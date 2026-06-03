from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import ChatSession, Message, User
from app.schemas.schemas import ChatSessionResponse, ChatSessionDetail, SendMessageRequest, SendMessageResponse, MessageResponse
from app.services.chat_service import process_chat_message

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=SendMessageResponse)
async def send_message(data: SendMessageRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await process_chat_message(db=db, user=current_user, question=data.content, session_id=data.session_id)
    return result


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_archived == False
    ).order_by(ChatSession.last_message_at.desc().nullslast()).all()

    return [ChatSessionResponse(
        id=s.id, title=s.title, department_id=s.department_id,
        is_archived=s.is_archived, created_at=s.created_at,
        last_message_at=s.last_message_at,
        message_count=db.query(Message).filter(Message.session_id == s.id).count()
    ) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session: raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()
    return ChatSessionDetail(
        id=session.id, title=session.title, department_id=session.department_id,
        is_archived=session.is_archived, created_at=session.created_at,
        last_message_at=session.last_message_at, message_count=len(messages),
        messages=[MessageResponse(id=m.id, role=m.role, content=m.content, citations=m.citations, created_at=m.created_at) for m in messages]
    )


@router.delete("/sessions/{session_id}", response_model=dict)
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not s: raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s); db.commit()
    return {"message": "Session deleted"}


@router.patch("/sessions/{session_id}/archive", response_model=dict)
def archive_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not s: raise HTTPException(status_code=404, detail="Session not found")
    s.is_archived = True; db.commit()
    return {"message": "Archived"}


@router.patch("/sessions/{session_id}/rename", response_model=dict)
def rename_session(session_id: int, title: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not s: raise HTTPException(status_code=404, detail="Session not found")
    s.title = title[:60]; db.commit()
    return {"message": "Renamed", "title": s.title}
