import json
import os
import re

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"

MAX_EVALUATION_ATTEMPTS = 3


class AnswerEvaluationError(Exception):
    """
    Raised when answer evaluation fails or Gemini returns
    unusable data.
    """
    pass


def _get_client() -> "genai.Client":
    if not GEMINI_API_KEY:
        raise AnswerEvaluationError(
            "Answer evaluation is not configured. "
            "GEMINI_API_KEY is missing."
        )

    return genai.Client(
        api_key=GEMINI_API_KEY
    )


def _build_prompt(
    question: str,
    answer: str,
    ideal_answer: str,
    job_role: str,
    interview_type: str,
    difficulty: str,
) -> str:

    ideal_answer_block = (
        f"""
Reference (ideal) answer for grading guidance only.
A differently-worded but equally correct candidate
answer should still receive full marks:

{ideal_answer}
"""
        if ideal_answer
        else ""
    )

    return f"""
You are an expert, fair, and constructive interview evaluator.

Job role:
{job_role}

Interview type:
{interview_type}

Difficulty:
{difficulty}

Question:
{question}

{ideal_answer_block}

Candidate's answer:
{answer}

Score the candidate's answer using this exact 3-level
marking scale. The maximum is 2 marks.

2 = Correct
- Accurate
- Relevant
- Sufficiently complete
- Addresses the important parts of the question

1 = Partially Correct
- On the right track
- But incomplete
- Or partially inaccurate
- Or missing an important detail

0 = Incorrect
- Wrong
- Irrelevant
- Empty
- Nonsensical
- Does not answer the question

Guidelines:
- Judge correctness, relevance, depth, and clarity.
- Respect the stated difficulty.
- Be fair and constructive.
- Do not judge grammar harshly unless it affects meaning.
- Do not invent information about the candidate.
- Do not require the candidate to use the exact wording
  of the reference answer.

Return ONLY one JSON object.

Required format:

{{
  "score": 0,
  "feedback": "Overall constructive feedback",
  "strengths": "What the candidate did well",
  "improvements": "What the candidate should improve"
}}

The score MUST be exactly 0, 1, or 2.

Do not return markdown.
Do not return code fences.
Do not return extra text.
"""


def _extract_json(raw_text: str) -> dict:
    text = raw_text.strip()

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    text = text.strip()

    try:
        data = json.loads(text)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    match = re.search(
        r"\{.*\}",
        text,
        re.DOTALL,
    )

    if match:
        try:
            data = json.loads(
                match.group(0)
            )

            if isinstance(data, dict):
                return data

        except json.JSONDecodeError:
            pass

    raise AnswerEvaluationError(
        "Could not parse evaluation response."
    )


def _validate_result(data: dict) -> dict:

    if not isinstance(data, dict):
        raise AnswerEvaluationError(
            "Evaluation response was not a valid object."
        )

    required_keys = {
        "score",
        "feedback",
        "strengths",
        "improvements",
    }

    if not required_keys.issubset(
        data.keys()
    ):
        raise AnswerEvaluationError(
            "Evaluation response is missing required fields."
        )

    score = data["score"]

    if isinstance(score, bool):
        raise AnswerEvaluationError(
            "Evaluation score was invalid."
        )

    if not isinstance(
        score,
        (int, float),
    ):
        raise AnswerEvaluationError(
            "Evaluation score was not a number."
        )

    score = int(round(score))

    if score not in (0, 1, 2):
        raise AnswerEvaluationError(
            "Evaluation score must be 0, 1, or 2."
        )

    feedback = str(
        data["feedback"]
    ).strip()

    strengths = str(
        data["strengths"]
    ).strip()

    improvements = str(
        data["improvements"]
    ).strip()

    if not feedback:
        feedback = "No feedback provided."

    if not strengths:
        strengths = "No specific strengths identified."

    if not improvements:
        improvements = "No specific improvements identified."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements,
    }


def evaluate_answer(
    question: str,
    answer: str,
    ideal_answer: str,
    job_role: str,
    interview_type: str,
    difficulty: str,
) -> dict:
    """
    Evaluate an open-ended interview answer.

    Returns:
        {
            "score": 0 | 1 | 2,
            "feedback": str,
            "strengths": str,
            "improvements": str
        }
    """

    # Empty answer is automatically 0.
    if not answer or not answer.strip():
        return {
            "score": 0,
            "feedback": "No answer was provided.",
            "strengths": "",
            "improvements": "Provide an answer to the question.",
        }

    client = _get_client()

    last_error: Exception | None = None

    for _ in range(
        MAX_EVALUATION_ATTEMPTS
    ):

        prompt = _build_prompt(
            question=question,
            answer=answer,
            ideal_answer=ideal_answer,
            job_role=job_role,
            interview_type=interview_type,
            difficulty=difficulty,
        )

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                },
            )

        except genai_errors.APIError:
            last_error = AnswerEvaluationError(
                "The answer evaluation service is "
                "temporarily unavailable. Please try again."
            )
            continue

        except Exception:
            last_error = AnswerEvaluationError(
                "An unexpected error occurred while "
                "evaluating the answer."
            )
            continue

        raw_text = getattr(
            response,
            "text",
            None,
        )

        if not raw_text:
            last_error = AnswerEvaluationError(
                "The answer evaluation service "
                "returned no content."
            )
            continue

        try:
            data = _extract_json(
                raw_text
            )

            return _validate_result(
                data
            )

        except AnswerEvaluationError as exc:
            last_error = exc
            continue

        except Exception as exc:
            last_error = AnswerEvaluationError(
                f"Could not process evaluation response: {exc}"
            )
            continue

    raise (
        last_error
        or AnswerEvaluationError(
            "Answer evaluation failed after multiple attempts."
        )
    )