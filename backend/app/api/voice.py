
from __future__ import annotations

import base64
import io
import logging
import mimetypes
import os
import tempfile
import wave
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from google import genai
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])

TTS_MODEL = "gemini-3.1-flash-tts-preview"
TRANSCRIBE_MODEL = "gemini-3.5-transcribe"
TTS_VOICE = "Kore"

MAX_AUDIO_SIZE = 20 * 1024 * 1024  # 20 MB

SUPPORTED_AUDIO_TYPES = {
    "audio/webm": ".webm",
    "audio/opus": ".opus",
    "audio/wav": ".wav",
    "audio/mp3": ".mp3",
    "audio/mpeg": ".mp3",
    "audio/m4a": ".m4a",
    "audio/mp4": ".m4a",
    "audio/ogg": ".ogg",
    "audio/flac": ".flac",
    "audio/aac": ".aac",
    "audio/aiff": ".aiff",
    "audio/l16": ".l16",
    "audio/alaw": ".alaw",
    "audio/mulaw": ".mulaw",
}


CUSTOM_VOCABULARY = [
    "InterviewAI",
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "Next.js",
    "React",
    "FastAPI",
    "PostgreSQL",
    "MySQL",
    "DBMS",
    "API",
    "JWT",
    "REST API",
    "Judge0",
    "GitHub",
    "Docker",
    "SQL",
    "OOP",
    "DSA",
    "polymorphism",
    "inheritance",
    "encapsulation",
    "abstraction",
]


class SpeakRequest(BaseModel):
    text: str


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured.",
        )

    return genai.Client(api_key=api_key)


def normalize_mime_type(
    content_type: str | None,
    filename: str | None,
) -> str:
    mime_type = (content_type or "").strip().lower()

    if ";" in mime_type:
        mime_type = mime_type.split(";", 1)[0].strip()

    if mime_type in SUPPORTED_AUDIO_TYPES:
        return mime_type

    if filename:
        guessed, _ = mimetypes.guess_type(filename)

        if guessed:
            guessed = guessed.lower().strip()

            if ";" in guessed:
                guessed = guessed.split(";", 1)[0].strip()

            if guessed in SUPPORTED_AUDIO_TYPES:
                return guessed

    return "audio/webm"


def get_audio_extension(
    mime_type: str,
    filename: str | None,
) -> str:
    if mime_type in SUPPORTED_AUDIO_TYPES:
        return SUPPORTED_AUDIO_TYPES[mime_type]

    if filename:
        suffix = Path(filename).suffix.lower()

        if suffix:
            return suffix

    return ".webm"


def pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """
    Gemini 3.1 Flash TTS returns raw PCM audio.

    Convert the PCM bytes into a browser-playable WAV file.
    """

    output = io.BytesIO()

    with wave.open(output, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)

    return output.getvalue()


# ============================================================
# TEXT TO SPEECH
# ============================================================

@router.post("/speak")
def speak_question(request: SpeakRequest) -> Response:
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Question text cannot be empty.",
        )

    if len(text) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Question text is too long.",
        )

    client = get_gemini_client()

    try:
        # IMPORTANT:
        # Do NOT specify audio/mp3 here.
        # Gemini 3.1 Flash TTS returns PCM audio.
        interaction = client.interactions.create(
            model=TTS_MODEL,
            input=text,
            response_format={
                "type": "audio",
            },
            generation_config={
                "speech_config": [
                    {
                        "voice": TTS_VOICE,
                    }
                ]
            },
        )

        output_audio = getattr(
            interaction,
            "output_audio",
            None,
        )

        if output_audio is None:
            raise HTTPException(
                status_code=502,
                detail="Gemini did not return audio.",
            )

        audio_data = getattr(
            output_audio,
            "data",
            None,
        )

        if not audio_data:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned empty audio data.",
            )

        # Gemini returns the audio data as base64.
        if isinstance(audio_data, str):
            try:
                pcm_bytes = base64.b64decode(audio_data)
            except Exception as exc:
                logger.exception(
                    "Failed to decode Gemini TTS audio."
                )
                raise HTTPException(
                    status_code=502,
                    detail=f"Could not decode Gemini audio: {exc}",
                ) from exc
        else:
            pcm_bytes = bytes(audio_data)

        if not pcm_bytes:
            raise HTTPException(
                status_code=502,
                detail="Generated PCM audio is empty.",
            )

        # Gemini's TTS example uses:
        # 24000 Hz, 16-bit, mono PCM.
        wav_bytes = pcm_to_wav(
            pcm_bytes,
            sample_rate=24000,
            channels=1,
            sample_width=2,
        )

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": (
                    'inline; filename="interview-question.wav"'
                ),
                "Cache-Control": "no-store",
            },
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Gemini TTS failed.")

        raise HTTPException(
            status_code=502,
            detail=f"Gemini TTS failed: {str(exc)}",
        ) from exc


# ============================================================
# VOICE TO TEXT
# ============================================================

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
) -> dict[str, str]:

    if file is None:
        raise HTTPException(
            status_code=400,
            detail="Audio file is required.",
        )

    mime_type = normalize_mime_type(
        file.content_type,
        file.filename,
    )

    try:
        audio_bytes = await file.read()

    except Exception as exc:
        logger.exception(
            "Could not read uploaded audio."
        )

        raise HTTPException(
            status_code=400,
            detail=f"Could not read uploaded audio: {exc}",
        ) from exc

    finally:
        await file.close()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded audio file is empty.",
        )

    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Audio file is larger than 20 MB.",
        )

    extension = get_audio_extension(
        mime_type,
        file.filename,
    )

    temp_path: str | None = None
    uploaded_file = None

    client = get_gemini_client()

    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=extension,
            delete=False,
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        logger.info(
            "Uploading audio to Gemini: "
            "mime=%s size=%d filename=%s",
            mime_type,
            len(audio_bytes),
            file.filename,
        )

        uploaded_file = client.files.upload(
            file=temp_path,
            config=types.UploadFileConfig(
                mime_type=mime_type,
            ),
        )

        if uploaded_file is None:
            raise HTTPException(
                status_code=502,
                detail="Gemini audio upload failed.",
            )

        file_uri = getattr(
            uploaded_file,
            "uri",
            None,
        )

        if not file_uri:
            raise HTTPException(
                status_code=502,
                detail="Gemini did not return an audio URI.",
            )

        interaction = client.interactions.create(
            model=TRANSCRIBE_MODEL,
            input=[
                {
                    "type": "audio",
                    "uri": file_uri,
                    "mime_type": mime_type,
                }
            ],
            generation_config={
                "transcription_config": {
                    "mode": "smart",
                    "custom_vocabulary": CUSTOM_VOCABULARY,
                }
            },
        )

        transcript = (
            getattr(
                interaction,
                "output_text",
                None,
            )
            or ""
        ).strip()

        if not transcript:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty transcript.",
            )

        return {
            "text": transcript,
            "answer_source": "voice",
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Gemini transcription failed."
        )

        raise HTTPException(
            status_code=502,
            detail=f"Gemini transcription failed: {str(exc)}",
        ) from exc

    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass

        if uploaded_file is not None:
            uploaded_name = getattr(
                uploaded_file,
                "name",
                None,
            )

            if uploaded_name:
                try:
                    client.files.delete(
                        name=uploaded_name
                    )
                except Exception:
                    logger.warning(
                        "Could not delete temporary Gemini file: %s",
                        uploaded_name,
                    )

