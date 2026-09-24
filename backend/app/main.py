from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import os

from app.db.database import get_db
from app.api.auth import router as auth_router
from app.api.interviews import router as interviews_router
from app.api.questions import router as questions_router
from app.api.proctoring import router as proctoring_router
from app.api.resumes import router as resumes_router
from app.api.code_execution import router as code_execution_router
from app.api.voice import router as voice_router


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="InterviewAI Backend"
)


# --------------------------------------------------
# API routers
# --------------------------------------------------

app.include_router(auth_router)
app.include_router(interviews_router)
app.include_router(questions_router)
app.include_router(proctoring_router)
app.include_router(resumes_router)
app.include_router(code_execution_router)
app.include_router(voice_router)


# --------------------------------------------------
# Database test
# --------------------------------------------------

@app.get("/db-test")
def db_test(
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("SELECT 1")
        ).scalar()

        return {
            "status": "connected",
            "result": result,
        }

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Database connection failed: "
                f"{str(e)}"
            ),
        )


# --------------------------------------------------
# CORS
# --------------------------------------------------

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

allow_origins = [
    origin.strip()
    for origin in cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "InterviewAI backend",
    }