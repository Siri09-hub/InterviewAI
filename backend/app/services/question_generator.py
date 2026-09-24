import json
import logging
import os
import re
import uuid

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors

load_dotenv()

logger = logging.getLogger("interviewai.question_generator")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"

MAX_GENERATION_ATTEMPTS = 4
MCQ_OPTION_COUNT = 4
MCQ_RATIO = 0.2  # approximate share of "some MCQ" slots where applicable
NEAR_DUPLICATE_THRESHOLD = 0.6  # Jaccard word-overlap threshold
MAX_AVOID_QUESTIONS_IN_PROMPT = 30


class QuestionGenerationError(Exception):
    """Raised when AI question generation fails or produces unusable data.

    The message on this exception is safe to show to API callers — it
    never contains the API key or raw provider error internals. The full
    underlying error is logged server-side (see `logger` calls below) so
    it can be diagnosed from the backend terminal/logs even though the
    client never sees it.
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
    guarantees the required composition (mostly open + some MCQ for
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
        for i in range(question_count):
            plan.append({"category": "technical", "type": "open"})

    return plan


def _normalize_words(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _overlap_score(candidate: str, existing_texts: list[str]) -> float:
    """Returns the highest Jaccard word-overlap score between `candidate`
    and any question in `existing_texts`. 0.0 means no overlap with
    anything; values approaching 1.0 mean near-identical wording.
    """
    candidate_words = _normalize_words(candidate)
    if not candidate_words:
        return 0.0

    best = 0.0
    for existing in existing_texts:
        existing_words = _normalize_words(existing)
        if not existing_words:
            continue
        union = candidate_words | existing_words
        if not union:
            continue
        overlap = len(candidate_words & existing_words) / len(union)
        if overlap > best:
            best = overlap

    return best


def _is_near_duplicate(candidate: str, existing_texts: list[str], threshold: float = NEAR_DUPLICATE_THRESHOLD) -> bool:
    return _overlap_score(candidate, existing_texts) >= threshold


def _build_prompt(
    job_role: str,
    difficulty: str,
    plan: list[dict],
    avoid_questions: list[str],
) -> str:
    plan_entries = ",\n  ".join(
        f'{{"index": {i}, "category": "{slot["category"]}", "type": "{slot["type"]}"}}'
        for i, slot in enumerate(plan)
    )
    plan_json = f"[\n  {plan_entries}\n]"

    # A fresh random token per call adds entropy on top of the explicit
    # avoid-list below — it is a supplementary nudge, not the mechanism
    # that actually prevents repetition (that's the avoid-list + the
    # post-generation near-duplicate check in generate_questions).
    diversity_token = uuid.uuid4().hex[:12]

    avoid_section = ""
    if avoid_questions:
        trimmed = [q.strip()[:160] for q in avoid_questions[:MAX_AVOID_QUESTIONS_IN_PROMPT] if q.strip()]
        if trimmed:
            bullet_list = "\n".join(f"- {q}" for q in trimmed)
            avoid_section = f"""

The candidate has already been asked the following questions in previous interviews for this
exact role, interview type, and difficulty. You MUST NOT repeat any of them, and you MUST NOT
generate near-duplicate rephrasings that test the same concept/scenario with only the wording
changed. Generate genuinely different questions — different concepts, different scenarios,
different examples:
{bullet_list}
"""

    return f"""You are an expert interviewer creating interview questions.

Job role: {job_role}
Difficulty: {difficulty}
Generation session: {diversity_token}

Generate exactly {len(plan)} interview questions following this exact plan, in this exact order.
Each entry specifies the required category ("technical" or "behavioral") and type ("open" or "mcq")
for that question index:

{plan_json}
{avoid_section}
Diversity requirements (very important):
- Do not default to the most common/canonical/textbook question for this role and difficulty.
- Vary the underlying concepts, real-world scenarios, specific wording, and examples.
- Avoid reusing the same phrasing pattern across multiple questions in this set.
- For MCQ questions, vary which concept is tested and vary the specific wrong-option distractors used.

Rules:
- "type": "open" — an open-ended question with no answer options. Provide "question_text" and
  "ideal_answer": a concise model/reference answer (2-4 sentences) that a strong candidate might give.
  This reference answer is for internal grading only and will never be shown to the candidate during
  the interview.
- "type": "mcq" — a multiple-choice question. Provide "question_text", exactly {MCQ_OPTION_COUNT}
  distinct, plausible answer options in "options", and "correct_option" as the zero-based index
  (0 to {MCQ_OPTION_COUNT - 1}) of the single correct option within "options". Set "ideal_answer" to null.
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
  "correct_option": null for open questions, or an integer index into "options" for mcq questions,
  "ideal_answer": "<concise reference answer>" for open questions, or null for mcq questions
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
            "ideal_answer": None,
        }

    ideal_answer = str(item.get("ideal_answer", "")).strip()
    if not ideal_answer:
        raise QuestionGenerationError("An open-ended question was missing an ideal_answer.")

    return {
        "question_text": question_text,
        "question_type": "open",
        "options": [],
        "correct_option": None,
        "ideal_answer": ideal_answer,
    }


