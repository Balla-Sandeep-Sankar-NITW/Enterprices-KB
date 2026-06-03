from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Department, DepartmentChangeRequest, RequestStatus
from app.schemas.schemas import UserResponse, UserUpdateRequest, DepartmentResponse, DeptChangeRequestCreate, DeptChangeRequestResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.full_name:
        current_user.full_name = data.full_name
    db.commit(); db.refresh(current_user)
    return current_user


@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [DepartmentResponse(id=d.id, name=d.name, description=d.description, created_at=d.created_at)
            for d in db.query(Department).all()]


@router.post("/department-change-request", response_model=DeptChangeRequestResponse)
def request_dept_change(data: DeptChangeRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(DepartmentChangeRequest).filter(
        DepartmentChangeRequest.user_id == current_user.id,
        DepartmentChangeRequest.status == RequestStatus.PENDING
    ).first()
    if existing: raise HTTPException(status_code=400, detail="You already have a pending request")

    dept = db.query(Department).filter(Department.id == data.requested_department_id).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    if current_user.department_id == data.requested_department_id:
        raise HTTPException(status_code=400, detail="You are already in this department")

    req = DepartmentChangeRequest(
        user_id=current_user.id,
        current_department_id=current_user.department_id,
        requested_department_id=data.requested_department_id,
        reason=data.reason,
        status=RequestStatus.PENDING
    )
    db.add(req); db.commit(); db.refresh(req)

    curr = db.query(Department).filter(Department.id == req.current_department_id).first()
    return DeptChangeRequestResponse(
        id=req.id, user_id=req.user_id, user_name=current_user.full_name,
        current_department_id=req.current_department_id, current_department_name=curr.name if curr else None,
        requested_department_id=req.requested_department_id, requested_department_name=dept.name,
        reason=req.reason, status=req.status, created_at=req.created_at,
    )


@router.get("/department-change-requests/my", response_model=List[DeptChangeRequestResponse])
def my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reqs = db.query(DepartmentChangeRequest).filter(
        DepartmentChangeRequest.user_id == current_user.id
    ).order_by(DepartmentChangeRequest.created_at.desc()).all()

    result = []
    for r in reqs:
        curr = db.query(Department).filter(Department.id == r.current_department_id).first()
        req_dept = db.query(Department).filter(Department.id == r.requested_department_id).first()
        result.append(DeptChangeRequestResponse(
            id=r.id, user_id=r.user_id, user_name=current_user.full_name,
            current_department_id=r.current_department_id, current_department_name=curr.name if curr else None,
            requested_department_id=r.requested_department_id, requested_department_name=req_dept.name if req_dept else None,
            reason=r.reason, status=r.status, review_note=r.review_note,
            created_at=r.created_at, reviewed_at=r.reviewed_at,
        ))
    return result
