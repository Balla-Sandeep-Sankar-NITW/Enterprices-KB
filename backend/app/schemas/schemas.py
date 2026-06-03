from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, UserStatus, DocumentStatus, RequestStatus
import re


# ── Auth ──────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    department_id: Optional[int] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Min 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Need at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Need at least one digit")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class EmailVerificationRequest(BaseModel):
    token: str


# ── Users ─────────────────────────────────

class DepartmentBrief(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    department: Optional[DepartmentBrief] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None


class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    department_id: Optional[int] = None
    rejection_reason: Optional[str] = None


class ApproveUserRequest(BaseModel):
    department_id: int


class RejectUserRequest(BaseModel):
    reason: Optional[str] = None


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    per_page: int
    pages: int


# ── Departments ───────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    user_count: Optional[int] = 0
    document_count: Optional[int] = 0
    class Config:
        from_attributes = True


# ── Documents ─────────────────────────────

class DocumentResponse(BaseModel):
    id: int
    title: str
    original_filename: str
    file_type: str
    file_size: Optional[int] = None
    department_id: int
    department_name: Optional[str] = None
    status: DocumentStatus
    total_pages: Optional[int] = None
    total_chunks: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    uploaded_by_name: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    processing_error: Optional[str] = None
    class Config:
        from_attributes = True


class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    department_id: Optional[int] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    per_page: int
    pages: int


# ── Chat ──────────────────────────────────

class Citation(BaseModel):
    document_id: int
    title: str
    page: Optional[int] = None
    chunk_text: Optional[str] = None
    relevance_score: Optional[float] = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    created_at: datetime
    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: int
    title: Optional[str] = None
    department_id: Optional[int] = None
    is_archived: bool
    created_at: datetime
    last_message_at: Optional[datetime] = None
    message_count: Optional[int] = 0
    class Config:
        from_attributes = True


class ChatSessionDetail(ChatSessionResponse):
    messages: List[MessageResponse] = []


class SendMessageRequest(BaseModel):
    content: str
    session_id: Optional[int] = None


class SendMessageResponse(BaseModel):
    session_id: int
    session_title: str
    message: MessageResponse


# ── Dept Change Requests ──────────────────

class DeptChangeRequestCreate(BaseModel):
    requested_department_id: int
    reason: Optional[str] = None


class DeptChangeRequestResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    current_department_id: Optional[int] = None
    current_department_name: Optional[str] = None
    requested_department_id: int
    requested_department_name: Optional[str] = None
    reason: Optional[str] = None
    status: RequestStatus
    review_note: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ReviewDeptChangeRequest(BaseModel):
    action: str
    note: Optional[str] = None


# ── Analytics ─────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    pending_approval: int
    total_documents: int
    processed_documents: int
    total_chat_sessions: int
    total_messages: int
    departments: int
