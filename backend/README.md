# FeedbackIQ Backend

AI-powered customer feedback intelligence API built with **FastAPI**, **SQLAlchemy**, **HuggingFace Transformers**, **sentence-transformers**, and **FAISS**.

## Features

- JWT authentication (signup, login, role-based access)
- Feedback upload (JSON + CSV)
- Automatic sentiment analysis (DistilBERT SST-2)
- Semantic embeddings (all-MiniLM-L6-v2) + FAISS search
- Dashboard analytics APIs (frontend-compatible JSON)
- Alerts, customer stats, insights preparation for RAG
- SQLite by default (PostgreSQL-ready via `DATABASE_URL`)

## Quick start

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
```

Set `MOCK_AI=true` in `.env` for fast local dev without downloading ML models.

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Windows `WinError 10013`?** Another process is usually already using the port. Either stop it or pick a new port:

```powershell
# See what is using port 8000
netstat -ano | findstr :8000

# Stop that PID (replace 12345 with the number from the last column)
taskkill /PID 12345 /F

# Or run on a different port
$env:PORT=8001; uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Seed accounts

| Email | Password | Role |
|-------|----------|------|
| admin@feedbackiq.com | admin123 | admin |
| analyst@feedbackiq.com | analyst123 | analyst |

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/feedback` | Create feedback |
| POST | `/api/feedback/upload-csv` | CSV bulk upload |
| GET | `/api/feedback` | List / filter feedback |
| POST | `/api/semantic-search` | Semantic search |
| GET | `/api/similar-feedback/{id}` | Similar complaints |
| GET | `/api/dashboard` | Dashboard KPIs & charts |
| GET | `/api/alerts` | Alerts list |
| GET | `/api/customers` | Customer 360 stats |

All protected routes require header: `Authorization: Bearer <token>`

## PostgreSQL

Update `.env`:

```env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/feedbackiq
```

Install driver: `pip install psycopg2-binary`

## Frontend integration

Set in the React app `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

## Project structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config/           # Settings
│   ├── database/         # SQLAlchemy session + init
│   ├── models/           # ORM models
│   ├── schemas/          # Pydantic models
│   ├── routes/           # API routers
│   ├── services/         # Business + AI logic
│   ├── middleware/       # Logging
│   ├── utils/            # Helpers
│   └── core/             # Security, deps, exceptions
├── requirements.txt
├── .env
└── README.md
```

## AI models

| Task | Model | Env flag |
|------|-------|----------|
| Sentiment | distilbert-base-uncased-finetuned-sst-2-english | `MOCK_AI=false` |
| Embeddings | all-MiniLM-L6-v2 | `MOCK_AI=false` |

When `MOCK_AI=true`, heuristic sentiment and deterministic pseudo-embeddings are used so the API runs without GPU/large downloads.
