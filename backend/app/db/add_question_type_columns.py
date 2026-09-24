from sqlalchemy import text

from app.db.database import engine

STATEMENTS = [
    "ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS question_type VARCHAR NOT NULL DEFAULT 'open'",
    "ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS options TEXT",
    "ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS correct_option INTEGER",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for statement in STATEMENTS:
            conn.execute(text(statement))
        conn.commit()
    print("✅ Question type columns added (or already present) on interview_questions.")