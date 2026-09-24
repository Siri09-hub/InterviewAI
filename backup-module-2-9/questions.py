import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db
from app.db.models import Interview, InterviewQuestion, InterviewAnswer, User
from app.core.auth import get_current_user
from app.services.question_generator import generate_questions, QuestionGenerationError
from app.services.answer_evaluator import evaluate_answer, AnswerEvaluationError

router = APIRouter(tags=["questions"])


QUESTION_COUNT_BY_DURATION = {
    15: 5,
    30: 10,
    45: 15,
    60: 20,
}


class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_number: int
    question_text: str
    question_type: str
    options: list[str]


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
    options: list[str]

    candidate_answer: str | None
    answered: bool

    # Original AI score, kept internally/useful for open-ended review
    score: int | None

    # Actual interview marks: 0, 1 or 2
    marks: int

    feedback: str | None
    strengths: str | None
    improvements: str | None

    correct_answer: str | None = None
    is_correct: bool | None = None


class InterviewResultsResponse(BaseModel):
    interview_id: int
    status: str

    total_questions: int
    answered_questions: int
    skipped_questions: int

    # Example: 4 / 10
    total_marks: int
    obtained_marks: int

    # Example: 40
    percentage: int

    questions: list[QuestionResultItem]


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


def _parse_options(raw_options: str | None) -> list[str]:

    try:
        return json.loads(raw_options) if raw_options else []

    except (TypeError, json.JSONDecodeError):
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
        options=_parse_options(question.options),
    )


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
            InterviewQuestion.interview_id == interview_id
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

    get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id == interview_id,
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

    try:

        generated = generate_questions(
            job_role=interview.job_role,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            question_count=question_count,
        )

    except QuestionGenerationError as e:

        raise HTTPException(
            status_code=502,
            detail=str(e),
        )

    try:

        db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).delete()

        new_questions = [

            InterviewQuestion(
                interview_id=interview_id,
                question_number=i + 1,
                question_text=q["question_text"],
                question_type=q["question_type"],
                options=json.dumps(q["options"]),
                correct_option=q["correct_option"],
            )

            for i, q in enumerate(generated)
        ]

        db.add_all(new_questions)

        interview.status = "created"

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

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id,
            InterviewQuestion.interview_id == interview_id,
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
            InterviewAnswer.question_id == question_id
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

    # ---------------------------------------------------------
    # MCQ
    # ---------------------------------------------------------

    if question.question_type == "mcq":

        options = _parse_options(
            question.options
        )

        correct_text = None

        if (
            question.correct_option is not None
            and 0 <= question.correct_option < len(options)
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

            "score": 100 if is_correct else 0,

            "feedback": (
                "Correct! You selected the right option."
                if is_correct
                else
                "Incorrect. This was not the correct option."
            ),

            "strengths": (
                "Selected the correct option."
                if is_correct
                else
                "Attempted the question."
            ),

            "improvements": (
                "No improvements needed."
                if is_correct
                else
                "Review the topic and reconsider the options."
            ),
        }

    # ---------------------------------------------------------
    # OPEN ENDED
    # ---------------------------------------------------------

    else:

        try:

            result = evaluate_answer(
                question=question.question_text,
                answer=latest_answer.answer_text,
                job_role=interview.job_role,
                interview_type=interview.interview_type,
                difficulty=interview.difficulty,
            )

        except AnswerEvaluationError as e:

            raise HTTPException(
                status_code=502,
                detail=str(e),
            )

    try:

        latest_answer.score = result["score"]
        latest_answer.feedback = result["feedback"]
        latest_answer.strengths = result["strengths"]
        latest_answer.improvements = result["improvements"]

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


# =============================================================
# COMPLETE INTERVIEW
# =============================================================

@router.post(
    "/interviews/{interview_id}/complete"
)
def complete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    interview = get_owned_interview(
        interview_id,
        db,
        current_user,
    )

    interview.status = "completed"

    try:

        db.commit()
        db.refresh(interview)

    except SQLAlchemyError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not complete interview",
        )

    return {
        "interview_id": interview.id,
        "status": "completed",
    }


