import asyncio
import base64
import os

import httpx


# Use Judge0 Cloud by default. An environment variable can override this later.
JUDGE0_API_URL = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com").rstrip("/")

LANGUAGE_IDS = {
    "C": 50,
    "C++": 54,
    "Java": 62,
    "JavaScript": 63,
    "Python": 71,
}

CPU_TIME_LIMIT = 5
WALL_TIME_LIMIT = 10
MEMORY_LIMIT = 128000
POLL_INTERVAL = 0.5
MAX_POLLS = 30


def encode(value: str) -> str:
    return base64.b64encode(value.encode()).decode()


def decode(value: str | None) -> str:
    if not value:
        return ""
    try:
        return base64.b64decode(value).decode()
    except Exception:
        return value


async def execute_code(
    language: str,
    source_code: str,
    stdin: str = "",
) -> dict:
    if language not in LANGUAGE_IDS:
        raise ValueError(f"Unsupported language: {language}")

    payload = {
        "language_id": LANGUAGE_IDS[language],
        "source_code": encode(source_code),
        "stdin": encode(stdin),
        "cpu_time_limit": CPU_TIME_LIMIT,
        "wall_time_limit": WALL_TIME_LIMIT,
        "memory_limit": MEMORY_LIMIT,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{JUDGE0_API_URL}/submissions",
            params={"base64_encoded": "true", "wait": "false"},
            json=payload,
        )
        response.raise_for_status()

        submission = response.json()
        token = submission.get("token")
        if not token:
            raise RuntimeError("Judge0 did not return a submission token.")

        for _ in range(MAX_POLLS):
            await asyncio.sleep(POLL_INTERVAL)

            result_response = await client.get(
                f"{JUDGE0_API_URL}/submissions/{token}",
                params={"base64_encoded": "true"},
            )
            result_response.raise_for_status()

            result = result_response.json()
            status_id = result.get("status", {}).get("id")

            if status_id in {1, 2}:
                continue

            return {
                "status_id": status_id,
                "status": result.get("status", {}).get("description"),
                "stdout": decode(result.get("stdout")),
                "stderr": decode(result.get("stderr")),
                "compile_output": decode(result.get("compile_output")),
                "message": decode(result.get("message")),
                "time": result.get("time"),
                "memory": result.get("memory"),
            }

    return {
        "status_id": None,
        "status": "Time Limit Exceeded",
        "stdout": "",
        "stderr": "",
        "compile_output": "",
        "message": "Judge0 did not finish within the polling limit.",
        "time": None,
        "memory": None,
    }
