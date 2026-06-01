"""Database engine and session factory."""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import get_settings

settings = get_settings()

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_database_exists() -> None:
    """Create the target PostgreSQL database if it does not already exist."""
    url = make_url(settings.database_url)
    if not url.drivername.startswith("postgresql"):
        return

    database_name = url.database
    if not database_name or database_name.lower() in {"postgres", "template1"}:
        return

    admin_url = url.set(database="postgres")
    admin_engine = create_engine(
        admin_url,
        echo=settings.debug,
        pool_pre_ping=True,
    )

    try:
        with admin_engine.connect() as conn:
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f'CREATE DATABASE "{database_name}"'))
    except OperationalError as exc:
        if "already exists" in str(exc).lower():
            return
        raise
    except Exception as exc:
        if "already exists" in str(exc).lower():
            return
        raise


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
