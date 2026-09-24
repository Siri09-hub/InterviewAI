from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.db.models import Resume, User

from app.services.resume_storage import (
    MAX_RESUME_SIZE_BYTES,
    ResumeValidationError,
    delete_resume_file,
    generate_stored_filename,
    validate_resume_upload,
    write_resume_file,
)

from app.services.resume_validator import (
    ResumeContentValidationError,
    validate_resume_content,
)

from app.services.resume_analyzer import (
    ResumeAnalysisError,
    analyze_resume,
)


router = APIRouter(
    prefix="/resumes",
    tags=["resumes"],
)


# --------------------------------------------------
# RESPONSE MODELS
# --------------------------------------------------

class ResumeResponse(BaseModel):
    id: int
    original_filename: str
    content_type: str
    file_size: int
    uploaded_at: str


class EducationAnalysis(BaseModel):
    degree: str
    institution: str
    year: str
    details: str


class ExperienceAnalysis(BaseModel):
    role: str
    organization: str
    duration: str
    details: str


class ProjectAnalysis(BaseModel):
    name: str
    technologies: list[str]
    details: str


class ResumeAnalysisResponse(BaseModel):
    resume_id: int
    original_filename: str

    summary: str

    skills: list[str]

    education: list[
        EducationAnalysis
    ]

    experience: list[
        ExperienceAnalysis
    ]

    projects: list[
        ProjectAnalysis
    ]

    certifications: list[str]

    strengths: list[str]

    areas_for_improvement: list[str]

    overall_assessment: str

    suggested_roles: list[str]


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def _to_response(
    resume: Resume,
) -> ResumeResponse:

    return ResumeResponse(
        id=resume.id,
        original_filename=(
            resume.original_filename
        ),
        content_type=(
            resume.content_type
        ),
        file_size=(
            resume.file_size
        ),
        uploaded_at=(
            resume.uploaded_at.isoformat()
            if resume.uploaded_at
            else ""
        ),
    )


async def _read_upload_with_limit(
    upload_file: UploadFile,
) -> bytes:

    chunks: list[bytes] = []
    total = 0

    while True:
        chunk = await upload_file.read(
            1024 * 1024
        )

        if not chunk:
            break

        total += len(chunk)

        if total > MAX_RESUME_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    "Resume file exceeds the 5MB limit."
                ),
            )

        chunks.append(chunk)

    return b"".join(chunks)


# --------------------------------------------------
# UPLOAD RESUME
# --------------------------------------------------

@router.post(
    "",
    response_model=ResumeResponse,
    status_code=201,
)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    # --------------------------------------------------
    # 1. Validate extension and MIME type
    # --------------------------------------------------

    try:
        extension = validate_resume_upload(
            file.filename or "",
            file.content_type,
        )

    except ResumeValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    # --------------------------------------------------
    # 2. Read upload with 5MB limit
    # --------------------------------------------------

    content = (
        await _read_upload_with_limit(
            file
        )
    )

    if not content:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded file is empty."
            ),
        )

    # --------------------------------------------------
    # 3. Validate actual document content
    # --------------------------------------------------

    try:
        validate_resume_content(
            file.filename or "",
            content,
        )

    except ResumeContentValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    # --------------------------------------------------
    # 4. Generate safe stored filename
    # --------------------------------------------------

    stored_filename = (
        generate_stored_filename(
            extension
        )
    )

    # --------------------------------------------------
    # 5. Save file to disk
    # --------------------------------------------------

    try:
        write_resume_file(
            current_user.id,
            stored_filename,
            content,
        )

    except OSError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save the uploaded file."
            ),
        )

    # --------------------------------------------------
    # 6. Check existing resume
    # --------------------------------------------------

    existing_resume = (
        db.query(Resume)
        .filter(
            Resume.user_id
            == current_user.id
        )
        .first()
    )

    old_stored_filename = (
        existing_resume.stored_filename
        if existing_resume
        else None
    )

    # --------------------------------------------------
    # 7. Save resume metadata
    # --------------------------------------------------

    try:
        if existing_resume:

            existing_resume.original_filename = (
                file.filename or "resume"
            )

            existing_resume.stored_filename = (
                stored_filename
            )

            existing_resume.content_type = (
                file.content_type
                or "application/octet-stream"
            )

            existing_resume.file_size = (
                len(content)
            )

            existing_resume.uploaded_at = (
                datetime.utcnow()
            )

            resume = existing_resume

        else:

            resume = Resume(
                user_id=current_user.id,
                original_filename=(
                    file.filename or "resume"
                ),
                stored_filename=(
                    stored_filename
                ),
                content_type=(
                    file.content_type
                    or "application/octet-stream"
                ),
                file_size=len(content),
            )

            db.add(resume)

        db.commit()
        db.refresh(resume)

    except SQLAlchemyError as error:

        db.rollback()

        print(
            "Resume database error:",
            error,
        )

        delete_resume_file(
            current_user.id,
            stored_filename,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save resume metadata."
            ),
        )

    # --------------------------------------------------
    # 8. Delete old resume file
    # --------------------------------------------------

    if (
        old_stored_filename
        and old_stored_filename
        != stored_filename
    ):
        delete_resume_file(
            current_user.id,
            old_stored_filename,
        )

    return _to_response(
        resume
    )


# --------------------------------------------------
# GET MY RESUME
# --------------------------------------------------

@router.get(
    "/me",
    response_model=ResumeResponse,
)
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id
            == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume has been uploaded yet."
            ),
        )

    return _to_response(
        resume
    )


# --------------------------------------------------
# ANALYZE MY RESUME
# --------------------------------------------------

@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
)
def analyze_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id
            == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No resume has been uploaded yet. "
                "Upload a resume before analyzing it."
            ),
        )

    try:
        analysis = analyze_resume(
            user_id=current_user.id,
            stored_filename=(
                resume.stored_filename
            ),
        )

    except ResumeAnalysisError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )

    return ResumeAnalysisResponse(
        resume_id=resume.id,
        original_filename=(
            resume.original_filename
        ),

        summary=analysis[
            "summary"
        ],

        skills=analysis[
            "skills"
        ],

        education=analysis[
            "education"
        ],

        experience=analysis[
            "experience"
        ],

        projects=analysis[
            "projects"
        ],

        certifications=analysis[
            "certifications"
        ],

        strengths=analysis[
            "strengths"
        ],

        areas_for_improvement=analysis[
            "areas_for_improvement"
        ],

        overall_assessment=analysis[
            "overall_assessment"
        ],

        suggested_roles=analysis[
            "suggested_roles"
        ],
    )