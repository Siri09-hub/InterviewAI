# InterviewAI

> **AI-Powered Interview Platform with Live Coding Evaluation**

InterviewAI is a full-stack web application that simulates technical interviews using AI and evaluates candidates through **resume-based questioning, coding challenges, real-time interview interaction, and automated evaluation**.

The platform is designed to provide a realistic interview experience while helping candidates understand their technical strengths and areas for improvement.

---

## 🚀 Features

### 👤 User Authentication

* User registration and login
* Secure password handling
* JWT-based authentication
* Protected application routes

### 📄 Resume Analysis

* Upload resume in PDF or DOCX format
* AI-powered resume analysis
* Extracts relevant skills, education, projects, and experience
* Generates interview questions based on the candidate's resume

### 🤖 AI Interviewer

* AI-generated technical interview questions
* Questions based on resume and selected interview category
* Dynamic follow-up questions
* Interview conversation flow
* AI-generated evaluation and feedback

### 💻 Live Coding Evaluation

* Coding problems generated for the interview
* Online code editor
* Supports programming languages such as Java and Python
* Code execution through Judge0
* Test-case based evaluation
* Displays execution results and errors

### 🎥 Interview Proctoring

* Camera and microphone permission handling
* Interview monitoring
* Detection of selected suspicious activities
* Proctoring violation tracking

### 📊 Interview Evaluation

* Technical performance evaluation
* Coding performance evaluation
* AI-generated feedback
* Strengths and improvement areas
* Interview completion tracking

### 🗄️ Database Management

* PostgreSQL database
* User information storage
* Resume information
* Interview questions and answers
* Coding submissions
* Evaluation results
* Proctoring violations

### ☁️ Cloud Storage

* Resume files stored using Cloudinary
* Prevents dependency on temporary server storage
* Secure cloud-based resume file management

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User / Candidate │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js Frontend   │
                         │   React + TypeScript  │
                         └──────────┬───────────┘
                                    │
                              REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │     Python API       │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └────────────┐
                    ▼                                 ▼
           ┌─────────────────┐              ┌─────────────────┐
           │    PostgreSQL   │              │   Google Gemini │
           │    Database     │              │    AI Service   │
           └─────────────────┘              └─────────────────┘
                                      
                                      
                    ┌───────────────────────────────┐
                    │           Services            │
                    ├───────────────────────────────┤
                    │ Cloudinary - Resume Storage   │
                    │ Judge0 - Code Execution       │
                    └───────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* HTML5
* CSS3

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* JWT Authentication

### Database

* PostgreSQL

### AI

* Google Gemini API

### Code Execution

* Judge0

### Cloud Storage

* Cloudinary

### Development Tools

* Git
* GitHub
* VS Code
* Postman / Swagger

### Deployment

* Vercel — Frontend
* Render — Backend
* Render PostgreSQL — Database
* Cloudinary — Resume storage

---

## 📁 Project Structure

```text
InterviewAI/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   ├── interview/
│   │   │   └── ...
│   │   │
│   │   ├── components/
│   │   └── lib/
│   │       └── api.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   ├── create_tables.py
│   │   │   └── ...
│   │   │
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── resume_storage.py
│   │   │   └── ...
│   │   │
│   │   └── main.py
│   │
│   ├── storage/
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
├── ai/
├── database/
├── docker/
├── docs/
├── .gitignore
└── README.md
```

---

## 🔄 Application Workflow

```text
1. User Registration
        ↓
2. User Login
        ↓
3. Upload Resume
        ↓
4. Resume Stored in Cloudinary
        ↓
5. AI Analyzes Resume
        ↓
6. Interview Questions Generated
        ↓
7. AI Technical Interview
        ↓
8. Coding Challenge
        ↓
9. Code Submitted
        ↓
10. Judge0 Executes Code
        ↓
11. AI Evaluates Performance
        ↓
12. Final Interview Evaluation
        ↓
13. Feedback & Results
```

---

## 📄 Resume Analysis

The candidate uploads a resume in **PDF or DOCX format**.

The backend:

1. Validates the uploaded file.
2. Stores the resume in Cloudinary.
3. Retrieves the stored file when required.
4. Extracts the resume content.
5. Sends relevant information to Gemini.
6. Generates structured analysis.
7. Uses the analysis to support personalized interview questions.

---

## 🤖 AI Interview Process

InterviewAI uses Google Gemini to provide an interactive interview experience.

The AI can:

* Analyze candidate information.
* Generate technical questions.
* Ask follow-up questions.
* Evaluate answers.
* Identify strengths.
* Identify areas for improvement.
* Generate interview feedback.

The goal is to make the questions more relevant to the candidate instead of using only a fixed question list.

---

## 💻 Coding Evaluation

The coding module allows candidates to solve programming problems during the interview.

