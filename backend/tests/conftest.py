from __future__ import annotations

import os
from urllib.parse import urlsplit, urlunsplit

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.models.news import News
from app.models.stock import PriceHistory, Stock
from app.models.user import Holding, User, Watchlist  # noqa: F401 -- register on Base.metadata


@pytest.fixture()
def db_session():
    """In-memory SQLite session with just the tables the score engine touches.

    Not Postgres — score_engine only does plain ORM reads (no dialect-specific
    upserts), so SQLite is a faithful enough stand-in and keeps these tests
    fast and dependency-free. users/watchlist/holdings use Postgres-only UUID
    columns and are deliberately excluded — nothing here needs them.
    """
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(
        bind=engine, tables=[Stock.__table__, PriceHistory.__table__, News.__table__]
    )
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def _test_database_url() -> str:
    override = os.environ.get("TEST_DATABASE_URL")
    if override:
        return override
    parts = urlsplit(settings.database_url)
    return urlunsplit(parts._replace(path="/stockcoach_test"))


def _ensure_database_exists(test_url: str) -> None:
    parts = urlsplit(test_url)
    db_name = parts.path.lstrip("/")
    admin_url = urlunsplit(parts._replace(path="/postgres"))

    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
            ).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session")
def pg_engine():
    """Real Postgres, in a dedicated `stockcoach_test` database (never the
    dev DB) — API/router tests exercise code paths (Postgres upserts, UUID
    user/watchlist/holdings columns) that plain SQLite can't stand in for.
    Must run against the `db` service from docker-compose, not a Windows
    host venv — see project history on psycopg2 vs. Docker Desktop's
    Windows port-forwarding.
    """
    test_url = _test_database_url()
    _ensure_database_exists(test_url)

    engine = create_engine(test_url)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def pg_session(pg_engine):
    """One DB transaction per test, rolled back afterwards — isolates tests
    from each other even though the app's service layer calls db.commit()
    internally (those become SAVEPOINT releases within this outer
    transaction via join_transaction_mode)."""
    connection = pg_engine.connect()
    trans = connection.begin()
    session = sessionmaker(bind=connection, join_transaction_mode="create_savepoint")()
    try:
        yield session
    finally:
        session.close()
        trans.rollback()
        connection.close()


@pytest.fixture()
def client(pg_session):
    """FastAPI TestClient wired to the per-test transactional session above,
    instead of the app's real SessionLocal/engine."""
    from app.main import app

    def _override_get_db():
        yield pg_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
