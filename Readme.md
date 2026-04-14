# Resume IQ

An internal HR portal for HR teams to upload resumes, extract structured candidate data using an LLM, and shortlist candidates against a job description — all in real time.

---

## Demo

▶️ [Watch Demo Video](https://drive.google.com/file/d/1hJaWQqzJXfgeHn49q9AkVzQPjaXDd-ur/view?usp=sharing)

---

## Features

### Authentication
Secure two-factor login — password verification followed by a 6-digit OTP sent to the user's email. JWT access tokens (15 min) with refresh tokens (7 days) for seamless session management.

### Resume Upload & Processing
Upload one or multiple PDF resumes at once. The system accepts uploads instantly and processes each file in the background via Celery workers — no waiting. Real-time status updates (Queued → Processing → Parsing → Completed) stream directly to the browser via WebSocket without any page refresh. Scanned PDFs are handled automatically using OCR (Tesseract). Duplicate resumes are detected using SHA-256 file hashing and rejected before processing begins.

### AI-Powered Data Extraction
Each resume is sent to Groq's LLM (llama-3.3-70b-versatile) which extracts 20+ structured fields including personal info, education (including 10th/12th details), full work history with employment gap detection, categorised skills (languages, frameworks, databases, cloud, tools), projects, notice period, and expected salary.

### Candidate Explorer
A fully-featured candidates table with server-side pagination, sortable columns, show/hide column controls, and 8 simultaneous filters — years of experience, skills, education level, location, college name, GPA range, employment gap toggle, and upload date range. Select multiple candidates across pages and export to CSV with only the visible columns included.

### Candidate Detail View
Clicking any candidate opens a full detail page showing all extracted fields in a clean layout — work history as a timeline, skills grouped by category as tags, education details, projects, and a button to open the original PDF from Cloudinary.

### JD Matching
HR can paste a job description as plain text or upload it as a PDF or DOCX file. The system scores every candidate from 0–100 using a weighted formula (skills 50%, experience 30%, education 20%). A Match Score column appears in the table automatically, sorted highest to lowest. The default threshold of 60 filters out weak matches — HR can adjust it up or down with a slider. Scores are temporary (2-hour TTL in Redis) and auto-cleanup without touching the database.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | FastAPI (Python) |
| Database | MySQL 8 + SQLAlchemy ORM |
| Cache / Queue | Redis 7 (4 isolated databases) |
| Background Worker | Celery 5 (concurrency 2) |
| File Storage | Cloudinary |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Email | SendGrid SMTP |
| Containerisation | Docker + Docker Compose |

---

## Architecture
```
Browser (React)
      │ REST + WebSocket
      ▼
   Nginx
      │ /api/ → FastAPI     /ws/ → FastAPI WebSocket
      ▼
   FastAPI ──────────────────────► MySQL
      │                              (users, resumes, resume_data)
      │ Celery task
      ▼
   Redis ──────────────────────────► Celery Worker
   db0: OTP + JD scores              │
   db1: task queue (broker)          ├─► Cloudinary (PDF storage)
   db2: task results (backend)       ├─► Groq LLM (parse + score)
   db3: WebSocket pub/sub            └─► Tesseract OCR (scanned PDFs)
      │
      │ pub/sub
      ▼
   FastAPI WebSocket ──► Browser (real-time status)
```
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│    MySQL    │
│  React +    │     │  FastAPI +  │     │  (resume    │
│   Nginx     │     │  Uvicorn    │     │   data)     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐     ┌─────────────┐
                    │    Redis    │────▶│   Celery    │
                    │  (queue +   │     │   Worker    │
                    │  pub/sub)   │     │  (process   │
                    └─────────────┘     │   resumes)  │
                                        └─────────────┘
                                               │
                                        ┌──────▼──────┐
                                        │  Cloudinary │
                                        │  (PDF store)│
                                        └─────────────┘
```
---

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- A `.env` file at the project root (copy from `.env.example` and fill in values)

### Run with one command
```bash
git clone https://github.com/YOUR_USERNAME/Resume-IQ.git
cd Resume-IQ
cp .env.example .env
# Fill in your API keys in .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

### Default login (seed data included)
```
Email:    admin@resumeiq.com
Password: Admin@1234
```

15 pre-parsed candidate records are seeded automatically on first startup — no manual uploads needed to explore the platform.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_DATABASE` | Database name |
| `JWT_SECRET_KEY` | Secret for signing JWTs — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime (recommended: 1440) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime (recommended: 7) |
| `REDIS_URL` | Redis connection for OTP + JD sessions (db 0) |
| `CELERY_BROKER_URL` | Redis for Celery task queue (db 1) |
| `CELERY_RESULT_BACKEND` | Redis for Celery results (db 2) |
| `WS_REDIS_URL` | Redis for WebSocket pub/sub (db 3) |
| `OTP_EXPIRE_SECONDS` | OTP validity window (recommended: 300) |
| `SENDGRID_API_KEY` | SendGrid API key for email OTPs |
| `MAIL_FROM` | Verified sender email on SendGrid |
| `MAIL_FROM_NAME` | Display name for emails |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GROQ_API_KEY` | Groq API key for LLM |
| `GROQ_MODEL` | Model name (llama-3.3-70b-versatile) |

---

## Key Technical Decisions

**Why Celery over FastAPI BackgroundTasks?**
BackgroundTasks runs in the same process as the API — if it crashes or restarts, tasks are lost with no retry mechanism. Celery uses Redis as a persistent queue, supports automatic retries with exponential backoff, and scales horizontally by adding more worker containers.

**Why Redis pub/sub for WebSockets instead of polling?**
Polling means constant API calls every few seconds regardless of whether anything changed. Pub/sub pushes updates the moment they happen — near-zero latency, no wasted requests, no database involvement in the delivery path.

**Why Groq over OpenAI?**
Free tier with generous rate limits, custom LPU hardware gives sub-2-second response times, and `response_format: json_object` guarantees valid JSON output — no markdown parsing needed.

**Why SHA-256 for duplicate detection?**
Parsed name/email aren't available until after processing completes in the background. SHA-256 hashes the raw file bytes at upload time — before any processing — and is deterministic regardless of filename. Fast: computed in memory with a single indexed database lookup.

**Why JD scores in Redis instead of MySQL?**
Match scores are session-specific and temporary. Redis TTL (2 hours) handles cleanup automatically. Writing temporary data to MySQL would require scheduled cleanup jobs and pollute the permanent data store.

**Why separate Redis databases (0, 1, 2, 3)?**
Isolation. OTPs, Celery tasks, Celery results, and WebSocket channels have different data shapes and TTLs. Separate databases prevent a bug in one area from corrupting another and make debugging easier.

---

## Project Structure
```
Resume-IQ/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   └── utils/           # Auth, OTP, email, Cloudinary, PDF, Groq
│   ├── worker/
│   │   ├── celery_app.py    # Celery configuration
│   │   └── tasks.py         # Background tasks
│   ├── seed.py              # 15 pre-parsed candidate records
│   ├── entrypoint.sh        # DB wait + table creation + seed + start
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios + API calls
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand state management
│   │   └── hooks/           # Custom React hooks
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
