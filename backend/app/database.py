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
    """Initialize database - create all tables if they don't exist (preserves data)"""
    from app.models import Base
    
    # Create data directory if using SQLite
    if DATABASE_URL.startswith('sqlite'):
        db_path = Path(DATABASE_URL.replace('sqlite:///', './'))
        db_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Only create tables if they don't exist - this preserves existing data
    # DO NOT drop tables on startup!
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized (existing data preserved)")

def reset_db_dev_only():
    """
    DEVELOPMENT ONLY: Drop and recreate all tables
    WARNING: This deletes all data! Only use for testing.
    """
    from app.models import Base
    print("⚠️  RESETTING DATABASE - ALL DATA WILL BE DELETED!")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database reset complete")

def drop_all_tables():
    """Drop all tables - USE WITH CAUTION"""
    from app.models import Base
    Base.metadata.drop_all(bind=engine)
    print("⚠️ All tables dropped")
