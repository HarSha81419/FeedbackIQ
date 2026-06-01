# FeedbackIQ Chat API - Complete Reference

## Base URL
```
http://localhost:8001/api
```

## Endpoints

### 1. Non-Streaming Chat Query
Returns complete response once generation is finished.

**Endpoint**: `POST /chat/query`

**Request Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "What are our top customer complaints?",
  "limit": 7,
  "category": null,
  "sentiment": null,
  "source": null,
  "date_from": null,
  "date_to": null,
  "history": null
}
```

**Query Parameters**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| query | string | Yes | - | Question to ask about feedback |
| limit | integer | No | 7 | Number of sources to retrieve (1-20) |
| category | string | No | null | Filter by feedback category |
| sentiment | string | No | null | Filter by sentiment: positive/neutral/negative |
| source | string | No | null | Filter by source (csv, manual, etc.) |
| date_from | ISO8601 | No | null | Filter from date (e.g., 2024-05-01T00:00:00) |
| date_to | ISO8601 | No | null | Filter to date |
| history | array | No | null | Previous chat turns for context |

**History Format** (for multi-turn conversations):
```json
{
  "history": [
    {
      "role": "user",
      "content": "What are billing complaints?"
    },
    {
      "role": "assistant",
      "content": "Billing complaints focus on..."
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "query": "What are our top customer complaints?",
  "answer": "Based on 127 feedback entries, billing issues (34%) and delayed delivery (28%) are the primary complaints. Enterprise customers cite integration complexity (18%), while SMB users mention lack of specific features. Negative sentiment dominates with 62% of complaints marked negative.",
  "sources": [
    {
      "id": "fb-1234",
      "customerId": "c-acme",
      "customerName": "ACME Corp",
      "content": "Billing cycle is confusing and charges are not transparent...",
      "sentiment": "negative",
      "category": "Billing",
      "urgency": "high",
      "source": "csv",
      "createdAt": "2024-05-15T10:30:00",
      "score": 0.95,
      "relevance": 0.94
    }
  ],
  "matched_feedback": [...],  // Same as sources
  "retrieved_count": 7,
  "query_time_ms": 45,
  "model_time_ms": 3200
}
```

**Error Responses**:
```json
// 401 Unauthorized
{
  "detail": "Not authenticated"
}

// 400 Bad Request
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "query"],
      "msg": "ensure this value has at least 1 characters",
      "input": ""
    }
  ]
}
```

---

### 2. Streaming Chat Query
Returns response tokens as they arrive (Server-Sent Events).

**Endpoint**: `POST /chat/query-stream`

**Request Format**: Same as `/chat/query`

**Response**: `text/event-stream` (Server-Sent Events)

**Stream Format**:
```
data: Based
data:  on
data:  127
data:  feedback
data:  entries,
...
```

**JavaScript Example**:
```javascript
const response = await fetch('http://localhost:8001/api/chat/query-stream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "What are customer complaints about?",
    limit: 7
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const token = line.slice(6);
      console.log(token);  // Do something with token
    }
  }
}
```

---

## cURL Examples

### 1. Non-Streaming Query

```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the most common customer complaints?",
    "limit": 7
  }'
```

### 2. Streaming Query

```bash
curl -X POST http://localhost:8001/api/chat/query-stream \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the most common customer complaints?",
    "limit": 7
  }'
```

Output:
```
data: Based
data:  on
data:  analysis
...
```

### 3. Query with Filters

```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What billing issues do enterprise customers have?",
    "limit": 10,
    "category": "Billing",
    "sentiment": "negative",
    "date_from": "2024-05-01T00:00:00",
    "date_to": "2024-05-31T23:59:59"
  }'
```

### 4. Multi-Turn Conversation

```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What specific features are they requesting?",
    "limit": 7,
    "history": [
      {
        "role": "user",
        "content": "What are customers complaining about?"
      },
      {
        "role": "assistant",
        "content": "Customers mainly complain about delayed delivery and billing issues..."
      }
    ]
  }'
