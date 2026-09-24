from sqlalchemy import text
from app.db.database import engine

def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            print("Connected to PostgreSQL successfully.")
            print("Result:", result)
    except Exception as e:
        print("Connection failed.")
        print(e)

if __name__ == "__main__":
    test_connection()