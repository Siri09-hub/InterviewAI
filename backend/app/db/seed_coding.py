from app.db.database import SessionLocal
from app.db.models import CodingProblem, CodingTestCase


PROBLEMS = [
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "topic": "Arrays",
        "description": "Given an array of integers and a target value, find the indices of two numbers that add up to the target.",
        "example_input": "2 7 11 15\n9",
        "example_output": "[0,1]",
        "explanation": "Use a HashMap to remember each number and its index. For every number, check whether target - number has already been seen.",
        "constraints": [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Exactly one valid answer exists.",
        ],
        "test_cases": [
            ("2 7 11 15\n9", "[0,1]"),
            ("3 2 4\n6", "[1,2]"),
            ("3 3\n6", "[0,1]"),
        ],
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "difficulty": "Easy",
        "topic": "Arrays",
        "description": "Given an integer array, determine whether any value appears at least twice.",
        "example_input": "1 2 3 1",
        "example_output": "true",
        "explanation": "Store every number in a Set. If a number is already present, a duplicate exists.",
        "constraints": [
            "1 <= nums.length <= 10^5",
            "-10^9 <= nums[i] <= 10^9",
        ],
        "test_cases": [
            ("1 2 3 1", "true"),
            ("1 2 3 4", "false"),
            ("1 1", "true"),
        ],
    },
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topic": "Stack",
        "description": "Given a string containing brackets, determine whether every opening bracket is closed in the correct order.",
        "example_input": "()[]{}",
        "example_output": "true",
        "explanation": "Use a stack. Push opening brackets and match each closing bracket with the latest opening bracket.",
        "constraints": [
            "1 <= s.length <= 10^4",
            "s contains only parentheses, braces and brackets.",
        ],
        "test_cases": [
            ("()[]{}", "true"),
            ("([)]", "false"),
            ("{[]}", "true"),
        ],
    },
    {
        "slug": "binary-search",
        "title": "Binary Search",
        "difficulty": "Easy",
        "topic": "Searching",
        "description": "Given a sorted array and a target, return the target index or -1 when it is not present.",
        "example_input": "-1 0 3 5 9 12\n9",
        "example_output": "4",
        "explanation": "Compare the target with the middle element and repeatedly discard the half that cannot contain the target.",
        "constraints": [
            "1 <= nums.length <= 10^4",
            "nums is sorted in ascending order.",
        ],
        "test_cases": [
            ("-1 0 3 5 9 12\n9", "4"),
            ("-1 0 3 5 9 12\n2", "-1"),
            ("5\n5", "0"),
        ],
    },
    {
        "slug": "maximum-subarray",
        "title": "Maximum Subarray",
        "difficulty": "Medium",
        "topic": "Arrays",
        "description": "Find the contiguous subarray with the largest sum and return that sum.",
        "example_input": "-2 1 -3 4 -1 2 1 -5 4",
        "example_output": "6",
        "explanation": "Use Kadane's algorithm to keep the best subarray ending at each position.",
        "constraints": [
            "1 <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4",
        ],
        "test_cases": [
            ("-2 1 -3 4 -1 2 1 -5 4", "6"),
            ("1", "1"),
            ("5 4 -1 7 8", "23"),
        ],
    },
    {
        "slug": "reverse-string",
        "title": "Reverse String",
        "difficulty": "Easy",
        "topic": "Strings",
        "description": "Given a string, print the characters in reverse order.",
        "example_input": "hello",
        "example_output": "olleh",
        "explanation": "Reverse the characters using two pointers, an array, or a string builder.",
        "constraints": [
            "1 <= s.length <= 10^5",
            "The input contains a single line of text.",
        ],
        "test_cases": [
            ("hello", "olleh"),
            ("InterviewAI", "IAweivretnI"),
            ("abcd", "dcba"),
        ],
    },
]


def seed() -> None:
    db = SessionLocal()

    try:
        for data in PROBLEMS:
            problem = (
                db.query(CodingProblem)
                .filter(CodingProblem.slug == data["slug"])
                .first()
            )

            if not problem:
                problem = CodingProblem(slug=data["slug"])
                db.add(problem)

            problem.title = data["title"]
            problem.difficulty = data["difficulty"]
            problem.topic = data["topic"]
            problem.description = data["description"]
            problem.example_input = data["example_input"]
            problem.example_output = data["example_output"]
            problem.explanation = data["explanation"]
            problem.constraints = "\n".join(data["constraints"])

            db.commit()
            db.refresh(problem)

            existing_cases = (
                db.query(CodingTestCase)
                .filter(CodingTestCase.problem_id == problem.id)
                .all()
            )

            existing_pairs = {
                (case.input_data, case.expected_output)
                for case in existing_cases
            }

            for input_data, expected_output in data["test_cases"]:
                if (input_data, expected_output) not in existing_pairs:
                    db.add(
                        CodingTestCase(
                            problem_id=problem.id,
                            input_data=input_data,
                            expected_output=expected_output,
                            is_hidden=0,
                        )
                    )

            db.commit()

        print("Selected coding problems seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
