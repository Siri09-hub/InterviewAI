from sqlalchemy import text

from app.db.database import engine

STATEMENTS = [
    "ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS ideal_answer TEXT",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for statement in STATEMENTS:
            conn.execute(text(statement))
        conn.commit()

    print("ideal_answer column added (or already present) on interview_questions.")