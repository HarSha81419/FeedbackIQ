# FeedbackIQ Production Setup Guide

## Current Status (May 20, 2026)

### ✅ Completed
1. **Backend Configuration**
   - ✅ Updated to use `phi3` Ollama model (was mistral)
   - ✅ Frontend API URL fixed to `http://localhost:8000/api` (was 8001)
   - ✅ FAISS semantic search integrated
   - ✅ RAG pipeline with evidence-based grounding

2. **Authentication**
   - ✅ JWT token-based auth working
   - ✅ Seed users created (for testing):
     - **Email**: `admin@feedbackiq.com` | **Password**: `admin123`
     - **Email**: `analyst@feedbackiq.com` | **Password**: `analyst123`
   - ✅ Protected routes enforcing auth
   - ✅ Login/Signup flow implemented

3. **Dataset Management**
   - ✅ Upload CSV endpoint (`/api/feedback/upload-csv`)
   - ✅ Replace dataset endpoint (`/api/feedback/replace-dataset`)
   - ✅ Delete all feedback endpoint (`/api/feedback`)
   - ✅ Dataset statistics endpoint (`/api/feedback/stats`)
   - ✅ Admin UI with dataset controls

4. **AI Chat**
   - ✅ Ollama phi3 integration
   - ✅ Streaming responses (`/api/chat/query-stream`)
   - ✅ Evidence-based grounding from FAISS
   - ✅ Sentiment and category analysis
   - ✅ Proper error handling and fallbacks

5. **Frontend**
   - ✅ React + TypeScript + Vite
   - ✅ Running on `http://localhost:5174`
   - ✅ Responsive UI with dark theme
   - ✅ Admin panel with dataset management

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- Ollama (with phi3 model: `ollama pull phi3`)

### Backend Setup
```bash
cd feedbackIQ
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\Activate.ps1

cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --app-dir . --reload --host 127.0.0.1 --port 8000
```

Backend runs on: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd feedbackIQ
npm install
npm run dev
```

Frontend runs on: `http://localhost:5174`

## Testing the Application

### 1. Login
1. Open `http://localhost:5174`
2. Click "Create one" to go to signup OR login with:
   - Email: `admin@feedbackiq.com`
   - Password: `admin123`

### 2. Upload Dataset
1. Navigate to Admin Panel (`/admin`)
2. Click "Replace Dataset"
3. Select a CSV file with columns:
   - `customer_name` or `customer`
   - `feedback_text` or `feedback`
   - `source` (optional)
   - `category` (optional)

### 3. Test Chat
1. Go to Feedback Explorer or Dashboard
2. Open the AI Chat panel
3. Ask a question about feedback:
   - "What are customers saying about delivery?"
   - "What's the sentiment distribution?"
   - "What are the top complaints?"

The AI should respond with evidence-based insights from the uploaded feedback.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account

### Feedback Management
- `GET /api/feedback` - List all feedback with filters
- `POST /api/feedback` - Create single feedback entry
- `POST /api/feedback/upload-csv` - Bulk import CSV
- `POST /api/feedback/replace-dataset` - Replace entire dataset
- `DELETE /api/feedback` - Clear all feedback
- `GET /api/feedback/stats` - Dataset statistics

### Chat
- `POST /api/chat/query` - Query with RAG (non-streaming)
- `POST /api/chat/query-stream` - Stream RAG responses

### Search
- `POST /api/semantic-search` - Semantic search over feedback
- `GET /api/similar-feedback/{id}` - Find similar feedback

## Environment Variables

### Backend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK=false

# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/feedbackiq

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
OLLAMA_TIMEOUT=120

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

## Known Limitations (To Address)

### 1. Database
- PostgreSQL is now the primary database target for production
- `DATABASE_URL` controls the active SQL backend
- Impact: concurrency, reliability, and clean DB management

### 2. Authentication
- Seed users are hardcoded for development
- **TODO**: Remove seed data in production
- **TODO**: Implement proper user management

### 3. Data Persistence
- Chat history not persisted per user
- **TODO**: Add user chat history storage
- **TODO**: Add audit logging

### 4. Deployment
- **TODO**: Docker containerization
- **TODO**: Environment-specific configs
- **TODO**: CI/CD pipeline

## Next Steps for Production

### Phase 1: Data & Auth (High Priority)
- [ ] Migrate to PostgreSQL
- [ ] Remove seed users/data
- [ ] Implement user signup/email verification
- [ ] Add password reset flow
- [ ] Role-based access control

### Phase 2: UX & Features (Medium Priority)
- [ ] Chat history sidebar
- [ ] Citation/evidence links in responses
- [ ] Export chat as PDF
- [ ] Dataset comparison/versioning
- [ ] User preferences (theme, language)

### Phase 3: Operations (Ongoing)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel/GA)
- [ ] Performance monitoring
- [ ] Rate limiting
- [ ] API usage quotas

### Phase 4: Scaling (As Needed)
- [ ] Redis caching
- [ ] Vector DB upgrade (Pinecone/Weaviate)
- [ ] Load balancing
- [ ] CDN for static assets
- [ ] Async job queue (Celery)

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F

# Restart backend
python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

### Ollama not responding
```bash
# Check if Ollama is running
ollama list

# If not running, start Ollama
ollama serve

# Ensure phi3 is pulled
ollama pull phi3
```

### Chat returns generic responses
- Ensure feedback is uploaded in Admin Panel
- Check Dataset Statistics shows >0 feedback entries
- Verify Ollama is responding: `curl http://localhost:11434/api/tags`
- Check backend logs for error messages

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:8000`
- Check `.env` file has correct `VITE_API_URL`
- Clear browser cache and restart dev server
- Check CORS settings in backend config

## Security Considerations

⚠️ **Not Production Ready** - Requires:
1. HTTPS/TLS encryption
2. Rate limiting & DDoS protection
3. API key rotation
4. Input validation & sanitization
5. SQL injection prevention (ORM helps)
6. XSS protection (React helps)
7. CSRF tokens
8. Secure headers
9. Audit logging
10. Data backup strategy

## Support & Documentation

- **API Docs**: `http://localhost:8000/docs`
- **Project README**: See [README.md](README.md)
- **Dataset Format**: See [feedbackiq_10k_dataset.csv](feedbackiq_10k_dataset.csv)

---

**Last Updated**: May 20, 2026
**Status**: Beta (Development Ready)
**Next Major Update**: PostgreSQL Migration & Auth Refactor
