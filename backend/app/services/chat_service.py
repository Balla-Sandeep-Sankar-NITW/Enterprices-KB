from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx

from app.core.config import settings
from app.models.models import User, ChatSession, Message, Document, DocumentAccessLog
from app.services.vector_store import retrieve_chunks, build_contextualized_query


def get_or_create_session(db: Session, user: User, session_id: Optional[int]) -> ChatSession:
    if session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
            ChatSession.is_archived == False
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        return session

    session = ChatSession(
        user_id=user.id,
        department_id=user.department_id,
        title="New Chat"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_history(db: Session, session_id: int) -> List[Dict[str, str]]:
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at).all()
    return [{"role": m.role, "content": m.content} for m in messages]


def build_citations(chunks: List[Dict], db: Session) -> List[Dict]:
    seen = {}
    citations = []
    for chunk in chunks:
        meta = chunk["metadata"]
        doc_id = meta.get("document_id")
        if doc_id not in seen:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            seen[doc_id] = doc.title if doc else meta.get("document_title", "Unknown")
        citations.append({
            "document_id": doc_id,
            "title": seen[doc_id],
            "page": meta.get("page"),
            "chunk_text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
            "relevance_score": chunk.get("score"),
        })
    # Deduplicate by doc+page
    unique = {}
    for c in citations:
        key = f"{c['document_id']}_p{c['page']}"
        if key not in unique:
            unique[key] = c
    return list(unique.values())


async def call_openrouter(
    question: str,
    chunks: List[Dict],
    history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """Call OpenRouter LLM with retrieved context."""
    if not chunks:
        context_str = "No relevant documents found in the knowledge base."
    else:
        parts = []
        for i, c in enumerate(chunks, 1):
            meta = c["metadata"]
            parts.append(
                f"[Source {i}: {meta.get('document_title', 'Unknown')}, Page {meta.get('page', '?')}]\n{c['text']}"
            )
        context_str = "\n\n---\n\n".join(parts)

    system_prompt = f"""You are an intelligent assistant for an enterprise knowledge base.
Answer questions using ONLY the provided context documents.
If the answer is not in the context, clearly say so.
Always cite your sources using [Source N] notation.

Context Documents:
{context_str}
"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})

    # Try primary model, fallback to others if rate limited
    models_to_try = list(dict.fromkeys([
        settings.OPENROUTER_MODEL,
        "mistralai/mistral-7b-instruct",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3-8b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free",
    ]))

    last_error = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for model in models_to_try:
            try:
                resp = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": settings.FRONTEND_URL,
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.2,
                        "max_tokens": 1024,
                    }
                )
                if resp.status_code == 429:
                    print(f"[OpenRouter] Rate limited on {model}, trying next...")
                    last_error = f"Rate limited on {model}"
                    continue
                resp.raise_for_status()
                data = resp.json()
                return {
                    "answer": data["choices"][0]["message"]["content"],
                    "model": data.get("model", model),
                    "tokens_used": data.get("usage", {}).get("total_tokens"),
                }
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    print(f"[OpenRouter] Rate limited on {model}, trying next...")
                    last_error = f"Rate limited on {model}"
                    continue
                last_error = str(e)
                break
            except Exception as e:
                last_error = str(e)
                break

    return {
        "answer": (
            f"I found {len(chunks)} relevant source(s) but all AI models are currently rate limited.\n\n"
            "**What you can do:**\n"
            "1. Wait a few minutes and try again\n"
            "2. Add credits at https://openrouter.ai/credits\n"
            "3. The free tier allows ~20 requests/day per model"
        ),
        "model": "rate_limited",
        "tokens_used": 0,
    }


async def process_chat_message(
    db: Session,
    user: User,
    question: str,
    session_id: Optional[int] = None
) -> Dict[str, Any]:
    if not user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be assigned to a department to use the chat"
        )

    # 1. Session
    session = get_or_create_session(db, user, session_id)
    is_new = session.title == "New Chat"

    # 2. History
    history = get_session_history(db, session.id)

    # 3. Contextualized query
    retrieval_query = build_contextualized_query(question, history)

    # 4. Retrieve from Pinecone (cloud API)
    chunks = await retrieve_chunks(
        query=retrieval_query,
        department_id=user.department_id,
        top_k=3
    )

    # 5. LLM via OpenRouter (cloud API)
    llm_result = await call_openrouter(question, chunks, history)

    # 6. Citations
    citations = build_citations(chunks, db) if chunks else []

    # 7. Save messages
    user_msg = Message(session_id=session.id, role="user", content=question)
    db.add(user_msg)

    asst_msg = Message(
        session_id=session.id,
        role="assistant",
        content=llm_result["answer"],
        citations=citations,
        retrieval_query=retrieval_query,
        retrieved_chunks=len(chunks),
        tokens_used=llm_result.get("tokens_used"),
        model_used=llm_result.get("model"),
    )
    db.add(asst_msg)

    # 8. Update session
    session.last_message_at = datetime.utcnow()
    if is_new:
        session.title = question[:60] + ("..." if len(question) > 60 else "")
        db.commit()
    else:
        db.commit()

    # 9. Log access
    for c in citations:
        db.add(DocumentAccessLog(
            user_id=user.id,
            document_id=c["document_id"],
            session_id=session.id,
            action="cited"
        ))
    db.commit()
    db.refresh(asst_msg)

    return {
        "session_id": session.id,
        "session_title": session.title,
        "message": {
            "id": asst_msg.id,
            "role": "assistant",
            "content": asst_msg.content,
            "citations": citations,
            "created_at": asst_msg.created_at,
        }
    }