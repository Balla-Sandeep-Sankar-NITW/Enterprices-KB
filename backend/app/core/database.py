from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Neon requires sslmode=require — already in the connection string
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,        # Reconnect if connection dropped
    pool_size=5,               # Keep RAM low
    max_overflow=10,
    pool_recycle=300,          # Recycle connections every 5 min
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10,
    } if "neon.tech" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)


def check_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Neon PostgreSQL connected")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
