from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    ForeignKey, Enum, Float, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ─────────────────────────────────────────
# Enums
# ─────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"


class UserStatus(str, enum.Enum):
    PENDING_EMAIL = "pending_email"       # Registered, not verified email
    PENDING_APPROVAL = "pending_approval" # Email verified, waiting admin approval
    ACTIVE = "active"                     # Fully active
    REJECTED = "rejected"                 # Admin rejected
    SUSPENDED = "suspended"               # Suspended by admin


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ─────────────────────────────────────────
# Models
# ─────────────────────────────────────────

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="department")
    documents = relationship("Document", back_populates="department")
    
    # FIX: Explicitly tell Department to look at requested_department_id string
    change_requests = relationship(
        "DepartmentChangeRequest", 
        back_populates="requested_department",
        foreign_keys="[DepartmentChangeRequest.requested_department_id]"
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_EMAIL, nullable=False)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    email_verification_token = Column(String(128), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)

    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="users")
    approved_by = relationship("User", remote_side=[id], foreign_keys=[approved_by_id])
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    access_logs = relationship("DocumentAccessLog", back_populates="user")
    
    # FIX: Matched string syntax format for the foreign key target
    department_change_requests = relationship(
        "DepartmentChangeRequest",
        back_populates="user",
        foreign_keys="[DepartmentChangeRequest.user_id]"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    stored_filename = Column(String(500), nullable=False)  # UUID-based name on disk
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt, xlsx
    mime_type = Column(String(100), nullable=True)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    processing_error = Column(Text, nullable=True)

    # Processing metadata
    total_pages = Column(Integer, nullable=True)
    total_chunks = Column(Integer, nullable=True)
    chroma_collection_id = Column(String(255), nullable=True)

    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # list of strings

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    access_logs = relationship("DocumentAccessLog", back_populates="document",cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
    
    # ─── ADD THIS LINE ───
    access_logs = relationship("DocumentAccessLog", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)

    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)

    # For assistant messages — citations
    citations = Column(JSON, nullable=True)
    # Example:
    # [
    #   {"document_id": 1, "title": "Leave Policy", "page": 3, "chunk": "..."},
    # ]

    # Retrieval metadata (for debugging/analytics)
    retrieval_query = Column(Text, nullable=True)  # contextualized query used
    retrieved_chunks = Column(Integer, nullable=True)  # how many chunks retrieved

    tokens_used = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("ChatSession", back_populates="messages")


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True) # Already nullable=True

    action = Column(String(50), nullable=False)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="access_logs")
    document = relationship("Document", back_populates="access_logs")
    
    # ─── ADD THIS LINE ───
    session = relationship("ChatSession", back_populates="access_logs")


class DepartmentChangeRequest(Base):
    __tablename__ = "department_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    requested_department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    reason = Column(Text, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)

    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # FIX: All relationships here now explicitly point to their exact matching column object
    user = relationship(
        "User", 
        back_populates="department_change_requests", 
        foreign_keys=[user_id]
    )
    requested_department = relationship(
        "Department", 
        back_populates="change_requests", 
        foreign_keys=[requested_department_id]
    )
    reviewed_by = relationship(
        "User", 
        foreign_keys=[reviewed_by_id]
    )
    current_department = relationship(
        "Department", 
        foreign_keys=[current_department_id]
    )