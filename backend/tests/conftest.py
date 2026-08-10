"""Pytest fixtures for the Aura backend."""

from __future__ import annotations

import os
import sys
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Repo root on sys.path so `backend.*` imports resolve.
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

os.environ.setdefault("AURA_API_SECRET", "test-secret-key")
os.environ.setdefault("AURA_ENV", "development")
os.environ.setdefault("AURA_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("AURA_MAX_CONCURRENT", "4")

from backend.main import app

API_SECRET = os.environ["AURA_API_SECRET"]
AUTH_HEADERS = {"X-Aura-Key": API_SECRET}


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
