from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import create_tables, check_db_connection
from app.api.routes import auth, admin, documents, chat, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Check DB
    check_db_connection()
    create_tables()
    print("✅ Database tables ready")

    # Init Pinecone
    from app.services.vector_store import init_pinecone
    init_pinecone()

    # Uploads dir
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print("✅ Upload directory ready")

    # Create first admin
    await _create_first_admin()

    yield
    print("👋 Shutting down")


async def _create_first_admin():
    from app.core.database import SessionLocal
    from app.models.models import User, UserRole, UserStatus
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == UserRole.ADMIN).first():
            admin = User(
                email=settings.FIRST_ADMIN_EMAIL,
                full_name="System Administrator",
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
            db.add(admin); db.commit()
            print(f"✅ Admin created: {settings.FIRST_ADMIN_EMAIL}")
        else:
            print(f"ℹ️  Admin already exists")
    except Exception as e:
        print(f"⚠️  Admin creation: {e}")
    finally:
        db.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Knowledge Base — RAG + RBAC + Cloud APIs",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
