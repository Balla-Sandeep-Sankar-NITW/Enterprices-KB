from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app.models.models import User, UserRole, UserStatus
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, generate_verification_token
from app.schemas.schemas import SignupRequest, LoginRequest
from app.services.email_service import send_verification_email, send_approval_email, send_rejection_email


class AuthService:

    @staticmethod
    def signup(db: Session, data: SignupRequest) -> tuple[User, str]:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        token = generate_verification_token()
        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role=UserRole.EMPLOYEE,
            status=UserStatus.PENDING_EMAIL,
            department_id=data.department_id,
            email_verification_token=token,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, token

    @staticmethod
    def verify_email(db: Session, token: str) -> User:
        user = db.query(User).filter(
            User.email_verification_token == token,
            User.status == UserStatus.PENDING_EMAIL
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")

        user.status = UserStatus.PENDING_APPROVAL
        user.email_verified_at = datetime.utcnow()
        user.email_verification_token = None
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, data: LoginRequest) -> dict:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")

        status_messages = {
            UserStatus.PENDING_EMAIL: "Please verify your email first",
            UserStatus.PENDING_APPROVAL: "Your account is pending admin approval",
            UserStatus.REJECTED: f"Your account was rejected. Reason: {user.rejection_reason or 'Not specified'}",
            UserStatus.SUSPENDED: "Your account has been suspended",
        }
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=403, detail=status_messages.get(user.status, "Account inactive"))

        user.last_login_at = datetime.utcnow()
        db.commit()

        token_data = {"sub": str(user.id), "role": user.role.value}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user or user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        token_data = {"sub": str(user.id), "role": user.role.value}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }
