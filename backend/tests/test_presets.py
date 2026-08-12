"""Lock calibrated Control Deck presets to their staged engine outcomes."""

from __future__ import annotations

from backend.engine import FIXED_SEED, HEALTH_CRIT, HEALTH_WARN, simulate

# Keep in sync with features/simulation/presets.ts
PRESETS: dict[str, dict[str, float | int]] = {
    "bootstrap": {
        "ad_spend": 15_000,
        "price": 2_000,
        "team_size": 2,
        "opex": 0,
        "cash_reserve": 60_000,
    },
    "growth_push": {
        "ad_spend": 30_000,
        "price": 2_000,
        "team_size": 4,
        "opex": 0,
        "cash_reserve": 100_000,
    },
    "overload_crisis": {
        "ad_spend": 40_000,
        "price": 149,
        "team_size": 2,
        "opex": 5_000,
        "cash_reserve": 40_000,
    },
    "optimized": {
        "ad_spend": 8_000,
        "price": 149,
        "team_size": 6,
        "opex": 0,
        "cash_reserve": 250_000,
    },
}

SUPPORT_INDEX = 2


def _band(health: float) -> str:
    if health > HEALTH_WARN:
        return "green"
    if health >= HEALTH_CRIT:
        return "yellow"
    return "red"


def _month12(params: dict[str, float | int]):
    result = simulate(**params, seed=FIXED_SEED)
    return result, result.months[11]


def test_bootstrap_profitable_yellow_modest() -> None:
    """Bootstrap: cash-flow positive, at least one yellow node, modest scale."""
    _result, month = _month12(PRESETS["bootstrap"])
    healths = [node[0] for node in month.nodes]
    bands = [_band(h) for h in healths]

    assert month.runway_months is None
    assert month.profit[1] >= 0
    assert "yellow" in bands
    assert month.customers < 25
    assert month.capacity_used < 1.0


def test_growth_push_high_revenue_orange_support() -> None:
    """Growth Push: high revenue with orange Support node."""
    result, month = _month12(PRESETS["growth_push"])
    support_health = month.nodes[SUPPORT_INDEX][0]

    assert result.annual.revenue[1] > 300_000
    assert _band(support_health) == "yellow"
    assert month.runway_months is None


def test_overload_crisis_red_nodes_and_breach() -> None:
    """Overload Crisis: capacity breached and majority of nodes critical."""
    _result, month = _month12(PRESETS["overload_crisis"])
    healths = [node[0] for node in month.nodes]
    red_count = sum(1 for h in healths if _band(h) == "red")

    assert month.capacity_used > 1.2
    assert red_count >= 5
    assert month.churn_rate > 0.03


def test_optimized_mostly_green() -> None:
    """Optimized: almost all nodes stable green."""
    _result, month = _month12(PRESETS["optimized"])
    healths = [node[0] for node in month.nodes]
    green_count = sum(1 for h in healths if _band(h) == "green")

    assert green_count >= 5
    assert month.capacity_used < 1.0
    assert month.capacity_used > 0.5
