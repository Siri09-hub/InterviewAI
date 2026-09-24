from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import CodingProblem, CodingSubmission, CodingTestCase
from app.services.code_executor import execute_code


router = APIRouter(prefix="/coding", tags=["Coding"])


class TestCase(BaseModel):
    input: str = ""
    expected_output: str = ""


class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    problem_slug: str | None = None
    test_cases: list[TestCase] = Field(default_factory=list, max_length=20)


class CodeSubmissionRequest(BaseModel):
    language: str
    code: str


SUPPORTED_LANGUAGES = {"C", "C++", "Java", "JavaScript", "Python"}


def normalize_output(value: str | None) -> str:
    return (value or "").strip()


def get_problem_by_slug(slug: str, db: Session) -> CodingProblem:
    problem = db.query(CodingProblem).filter(CodingProblem.slug == slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Coding problem not found.")
    return problem


def validate_language(language: str) -> None:
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}.",
        )


def problem_to_dict(problem: CodingProblem, solved: bool) -> dict:
    constraints = [
        line.strip()
        for line in (problem.constraints or "").splitlines()
        if line.strip()
    ]
    return {
        "id": problem.id,
        "slug": problem.slug,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "topic": problem.topic,
        "description": problem.description,
        "example_input": problem.example_input or "",
        "example_output": problem.example_output or "",
        "explanation": problem.explanation or "",
        "constraints": constraints,
        "solved": solved,
    }


def build_runnable_code(language: str, user_code: str) -> str:
    code = user_code.strip()

    if language == "Java":
        return code if "class Main" in code else (
            code
            + "\n\npublic class Main {\n"
            + "    public static void main(String[] args) {\n"
            + "        new Solution().solve();\n"
            + "    }\n"
            + "}\n"
        )

    if language == "Python":
        return code if "Solution().solve()" in code else (
            code
            + "\n\nif __name__ == \"__main__\":\n"
            + "    Solution().solve()\n"
        )

    if language == "C++":
        return code if "int main(" in code else (
            code
            + "\n\nint main() {\n"
            + "    Solution solution;\n"
            + "    solution.solve();\n"
            + "    return 0;\n"
            + "}\n"
        )

    if language == "JavaScript":
        return code if "solve();" in code or "new Solution().solve()" in code else (
            code + "\n\nnew Solution().solve();\n"
        )

    if language == "C":
        return code if "int main(" in code else (
            code
            + "\n\nint main(void) {\n"
            + "    solve();\n"
            + "    return 0;\n"
            + "}\n"
        )

    raise ValueError(f"Unsupported language: {language}")


