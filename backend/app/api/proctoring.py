from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.db.models import Interview, User


router = APIRouter(tags=["proctoring"])


class ProctoringViolationRequest(BaseModel):
    violation_type: str
    details: str | None = None


class ProctoringViolationResponse(BaseModel):
    id: int
    interview_id: int
    violation_type: str
    details: str | None
    occurred_at: datetime


@router.post(
    "/interviews/{interview_id}/proctoring/violations",
    response_model=ProctoringViolationResponse,
    status_code=201,
)
def create_proctoring_violation(
    interview_id: int,
    payload: ProctoringViolationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------
    # Verify that the interview belongs to user
    # --------------------------------------------
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    # --------------------------------------------
    # Validate violation type
    # --------------------------------------------
    violation_type = payload.violation_type.strip()

    if not violation_type:
        raise HTTPException(
            status_code=400,
            detail="Violation type is required",
        )

    # --------------------------------------------
    # Save violation
    # --------------------------------------------
    insert_sql = text(
        """
        INSERT INTO proctoring_violations (
            interview_id,
            violation_type,
            details
        )
        VALUES (
            :interview_id,
            :violation_type,
            :details
        )
        RETURNING
            id,
            interview_id,
            violation_type,
            details,
            occurred_at
        """
    )

    try:
        result = db.execute(
            insert_sql,
            {
                "interview_id": interview_id,
                "violation_type": violation_type,
                "details": payload.details,
            },
        )

        row = result.fetchone()

        if row is None:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Could not create proctoring violation",
            )

        db.commit()

        return ProctoringViolationResponse(
            id=row.id,
            interview_id=row.interview_id,
            violation_type=row.violation_type,
            details=row.details,
            occurred_at=row.occurred_at,
        )

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not save proctoring violation",
        )