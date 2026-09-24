from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
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
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(
        Integer,
        ForeignKey("interviews.id"),
        nullable=False
    )

    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)

    question_type = Column(
        String,
        default="open",
        nullable=False
    )

    options = Column(Text, nullable=True)
    correct_option = Column(Integer, nullable=True)

    ideal_answer = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)

    question_id = Column(
        Integer,
        ForeignKey("interview_questions.id"),
        nullable=False
    )

    answer_text = Column(Text, nullable=False)

    answer_source = Column(
        String,
        default="text",
        nullable=False
    )

    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    improvements = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================================
# CODING PRACTICE
# =========================================================


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(Integer, primary_key=True, index=True)

    slug = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    title = Column(String, nullable=False)

    difficulty = Column(String, nullable=False)
    topic = Column(String, nullable=False)

    description = Column(Text, nullable=False)

    example_input = Column(Text, nullable=True)
    example_output = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)

    constraints = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class CodingTestCase(Base):
    __tablename__ = "coding_test_cases"

    id = Column(Integer, primary_key=True, index=True)

    problem_id = Column(
        Integer,
        ForeignKey("coding_problems.id"),
        nullable=False,
        index=True
    )

    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)

    is_hidden = Column(
        Integer,
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    problem_id = Column(
        Integer,
        ForeignKey("coding_problems.id"),
        nullable=False,
        index=True
    )

    language = Column(String, nullable=False)

    source_code = Column(Text, nullable=False)

    status = Column(
        String,
        default="pending",
        nullable=False
    )

    passed_tests = Column(
        Integer,
        default=0,
        nullable=False
    )

    total_tests = Column(
        Integer,
        default=0,
        nullable=False
    )

    runtime_ms = Column(Integer, nullable=True)
    memory_kb = Column(Integer, nullable=True)

    submitted_at = Column(
        DateTime,
        default=datetime.utcnow
    )