from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.db.models import Interview, User


router = APIRouter(prefix="/interviews", tags=["interviews"])


# ============================================================
# TYPES
# ============================================================

JobRole = Literal[
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Data Scientist",
    "AI/ML Engineer",
    "Full Stack Developer",
]

InterviewType = Literal[
    "Technical",
    "Behavioral",
    "Mixed",
]

Difficulty = Literal[
    "Easy",
    "Medium",
    "Hard",
]

DurationMinutes = Literal[
    15,
    30,
    45,
    60,
]


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class CreateInterviewRequest(BaseModel):
    job_role: JobRole
    interview_type: InterviewType
    difficulty: Difficulty
    duration_minutes: DurationMinutes


class InterviewResponse(BaseModel):
    id: int
    job_role: str
    interview_type: str
    difficulty: str
    duration_minutes: int
    status: str


class InterviewHistoryResponse(BaseModel):
    id: int
    job_role: str
    interview_type: str
    difficulty: str
    duration_minutes: int
    status: str
    completed_at: str | None


# ============================================================
# CREATE INTERVIEW
# ============================================================

@router.post(
    "",
    response_model=InterviewResponse,
    status_code=201,
)
def create_interview(
    payload: CreateInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_interview = Interview(
        user_id=current_user.id,
        job_role=payload.job_role,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
    )

    try:
        db.add(new_interview)
        db.commit()
        db.refresh(new_interview)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not create interview",
        )

    return new_interview


# ============================================================
# GET INTERVIEW HISTORY
# ============================================================

@router.get(
    "",
    response_model=list[InterviewHistoryResponse],
)
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == current_user.id
        )
        .order_by(
            Interview.id.desc()
        )
        .all()
    )

    return [
        InterviewHistoryResponse(
            id=interview.id,
            job_role=interview.job_role,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            duration_minutes=interview.duration_minutes,
            status=interview.status,
            completed_at=(
                interview.completed_at.isoformat()
                if interview.completed_at
                else None
            ),
        )
        for interview in interviews
    ]