from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_role = Column(String, nullable=False)
    interview_type = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String, default="created", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)

    # Automatically generated: "open" or "mcq"
    question_type = Column(
        String,
        default="open",
        nullable=False,
    )

    # JSON text containing the MCQ options.
    # Open questions use [].
    options = Column(
        Text,
        nullable=True,
    )

    # Zero-based index of the correct MCQ option.
    # NULL for open questions.
    correct_option = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer,
        ForeignKey("interview_questions.id"),
        nullable=False,
    )

    answer_text = Column(
        Text,
        nullable=False,
    )

    answer_source = Column(
        String,
        default="text",
        nullable=False,
    )

    # Module 2.9 evaluation fields
    score = Column(
        Integer,
        nullable=True,
    )

    feedback = Column(
        Text,
        nullable=True,
    )

    strengths = Column(
        Text,
        nullable=True,
    )

    improvements = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )