"""Production FastAPI surface: docs and OpenAPI are disabled."""

from __future__ import annotations

import importlib

import pytest
from fastapi.testclient import TestClient


def test_production_disables_docs_and_openapi(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AURA_ENV", "production")
    import backend.main as main_mod

    production_app = importlib.reload(main_mod).app
    try:
        with TestClient(production_app) as client:
            assert client.get("/docs").status_code == 404
            assert client.get("/redoc").status_code == 404
            assert client.get("/openapi.json").status_code == 404
            assert client.get("/health").status_code == 200
    finally:
        monkeypatch.setenv("AURA_ENV", "development")
        importlib.reload(main_mod)
