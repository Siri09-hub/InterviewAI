import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader


# --------------------------------------------------
# Resume validation settings
# --------------------------------------------------

MIN_TEXT_LENGTH = 150

STRONG_RESUME_KEYWORDS = {
    "education",
    "skills",
    "projects",
    "experience",
    "work experience",
    "internship",
    "technical skills",
    "certifications",
    "achievements",
    "summary",
    "objective",
    "career objective",
}

CERTIFICATE_KEYWORDS = {
    "certificate of completion",
    "certificate of participation",
    "this is to certify",
    "has successfully completed",
    "awarded to",
    "certificate",
    "completion certificate",
    "participation certificate",
}

MIN_RESUME_SECTION_MATCHES = 2


class ResumeContentValidationError(Exception):
    """Raised when the uploaded document does not appear to be a resume."""
    pass


# --------------------------------------------------
# Extract text from PDF
# --------------------------------------------------

def extract_pdf_text(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))

        pages = []

        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)

        return "\n".join(pages).strip()

    except Exception as error:
        raise ResumeContentValidationError(
            f"Could not read the PDF file: {error}"
        )


# --------------------------------------------------
# Extract text from DOCX
# --------------------------------------------------

def extract_docx_text(content: bytes) -> str:
    try:
        document = Document(
            io.BytesIO(content)
        )

        parts = []

        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                parts.append(
                    paragraph.text.strip()
                )

        return "\n".join(parts).strip()

    except Exception as error:
        raise ResumeContentValidationError(
            f"Could not read the DOCX file: {error}"
        )


# --------------------------------------------------
# Extract text based on extension
# --------------------------------------------------

def extract_resume_text(
    filename: str,
    content: bytes,
) -> str:

    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(content)

    if extension == ".docx":
        return extract_docx_text(content)

    raise ResumeContentValidationError(
        "Only PDF or DOCX files are supported."
    )


# --------------------------------------------------
# Normalize text
# --------------------------------------------------

def normalize_text(text: str) -> str:
    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# --------------------------------------------------
# Validate resume content
# --------------------------------------------------

def validate_resume_content(
    filename: str,
    content: bytes,
) -> str:

    text = extract_resume_text(
        filename,
        content,
    )

    normalized = normalize_text(
        text
    )

    # ----------------------------------------------
    # Empty / very short document
    # ----------------------------------------------

    if len(normalized) < MIN_TEXT_LENGTH:
        raise ResumeContentValidationError(
            "This document does not contain enough text to be recognized as a resume."
        )

    # ----------------------------------------------
    # Certificate detection
    # ----------------------------------------------

    certificate_matches = 0

    for keyword in CERTIFICATE_KEYWORDS:
        if keyword in normalized:
            certificate_matches += 1

    # A document containing strong certificate
    # phrases but very few resume sections is
    # likely a certificate rather than a resume.
    resume_section_matches = 0

    for keyword in STRONG_RESUME_KEYWORDS:
        if keyword in normalized:
            resume_section_matches += 1

    if (
        certificate_matches >= 2
        and resume_section_matches < MIN_RESUME_SECTION_MATCHES
    ):
        raise ResumeContentValidationError(
            "This document appears to be a certificate or similar document. "
            "Please upload your resume."
        )

    # ----------------------------------------------
    # Resume section detection
    # ----------------------------------------------

    matched_sections = []

    for keyword in STRONG_RESUME_KEYWORDS:
        if keyword in normalized:
            matched_sections.append(
                keyword
            )

    # ----------------------------------------------
    # Require enough resume structure
    # ----------------------------------------------

    if len(matched_sections) < MIN_RESUME_SECTION_MATCHES:
        raise ResumeContentValidationError(
            "This document does not appear to be a resume. "
            "Please upload a resume containing sections such as "
            "Education, Skills, Projects, or Experience."
        )

    return text