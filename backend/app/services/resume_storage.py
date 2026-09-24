import os
import uuid
import tempfile
from pathlib import Path
from io import BytesIO
from urllib.request import urlopen

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from dotenv import load_dotenv


load_dotenv()


# --------------------------------------------------
# CLOUDINARY CONFIGURATION
# --------------------------------------------------

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )


# --------------------------------------------------
# LOCAL TEMPORARY STORAGE
# --------------------------------------------------

_DEFAULT_STORAGE_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "storage"
    / "resumes"
)

RESUME_STORAGE_DIR = Path(
    os.getenv(
        "RESUME_STORAGE_DIR",
        str(_DEFAULT_STORAGE_DIR),
    )
)


ALLOWED_EXTENSIONS = {".pdf", ".docx"}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024


# --------------------------------------------------
# ERRORS
# --------------------------------------------------

class ResumeValidationError(Exception):
    """Raised when an uploaded resume fails validation."""

    pass


# --------------------------------------------------
# VALIDATION
# --------------------------------------------------

def validate_resume_upload(
    filename: str,
    content_type: str | None,
) -> str:

    if not filename:
        raise ResumeValidationError(
            "No file was provided."
        )

    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ResumeValidationError(
            "Only PDF or DOCX files are supported."
        )

    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ResumeValidationError(
            "Only PDF or DOCX files are supported."
        )

    return ext


# --------------------------------------------------
# CLOUDINARY HELPERS
# --------------------------------------------------

def _check_cloudinary_config() -> None:

    if not all(
        [
            CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET,
        ]
    ):
        raise ResumeValidationError(
            "Resume storage is not configured."
        )


def _cloudinary_public_id(
    user_id: int,
    stored_filename: str,
) -> str:

    return (
        f"interviewai/resumes/"
        f"{user_id}/"
        f"{stored_filename}"
    )


# --------------------------------------------------
# LOCAL PATH
# --------------------------------------------------

def get_user_resume_dir(user_id: int) -> Path:

    user_dir = (
        RESUME_STORAGE_DIR
        / str(user_id)
    )

    user_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    return user_dir


def resume_file_path(
    user_id: int,
    stored_filename: str,
) -> Path:

    """
    Downloads the resume from Cloudinary into a
    temporary local file and returns that path.
    """

    _check_cloudinary_config()

    public_id = _cloudinary_public_id(
        user_id,
        stored_filename,
    )

    url, _ = cloudinary_url(
        public_id,
        resource_type="raw",
        secure=True,
    )

    temp_dir = get_user_resume_dir(user_id)

    local_path = (
        temp_dir
        / stored_filename
    )

    try:
        with urlopen(url, timeout=30) as response:
            content = response.read()

        with open(local_path, "wb") as file:
            file.write(content)

    except Exception as exc:
        raise FileNotFoundError(
            "Stored resume file could not be downloaded."
        ) from exc

    return local_path


# --------------------------------------------------
# FILENAME
# --------------------------------------------------

def generate_stored_filename(
    ext: str,
) -> str:

    return f"{uuid.uuid4().hex}{ext}"


# --------------------------------------------------
# WRITE / UPLOAD
# --------------------------------------------------

def write_resume_file(
    user_id: int,
    stored_filename: str,
    content: bytes,
) -> None:

    _check_cloudinary_config()

    public_id = _cloudinary_public_id(
        user_id,
        stored_filename,
    )

    try:

        cloudinary.uploader.upload(
            BytesIO(content),
            resource_type="raw",
            public_id=public_id,
            overwrite=True,
        )

    except Exception as exc:

        raise ResumeValidationError(
            "Could not store the resume."
        ) from exc


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def delete_resume_file(
    user_id: int,
    stored_filename: str,
) -> None:

    if not (
        CLOUDINARY_CLOUD_NAME
        and CLOUDINARY_API_KEY
        and CLOUDINARY_API_SECRET
    ):
        return

    public_id = _cloudinary_public_id(
        user_id,
        stored_filename,
    )

    try:

        cloudinary.uploader.destroy(
            public_id,
            resource_type="raw",
        )

    except Exception:
        # Best-effort cleanup.
        pass

    # Also remove any temporary local copy.

    local_path = (
        get_user_resume_dir(user_id)
        / stored_filename
    )

    try:

        if local_path.exists():
            local_path.unlink()

    except OSError:
        pass