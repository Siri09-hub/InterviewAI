import json
import logging
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db
from app.db.models import (
    Interview,
    InterviewQuestion,
    InterviewAnswer,
    User,
)
from app.core.auth import get_current_user
from app.services.question_generator import (
    generate_questions,
    QuestionGenerationError,
)
from app.services.answer_evaluator import (
    evaluate_answer,
    AnswerEvaluationError,
)

logger = logging.getLogger("interviewai.questions")

router = APIRouter(tags=["questions"])

QUESTION_COUNT_BY_DURATION = {
    15: 5,
    30: 10,
    45: 15,
    60: 20,
}

PREVIOUS_QUESTIONS_LOOKBACK = 40


# --------------------------------------------------
# PROCTORING
# --------------------------------------------------

PROCTORING_VIOLATIONS_TABLE = "proctoring_violations"

TAB_SWITCH_TYPES = {
    "tab_switch",
}

INTERACTION_TYPES = {
    "right_click",
    "copy",
    "paste",
    "cut",
}

# Supports both the names used by the frontend
# and the descriptive names used internally.
FACE_TYPES = {
    "face",
    "no_face",
    "multiple_faces",
}

GAZE_TYPES = {
    "gaze",
    "looking_away",
}

OBJECT_TYPES = {
    "object",
    "prohibited_object",
}

# Every 3 violations = -1 mark
PROCTORING_PENALTY_EVERY = 3
PROCTORING_PENALTY_MARKS = 1


# --------------------------------------------------
# RESPONSE MODELS
# --------------------------------------------------

class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_number: int
    question_text: str
    question_type: str
    options: list[str]

    # IMPORTANT:
    # correct_option and ideal_answer are intentionally NOT
    # returned while the interview is active.


class CreateAnswerRequest(BaseModel):
    answer_text: str
    answer_source: Literal["text", "voice"] = "text"


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    answer_source: str


class EvaluationResponse(BaseModel):
    answer_id: int
    score: int
    feedback: str
    strengths: str
    improvements: str


class QuestionResultItem(BaseModel):
    question_id: int
    question_number: int
    question_text: str
    question_type: str
    candidate_answer: str | None
    answered: bool
    score: int
    max_marks: int
    status: Literal[
        "correct",
        "partially_correct",
        "incorrect",
        "skipped",
    ]
    correct_answer: str | None = None
    ideal_answer: str | None = None
    feedback: str | None = None
    strengths: str | None = None
    improvements: str | None = None


class ProctoringSummary(BaseModel):
    total_violations: int
    tab_switches: int
    interaction_violations: int
    face_violations: int
    gaze_violations: int
    object_violations: int
    data_available: bool


class PerformanceAnalysis(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    areas_for_improvement: list[str]
    overall_feedback: str
    recommended_topics: list[str]


class InterviewResultsResponse(BaseModel):
    interview_id: int
    status: str
    completed_at: str | None

    job_role: str
    interview_type: str
    difficulty: str
    duration_minutes: int

    total_questions: int
    answered_questions: int
    skipped_questions: int

    correct_count: int
    partially_correct_count: int
    incorrect_count: int

    overall_score: int
    max_score: int
    percentage: int

    questions: list[QuestionResultItem]

    proctoring: ProctoringSummary
    performance: PerformanceAnalysis


# --------------------------------------------------
# INTERVIEW HELPERS
# --------------------------------------------------

def get_owned_interview(
    interview_id: int,
    db: Session,
    current_user: User,
) -> Interview:
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    return interview


def _parse_options(
    raw_options: str | None,
) -> list[str]:
    try:
        return (
            json.loads(raw_options)
            if raw_options
            else []
        )
    except (
        TypeError,
        json.JSONDecodeError,
    ):
        return []


def _question_to_response(
    question: InterviewQuestion,
) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        interview_id=question.interview_id,
        question_number=question.question_number,
        question_text=question.question_text,
        question_type=question.question_type,
        options=_parse_options(
            question.options
        ),
    )


