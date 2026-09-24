from sqlalchemy import text

from app.db.database import engine


STATEMENTS = [
    "ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS score INTEGER",
    "ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS feedback TEXT",
    "ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS strengths TEXT",
    "ALTER TABLE interview_answers ADD COLUMN IF NOT EXISTS improvements TEXT",
]


if __name__ == "__main__":
    with engine.connect() as conn:
        for statement in STATEMENTS:
            conn.execute(text(statement))

        conn.commit()

    print(
        "Evaluation columns added (or already present) "
        "on interview_answers."
    )