def generate_questions(
    job_role: str,
    interview_type: str,
    difficulty: str,
    question_count: int,
    avoid_questions: list[str] | None = None,
) -> list[dict]:
    """Generate exactly `question_count` interview questions using Gemini.

    `avoid_questions` should be the text of questions previously generated
    for this same user/job_role/interview_type/difficulty combination
    (fetched from the database by the caller). Both the prompt AND a
    post-generation Jaccard-overlap check use this list.

    Reliability behavior: a batch that is structurally valid (right count,
    right types, valid MCQs, unique within itself) is always usable. If
    it ALSO avoids overlapping with `avoid_questions`, it is returned
    immediately. If every attempt still overlaps with prior questions
    after MAX_GENERATION_ATTEMPTS tries — which can genuinely happen for
    narrow role/difficulty combinations with limited natural variety —
    the least-overlapping structurally-valid batch is returned instead of
    raising an error, and a warning is logged. This keeps the interview
    flow reliable even when perfect diversity can't be guaranteed.

    QuestionGenerationError is only raised when NO structurally valid
    batch could be produced at all (API unreachable, key missing,
    persistent malformed/incomplete responses). The real underlying error
    is always logged server-side via `logger`, even though the exception
    message shown to API callers stays generic.
    """
    if question_count <= 0:
        return []

    avoid_questions = avoid_questions or []
    plan = _build_plan(interview_type, question_count)
    client = _get_client()

    last_error: Exception | None = None

    # Best structurally-valid batch seen so far, tracked so we can fall
    # back to it (rather than hard-failing) if every attempt still
    # overlaps with prior questions.
    best_batch: list[dict] | None = None
    best_batch_overlap = float("inf")

    for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
        prompt = _build_prompt(job_role, difficulty, plan, avoid_questions)

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json", "temperature": 1.0},
            )
        except genai_errors.APIError as e:
            logger.warning(
                "Gemini API error on question generation attempt %s/%s (role=%r, type=%r, difficulty=%r): %s",
                attempt, MAX_GENERATION_ATTEMPTS, job_role, interview_type, difficulty, e,
            )
            last_error = QuestionGenerationError(
                "The question generation service is temporarily unavailable. Please try again."
            )
            continue
        except Exception as e:
            logger.exception(
                "Unexpected error on question generation attempt %s/%s (role=%r, type=%r, difficulty=%r)",
                attempt, MAX_GENERATION_ATTEMPTS, job_role, interview_type, difficulty,
            )
            last_error = QuestionGenerationError(
                "An unexpected error occurred while generating questions."
            )
            continue

        raw_text = getattr(response, "text", None)
        if not raw_text:
            logger.warning(
                "Gemini returned empty content on question generation attempt %s/%s.",
                attempt, MAX_GENERATION_ATTEMPTS,
            )
            last_error = QuestionGenerationError("The question generation service returned no content.")
            continue

        try:
            raw_items = _extract_json_array(raw_text)
        except QuestionGenerationError as e:
            logger.warning(
                "Could not parse Gemini response as JSON array on attempt %s/%s: %s. Raw (truncated): %s",
                attempt, MAX_GENERATION_ATTEMPTS, e, raw_text[:500],
            )
            last_error = e
            continue

        if len(raw_items) != len(plan):
            logger.warning(
                "Gemini returned %s questions, expected %s, on attempt %s/%s.",
                len(raw_items), len(plan), attempt, MAX_GENERATION_ATTEMPTS,
            )
            last_error = QuestionGenerationError(
                f"Expected {len(plan)} questions, received {len(raw_items)}."
            )
            continue

        try:
            validated = [_validate_item(item, plan[i]["type"]) for i, item in enumerate(raw_items)]
        except QuestionGenerationError as e:
            logger.warning(
                "Question validation failed on attempt %s/%s: %s",
                attempt, MAX_GENERATION_ATTEMPTS, e,
            )
            last_error = e
            continue

        # Deduplicate within this batch (exact case-insensitive match).
        seen = set()
        unique = []
        for q in validated:
            key = q["question_text"].strip().lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(q)

        if len(unique) != len(plan):
            logger.warning(
                "Generated batch had internal duplicates on attempt %s/%s (%s unique of %s).",
                attempt, MAX_GENERATION_ATTEMPTS, len(unique), len(plan),
            )
            last_error = QuestionGenerationError("Generated questions contained duplicates.")
            continue

        # Structurally valid at this point — this is a usable fallback
        # candidate even if it overlaps with prior questions.
        batch_overlap = max(
            (_overlap_score(q["question_text"], avoid_questions) for q in unique),
            default=0.0,
        )
        if batch_overlap < best_batch_overlap:
            best_batch = unique
            best_batch_overlap = batch_overlap

        overlapped = batch_overlap >= NEAR_DUPLICATE_THRESHOLD
        if overlapped:
            logger.info(
                "Attempt %s/%s produced a structurally valid batch but it overlapped with prior "
                "questions (max overlap score %.2f >= threshold %.2f). Retrying for better diversity.",
                attempt, MAX_GENERATION_ATTEMPTS, batch_overlap, NEAR_DUPLICATE_THRESHOLD,
            )
            last_error = QuestionGenerationError(
                "Generated questions overlapped with previously asked questions."
            )
            continue

        return unique

    if best_batch is not None:
        logger.warning(
            "Falling back to the least-overlapping structurally valid batch after %s attempts "
            "(role=%r, type=%r, difficulty=%r, best overlap score %.2f). The interview will "
            "proceed with this batch instead of failing.",
            MAX_GENERATION_ATTEMPTS, job_role, interview_type, difficulty, best_batch_overlap,
        )
        return best_batch

    logger.error(
        "Question generation failed after %s attempts with no usable batch "
        "(role=%r, type=%r, difficulty=%r). Last error: %s",
        MAX_GENERATION_ATTEMPTS, job_role, interview_type, difficulty, last_error,
    )
    raise last_error or QuestionGenerationError("Question generation failed after multiple attempts.")