from sqlalchemy import text

from app.db.database import engine

STATEMENTS = [
    "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for statement in STATEMENTS:
            conn.execute(text(statement))
        conn.commit()

    print("completed_at column added (or already present) on interviews.")