"""API and engine contract tests for Aura Workspace backend."""

from __future__ import annotations

import math

import pytest
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
        assert ma.insights == mb.insights


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
    assert body == {"detail": "Invalid request"}


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
    assert response.json() == {"detail": "Invalid request"}


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


def test_reject_oversized_body(client: TestClient) -> None:
    payload = b"x" * (4 * 1024 + 1)
    response = client.post(
        "/api/simulate",
        headers={**AUTH_HEADERS, "Content-Type": "application/json"},
        content=payload,
    )
    assert response.status_code == 413
    assert response.json() == {"detail": "Request body too large"}


def test_reject_wrong_secret(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers={"X-Aura-Key": "wrong-secret-key"},
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
    assert response.json() == {"detail": "Invalid request"}


def test_reject_seed_out_of_range(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers=AUTH_HEADERS,
        json={
            "ad_spend": 8000,
            "price": 149,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
            "seed": 3_000_000_000,
        },
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid request"}


def test_reject_negative_seed(client: TestClient) -> None:
    response = client.post(
        "/api/simulate",
        headers=AUTH_HEADERS,
        json={
            "ad_spend": 8000,
            "price": 149,
            "team_size": 6,
            "opex": 12000,
            "cash_reserve": 120000,
            "seed": -1,
        },
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid request"}


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
    assert data["meta"]["clients_per_head"] == 12
    assert data["meta"]["cost_per_head"] == 2500.0
    assert len(data["months"]) == 12
    assert len(data["insights"]) == 3
    for month in data["months"]:
        assert len(month["insights"]) == 3
    assert data["insights"] == data["months"][-1]["insights"]
    assert data["meta"]["engine_version"] == "1.1.0"


def test_each_month_has_exactly_three_insights() -> None:
    result = simulate()
    assert result.meta.engine_version == "1.1.0"
    assert len(result.insights) == 3
    for month in result.months:
        assert len(month.insights) == 3
        codes = [item.code for item in month.insights]
        assert len(set(codes)) == 3
        for item in month.insights:
            assert item.severity in {"info", "warning", "critical"}
            assert item.code
    assert result.insights == result.months[-1].insights


def test_insights_pad_to_three_when_few_rules_fire(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Zod .length(3) requires padding when the catalog fires fewer than 3 rules."""
    from backend import engine

    monkeypatch.setattr(engine, "INSIGHT_RULES", ())
    result = engine.simulate(seed=FIXED_SEED)
    assert len(result.insights) == 3
    for month in result.months:
        assert len(month.insights) == 3
        codes = [item.code for item in month.insights]
        assert len(set(codes)) == 3
        assert set(codes) <= {
            "REC_SECOND_LEVER",
            "MKT_EFFICIENT",
            "REC_TOP_LEVER",
        }


def test_docs_enabled_in_development(client: TestClient) -> None:
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200
    assert client.get("/openapi.json").status_code == 200


def test_month_insights_track_horizon() -> None:
    """Cash risk eases later in Bootstrap, so Copilot codes change with the scrubber."""
    result = simulate(
        ad_spend=15_000,
        price=2_000,
        team_size=2,
        opex=0,
        cash_reserve=60_000,
        seed=FIXED_SEED,
    )
    codes_early = [item.code for item in result.months[0].insights]
    codes_late = [item.code for item in result.months[-1].insights]
    assert codes_early != codes_late
    assert "CASH_RUNWAY_CRITICAL" in codes_early
    assert "CASH_RUNWAY_CRITICAL" not in codes_late


def test_health_telemetry(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "engine_version" in data
    assert "uptime_s" in data
    assert "numpy_warmup_ms" in data
    assert data["numpy_warmup_ms"] >= 0
