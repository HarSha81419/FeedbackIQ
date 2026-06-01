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
Add `OPENAI_API_KEY=<your-key>` for OpenAI integration (optional fallback).
Configure `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_TIMEOUT` to enable local LLM inference.

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
| POST | `/api/chat/query` | RAG-powered chat query (non-streaming) |
| POST | `/api/chat/query-stream` | Streaming RAG chat response |

All protected routes require header: `Authorization: Bearer <token>`

## Ollama Integration

FeedbackIQ now features **true conversational AI** powered by **Ollama** — a local LLM inference engine that replaces the robotic template-based summarization.

### Prerequisites

1. **Install Ollama**:
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows (use WSL2 recommended)
   # Download from https://ollama.ai
   ```

2. **Pull a model** (default is `phi3`):
```bash
ollama pull phi3
# Or try other models:
# ollama pull llama2
# ollama pull phi3
```

3. **Start Ollama** (listens on `http://localhost:11434` by default):
   ```bash
   ollama serve
   ```

### Configuration

In `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3              # or llama2, phi3, gemma, etc.
OLLAMA_TIMEOUT=120                # Request timeout in seconds
```

### How It Works

**RAG Pipeline**:
1. User sends query → embedding generated via sentence-transformers
2. FAISS retrieves top-k semantically similar feedback entries
3. Retrieved feedback + user query sent to Ollama model
4. Ollama generates contextual, conversational response
5. Response streamed back to frontend in real-time

**Features**:
- ✅ Natural language responses (no robotic summaries)
- ✅ Grounded in real customer feedback
- ✅ Streaming tokens for live typing effect
- ✅ Conversation history support
- ✅ Fallback to local summarizer if Ollama unavailable
- ✅ Smart prompt engineering with sentiment/category context

### Performance Tips

- **Model selection**: `phi3` is fast and lightweight; `llama2` is accuracy-focused
- **Timeout**: Increase if on slow hardware
- **Max tokens**: Model generation typically 2-4 seconds

### Example Conversation

**User**: "What are customers saying about delivery?"

**AI Response** (powered by Ollama):
> "Customers generally appreciate our fast delivery experience, with 68% positive feedback. However, we're seeing complaints about inconsistent delivery times during peak hours, particularly from enterprise customers. Several users mentioned missing real-time tracking updates. These issues are concentrated in the Logistics category and correlate with our 0.6+ churn risk segment."

(Not: "Most matching feedback is positive. Top themes are...")

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure `ollama serve` is running |
| Slow responses | Check hardware; try smaller model (`phi`) |
| Out of memory | Reduce `OLLAMA_TIMEOUT` or use lighter model |
| Not streaming | Verify `/api/chat/query-stream` endpoint in browser |


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