### Process

```text
Coding Problem
      ↓
Candidate writes code
      ↓
Code submission
      ↓
Judge0 execution
      ↓
Test cases
      ↓
Execution result
      ↓
Evaluation
```

Judge0 is used to execute submitted code and obtain execution results such as:

* Output
* Compilation errors
* Runtime errors
* Execution status
* Test-case results

---

## 🎥 Proctoring

The interview proctoring module helps monitor the interview environment.

Depending on the enabled checks, the system can track events such as:

* Camera status
* Microphone status
* Tab/window-related violations
* Other configured suspicious activities

Proctoring events can be stored in the PostgreSQL database for later evaluation.

---

## 🗄️ Database

PostgreSQL is used as the primary database.

The database stores application data such as:

```text
Users
  ↓
Resumes
  ↓
Interviews
  ↓
Questions
  ↓
Answers
  ↓
Coding Submissions
  ↓
Evaluations
  ↓
Proctoring Violations
```

SQLAlchemy is used for database interaction.

---

## 🔐 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
DATABASE_URL=your_database_url

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CORS_ORIGINS=http://localhost:3000
```

For the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Important:** Never commit `.env` files, API keys, database passwords, or other secrets to GitHub.

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Namratha18-hub/InterviewAI.git
cd InterviewAI
```

---

# 🖥️ Frontend Setup

Open a terminal inside:

```text
InterviewAI/frontend
```

Install dependencies:

```powershell
npm.cmd install
```

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the development server:

```powershell
npm.cmd run dev
```

Frontend will normally run at:

```text
http://localhost:3000
```

---

# ⚙️ Backend Setup

Open another terminal:

```powershell
cd D:\InterviewAI\backend
```

Create and activate the virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

Create the backend `.env` file and configure the required environment variables.

Create database tables:

```powershell
python -m app.db.create_tables
```

Start the FastAPI server:

```powershell
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

---

## 🔌 API

The backend exposes REST APIs for:

* Authentication
* Resume upload
* Resume analysis
* Interview management
* AI question generation
* Answer submission
* Coding evaluation
* Interview evaluation
* Proctoring

Interactive API documentation is available through FastAPI Swagger:

```text
/docs
```

---

## ☁️ Deployment

### Frontend

The Next.js frontend is deployed using Vercel.

Production frontend:

```text
https://frontend-7dac.vercel.app/
```

### Backend

The FastAPI backend is deployed using Render.

Production API:

```text
https://interviewai-nhhd.onrender.com
```

API documentation:

```text
https://interviewai-nhhd.onrender.com/docs
```

### Database

PostgreSQL is hosted using Render.

### Resume Storage

Cloudinary is used for cloud-based resume storage.

---

## 🔒 Security

InterviewAI follows basic security practices including:

* JWT-based authentication
* Password hashing
* Protected API routes
* Environment variables for secrets
* CORS configuration
* File type validation
* File size validation
* Cloud-based resume storage
* Database-backed user data

Sensitive credentials should always be stored in environment variables rather than source code.

---

## 🧪 Testing

Before deployment, test the following major workflows:

### Authentication

```text
Register → Login → Access Dashboard
```

### Resume

```text
Upload Resume → Store Resume → Analyze Resume
```

### Interview

```text
Start Interview → Answer Questions → Submit Interview
```

### Coding

```text
Open Problem → Write Code → Run/Submit → Receive Result
```

### Evaluation

```text
Complete Interview → Generate Evaluation → View Feedback
```

---

## 🎯 Project Objectives

The main objectives of InterviewAI are:

* Provide an AI-powered interview simulation.
* Personalize interview questions using resume information.
* Evaluate technical and coding performance.
* Provide immediate and meaningful feedback.
* Create a realistic technical interview environment.
* Combine AI, web development, databases, and code execution into one platform.

---

## 🔮 Future Enhancements

Possible future improvements include:

* Voice-based AI interviews
* Real-time speech-to-text
* Advanced facial and behavior analysis
* More programming languages
* Difficulty-based question generation
* Detailed performance analytics
* Interview history and progress tracking
* Personalized learning recommendations
* Advanced anti-cheating mechanisms
* Improved AI evaluation models

---

## 👩‍💻 Author

**Namratha**

Computer Science and Engineering Undergraduate

GitHub:
https://github.com/Namratha18-hub

LinkedIn:
https://www.linkedin.com/in/namratha-sanapala

---

## 📜 License

This project is developed for educational and academic purposes.

---

## ⭐ Project Summary

**InterviewAI** combines:

```text
AI
+
Resume Analysis
+
Technical Interviews
+
Live Coding
+
Code Execution
+
Proctoring
+
Automated Evaluation
+
Cloud Storage
+
PostgreSQL
```

to create a complete **AI-powered technical interview platform**.
