from sqlalchemy import text

from app.db.database import engine


def main():
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS proctoring_violations (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER NOT NULL
            REFERENCES interviews(id)
            ON DELETE CASCADE,
        violation_type VARCHAR(100) NOT NULL,
        details TEXT NULL,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_proctoring_violations_interview_id
    ON proctoring_violations(interview_id);

    CREATE INDEX IF NOT EXISTS ix_proctoring_violations_occurred_at
    ON proctoring_violations(occurred_at);
    """

    with engine.begin() as connection:
        connection.execute(text(create_table_sql))

    print("Proctoring violations table created successfully.")


if __name__ == "__main__":
    main()