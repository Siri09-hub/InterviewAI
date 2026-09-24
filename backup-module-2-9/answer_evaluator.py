import json
import os
import re

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"

MAX_EVALUATION_ATTEMPTS = 3


# ============================================================
# CUSTOM ERROR
# ============================================================

class AnswerEvaluationError(Exception):
    """
    Raised when AI answer evaluation fails or returns
    unusable data.
    """

    pass


# ============================================================
# GEMINI CLIENT
# ============================================================

def _get_client() -> "genai.Client":
    """
    Create and return the Gemini client.
    """

    if not GEMINI_API_KEY:
        raise AnswerEvaluationError(
            "Answer evaluation is not configured. GEMINI_API_KEY is missing."
        )

    return genai.Client(
        api_key=GEMINI_API_KEY
    )


# ============================================================
# BUILD EVALUATION PROMPT
# ============================================================

def _build_prompt(
    question: str,
    answer: str,
    job_role: str,
    interview_type: str,
    difficulty: str,
) -> str:
    """
    Build the prompt sent to Gemini for answer evaluation.
    """

    if interview_type == "Technical":
        focus_instruction = (
            "This is a TECHNICAL interview. Focus strongly on "
            "technical correctness, reasoning, accuracy, and depth "
            "of understanding."
        )

    elif interview_type == "Behavioral":
        focus_instruction = (
            "This is a BEHAVIORAL interview. Focus on communication, "
            "relevance, structure, ownership, teamwork, reflection, "
            "and clarity rather than technical correctness."
        )

    else:
        focus_instruction = (
            "This is a MIXED interview. Evaluate technical questions "
            "for correctness and reasoning, and behavioral questions "
            "for communication, ownership, teamwork, and reflection."
        )

    return f"""
You are an expert, fair, and constructive interview evaluator.

Job role:
{job_role}

Interview type:
{interview_type}

Difficulty:
{difficulty}

{focus_instruction}

Question:
{question}

Candidate's answer:
{answer}

Evaluate the candidate's answer based on:

1. Relevance to the question
2. Correctness
3. Depth and detail
4. Clarity
5. Communication quality where appropriate

Rules:

- Be fair and constructive.
- Respect the specified difficulty level.
- Do not judge grammar harshly unless it affects clarity.
- Do not invent information about the candidate.
- Do not assume information that is not present in the answer.
- If the answer is empty, irrelevant, incorrect, or nonsensical,
  give a low score and explain constructively.
- Keep feedback concise and useful.

Return ONLY one JSON object.

Do not use markdown.
Do not use code fences.
Do not add any extra text.

The JSON must have exactly this structure:

{{
    "score": <integer from 0 to 100>,
    "feedback": "<2-4 constructive sentences>",
    "strengths": "<1-3 sentences>",
    "improvements": "<1-3 actionable sentences>"
}}
"""


# ============================================================
# EXTRACT JSON FROM GEMINI RESPONSE
# ============================================================

def _extract_json(raw_text: str) -> dict:
    """
    Extract a JSON object from Gemini's response.

    Handles:
    - Normal JSON
    - JSON wrapped in markdown code fences
    - JSON embedded inside additional text
    """

    text = raw_text.strip()

    # --------------------------------------------------------
    # Remove markdown code fences if Gemini adds them.
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # First attempt: parse the entire response.
    # --------------------------------------------------------

    try:
        result = json.loads(text)

        if isinstance(result, dict):
            return result

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Second attempt: find the first JSON object.
    # --------------------------------------------------------

    match = re.search(
        r"\{.*\}",
        text,
        re.DOTALL,
    )

    if match:
        try:
            result = json.loads(
                match.group(0)
            )

            if isinstance(result, dict):
                return result

        except json.JSONDecodeError:
            pass

    raise AnswerEvaluationError(
        "Could not parse evaluation response."
    )


# ============================================================
# VALIDATE EVALUATION RESULT
# ============================================================

def _validate_result(data: dict) -> dict:
    """
    Validate and normalize Gemini's evaluation response.
    """

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

    # --------------------------------------------------------
    # Validate score
    # --------------------------------------------------------

    score = data["score"]

    if (
        isinstance(score, bool)
        or not isinstance(score, (int, float))
    ):
        raise AnswerEvaluationError(
            "Evaluation score was not a number."
        )

    score = int(round(score))

    # Keep score between 0 and 100.
    score = max(
        0,
        min(
            100,
            score,
        ),
    )

    # --------------------------------------------------------
    # Validate text fields
    # --------------------------------------------------------

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
        raise AnswerEvaluationError(
            "Evaluation feedback is empty."
        )

    if not strengths:
        raise AnswerEvaluationError(
            "Evaluation strengths are empty."
        )

    if not improvements:
        raise AnswerEvaluationError(
            "Evaluation improvements are empty."
        )

    # --------------------------------------------------------
    # Return normalized result
    # --------------------------------------------------------

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements,
    }


# ============================================================
# EVALUATE ANSWER
# ============================================================

def evaluate_answer(
    question: str,
    answer: str,
    job_role: str,
    interview_type: str,
    difficulty: str,
) -> dict:
    """
    Evaluate a candidate's answer using Gemini.

    Returns:

    {
        "score": int,
        "feedback": str,
        "strengths": str,
        "improvements": str
    }

    Raises:
        AnswerEvaluationError
    """

    # --------------------------------------------------------
    # Create Gemini client
    # --------------------------------------------------------

    client = _get_client()

    # --------------------------------------------------------
    # Build prompt
    # --------------------------------------------------------

    prompt = _build_prompt(
        question=question,
        answer=answer,
        job_role=job_role,
        interview_type=interview_type,
        difficulty=difficulty,
    )

    last_error: Exception | None = None

    # --------------------------------------------------------
    # Retry evaluation up to MAX_EVALUATION_ATTEMPTS
    # --------------------------------------------------------

    for _ in range(
        MAX_EVALUATION_ATTEMPTS
    ):

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                },
            )

        except genai_errors.APIError as exc:
            # Development logging only.
            # Never print the API key.
            print(
                "GEMINI EVALUATION API ERROR:",
                type(exc).__name__,
                str(exc),
            )

            last_error = AnswerEvaluationError(
                "The answer evaluation service is temporarily unavailable. Please try again."
            )

            continue

        except Exception as exc:
            # Development logging only.
            print(
                "GEMINI EVALUATION UNEXPECTED ERROR:",
                type(exc).__name__,
                str(exc),
            )

            last_error = AnswerEvaluationError(
                "An unexpected error occurred while evaluating the answer."
            )

            continue

        # ----------------------------------------------------
        # Get response text
        # ----------------------------------------------------

        raw_text = getattr(
            response,
            "text",
            None,
        )

        if not raw_text:
            last_error = AnswerEvaluationError(
                "The evaluation service returned no content."
            )

            continue

        # ----------------------------------------------------
        # Parse and validate JSON
        # ----------------------------------------------------

        try:
            parsed = _extract_json(
                raw_text
            )

            validated = _validate_result(
                parsed
            )

            return validated

        except AnswerEvaluationError as exc:
            last_error = exc
            continue

    # --------------------------------------------------------
    # All attempts failed
    # --------------------------------------------------------

    if last_error:
        raise last_error

    raise AnswerEvaluationError(
        "Answer evaluation failed after multiple attempts."
    )