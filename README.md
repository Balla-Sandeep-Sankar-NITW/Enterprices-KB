<div align="center">

<br />

```
 ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗███╗   ███╗██╗███╗   ██╗██████╗
 ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝████╗ ████║██║████╗  ██║██╔══██╗
 ██║   ██║███████║██║   ██║██║     ██║   ██╔████╔██║██║██╔██╗ ██║██║  ██║
 ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
  ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   ██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
   ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝
```

### Enterprise Knowledge Base · AI-Powered Document Chat

<br />

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge)](https://pinecone.io)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)

<br />

> **Chat with your company's documents.** VaultMind is a full-stack RAG platform that lets employees ask questions about internal documents in plain English — with department-based access control, approval workflows, and cited answers showing exactly which document and page the answer came from.

<br />

[Features](#-features) · [Architecture](#️-architecture) · [Tech Stack](#️-tech-stack) · [Project Structure](#-project-structure) · [Database Schema](#️-database-schema) · [Security](#-security)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 👤 For Employees

- 💬 **Chat with documents** — ask questions in plain English
- 📎 **Cited answers** — every response links back to source document and page number
- 🗂️ **Persistent chat history** — sessions saved like ChatGPT, pick up where you left off
- 🏢 **Department access control** — only see documents relevant to your team
- 🔄 **Department change requests** — submit a request to move departments

</td>
<td width="50%" valign="top">

### 🛡️ For Admins

- 📤 **Document upload** — supports PDF, DOCX, TXT, and XLSX
- 👥 **User management** — approve or reject new registrations
- 🏛️ **Department management** — create, edit, and manage departments
- 📊 **Analytics dashboard** — system-wide usage overview
- ✅ **Approval workflow** — review and action department change requests

</td>
</tr>
</table>

### ⚙️ System Capabilities

| Capability | Details |
|---|---|
| 🔐 Authentication | JWT access tokens (60 min) + refresh tokens (7 days) |
| 📧 Email verification | Sent automatically on signup |
| 🧠 Context-aware RAG | Resolves pronouns ("they", "it") using full chat history |
| 🛡️ RBAC | Role-based access control — Admin / Employee |
| ☁️ Cloud-native | ~50 MB RAM footprint, no GPU required |

---

## 🔄 How It Works

```
  Employee asks ──▶  "What is the leave policy?"
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Build contextualized query   │
              │  (resolves "they", "it" via   │
              │   chat history)               │
              └───────────────┬───────────────┘
                              │
                    Voyage AI embeddings
                              │
                              ▼
              ┌───────────────────────────────┐
              │         Pinecone              │
              │  Top 3 chunks, filtered by    │
              │  department_id                │
              └───────────────┬───────────────┘
                              │
                    Groq / OpenRouter LLM
                              │
                              ▼
  AI answers ◀──  "Employees receive 20 annual leaves
                   [Source: Leave Policy.pdf, Page 3]"
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                  React 18 + Vite + Tailwind                  │
│                       Hosted on Vercel                       │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────────┐
│                          Backend                             │
│                      FastAPI (Python)                        │
│                       Hosted on Render                       │
└────┬──────────────┬──────────────┬──────────────┬────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
  Neon          Pinecone       Voyage AI       Groq /
PostgreSQL      Vector DB      Embeddings    OpenRouter
(relational)  (similarity    (1024-dim      (LLM answer
              search +        vectors)       generation)
              dept filter)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State** | Zustand | Auth state management |
| **Data Fetching** | TanStack Query | Server state + caching |
| **Backend** | FastAPI (Python) | REST API |
| **Database** | Neon PostgreSQL | Relational data storage |
| **ORM** | SQLAlchemy | Database abstraction |
| **Vector DB** | Pinecone | Semantic similarity search |
| **Embeddings** | Voyage AI | Text → 1024-dim vector |
| **LLM** | Groq / OpenRouter | AI answer generation |
| **Auth** | JWT + bcrypt | Secure authentication |
| **Email** | SMTP | Transactional emails |
| **Hosting FE** | Vercel | Frontend deployment |
| **Hosting BE** | Render | Backend deployment |

---

## 📁 Project Structure

```
vaultmind/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                   # JWT auth guards
│   │   │   └── routes/
│   │   │       ├── auth.py               # signup, login, verify email
│   │   │       ├── admin.py              # user & department management
│   │   │       ├── documents.py          # upload, list, delete
│   │   │       ├── chat.py               # sessions & messages
│   │   │       └── users.py              # profile & department requests
│   │   │
│   │   ├── core/
│   │   │   ├── config.py                 # all settings from .env
│   │   │   ├── database.py               # Neon PostgreSQL connection
│   │   │   └── security.py               # JWT & password hashing
│   │   │
│   │   ├── models/
│   │   │   └── models.py                 # all database tables
│   │   │
│   │   ├── schemas/
│   │   │   └── schemas.py                # Pydantic request/response schemas
│   │   │
│   │   └── services/
│   │       ├── auth_service.py           # signup/login business logic
│   │       ├── chat_service.py           # full RAG pipeline
│   │       ├── document_service.py       # text extraction + chunking
│   │       ├── embedding_service.py      # Voyage AI API calls
│   │       ├── vector_store.py           # Pinecone store & retrieve
│   │       └── email_service.py          # Resend + SMTP email
│   │
│   ├── .env.example
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js                 # axios instance + all API calls
    │   │
    │   ├── store/
    │   │   └── authStore.js              # Zustand auth state
    │   │
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── ChatPage.jsx
    │   │   ├── DocumentsPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AdminUsers.jsx
    │   │       ├── AdminDepartments.jsx
    │   │       └── AdminDocuments.jsx
    │   │
    │   └── components/
    │       └── layout/
    │           ├── AppLayout.jsx
    │           ├── Sidebar.jsx
    │           ├── PrivateRoute.jsx
    │           └── AdminRoute.jsx
    │
    ├── vercel.json
    └── package.json
```

---

## 🗄️ Database Schema

```
departments
    │
    ├─── users (many)
    │         └─── chat_sessions (many)
    │                    └─── messages (many)
    │                              └─── [citations stored as JSON]
    │
    ├─── documents (many)
    │         └─── document_access_logs (many)
    │
    └─── department_change_requests (many)
```

| Table | Description |
|---|---|
| `users` | Employees and admins — stores role, status, and department |
| `departments` | HR, Engineering, Finance, etc. |
| `documents` | Uploaded files with processing status |
| `chat_sessions` | Conversation threads per user |
| `messages` | Individual messages with citations stored as JSON |
| `document_access_logs` | Full audit trail of every document retrieval |
| `department_change_requests` | Transfer requests with pending / approved / rejected status |

---

## 🔒 Security

| Mechanism | Details |
|---|---|
| **Password hashing** | bcrypt with per-user salt |
| **JWT tokens** | Access tokens expire in 60 min; refresh tokens in 7 days |
| **Department isolation** | Pinecone queries are hard-filtered by `department_id` |
| **Role guards** | All admin routes are protected server-side |
| **Approval workflow** | New users cannot access any resource until manually approved by an admin |
| **Audit logging** | Every document retrieval is recorded in `document_access_logs` |

---

## 🚀 RAG Pipeline (In Depth)

```
1. QUERY CONTEXTUALIZATION
   User message + last N chat messages
   → LLM rewrites ambiguous query into a standalone question
   → "What did they decide?" becomes "What did the board decide in the Q3 meeting?"

2. EMBEDDING
   Contextualized query → Voyage AI API
   → 1024-dimensional float vector

3. RETRIEVAL
   Vector + department_id filter → Pinecone
   → Top 3 most semantically similar document chunks

4. GENERATION
   System prompt + retrieved chunks + user question → Groq / OpenRouter
   → Grounded answer with inline citations

5. PERSISTENCE
   Answer + citations (doc title + page number) → Neon PostgreSQL
   Session and message saved; access log entry created
```

---

<div align="center">

Built with ♥ using **FastAPI** · **React** · **Pinecone** · **Voyage AI** · **Groq**

</div>
