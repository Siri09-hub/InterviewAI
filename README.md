# InterviewAI — Real-Time Adaptive AI Interview & Live Coding Evaluation Platform

InterviewAI is an AI-powered technical interview platform that combines AI-led interviews, coding evaluation, voice interaction, and interview proctoring.

Features

JWT-based user registration and login

AI interview sessions

Multiple-choice and open-ended questions

Text answers and voice-to-text answers

AI interviewer voice using Gemini TTS

Answer scoring, feedback, strengths, and improvements

Monaco live coding editor

Judge0 code execution

Compilation, runtime, wrong-answer, timeout, and success handling

Camera and microphone based proctoring

MediaPipe face detection

No-face and multiple-face detection

Tab-switch detection

Copy, paste, cut, and right-click detection

Proctoring violation storage

Mark deduction based on violations

Interview result and evaluation pages

PostgreSQL database

Tech Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

Monaco Editor

Backend

Python

FastAPI

SQLAlchemy

PostgreSQL

JWT

Google Gemini API

Judge0 API

AI / Vision

Gemini TTS

Gemini transcription

MediaPipe Face Detector

Project Structure

InterviewAI/
├── ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── main.py
│   ├── .venv/
│   └── requirements.txt
├── database/
├── docker/
├── docs/
├── frontend/
│   └── src/
└── README.md

Requirements

Node.js

Python

PostgreSQL

Git

Google Gemini API key

Judge0 access for coding execution

Environment Variables

Example backend configuration:

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/interviewai
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

For development, Judge0 is set with:

$env:JUDGE0_API_URL="https://ce.judge0.com"

Never commit API keys or database passwords.

Run Backend

Open PowerShell:

cd D:\InterviewAIackend
.\.venv\Scripts\Activate.ps1
$env:JUDGE0_API_URL="https://ce.judge0.com"
uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

Run Frontend

Open another PowerShell:

cd D:\InterviewAIrontend
npm.cmd run dev

Frontend:

http://localhost:3000

Login:

http://localhost:3000/login

Interview Flow

Candidate logs in.

Candidate starts an interview.

Questions are loaded.

AI interviewer presents each question.

Candidate answers using text or voice where supported.

Answers are saved and evaluated.

Coding questions can be executed through Judge0.

Proctoring monitors the interview.

Violations are recorded.

Interview is submitted.

Results and evaluation are displayed.

Proctoring

The current system monitors:

One face: normal

No face: violation after 3 seconds

Multiple faces: violation after 3 seconds

Tab switches

Right-click

Copy

Paste

Cut

Violation events are stored through the backend.

Current application logic deducts one mark for every 3 recorded violations.

Voice APIs

AI Interviewer

POST /voice/speak

Example:

{
  "text": "Please explain polymorphism in Java."
}

Candidate Transcription

POST /voice/transcribe

The frontend records microphone audio and uploads it for transcription.

Authentication

Protected API requests use:

Authorization: Bearer <access_token>

The frontend stores the access token after login and attaches it to authenticated requests.

Coding Evaluation

Judge0 is used for code execution.

Supported outcomes include:

Success

Compilation error

Runtime error

Wrong answer

Time-limit exceeded

Common Commands

Backend

cd D:\InterviewAIackend
.\.venv\Scripts\Activate.ps1
$env:JUDGE0_API_URL="https://ce.judge0.com"
uvicorn app.main:app --reload

Frontend

cd D:\InterviewAIrontend
npm.cmd run dev

Python syntax check

python -m py_compile .pppioice.py

Development Notes

PostgreSQL must be running before starting the backend.

Keep backend and frontend terminals running during development.

Judge0 can remain configured for local development.

Deployment configuration can be completed after the project is fully developed.

Goal

InterviewAI brings AI interviewing, coding assessment, voice interaction, automated evaluation, proctoring, and performance reporting into one platform.
