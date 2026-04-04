# Resume IQ

An internal HR portal that lets HR teams upload resumes, automatically extract candidate information using an LLM, and filter/shortlist candidates against a job description.

---

## Architecture

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

### How the pieces connect

- **Frontend** (React + Vite, served by Nginx) communicates with the backend via REST API and WebSocket
- **Backend** (FastAPI) handles auth, resume uploads, candidate queries, and JD matching
- **MySQL** stores all structured data — users, resumes, parsed candidate fields
- **Redis** serves three purposes: OTP storage (db 0), Celery task queue/results (db 1/2), WebSocket pub/sub (db 3)
- **Celery Worker** runs as a separate process, picks up resume processing tasks from Redis, uploads PDFs to Cloudinary, extracts text, and calls Groq LLM
- **Cloudinary** stores original PDF files persistently with secure URLs

---

## Setup & Running Locally

### Prerequisites

- Docker Desktop installed and running
- A `.env` file at the project root (see `.env.example`)

### One-command startup

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local development (without Docker)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Celery worker:**

```bash
cd backend
celery -A app.worker.celery_app worker --loglevel=info --pool=solo
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

See `.env.example` for all variables. Copy it to `.env` and fill in your values:

```bash
cp .env.example .env
```

---

## Key Technical Decisions

### Resume storage — Cloudinary

PDFs are stored on Cloudinary rather than the local filesystem. This ensures files persist across container restarts and redeploys. Each file gets a secure, permanent URL stored in MySQL. The `public_id` is also stored to support deletion.

### Async processing — Celery + Redis

Resume processing (upload to Cloudinary, text extraction, LLM parsing) is offloaded to Celery workers. This means the API returns a `202 Accepted` immediately after receiving the file — users never wait for processing. Redis acts as the message broker and result backend.

### Real-time status — WebSocket + Redis pub/sub

Each Celery task publishes status updates (`queued → processing → parsing → completed/failed`) to a Redis pub/sub channel. A WebSocket connection in the frontend subscribes to that channel and pushes updates to the UI instantly without polling.

### LLM parsing — Groq (llama-3.3-70b-versatile)

Groq was chosen for its free tier and extremely fast inference (typically under 2 seconds). The model is prompted with `response_format: json_object` to guarantee valid JSON output. Pydantic validates the response before it hits the database — malformed LLM output is caught and handled gracefully.

### Duplicate detection — SHA-256 file hash

Before any processing begins, a SHA-256 hash of the file bytes is computed and checked against existing records. If a match is found the upload is rejected with a `409 Conflict` response that includes the ID of the existing record. This is fast (hash computed in memory, single indexed DB lookup) and accurate (byte-identical files always produce the same hash).

### JD matching — temporary Redis storage

Match scores are stored in Redis with a 2-hour TTL rather than in MySQL. Since JD matching results are session-specific and temporary, writing them to the database would create stale data and require cleanup jobs. Redis TTL handles expiry automatically.

### Scanned PDF fallback — pytesseract + pdf2image

pdfplumber is tried first for text extraction. If the extracted text is under 100 characters (indicating a scanned/image-only PDF), the file is converted to images using pdf2image and OCR is run via pytesseract. This handles both digital and scanned resumes transparently.

### Authentication — JWT + bcrypt + OTP

Passwords are hashed with bcrypt (with SHA-256 pre-hashing to handle the 72-byte bcrypt limit). Login is a two-step process: password verification followed by a 6-digit OTP sent via SendGrid. OTPs are stored in Redis with a 5-minute TTL and deleted immediately after use to prevent replay attacks.

---

## Seed Data

On first startup, 15 pre-parsed candidate records are automatically inserted into the database so reviewers can explore the platform without uploading resumes manually. See `backend/seed.py`.
