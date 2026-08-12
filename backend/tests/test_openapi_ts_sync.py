"""PRD §11.2 - OpenAPI request schema stays aligned with the TypeScript mirror.

The TS mirror lives in features/simulation/types.ts (and the shared Zod contract
in lib/simulation/contract.ts). FastAPI exposes SimulationRequest via OpenAPI;
the engine response shape is checked against the same field inventory.
"""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from backend.engine import CLIENTS_PER_HEAD, COST_PER_HEAD, simulate
from backend.main import app
from backend.tests.conftest import AUTH_HEADERS

_ROOT = Path(__file__).resolve().parents[2]
_TYPES_TS = _ROOT / "features" / "simulation" / "types.ts"
_CONTRACT_TS = _ROOT / "lib" / "simulation" / "contract.ts"

# Canonical field inventory mirroring features/simulation/types.ts (PRD 6.1 / 6.2).
TS_INPUT_PROPS = {
    "ad_spend",
    "price",
    "team_size",
    "opex",
    "cash_reserve",
    "seed",
}
TS_INPUT_REQUIRED = {
    "ad_spend",
    "price",
    "team_size",
    "opex",
    "cash_reserve",
}
TS_META_PROPS = {
    "engine_version",
    "iterations",
    "months",
    "seed",
    "compute_ms",
    "currency",
    "clients_per_head",
    "cost_per_head",
}
TS_OUTPUT_TOP = {
    "meta",
    "annual",
    "months",
    "histogram",
    "sensitivity",
    "insights",
}
TS_ANNUAL_PROPS = {"revenue", "profit", "margin", "ending_cash"}
TS_MONTH_PROPS = {
    "index",
    "revenue",
    "profit",
    "margin",
    "customers",
    "churn_rate",
    "capacity_used",
    "cash",
    "runway_months",
    "risk",
    "nodes",
    "insights",
}
TS_HEALTH_PROPS = {"status", "engine_version", "uptime_s", "numpy_warmup_ms"}


def _openapi() -> dict[str, Any]:
    return app.openapi()


def test_openapi_simulate_request_matches_ts_input() -> None:
    schema = _openapi()
    request_schema = schema["components"]["schemas"]["SimulationRequest"]
    props = set(request_schema["properties"].keys())
    required = set(request_schema.get("required", []))

    assert props == TS_INPUT_PROPS
    # Pydantic defaults mean OpenAPI lists no required fields; TS still treats
    # the five levers as required when the client builds a request body.
    assert required <= TS_INPUT_REQUIRED
    assert "seed" not in required

    # Bounds from PRD 6.1 must stay encoded in OpenAPI.
    assert request_schema["properties"]["ad_spend"]["minimum"] == 0
    assert request_schema["properties"]["ad_spend"]["maximum"] == 50_000
    assert request_schema["properties"]["price"]["minimum"] == 10
    assert request_schema["properties"]["price"]["maximum"] == 2_000
    assert request_schema["properties"]["team_size"]["minimum"] == 1
    assert request_schema["properties"]["team_size"]["maximum"] == 50
    assert request_schema["properties"]["opex"]["minimum"] == 0
    assert request_schema["properties"]["opex"]["maximum"] == 100_000
    assert request_schema["properties"]["cash_reserve"]["minimum"] == 0
    assert request_schema["properties"]["cash_reserve"]["maximum"] == 500_000

    seed_variants = request_schema["properties"]["seed"]["anyOf"]
    seed_int = next(v for v in seed_variants if v.get("type") == "integer")
    assert seed_int["minimum"] == 0
    assert seed_int["maximum"] == 2_147_483_647
    assert any(v.get("type") == "null" for v in seed_variants)


def test_openapi_health_matches_ts_health() -> None:
    schema = _openapi()
    health = schema["paths"]["/health"]["get"]
    assert "200" in health["responses"]


def test_typescript_mirror_documents_contract_fields() -> None:
    types_text = _TYPES_TS.read_text(encoding="utf-8")
    contract_text = _CONTRACT_TS.read_text(encoding="utf-8")

    for name in TS_INPUT_PROPS | TS_META_PROPS | TS_OUTPUT_TOP | TS_HEALTH_PROPS:
        assert name in types_text, f"types.ts missing field {name}"

    for name in TS_META_PROPS:
        assert name in contract_text, f"contract.ts missing meta field {name}"

    # Capacity economics must be required in the shared Zod contract (not optional).
    assert "clients_per_head: z.number().finite().optional()" not in contract_text
    assert "cost_per_head: z.number().finite().optional()" not in contract_text
    assert "clients_per_head: z.number().finite()," in contract_text
    assert "cost_per_head: z.number().finite()," in contract_text


def test_engine_response_matches_ts_output_mirror() -> None:
    payload = asdict(simulate())
    assert set(payload.keys()) == TS_OUTPUT_TOP
    assert set(payload["meta"].keys()) == TS_META_PROPS
    assert set(payload["annual"].keys()) == TS_ANNUAL_PROPS
    assert len(payload["months"]) == 12
    assert set(payload["months"][0].keys()) == TS_MONTH_PROPS

    meta = payload["meta"]
    assert meta["clients_per_head"] == CLIENTS_PER_HEAD
    assert meta["cost_per_head"] == COST_PER_HEAD
    assert meta["iterations"] == 1000
    assert meta["months"] == 12


def test_simulate_http_echoes_capacity_meta(client: TestClient) -> None:
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
    meta = response.json()["meta"]
    assert meta["clients_per_head"] == CLIENTS_PER_HEAD
    assert meta["cost_per_head"] == COST_PER_HEAD