```

---

## Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| query | string | The user's original query |
| answer | string | AI-generated response from Ollama |
| sources | array | Retrieved feedback entries (max 4 in sources) |
| matched_feedback | array | All retrieved feedback (up to limit) |
| retrieved_count | integer | Number of feedback items retrieved |
| query_time_ms | float | FAISS retrieval latency |
| model_time_ms | float | Ollama generation latency |

### Feedback Item Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique feedback ID (fb-{db_id}) |
| customerId | string | Customer identifier |
| customerName | string | Customer name |
| content | string | Feedback text |
| sentiment | string | positive/neutral/negative |
| category | string | Inferred category (Billing, Support, etc.) |
| urgency | string | low/medium/high/critical |
| source | string | Source system (csv, manual, etc.) |
| createdAt | ISO8601 | Timestamp |
| score | float | Sentiment confidence (-1.0 to 1.0) |
| relevance | float | FAISS similarity score (0.0 to 1.0) |

---

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful response |
| 400 | Bad Request | Invalid query parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | User lacks permission |
| 422 | Unprocessable Entity | Validation error in request |
| 500 | Internal Server Error | Backend error |

---

## Authentication

All endpoints require a valid JWT token:

1. **Obtain token** (see `/api/auth/login`)
2. **Include in header**: `Authorization: Bearer <token>`

---

## Rate Limits

None currently implemented, but Ollama may queue requests if overwhelmed.

---

## Timeout Behavior

- Non-streaming query: `OLLAMA_TIMEOUT` seconds (default 120)
- Streaming query: First token within timeout, then stream indefinitely
- If Ollama unavailable: Returns error within 5 seconds

---

## Example Query Scenarios

### Scenario 1: Quick Overview
```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What should we focus on improving?"}'
```

### Scenario 2: Category Deep Dive
```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the specific billing complaints?",
    "category": "Billing",
    "limit": 10
  }'
```

### Scenario 3: Sentiment Analysis
```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What positive feedback are we getting?",
    "sentiment": "positive",
    "limit": 5
  }'
```

### Scenario 4: Time-Based Analysis
```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What changed last week?",
    "date_from": "2024-05-12T00:00:00",
    "date_to": "2024-05-19T23:59:59"
  }'
```

### Scenario 5: Follow-Up Question
```bash
curl -X POST http://localhost:8001/api/chat/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which enterprise accounts are affected?",
    "history": [
      {"role": "user", "content": "What billing issues do we have?"},
      {"role": "assistant", "content": "We have duplicate charges..."}
    ]
  }'
```

---

## Performance Metrics

Typical response times (on M1 Mac with phi3):

| Component | Time |
|-----------|------|
| FAISS retrieval | 20-50ms |
| Ollama first token | 800-1200ms |
| Full response (100 tokens) | 3000-5000ms |
| Total latency | 3000-5500ms |

---

## Debugging

### Check Ollama Status
```bash
curl http://localhost:11434/api/tags
```

### Enable Debug Logging
Set in `backend/.env`:
```env
DEBUG=true
```

### Check Backend Logs
```bash
tail -f backend/logs/feedbackiq.log
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Ensure token is valid and not expired |
| Ollama not available | Start ollama with `ollama serve` |
| Slow responses | Check Ollama process or try smaller model |
| Empty sources | Increase `limit` parameter or check FAISS index |
| Query too short | Minimum 1 character required |
| Model not found | Ensure model is pulled: `ollama pull phi3` |

---

## Integration Example

```typescript
// React component using streaming
async function StreamingChat() {
  const query = "What's our biggest issue?";
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:8001/api/chat/query-stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, limit: 7 })
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let full = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        const token = line.slice(6);
        full += token;
        document.body.innerText = full;  // Live display
      }
    }
  }
}
```

---

## Support

For issues or questions:
1. Check [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for setup help
2. Enable DEBUG=true in backend/.env
3. Check logs in backend/
4. Verify Ollama is running: `curl http://localhost:11434/api/tags`
