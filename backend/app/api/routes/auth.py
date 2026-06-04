from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import (
    SignupRequest, LoginRequest, TokenResponse,
    RefreshRequest, EmailVerificationRequest, UserResponse
)
from app.services.auth_service import AuthService
from app.services.email_service import send_verification_email
from app.api.deps import get_current_user
from app.models.models import User
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=dict, status_code=201)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    user, token = AuthService.signup(db, data)

    # Send email directly (not in background) so it completes before response
    try:
        send_verification_email(user.email, user.full_name, token)
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"[EMAIL FAILED] Error: {e}")
        print(f"[EMAIL FAILED] Manual verification link for {user.email}:")
        print(f"[EMAIL FAILED] {settings.FRONTEND_URL}/verify-email?token={token}")
        print(f"{'='*60}\n")

    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user_id": user.id
    }


@router.post("/verify-email", response_model=dict)
def verify_email(data: EmailVerificationRequest, db: Session = Depends(get_db)):
    user = AuthService.verify_email(db, data.token)
    return {
        "message": "Email verified. Your account is pending admin approval.",
        "user_id": user.id
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService.refresh(db, data.refresh_token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", response_model=dict)
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.post("/test-email", response_model=dict)
def test_email(email: str, db: Session = Depends(get_db)):
    """Test Gmail SMTP. Usage: POST /api/v1/auth/test-email?email=you@gmail.com"""
    from app.services.email_service import _send_email
    try:
        _send_email(email, "Test Email - Enterprise KB",
                    "<h2>✅ Gmail SMTP is working!</h2><p>Your email config is correct.</p>")
        return {"message": f"Test email sent to {email}"}
    except Exception as e:
        return {
            "error": str(e),
            "tip": "Make sure MAIL_PASSWORD is a Gmail App Password, not your login password."
        }