def _get_previous_question_texts(
    interview: Interview,
    db: Session,
    current_user: User,
    limit: int = PREVIOUS_QUESTIONS_LOOKBACK,
) -> list[str]:
    rows = (
        db.query(
            InterviewQuestion.question_text
        )
        .join(
            Interview,
            InterviewQuestion.interview_id
            == Interview.id,
        )
        .filter(
            Interview.user_id == current_user.id,
            Interview.job_role
            == interview.job_role,
            Interview.interview_type
            == interview.interview_type,
            Interview.difficulty
            == interview.difficulty,
            Interview.id != interview.id,
        )
        .order_by(
            InterviewQuestion.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        row[0]
        for row in rows
    ]


# --------------------------------------------------
# LIST QUESTIONS
# --------------------------------------------------

@router.get(
    "/interviews/{interview_id}/questions",
    response_model=list[QuestionResponse],
)
def list_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id
            == interview_id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    return [
        _question_to_response(q)
        for q in questions
    ]


# --------------------------------------------------
# CREATE ANSWER
# --------------------------------------------------

@router.post(
    "/interviews/{interview_id}/questions/{question_id}/answers",
    response_model=AnswerResponse,
    status_code=201,
)
def create_answer(
    interview_id: int,
    question_id: int,
    payload: CreateAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    if interview.status == "completed":
        raise HTTPException(
            status_code=400,
            detail=(
                "This interview has already been submitted. "
                "Answers can no longer be modified."
            ),
        )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id
            == interview_id,
        )
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    new_answer = InterviewAnswer(
        question_id=question.id,
        answer_text=payload.answer_text,
        answer_source=payload.answer_source,
    )

    try:
        db.add(new_answer)
        db.commit()
        db.refresh(new_answer)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not save answer",
        )

    return new_answer


# --------------------------------------------------
# GENERATE QUESTIONS
# --------------------------------------------------

@router.post(
    "/interviews/{interview_id}/generate-questions",
    response_model=list[QuestionResponse],
    status_code=201,
)
def generate_interview_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    question_count = QUESTION_COUNT_BY_DURATION.get(
        interview.duration_minutes,
        10,
    )

    previous_questions = (
        _get_previous_question_texts(
            interview,
            db,
            current_user,
        )
    )

    try:
        generated = generate_questions(
            job_role=interview.job_role,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            question_count=question_count,
            avoid_questions=previous_questions,
        )

    except QuestionGenerationError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )

    try:
        db.query(
            InterviewQuestion
        ).filter(
            InterviewQuestion.interview_id
            == interview_id
        ).delete()

        new_questions = [
            InterviewQuestion(
                interview_id=interview_id,
                question_number=i + 1,
                question_text=q[
                    "question_text"
                ],
                question_type=q[
                    "question_type"
                ],
                options=json.dumps(
                    q["options"]
                ),
                correct_option=q[
                    "correct_option"
                ],
                ideal_answer=q[
                    "ideal_answer"
                ],
            )
            for i, q in enumerate(generated)
        ]

        db.add_all(new_questions)

        # Fresh question generation means
        # the interview becomes active again.
        interview.status = "created"
        interview.completed_at = None

        db.commit()

        for question in new_questions:
            db.refresh(question)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not generate questions",
        )

    return [
        _question_to_response(q)
        for q in new_questions
    ]


# --------------------------------------------------
# EVALUATE ANSWER
# --------------------------------------------------

@router.post(
    "/interviews/{interview_id}/questions/{question_id}/evaluate",
    response_model=EvaluationResponse,
)
def evaluate_interview_answer(
    interview_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    if interview.status == "completed":
        raise HTTPException(
            status_code=400,
            detail=(
                "This interview has already been submitted. "
                "Answers can no longer be modified."
            ),
        )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id
            == interview_id,
        )
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    latest_answer = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.question_id
            == question_id
        )
        .order_by(
            InterviewAnswer.created_at.desc()
        )
        .first()
    )

    if latest_answer is None:
        raise HTTPException(
            status_code=404,
            detail="Answer not found",
        )

    # --------------------------------------------------
    # MCQ
    # --------------------------------------------------

    if question.question_type == "mcq":
        options = _parse_options(
            question.options
        )

        correct_text = None

        if (
            question.correct_option is not None
            and 0
            <= question.correct_option
            < len(options)
        ):
            correct_text = options[
                question.correct_option
            ]

        is_correct = (
            correct_text is not None
            and latest_answer.answer_text.strip().lower()
            == correct_text.strip().lower()
        )

        result = {
            "score": 2
            if is_correct
            else 0,

            "feedback": (
                "Correct! You selected the right option."
                if is_correct
                else (
                    "Incorrect. This wasn't "
                    "the right option for this question."
                )
            ),

            "strengths": (
                "Selected the correct option."
                if is_correct
                else "Attempted the question."
            ),

            "improvements": (
                "No improvements needed here."
                if is_correct
                else (
                    "Review this topic and "
                    "reconsider the options carefully."
                )
            ),
        }

    # --------------------------------------------------
    # OPEN-ENDED
    # --------------------------------------------------

    else:
        try:
            result = evaluate_answer(
                question=question.question_text,
                answer=latest_answer.answer_text,
                ideal_answer=(
                    question.ideal_answer
                    or ""
                ),
                job_role=interview.job_role,
                interview_type=(
                    interview.interview_type
                ),
                difficulty=interview.difficulty,
            )

        except AnswerEvaluationError as e:
            raise HTTPException(
                status_code=502,
                detail=str(e),
            )

    # --------------------------------------------------
    # SAVE EVALUATION
    # --------------------------------------------------

    try:
        latest_answer.score = result[
            "score"
        ]

        latest_answer.feedback = result[
            "feedback"
        ]

        latest_answer.strengths = result[
            "strengths"
        ]

        latest_answer.improvements = result[
            "improvements"
        ]

        db.commit()
        db.refresh(latest_answer)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not save evaluation",
        )

    return EvaluationResponse(
        answer_id=latest_answer.id,
        score=latest_answer.score,
        feedback=latest_answer.feedback,
        strengths=latest_answer.strengths,
        improvements=latest_answer.improvements,
    )


