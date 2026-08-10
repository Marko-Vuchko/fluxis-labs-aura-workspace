"""API and engine contract tests for Aura Workspace backend."""

from __future__ import annotations

import math

from fastapi.testclient import TestClient

from backend.engine import FIXED_SEED, simulate
from backend.tests.conftest import AUTH_HEADERS


def test_determinism_with_fixed_seed() -> None:
    a = simulate(seed=FIXED_SEED)
    b = simulate(seed=FIXED_SEED)
    assert a.meta.seed == FIXED_SEED
    assert b.meta.seed == FIXED_SEED
    assert a.annual.revenue == b.annual.revenue
    assert a.annual.profit == b.annual.profit
    assert a.annual.margin == b.annual.margin
    assert a.annual.ending_cash == b.annual.ending_cash
    assert len(a.months) == len(b.months) == 12
    for ma, mb in zip(a.months, b.months, strict=True):
        assert ma.revenue == mb.revenue
        assert ma.profit == mb.profit
        assert ma.risk.score == mb.risk.score


def test_risk_score_bounds() -> None:
    result = simulate()
    for month in result.months:
        assert 0.0 <= month.risk.score <= 100.0
        assert len(month.risk.components) == 4
        for component in month.risk.components:
            assert 0.0 <= component <= 1.0 or math.isfinite(component)


def test_margins_in_expected_range() -> None:
    result = simulate()
    p10, p50, p90 = result.annual.margin
    for value in (p10, p50, p90):
        assert math.isfinite(value)
        # Margin is profit/revenue: upper bound is 1.0 when costs are non-negative.
        assert value <= 1.0
    assert p10 <= p50 <= p90
    for month in result.months:
        assert math.isfinite(month.margin)
        assert month.margin <= 1.0


def test_reject_unknown_fields(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers=AUTH_HEADERS,
        json={
            "ad_spend": 8000,
            "price": 149,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
            "unknown_field": 1,
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert "detail" in body
    detail_text = str(body["detail"]).lower()
    assert "unknown_field" in detail_text or "extra" in detail_text


def test_reject_nan(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers={**AUTH_HEADERS, "Content-Type": "application/json"},
        content=(
            b'{"ad_spend": NaN, "price": 149, "team_size": 6,'
            b' "opex": 12000, "cash_reserve": 120000}'
        ),
    )
    assert response.status_code == 422
    detail_text = str(response.json()["detail"]).lower()
    assert "ad_spend" in detail_text


def test_reject_missing_secret(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        json={
            "ad_spend": 8000,
            "price": 149,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
        },
    )
    assert response.status_code == 401


def test_reject_out_of_range(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers=AUTH_HEADERS,
        json={
            "ad_spend": 8000,
            "price": 5,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
        },
    )
    assert response.status_code == 422
    detail_text = str(response.json()["detail"]).lower()
    assert "price" in detail_text


def test_simulate_success_shape(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers=AUTH_HEADERS,
        json={
            "ad_spend": 8000,
            "price": 149,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) >= {
        "meta",
        "annual",
        "months",
        "histogram",
        "sensitivity",
        "insights",
    }
    assert data["meta"]["iterations"] == 1000
    assert data["meta"]["months"] == 12
    assert len(data["months"]) == 12
    assert len(data["insights"]) == 3


def test_health_telemetry(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "engine_version" in data
    assert "uptime_s" in data
    assert "numpy_warmup_ms" in data
    assert data["numpy_warmup_ms"] >= 0
