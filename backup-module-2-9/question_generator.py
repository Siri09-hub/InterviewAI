import json
import os
import re

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"

MAX_GENERATION_ATTEMPTS = 3
MCQ_OPTION_COUNT = 4
MCQ_RATIO = 0.2  # approximate share of "some MCQ" slots where applicable


class QuestionGenerationError(Exception):
    """Raised when AI question generation fails or produces unusable data.

    The message on this exception is safe to show to API callers — it
    never contains the API key or raw provider error internals.
    """
    pass


def _get_client() -> "genai.Client":
    if not GEMINI_API_KEY:
        raise QuestionGenerationError(
            "Question generation is not configured. GEMINI_API_KEY is missing."
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def _build_plan(interview_type: str, question_count: int) -> list[dict]:
    """Decide, deterministically, the category (technical/behavioral) and
    type (open/mcq) for each question slot before asking Gemini for content.

    Controlling the mix ourselves — rather than letting the model decide —
    is what guarantees the required composition (mostly open + some MCQ for
    Technical, all open for Behavioral, balanced + some MCQ for Mixed)
    regardless of what any single Gemini call returns, and keeps the user
    out of the decision entirely.
    """
    plan: list[dict] = []

    def mcq_indices_for(count: int) -> set[int]:
        mcq_count = max(1, round(count * MCQ_RATIO)) if count >= 3 else 0
        if mcq_count == 0:
            return set()
        return {round(i * count / mcq_count) for i in range(mcq_count)}

    if interview_type == "Technical":
        mcq_idx = mcq_indices_for(question_count)
        for i in range(question_count):
            plan.append({"category": "technical", "type": "mcq" if i in mcq_idx else "open"})

    elif interview_type == "Behavioral":
        for i in range(question_count):
            plan.append({"category": "behavioral", "type": "open"})

    elif interview_type == "Mixed":
        mcq_idx = mcq_indices_for(question_count)
        for i in range(question_count):
            category = "technical" if i % 2 == 0 else "behavioral"
            q_type = "mcq" if (i in mcq_idx and category == "technical") else "open"
            plan.append({"category": category, "type": q_type})

    else:
        # Fallback for any unexpected interview_type value.
        for i in range(question_count):
            plan.append({"category": "technical", "type": "open"})

    return plan


def _build_prompt(job_role: str, difficulty: str, plan: list[dict]) -> str:
    plan_entries = ",\n  ".join(
        f'{{"index": {i}, "category": "{slot["category"]}", "type": "{slot["type"]}"}}'
        for i, slot in enumerate(plan)
    )
    plan_json = f"[\n  {plan_entries}\n]"

    return f"""You are an expert interviewer creating interview questions.

Job role: {job_role}
Difficulty: {difficulty}

Generate exactly {len(plan)} interview questions following this exact plan, in this exact order.
Each entry specifies the required category ("technical" or "behavioral") and type ("open" or "mcq")
for that question index:

{plan_json}

Rules:
- "type": "open" — an open-ended question with no answer options. Provide only "question_text".
- "type": "mcq" — a multiple-choice question. Provide "question_text", exactly {MCQ_OPTION_COUNT}
  distinct, plausible answer options in "options", and "correct_option" as the zero-based index
  (0 to {MCQ_OPTION_COUNT - 1}) of the single correct option within "options".
- "category": "technical" — must test technical knowledge or reasoning relevant to a "{job_role}" role.
- "category": "behavioral" — must test soft skills, past experience, teamwork, ownership, reflection.
- Respect the "{difficulty}" difficulty level.
- All questions must be realistic, relevant to the role, and diverse — no duplicates or near-duplicate rephrasings.
- Do not include markdown, numbering, or any commentary.

Respond with ONLY a single JSON array of exactly {len(plan)} objects, no markdown, no code fences, no extra text.
Each object must have exactly this shape:
{{
  "question_text": "<the question>",
  "question_type": "open" or "mcq",
  "options": [] for open questions, or an array of exactly {MCQ_OPTION_COUNT} strings for mcq questions,
  "correct_option": null for open questions, or an integer index into "options" for mcq questions
}}

Return the array in the same order as the plan above (index 0 first, etc.).
"""


def _extract_json_array(raw_text: str) -> list:
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    raise QuestionGenerationError("Could not parse the question generation response.")


def _validate_item(item, expected_type: str) -> dict:
    if not isinstance(item, dict):
        raise QuestionGenerationError("A generated question item was not a valid object.")

    question_text = str(item.get("question_text", "")).strip()
    if not question_text:
        raise QuestionGenerationError("A generated question had empty text.")

    question_type = item.get("question_type")
    if question_type not in ("open", "mcq"):
        raise QuestionGenerationError("A generated question had an invalid question_type.")
    if question_type != expected_type:
        raise QuestionGenerationError("A generated question did not match the required type.")

    if question_type == "mcq":
        options = item.get("options")
        if not isinstance(options, list) or len(options) != MCQ_OPTION_COUNT:
            raise QuestionGenerationError(f"An MCQ question did not have exactly {MCQ_OPTION_COUNT} options.")

        options = [str(o).strip() for o in options]
        if any(not o for o in options):
            raise QuestionGenerationError("An MCQ question had an empty option.")
        if len({o.lower() for o in options}) != MCQ_OPTION_COUNT:
            raise QuestionGenerationError("An MCQ question had duplicate options.")

        correct_option = item.get("correct_option")
        if isinstance(correct_option, bool) or not isinstance(correct_option, int):
            raise QuestionGenerationError("An MCQ question had an invalid correct_option.")
        if not (0 <= correct_option < MCQ_OPTION_COUNT):
            raise QuestionGenerationError("An MCQ question had correct_option out of range.")

        return {
            "question_text": question_text,
            "question_type": "mcq",
            "options": options,
            "correct_option": correct_option,
        }

    return {
        "question_text": question_text,
        "question_type": "open",
        "options": [],
        "correct_option": None,
    }


def generate_questions(
    job_role: str,
    interview_type: str,
    difficulty: str,
    question_count: int,
) -> list[dict]:
    """Generate exactly `question_count` interview questions using Gemini.

    Returns a list of dicts, each shaped as:
      {"question_text": str, "question_type": "open"|"mcq",
       "options": list[str], "correct_option": int | None}

    Question type/category composition (open vs mcq, technical vs
    behavioral) is decided deterministically by `_build_plan`, not by the
    model or the caller — this is what keeps the mix consistent and keeps
    the user out of the decision entirely.

    Raises QuestionGenerationError if Gemini cannot be reached, returns
    unusable content, or cannot ultimately satisfy the plan (wrong count,
    invalid MCQs, duplicates) after retrying. Never raises a raw provider
    exception or leaks the API key.
    """
    if question_count <= 0:
        return []

    plan = _build_plan(interview_type, question_count)
    client = _get_client()

    last_error: Exception | None = None

    for _ in range(MAX_GENERATION_ATTEMPTS):
        prompt = _build_prompt(job_role, difficulty, plan)

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
        except genai_errors.APIError:
            last_error = QuestionGenerationError(
                "The question generation service is temporarily unavailable. Please try again."
            )
            continue
        except Exception:
            last_error = QuestionGenerationError(
                "An unexpected error occurred while generating questions."
            )
            continue

        raw_text = getattr(response, "text", None)
        if not raw_text:
            last_error = QuestionGenerationError("The question generation service returned no content.")
            continue

        try:
            raw_items = _extract_json_array(raw_text)
        except QuestionGenerationError as e:
            last_error = e
            continue

        if len(raw_items) != len(plan):
            last_error = QuestionGenerationError(
                f"Expected {len(plan)} questions, received {len(raw_items)}."
            )
            continue

        try:
            validated = [_validate_item(item, plan[i]["type"]) for i, item in enumerate(raw_items)]
        except QuestionGenerationError as e:
            last_error = e
            continue

        seen = set()
        unique = []
        for q in validated:
            key = q["question_text"].strip().lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(q)

        if len(unique) != len(plan):
            last_error = QuestionGenerationError("Generated questions contained duplicates.")
            continue

        return unique

    raise last_error or QuestionGenerationError("Question generation failed after multiple attempts.")