# =============================================================
# FINAL RESULTS
# =============================================================

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

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id == interview_id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    total_questions = len(questions)

    answered_count = 0

    obtained_marks = 0

    items: list[QuestionResultItem] = []

    for question in questions:

        options = _parse_options(
            question.options
        )

        # ---------------------------------------------
        # Correct answer
        # ---------------------------------------------

        correct_answer_text = None

        if (
            question.question_type == "mcq"
            and question.correct_option is not None
            and 0 <= question.correct_option < len(options)
        ):

            correct_answer_text = options[
                question.correct_option
            ]

        # ---------------------------------------------
        # Latest answer
        # ---------------------------------------------

        latest_answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.question_id == question.id
            )
            .order_by(
                InterviewAnswer.created_at.desc()
            )
            .first()
        )

        has_answer = (
            latest_answer is not None
            and latest_answer.answer_text.strip() != ""
        )

        # =================================================
        # ANSWERED
        # =================================================

        if has_answer:

            answered_count += 1

            marks = 0

            is_correct = None

            # -----------------------------------------
            # MCQ MARKING
            # -----------------------------------------

            if question.question_type == "mcq":

                is_correct = (
                    correct_answer_text is not None
                    and
                    latest_answer.answer_text.strip().lower()
                    ==
                    correct_answer_text.strip().lower()
                )

                marks = 2 if is_correct else 0

            # -----------------------------------------
            # OPEN-ENDED MARKING
            # -----------------------------------------

            else:

                ai_score = (
                    latest_answer.score
                    if latest_answer.score is not None
                    else 0
                )

                # 2 marks = fully correct
                # 1 mark = partially correct
                # 0 marks = wrong
                #
                # Gemini score is converted to
                # interview marks here.

                if ai_score >= 95:
                    marks = 2

                elif ai_score >= 50:
                    marks = 1

                else:
                    marks = 0

            obtained_marks += marks

            items.append(
                QuestionResultItem(

                    question_id=question.id,

                    question_number=question.question_number,

                    question_text=question.question_text,

                    question_type=question.question_type,

                    options=options,

                    candidate_answer=latest_answer.answer_text,

                    answered=True,

                    score=latest_answer.score,

                    marks=marks,

                    feedback=latest_answer.feedback,

                    strengths=latest_answer.strengths,

                    improvements=latest_answer.improvements,

                    correct_answer=correct_answer_text,

                    is_correct=is_correct,
                )
            )

        # =================================================
        # SKIPPED
        # =================================================

        else:

            # Skipped = 0 marks

            marks = 0

            items.append(
                QuestionResultItem(

                    question_id=question.id,

                    question_number=question.question_number,

                    question_text=question.question_text,

                    question_type=question.question_type,

                    options=options,

                    candidate_answer=None,

                    answered=False,

                    score=None,

                    marks=0,

                    feedback=None,

                    strengths=None,

                    improvements=None,

                    correct_answer=correct_answer_text,

                    is_correct=None,
                )
            )

    # =====================================================
    # FINAL SCORE
    # =====================================================

    skipped_questions = (
        total_questions - answered_count
    )

    total_marks = total_questions * 2

    percentage = (
        round(
            (obtained_marks / total_marks) * 100
        )
        if total_marks > 0
        else 0
    )

    # Results page means the interview has been submitted.
    status = "completed"

    try:

        interview.status = "completed"

        db.commit()

    except SQLAlchemyError:

        db.rollback()

    return InterviewResultsResponse(

        interview_id=interview.id,

        status=status,

        total_questions=total_questions,

        answered_questions=answered_count,

        skipped_questions=skipped_questions,

        total_marks=total_marks,

        obtained_marks=obtained_marks,

        percentage=percentage,

        questions=items,
    )