# ==================================================
# PROCTORING SUMMARY
# ==================================================

def _get_proctoring_summary(
    interview_id: int,
    db: Session,
) -> ProctoringSummary:
    counts = {
        "tab": 0,
        "interaction": 0,
        "face": 0,
        "gaze": 0,
        "object": 0,
    }

    data_available = True

    try:
        rows = db.execute(
            text(
                f"""
                SELECT
                    violation_type,
                    COUNT(*) AS cnt
                FROM {PROCTORING_VIOLATIONS_TABLE}
                WHERE interview_id = :interview_id
                GROUP BY violation_type
                """
            ),
            {
                "interview_id": interview_id,
            },
        ).fetchall()

        for (
            violation_type,
            cnt,
        ) in rows:

            cnt = int(cnt or 0)

            if violation_type in TAB_SWITCH_TYPES:
                counts["tab"] += cnt

            elif (
                violation_type
                in INTERACTION_TYPES
            ):
                counts[
                    "interaction"
                ] += cnt

            elif violation_type in FACE_TYPES:
                counts["face"] += cnt

            elif violation_type in GAZE_TYPES:
                counts["gaze"] += cnt

            elif (
                violation_type
                in OBJECT_TYPES
            ):
                counts["object"] += cnt

    except SQLAlchemyError as e:
        logger.warning(
            (
                "Could not read proctoring violations "
                "for interview %s "
                "(table %r may not match schema): %s"
            ),
            interview_id,
            PROCTORING_VIOLATIONS_TABLE,
            e,
        )

        data_available = False

        try:
            db.rollback()
        except Exception:
            pass

    return ProctoringSummary(
        total_violations=sum(
            counts.values()
        ),
        tab_switches=counts["tab"],
        interaction_violations=counts[
            "interaction"
        ],
        face_violations=counts["face"],
        gaze_violations=counts["gaze"],
        object_violations=counts[
            "object"
        ],
        data_available=data_available,
    )


# ==================================================
# PROCTORING PENALTY
# ==================================================

def _get_proctoring_penalty(
    interview_id: int,
    db: Session,
) -> tuple[int, int]:
    """
    Every 3 proctoring violations deducts 1 mark.

    0-2 violations  -> 0 penalty
    3-5 violations  -> 1 mark
    6-8 violations  -> 2 marks
    9-11 violations -> 3 marks
    """

    try:
        result = db.execute(
            text(
                f"""
                SELECT COUNT(*)
                FROM {PROCTORING_VIOLATIONS_TABLE}
                WHERE interview_id = :interview_id
                """
            ),
            {
                "interview_id": interview_id,
            },
        )

        total_violations = int(
            result.scalar() or 0
        )

    except SQLAlchemyError as e:
        logger.warning(
            (
                "Could not calculate proctoring "
                "penalty for interview %s: %s"
            ),
            interview_id,
            e,
        )

        try:
            db.rollback()
        except Exception:
            pass

        # If proctoring data cannot be read,
        # do not incorrectly deduct marks.
        return 0, 0

    penalty_marks = (
        total_violations
        // PROCTORING_PENALTY_EVERY
    ) * PROCTORING_PENALTY_MARKS

    return (
        total_violations,
        penalty_marks,
    )


# ==================================================
# PERFORMANCE ANALYSIS
# ==================================================

def _build_performance_analysis(
    items: list[QuestionResultItem],
    percentage: int,
) -> PerformanceAnalysis:

    def label(
        item: QuestionResultItem,
    ) -> str:
        text_snippet = item.question_text[
            :80
        ]

        suffix = (
            "..."
            if len(
                item.question_text
            )
            > 80
            else ""
        )

        return (
            f"Q{item.question_number}: "
            f"{text_snippet}{suffix}"
        )

    strengths = [
        label(i)
        for i in items
        if i.status == "correct"
    ]

    weaknesses = [
        label(i)
        for i in items
        if i.status == "incorrect"
    ]

    areas_for_improvement = [
        label(i)
        for i in items
        if i.status
        in (
            "partially_correct",
            "skipped",
        )
    ]

    if percentage >= 80:
        overall_feedback = (
            "Excellent performance overall — "
            "you demonstrated strong command of "
            "the material across most questions."
        )

    elif percentage >= 50:
        overall_feedback = (
            "Solid performance with room to grow. "
            "You handled several questions well, "
            "but a few areas need more focused preparation."
        )

    else:
        overall_feedback = (
            "This interview highlighted several "
            "areas that need focused preparation. "
            "Review the topics below and consider "
            "practicing similar questions."
        )

    recommended_source = (
        weaknesses
        + [
            w
            for w in areas_for_improvement
            if w not in weaknesses
        ]
    )

    recommended_topics = (
        recommended_source[:5]
        or [
            "Review core fundamentals for this role."
        ]
    )

    return PerformanceAnalysis(
        strengths=(
            strengths
            or [
                "No fully correct answers yet — "
                "keep practicing."
            ]
        ),
        weaknesses=(
            weaknesses
            or [
                "No major weaknesses identified."
            ]
        ),
        areas_for_improvement=(
            areas_for_improvement
            or [
                "None — solid overall coverage."
            ]
        ),
        overall_feedback=overall_feedback,
        recommended_topics=recommended_topics,
    )


# ==================================================
# BUILD RESULTS
# ==================================================

