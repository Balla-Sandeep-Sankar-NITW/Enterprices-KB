from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import math

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.models import User, UserStatus, Department, Document, ChatSession, Message, DepartmentChangeRequest, RequestStatus
from app.schemas.schemas import (
    UserResponse, UserListResponse, ApproveUserRequest, RejectUserRequest, AdminUpdateUserRequest,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse, DashboardStats,
    DeptChangeRequestResponse, ReviewDeptChangeRequest
)
from app.services.email_service import send_approval_email, send_rejection_email, send_dept_change_approved_email

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return DashboardStats(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.status == UserStatus.ACTIVE).count(),
        pending_approval=db.query(User).filter(User.status == UserStatus.PENDING_APPROVAL).count(),
        total_documents=db.query(Document).count(),
        processed_documents=db.query(Document).filter(Document.status == "processed").count(),
        total_chat_sessions=db.query(ChatSession).count(),
        total_messages=db.query(Message).count(),
        departments=db.query(Department).count(),
    )


@router.get("/users", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None, role: Optional[str] = None,
    department_id: Optional[int] = None, search: Optional[str] = None,
    db: Session = Depends(get_db), admin=Depends(get_current_admin)
):
    q = db.query(User)
    if status: q = q.filter(User.status == status)
    if role: q = q.filter(User.role == role)
    if department_id: q = q.filter(User.department_id == department_id)
    if search: q = q.filter((User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%")))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return UserListResponse(users=users, total=total, page=page, per_page=per_page, pages=math.ceil(total / per_page) if total else 0)


@router.get("/users/pending", response_model=list[UserResponse])
def pending_users(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(User).filter(User.status == UserStatus.PENDING_APPROVAL).all()


@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(user_id: int, data: ApproveUserRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.status != UserStatus.PENDING_APPROVAL: raise HTTPException(status_code=400, detail="User not pending approval")
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")

    user.status = UserStatus.ACTIVE
    user.department_id = data.department_id
    user.approved_by_id = admin.id
    user.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    try: send_approval_email(user.email, user.full_name)
    except Exception: pass
    return user


@router.post("/users/{user_id}/reject", response_model=UserResponse)
def reject_user(user_id: int, data: RejectUserRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.status = UserStatus.REJECTED
    user.rejection_reason = data.reason
    db.commit()
    db.refresh(user)
    try: send_rejection_email(user.email, user.full_name, data.reason)
    except Exception: pass
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: AdminUpdateUserRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit(); db.refresh(user)
    return user


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id: raise HTTPException(status_code=400, detail="Cannot delete your own account")
    db.delete(user); db.commit()
    return {"message": "User deleted"}


# ── Departments ──────────────────────────────────────────

@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    depts = db.query(Department).all()
    return [DepartmentResponse(
        id=d.id, name=d.name, description=d.description, created_at=d.created_at,
        user_count=db.query(User).filter(User.department_id == d.id).count(),
        document_count=db.query(Document).filter(Document.department_id == d.id).count(),
    ) for d in depts]


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    if db.query(Department).filter(Department.name == data.name).first():
        raise HTTPException(status_code=400, detail="Department name already exists")
    dept = Department(name=data.name, description=data.description)
    db.add(dept); db.commit(); db.refresh(dept)
    return DepartmentResponse(id=dept.id, name=dept.name, description=dept.description, created_at=dept.created_at)


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, data: DepartmentUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    db.commit(); db.refresh(dept)
    return DepartmentResponse(id=dept.id, name=dept.name, description=dept.description, created_at=dept.created_at)


@router.delete("/departments/{dept_id}", response_model=dict)
def delete_department(dept_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    count = db.query(User).filter(User.department_id == dept_id).count()
    if count: raise HTTPException(status_code=400, detail=f"Cannot delete: {count} users in this department")
    db.delete(dept); db.commit()
    return {"message": "Department deleted"}


# ── Dept Change Requests ─────────────────────────────────

@router.get("/dept-change-requests", response_model=list[DeptChangeRequestResponse])
def list_dept_change_requests(status: Optional[str] = "pending", db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    q = db.query(DepartmentChangeRequest)
    if status: q = q.filter(DepartmentChangeRequest.status == status)
    reqs = q.all()
    result = []
    for r in reqs:
        user = db.query(User).filter(User.id == r.user_id).first()
        curr = db.query(Department).filter(Department.id == r.current_department_id).first()
        req_dept = db.query(Department).filter(Department.id == r.requested_department_id).first()
        result.append(DeptChangeRequestResponse(
            id=r.id, user_id=r.user_id, user_name=user.full_name if user else None,
            current_department_id=r.current_department_id, current_department_name=curr.name if curr else None,
            requested_department_id=r.requested_department_id, requested_department_name=req_dept.name if req_dept else None,
            reason=r.reason, status=r.status, review_note=r.review_note,
            created_at=r.created_at, reviewed_at=r.reviewed_at,
        ))
    return result


@router.post("/dept-change-requests/{req_id}/review", response_model=dict)
def review_dept_change(req_id: int, data: ReviewDeptChangeRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    req = db.query(DepartmentChangeRequest).filter(DepartmentChangeRequest.id == req_id).first()
    if not req: raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.PENDING: raise HTTPException(status_code=400, detail="Already reviewed")

    if data.action == "approve":
        req.status = RequestStatus.APPROVED
        user = db.query(User).filter(User.id == req.user_id).first()
        if user:
            user.department_id = req.requested_department_id
            dept = db.query(Department).filter(Department.id == req.requested_department_id).first()
            try: send_dept_change_approved_email(user.email, user.full_name, dept.name if dept else "")
            except Exception: pass
    elif data.action == "reject":
        req.status = RequestStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    req.reviewed_by_id = admin.id
    req.reviewed_at = datetime.utcnow()
    req.review_note = data.note
    db.commit()
    return {"message": f"Request {data.action}d"}
