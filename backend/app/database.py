"""
Database configuration and initialization
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from pathlib import Path

# Database URL - supports both SQLite (dev) and PostgreSQL (prod)
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'sqlite:///./app/data/diabinsight.db'  # SQLite for development
)

# Create engine with connection pool settings
if DATABASE_URL.startswith('sqlite'):
    # SQLite settings
    engine = create_engine(
        DATABASE_URL,
        connect_args={'check_same_thread': False},
        echo=False  # Set True for SQL logging
    )
else:
    # PostgreSQL settings
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        echo=False,
        pool_pre_ping=True  # Test connection before using
    )

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    Usage in FastAPI:
        @app.get("/")
        def read(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    from app.models import Base
    
    # Create data directory if using SQLite
    if DATABASE_URL.startswith('sqlite'):
        db_path = Path(DATABASE_URL.replace('sqlite:///', './'))
        db_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Drop and recreate all tables to ensure schema is up to date
    # This is safe for development but NOT for production with existing data
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")

def drop_all_tables():
    """Drop all tables - USE WITH CAUTION"""
    from app.models import Base
    Base.metadata.drop_all(bind=engine)
    print("⚠️ All tables dropped")
