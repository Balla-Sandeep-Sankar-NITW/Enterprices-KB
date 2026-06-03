# Enterprise Knowledge Base v2
### Zero GPU · All Cloud APIs · ~50MB RAM

---

## What changed from v1

| Component | v1 | v2 |
|---|---|---|
| sentence-transformers | ✅ Local (~600MB RAM) | ❌ Removed |
| ChromaDB | ✅ Local (~100MB RAM) | ❌ Removed |
| Embeddings | Local model | **Voyage AI API** (free) |
| Vector DB | ChromaDB (local) | **Pinecone API** (free) |
| Database | SQLite | **Neon PostgreSQL** (free) |
| Email | Gmail SMTP | **Gmail SMTP** (same) |
| **Total RAM** | **~750MB** | **~50MB** |

---

## Services to sign up for (all free)

### 1. Neon PostgreSQL
1. Go to **https://neon.tech** → Sign up free
2. Create a project (e.g. "enterprise-kb")
3. Go to **Dashboard → Connection Details**
4. Copy the **Connection string**:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Pinecone (Vector DB)
1. Go to **https://pinecone.io** → Sign up free
2. Go to **Console → API Keys** → copy your key
3. The index `enterprise-kb` is **auto-created on first startup**

### 3. Voyage AI (Embeddings)
1. Go to **https://voyageai.com** → Sign up free
2. Go to **Dashboard → API Keys** → Create a key
3. Free tier: **50 million tokens/month** (very generous)

### 4. OpenRouter (LLM)
1. Go to **https://openrouter.ai** → Sign up
2. Go to **Dashboard → API Keys** → Create key
3. To use **completely free**: set `OPENROUTER_MODEL=google/gemma-2-9b-it:free`
4. Or add $5 credits for `mistralai/mistral-7b-instruct` (lasts months)

### 5. Gmail (Email — same as before)
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Paste the 16-char password into `.env`

---

## Setup (Windows)

### Backend

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy and edit `.env`:
```cmd
copy .env.example .env
```

Fill in your keys:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
PINECONE_API_KEY=pcsk_xxxxxxx
VOYAGE_API_KEY=pa-xxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxx
OPENROUTER_MODEL=google/gemma-2-9b-it:free
MAIL_USERNAME=yourgmail@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=yourgmail@gmail.com
SECRET_KEY=paste-random-string-here
```

Generate SECRET_KEY:
```cmd
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start backend:
```cmd
uvicorn app.main:app --reload --port 8000
```

Expected output:
```
✅ Neon PostgreSQL connected
✅ Database tables ready
✅ Pinecone Index 'enterprise-kb' ready
✅ Upload directory ready
✅ Admin created: admin@company.com
INFO: Uvicorn running on http://127.0.0.1:8000
```

### Frontend

```cmd
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## Default Admin

| Field | Value |
|---|---|
| Email | admin@company.com |
| Password | Admin@123456 |

---

## Test Email Config

After starting, visit:
```
http://localhost:8000/docs
→ POST /api/v1/auth/test-email?email=your@gmail.com
```
Check inbox (and spam).

---

## Common Issues

**Pinecone first startup slow (~30s):**
Normal — it's creating the index. Subsequent starts are instant.

**Neon first query slow:**
Free tier pauses after inactivity. Reconnects automatically.

**Email not received:**
- Make sure `MAIL_PASSWORD` is a Gmail **App Password**, not your login password
- Check spam folder
- Use the test-email endpoint to debug

**OpenRouter 402 error:**
Switch to free model: `OPENROUTER_MODEL=google/gemma-2-9b-it:free`

**Voyage AI 401:**
Check `VOYAGE_API_KEY` starts with `pa-`

---

## RAG Pipeline

```
User question
     ↓
Build contextualized query (resolves pronouns using chat history)
     ↓
Voyage AI API → embed query (1024-dim vector)
     ↓
Pinecone API → top-3 chunks (filtered by department_id)
     ↓
OpenRouter API → LLM generates answer with citations
     ↓
Save to Neon PostgreSQL (session + messages + access logs)
```

---

## Project Structure

```
enterprise-kb-v2/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # JWT auth guard
│   │   │   └── routes/
│   │   │       ├── auth.py          # signup, login, verify
│   │   │       ├── admin.py         # user/dept management
│   │   │       ├── documents.py     # upload, list, delete
│   │   │       ├── chat.py          # sessions, messages
│   │   │       └── users.py         # profile, dept requests
│   │   ├── core/
│   │   │   ├── config.py            # all settings
│   │   │   ├── database.py          # Neon PostgreSQL
│   │   │   └── security.py          # JWT + bcrypt
│   │   ├── models/models.py         # all DB tables
│   │   ├── schemas/schemas.py       # all Pydantic schemas
│   │   └── services/
│   │       ├── auth_service.py      # signup/login logic
│   │       ├── chat_service.py      # RAG pipeline
│   │       ├── document_service.py  # text extraction + chunking
│   │       ├── embedding_service.py # Voyage AI API
│   │       ├── vector_store.py      # Pinecone API
│   │       └── email_service.py     # Gmail SMTP
│   ├── .env.example
│   └── requirements.txt
└── frontend/                        # React + Vite (unchanged)
```