@router.get("/problems")
def get_coding_problems(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    problems = db.query(CodingProblem).order_by(CodingProblem.id.asc()).all()
    accepted_problem_ids = {
        submission.problem_id
        for submission in db.query(CodingSubmission).filter(
            CodingSubmission.user_id == current_user.id,
            CodingSubmission.status == "accepted",
        ).all()
    }

    return {
        "problems": [
            problem_to_dict(problem, problem.id in accepted_problem_ids)
            for problem in problems
        ]
    }


@router.get("/problems/{slug}")
def get_coding_problem(
    slug: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    problem = get_problem_by_slug(slug, db)
    solved = db.query(CodingSubmission).filter(
        CodingSubmission.user_id == current_user.id,
        CodingSubmission.problem_id == problem.id,
        CodingSubmission.status == "accepted",
    ).first() is not None

    test_cases = db.query(CodingTestCase).filter(
        CodingTestCase.problem_id == problem.id,
        CodingTestCase.is_hidden == 0,
    ).order_by(CodingTestCase.id.asc()).all()

    response = problem_to_dict(problem, solved)
    response["test_cases"] = [
        {
            "id": case.id,
            "input": case.input_data,
            "expected_output": case.expected_output,
        }
        for case in test_cases
    ]
    return response


@router.post("/execute")
async def execute_coding_solution(
    request: CodeExecutionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_language(request.language)

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    if request.problem_slug:
        problem = get_problem_by_slug(request.problem_slug, db)
        test_cases = db.query(CodingTestCase).filter(
            CodingTestCase.problem_id == problem.id,
            CodingTestCase.is_hidden == 0,
        ).order_by(CodingTestCase.id.asc()).all()

        if not test_cases:
            raise HTTPException(status_code=400, detail="No visible test cases are available.")

        test_case_data = [
            {"input": case.input_data, "expected_output": case.expected_output}
            for case in test_cases
        ]
    else:
        if not request.test_cases:
            raise HTTPException(status_code=400, detail="At least one test case is required.")
        test_case_data = [
            {"input": case.input, "expected_output": case.expected_output}
            for case in request.test_cases
        ]

    try:
        runnable_code = build_runnable_code(request.language, request.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    results = []

    for index, test_case in enumerate(test_case_data, start=1):
        try:
            result = await execute_code(
                language=request.language,
                source_code=runnable_code,
                stdin=test_case["input"],
            )

            actual = normalize_output(result.get("stdout"))
            expected = normalize_output(test_case["expected_output"])
            status_id = result.get("status_id")

            results.append({
                "test_case": index,
                "input": test_case["input"],
                "expected_output": test_case["expected_output"],
                "actual_output": actual,
                "status": result.get("status"),
                "status_id": status_id,
                "passed": actual == expected and status_id == 3,
                "stderr": result.get("stderr"),
                "compile_output": result.get("compile_output"),
                "message": result.get("message"),
                "time": result.get("time"),
                "memory": result.get("memory"),
            })
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Code execution failed: {exc}") from exc

    passed = sum(1 for result in results if result["passed"])
    return {
        "language": request.language,
        "problem_slug": request.problem_slug,
        "total_tests": len(results),
        "passed_tests": passed,
        "all_passed": passed == len(results),
        "results": results,
    }


@router.post("/submit")
async def submit_coding_solution(
    request: CodeSubmissionRequest,
    problem_slug: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_language(request.language)

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    problem = get_problem_by_slug(problem_slug, db)
    test_cases = db.query(CodingTestCase).filter(
        CodingTestCase.problem_id == problem.id
    ).order_by(CodingTestCase.id.asc()).all()

    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases are available for this problem.")

    try:
        runnable_code = build_runnable_code(request.language, request.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    passed_tests = 0
    runtime_ms = None
    memory_kb = None
    has_compile_error = False
    has_runtime_error = False
    test_results = []

    for index, test_case in enumerate(test_cases, start=1):
        try:
            result = await execute_code(
                language=request.language,
                source_code=runnable_code,
                stdin=test_case.input_data,
            )

            actual = normalize_output(result.get("stdout"))
            expected = normalize_output(test_case.expected_output)
            status_id = result.get("status_id")
            passed = actual == expected and status_id == 3

            if passed:
                passed_tests += 1

            if status_id == 6:
                has_compile_error = True
            elif status_id in {5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}:
                has_runtime_error = True

            if result.get("time") is not None:
                try:
                    runtime_ms = int(float(result["time"]) * 1000)
                except (TypeError, ValueError):
                    pass

            if result.get("memory") is not None:
                try:
                    memory_kb = int(result["memory"])
                except (TypeError, ValueError):
                    pass

            test_results.append({
                "test_case": index,
                "passed": passed,
                "status": result.get("status"),
                "stderr": result.get("stderr"),
                "compile_output": result.get("compile_output"),
                "message": result.get("message"),
                "time": result.get("time"),
                "memory": result.get("memory"),
            })
        except Exception as exc:
            has_runtime_error = True
            test_results.append({
                "test_case": index,
                "passed": False,
                "status": "Execution Error",
                "stderr": str(exc),
                "compile_output": "",
                "message": "Unable to execute test case.",
                "time": None,
                "memory": None,
            })

    total_tests = len(test_cases)

    if passed_tests == total_tests:
        status = "accepted"
    elif has_compile_error:
        status = "compile_error"
    elif has_runtime_error:
        status = "runtime_error"
    else:
        status = "wrong_answer"

    submission = CodingSubmission(
        user_id=current_user.id,
        problem_id=problem.id,
        language=request.language,
        source_code=request.code,
        status=status,
        passed_tests=passed_tests,
        total_tests=total_tests,
        runtime_ms=runtime_ms,
        memory_kb=memory_kb,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return {
        "submission_id": submission.id,
        "problem_slug": problem.slug,
        "problem_title": problem.title,
        "language": request.language,
        "status": status,
        "accepted": status == "accepted",
        "solved": status == "accepted",
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "runtime_ms": runtime_ms,
        "memory_kb": memory_kb,
        "test_results": test_results,
        "submitted_at": submission.submitted_at,
    }


@router.get("/submissions")
def get_coding_submissions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    submissions = db.query(CodingSubmission).filter(
        CodingSubmission.user_id == current_user.id
    ).order_by(CodingSubmission.submitted_at.desc()).limit(100).all()

    results = []
    for submission in submissions:
        problem = db.query(CodingProblem).filter(
            CodingProblem.id == submission.problem_id
        ).first()

        results.append({
            "id": submission.id,
            "problem_id": submission.problem_id,
            "problem_slug": problem.slug if problem else None,
            "problem_title": problem.title if problem else None,
            "language": submission.language,
            "status": submission.status,
            "passed_tests": submission.passed_tests,
            "total_tests": submission.total_tests,
            "runtime_ms": submission.runtime_ms,
            "memory_kb": submission.memory_kb,
            "submitted_at": submission.submitted_at,
        })

    return {"submissions": results}
