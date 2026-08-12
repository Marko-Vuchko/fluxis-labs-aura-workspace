"""Return types for the Aura Monte Carlo engine."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Severity = Literal["info", "warning", "critical"]


@dataclass(frozen=True)
class RiskBlock:
    score: float
    components: list[float]


@dataclass(frozen=True)
class InsightItem:
    code: str
    severity: Severity
    params: dict[str, float | int]


@dataclass(frozen=True)
class MonthSnapshot:
    index: int
    revenue: list[float]
    profit: list[float]
    margin: float
    customers: float
    churn_rate: float
    capacity_used: float
    cash: float
    runway_months: float | None
    risk: RiskBlock
    nodes: list[list[float]]
    insights: list[InsightItem]


@dataclass(frozen=True)
class AnnualSummary:
    revenue: list[float]
    profit: list[float]
    margin: list[float]
    ending_cash: list[float]


@dataclass(frozen=True)
class HistogramBlock:
    metric: Literal["annual_profit"]
    bin_edges: list[float]
    counts: list[int]


@dataclass(frozen=True)
class SensitivityItem:
    param: str
    coefficient: float
    rank: int


@dataclass(frozen=True)
class MetaBlock:
    engine_version: str
    iterations: int
    months: int
    seed: int
    compute_ms: float
    currency: str
    # Capacity economics echoed from engine constants (PRD FR-2 / 5.1).
    clients_per_head: int
    cost_per_head: float


@dataclass(frozen=True)
class SimulationResult:
    meta: MetaBlock
    annual: AnnualSummary
    months: list[MonthSnapshot]
    histogram: HistogramBlock
    sensitivity: list[SensitivityItem]
    insights: list[InsightItem]