def _build_results(
    interview: Interview,
    db: Session,
) -> InterviewResultsResponse:

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id
            == interview.id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    total_questions = len(
        questions
    )

    answered_count = 0
    raw_total_marks = 0

    items: list[
        QuestionResultItem
    ] = []

    status_labels = {
        2: "correct",
        1: "partially_correct",
        0: "incorrect",
    }

    # --------------------------------------------------
    # SCORE EACH QUESTION
    # --------------------------------------------------

    for question in questions:
        options = _parse_options(
            question.options
        )

        correct_answer_text = None

        if (
            question.question_type
            == "mcq"
            and question.correct_option
            is not None
            and 0
            <= question.correct_option
            < len(options)
        ):
            correct_answer_text = options[
                question.correct_option
            ]

        latest_answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.question_id
                == question.id
            )
            .order_by(
                InterviewAnswer.created_at.desc()
            )
            .first()
        )

        has_answer = (
            latest_answer is not None
            and latest_answer.answer_text.strip()
            != ""
        )

        # --------------------------------------------------
        # ANSWERED
        # --------------------------------------------------

        if has_answer:
            answered_count += 1

            marks = (
                latest_answer.score
                if latest_answer.score
                is not None
                else 0
            )

            marks = max(
                0,
                min(2, marks),
            )

            raw_total_marks += marks

            items.append(
                QuestionResultItem(
                    question_id=question.id,
                    question_number=(
                        question.question_number
                    ),
                    question_text=(
                        question.question_text
                    ),
                    question_type=(
                        question.question_type
                    ),
                    candidate_answer=(
                        latest_answer.answer_text
                    ),
                    answered=True,
                    score=marks,
                    max_marks=2,
                    status=status_labels.get(
                        marks,
                        "incorrect",
                    ),
                    correct_answer=(
                        correct_answer_text
                    ),
                    ideal_answer=(
                        question.ideal_answer
                    ),
                    feedback=(
                        latest_answer.feedback
                    ),
                    strengths=(
                        latest_answer.strengths
                    ),
                    improvements=(
                        latest_answer.improvements
                    ),
                )
            )

        # --------------------------------------------------
        # SKIPPED
        # --------------------------------------------------

        else:
            items.append(
                QuestionResultItem(
                    question_id=question.id,
                    question_number=(
                        question.question_number
                    ),
                    question_text=(
                        question.question_text
                    ),
                    question_type=(
                        question.question_type
                    ),
                    candidate_answer=None,
                    answered=False,
                    score=0,
                    max_marks=2,
                    status="skipped",
                    correct_answer=(
                        correct_answer_text
                    ),
                    ideal_answer=(
                        question.ideal_answer
                    ),
                    feedback=None,
                    strengths=None,
                    improvements=None,
                )
            )

    # --------------------------------------------------
    # QUESTION SCORE SUMMARY
    # --------------------------------------------------

    skipped_questions = (
        total_questions
        - answered_count
    )

    max_score = (
        total_questions * 2
    )

    # --------------------------------------------------
    # COUNTS BY RESULT
    # --------------------------------------------------

    correct_count = sum(
        1
        for item in items
        if item.status == "correct"
    )

    partially_correct_count = sum(
        1
        for item in items
        if item.status
        == "partially_correct"
    )

    incorrect_count = sum(
        1
        for item in items
        if item.status == "incorrect"
    )

    # --------------------------------------------------
    # PROCTORING
    # --------------------------------------------------

    proctoring = (
        _get_proctoring_summary(
            interview.id,
            db,
        )
    )

    (
        total_proctoring_violations,
        proctoring_penalty,
    ) = _get_proctoring_penalty(
        interview.id,
        db,
    )

    # --------------------------------------------------
    # FINAL SCORE
    #
    # Every 3 violations = -1 mark
    # --------------------------------------------------

    final_score = max(
        0,
        raw_total_marks
        - proctoring_penalty,
    )

    if max_score > 0:
        percentage = round(
            (
                final_score
                / max_score
            )
            * 100
        )
    else:
        percentage = 0

    # --------------------------------------------------
    # PERFORMANCE
    #
    # IMPORTANT:
    # Use the final percentage AFTER proctoring penalty.
    # --------------------------------------------------

    performance = (
        _build_performance_analysis(
            items,
            percentage,
        )
    )

    # --------------------------------------------------
    # LOG SCORE INFORMATION
    # --------------------------------------------------

    logger.info(
        (
            "Interview %s results: "
            "raw_score=%s/%s, "
            "proctoring_violations=%s, "
            "proctoring_penalty=%s, "
            "final_score=%s/%s, "
            "percentage=%s%%"
        ),
        interview.id,
        raw_total_marks,
        max_score,
        total_proctoring_violations,
        proctoring_penalty,
        final_score,
        max_score,
        percentage,
    )

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------

    return InterviewResultsResponse(
        interview_id=interview.id,
        status=interview.status,
        completed_at=(
            interview.completed_at.isoformat()
            if interview.completed_at
            else None
        ),
        job_role=interview.job_role,
        interview_type=(
            interview.interview_type
        ),
        difficulty=interview.difficulty,
        duration_minutes=(
            interview.duration_minutes
        ),
        total_questions=total_questions,
        answered_questions=answered_count,
        skipped_questions=skipped_questions,
        correct_count=correct_count,
        partially_correct_count=(
            partially_correct_count
        ),
        incorrect_count=incorrect_count,
        overall_score=final_score,
        max_score=max_score,
        percentage=percentage,
        questions=items,
        proctoring=proctoring,
        performance=performance,
    )


# ==================================================
# SUBMIT INTERVIEW
# ==================================================

@router.post(
    "/interviews/{interview_id}/submit",
    response_model=InterviewResultsResponse,
)
def submit_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks the interview as completed.

    If it is already completed, the original
    completed_at timestamp is preserved.

    Final results are calculated fresh, including
    the proctoring penalty.
    """

    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    try:
        if interview.status != "completed":
            interview.status = "completed"
            interview.completed_at = (
                datetime.utcnow()
            )

            db.commit()
            db.refresh(interview)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not submit interview",
        )

    return _build_results(
        interview,
        db,
    )


# ==================================================
# GET RESULTS
# ==================================================

@router.get(
    "/interviews/{interview_id}/results",
    response_model=InterviewResultsResponse,
)
def get_interview_results(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    return _build_results(
        interview,
        db,
    )