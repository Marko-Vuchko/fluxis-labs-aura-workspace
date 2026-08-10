"""Vectorized Monte Carlo engine for Aura Workspace SaaS simulation."""

from __future__ import annotations

import math
import time
from collections.abc import Callable
from typing import Final

import numpy as np
import pandas as pd

from backend.schemas import (
    AnnualSummary,
    HistogramBlock,
    InsightItem,
    MetaBlock,
    MonthSnapshot,
    RiskBlock,
    SensitivityItem,
    SimulationResult,
)

# ---------------------------------------------------------------------------
# PRD 5.1 engine constants
# ---------------------------------------------------------------------------
ITERATIONS = 1_000
MONTHS = 12
FIXED_SEED = 20260810
BASE_CPL = 45.0
CPL_SIGMA = 0.35
HALF_SATURATION = 15_000.0
REFERENCE_PRICE = 149.0
PRICE_ELASTICITY = 0.9
CONV_ALPHA, CONV_BETA = 2.0, 23.0
CLIENTS_PER_HEAD = 12
COST_PER_HEAD = 2_500.0
BASE_CHURN = 0.03
OVERLOAD_CHURN_FACTOR = 0.25
RISK_WEIGHTS = (0.40, 0.25, 0.20, 0.15)
HEALTH_WARN, HEALTH_CRIT = 70.0, 40.0

# ---------------------------------------------------------------------------
# PRD 6.1 default inputs
# ---------------------------------------------------------------------------
DEFAULT_AD_SPEND = 8_000.0
DEFAULT_PRICE = 149.0
DEFAULT_TEAM_SIZE = 6
DEFAULT_OPEX = 12_000.0
DEFAULT_CASH_RESERVE = 120_000.0

# ---------------------------------------------------------------------------
# Aggregation / output contract constants
# ---------------------------------------------------------------------------
ENGINE_VERSION: Final[str] = "1.0.0"
CURRENCY: Final[str] = "USD"
HISTOGRAM_BINS: Final[int] = 30
HISTOGRAM_METRIC: Final[str] = "annual_profit"
PERCENTILE_QS: Final[tuple[float, float, float]] = (0.10, 0.50, 0.90)
ROUND_DIGITS: Final[int] = 2
INSIGHT_LIMIT: Final[int] = 3
EPS: Final[float] = 1e-12

# Sensitivity: light multiplicative noise on levers inside the same pass (PRD 5.4)
SENSITIVITY_NOISE_SIGMA: Final[float] = 0.05
SENSITIVITY_PARAMS: Final[tuple[str, ...]] = (
    "ad_spend",
    "price",
    "team_size",
    "opex",
    "cash_reserve",
)
SENSITIVITY_FLOOR: Final[dict[str, float]] = {
    "ad_spend": 100.0,
    "price": 10.0,
    "team_size": 1.0,
    "opex": 100.0,
    "cash_reserve": 1_000.0,
}

# Node layout (PRD 5.5) - angles by NAME, never by array index
NODE_ORDER: Final[tuple[str, ...]] = (
    "marketing",
    "sales",
    "support",
    "operations",
    "profit",
    "churn",
    "cash_runway",
)
NODE_ANGLE_DEG: Final[dict[str, float]] = {
    "marketing": 0.0,
    "sales": 60.0,
    "support": 120.0,
    "churn": 180.0,
    "operations": 240.0,
    "cash_runway": 300.0,
}
RING_RADIUS: Final[float] = 1.0
PROFIT_HEIGHT: Final[float] = 1.2
DEG_TO_RAD: Final[float] = math.pi / 180.0

# Health mapping helpers
HEALTH_MIN: Final[float] = 0.0
HEALTH_MAX: Final[float] = 100.0
CONV_BASELINE: Final[float] = CONV_ALPHA / (CONV_ALPHA + CONV_BETA)
CAPACITY_SWEET_LOW: Final[float] = 0.55
CAPACITY_SWEET_HIGH: Final[float] = 0.85
CAPACITY_SWEET_CENTER: Final[float] = 0.70
REACH_OPTIMAL: Final[float] = DEFAULT_AD_SPEND / (DEFAULT_AD_SPEND + HALF_SATURATION)
REACH_HEALTH_SCALE: Final[float] = 0.35
CHURN_HEALTH_SCALE: Final[float] = 0.12
MARGIN_HEALTH_REF: Final[float] = 0.25
RUNWAY_HEALTH_REF_MONTHS: Final[float] = 12.0
SALES_PRICE_PENALTY_SCALE: Final[float] = 0.50

# Insight thresholds
CAP_BREACH_USED: Final[float] = 1.0
CAP_NEAR_USED: Final[float] = 0.85
CAP_UNDERUSED: Final[float] = 0.40
CAP_HIRE_USED: Final[float] = 0.90
CAP_OVERLOAD_CHURN_MULT: Final[float] = 1.5
PRICE_CONV_DROP_RATIO: Final[float] = 0.85
PRICE_MARGIN_THIN: Final[float] = 0.10
MKT_SATURATION_REACH: Final[float] = 0.50
MKT_EFFICIENT_REACH_LOW: Final[float] = 0.20
MKT_EFFICIENT_REACH_HIGH: Final[float] = 0.45
MKT_DEPENDENCY_COMPONENT: Final[float] = 0.35
MKT_UNDERSPEND_RATIO: Final[float] = 0.25
CASH_RUNWAY_CRITICAL_MONTHS: Final[float] = 3.0
CASH_RUNWAY_WARNING_MONTHS: Final[float] = 6.0
CASH_LOSS_PROB_WARN: Final[float] = 0.35
CASH_LOSS_PROB_CRIT: Final[float] = 0.55
CASH_BURN_COMPARE_MONTHS: Final[int] = 3
SEVERITY_ORDER: Final[dict[str, int]] = {"critical": 0, "warning": 1, "info": 2}


def _r2(value: float) -> float:
    return float(round(float(value), ROUND_DIGITS))


def _percentile_triple(series: pd.Series) -> list[float]:
    return [_r2(float(series.quantile(q))) for q in PERCENTILE_QS]


def _clip_health(value: float) -> float:
    return float(np.clip(value, HEALTH_MIN, HEALTH_MAX))


def _noise_vector(
    value: float,
    param: str,
    rng: np.random.Generator,
) -> np.ndarray:
    floor = SENSITIVITY_FLOOR[param]
    scale = max(abs(value), floor)
    return value + rng.normal(0.0, SENSITIVITY_NOISE_SIGMA * scale, ITERATIONS)


def _capacity_health(capacity_used: float) -> float:
    distance = abs(capacity_used - CAPACITY_SWEET_CENTER)
    span = max(CAPACITY_SWEET_CENTER - CAPACITY_SWEET_LOW, CAPACITY_SWEET_HIGH - CAPACITY_SWEET_CENTER)
    return _clip_health(HEALTH_MAX * (1.0 - distance / (span + EPS)))


def _node_xyz(name: str, health: float) -> list[float]:
    radius = (health / HEALTH_MAX) * RING_RADIUS
    if name == "profit":
        return [_r2(0.0), _r2((health / HEALTH_MAX) * PROFIT_HEIGHT), _r2(0.0)]
    angle = NODE_ANGLE_DEG[name] * DEG_TO_RAD
    return [
        _r2(radius * math.cos(angle)),
        _r2(0.0),
        _r2(radius * math.sin(angle)),
    ]


def _build_nodes(
    *,
    marketing_health: float,
    sales_health: float,
    support_health: float,
    operations_health: float,
    profit_health: float,
    churn_health: float,
    cash_health: float,
) -> list[list[float]]:
    health_by_name: dict[str, float] = {
        "marketing": marketing_health,
        "sales": sales_health,
        "support": support_health,
        "operations": operations_health,
        "profit": profit_health,
        "churn": churn_health,
        "cash_runway": cash_health,
    }
    nodes: list[list[float]] = []
    for name in NODE_ORDER:
        health = _r2(health_by_name[name])
        xyz = _node_xyz(name, health)
        nodes.append([health, xyz[0], xyz[1], xyz[2]])
    return nodes


def _pearson(x: np.ndarray, y: np.ndarray) -> float:
    x_c = x - x.mean()
    y_c = y - y.mean()
    denom = math.sqrt(float(np.dot(x_c, x_c) * np.dot(y_c, y_c)))
    if denom < EPS:
        return 0.0
    return float(np.dot(x_c, y_c) / denom)


def _runway_months(cash_p50: float, profit_p50: float) -> float | None:
    if profit_p50 >= 0.0:
        return None
    burn = abs(profit_p50)
    if burn < EPS:
        return None
    if cash_p50 <= 0.0:
        return _r2(0.0)
    return _r2(cash_p50 / burn)


def _month_healths(
    *,
    reach: float,
    price: float,
    conv_p50: float,
    capacity_used_p50: float,
    churn_p50: float,
    margin_p50: float,
    loss_prob: float,
    runway: float | None,
) -> tuple[float, float, float, float, float, float, float]:
    marketing = _clip_health(
        HEALTH_MAX * (1.0 - abs(reach - REACH_OPTIMAL) / (REACH_HEALTH_SCALE + EPS))
    )

    expected_conv = CONV_BASELINE * (REFERENCE_PRICE / max(price, EPS)) ** PRICE_ELASTICITY
    expected_conv = float(np.clip(expected_conv, 0.0, 1.0))
    conv_ratio = conv_p50 / (expected_conv + EPS)
    price_penalty = abs(price - REFERENCE_PRICE) / (REFERENCE_PRICE * SALES_PRICE_PENALTY_SCALE + EPS)
    sales = _clip_health(HEALTH_MAX * min(conv_ratio, 1.0) * (1.0 / (1.0 + price_penalty)))

    support = _capacity_health(capacity_used_p50)
    operations = _capacity_health(capacity_used_p50)

    profit = _clip_health(
        HEALTH_MAX
        * (
            0.5 * float(np.clip(margin_p50 / MARGIN_HEALTH_REF, 0.0, 1.0))
            + 0.5 * (1.0 - loss_prob)
        )
    )

    churn = _clip_health(
        HEALTH_MAX * (1.0 - max(0.0, churn_p50 - BASE_CHURN) / (CHURN_HEALTH_SCALE + EPS))
    )

    if runway is None:
        cash = HEALTH_MAX
    else:
        cash = _clip_health(HEALTH_MAX * (runway / RUNWAY_HEALTH_REF_MONTHS))

    return marketing, sales, support, operations, profit, churn, cash


def _risk_for_month(
    profit_col: np.ndarray,
    overload_col: np.ndarray,
    ad_spend_v: np.ndarray,
    costs_v: np.ndarray,
) -> RiskBlock:
    loss_prob = float(np.mean(profit_col < 0.0))
    mean_overload = float(np.mean(overload_col))
    overload_component = float(np.clip(mean_overload, 0.0, 1.0))

    mean_profit = float(np.mean(profit_col))
    std_profit = float(np.std(profit_col))
    if abs(mean_profit) < EPS:
        volatility = 1.0
    else:
        volatility = abs(std_profit / mean_profit)
    volatility_component = float(np.clip(volatility, 0.0, 1.0))

    ad_dependency = float(np.mean(ad_spend_v / np.maximum(costs_v, EPS)))
    ad_dependency = float(np.clip(ad_dependency, 0.0, 1.0))

    components = [
        loss_prob,
        overload_component,
        volatility_component,
        ad_dependency,
    ]
    score = 100.0 * (
        RISK_WEIGHTS[0] * components[0]
        + RISK_WEIGHTS[1] * components[1]
        + RISK_WEIGHTS[2] * components[2]
        + RISK_WEIGHTS[3] * components[3]
    )
    score = float(np.clip(score, 0.0, 100.0))
    return RiskBlock(
        score=_r2(score),
        components=[_r2(c) for c in components],
    )


# ---------------------------------------------------------------------------
# Insight catalog (PRD 6.4) - codes and params only, no prose
# ---------------------------------------------------------------------------
InsightFn = Callable[..., InsightItem | None]


def _insight_cap_breach(
    capacity_used: list[float],
    **_: object,
) -> InsightItem | None:
    peak = max(capacity_used)
    if peak <= CAP_BREACH_USED:
        return None
    month = int(np.argmax(capacity_used)) + 1
    return InsightItem(
        code="CAP_BREACH",
        severity="critical",
        params={"overload_pct": _r2((peak - 1.0) * 100.0), "month": month},
    )


def _insight_cap_near_limit(
    capacity_used: list[float],
    **_: object,
) -> InsightItem | None:
    peak = max(capacity_used)
    if peak <= CAP_NEAR_USED or peak > CAP_BREACH_USED:
        return None
    month = int(np.argmax(capacity_used)) + 1
    return InsightItem(
        code="CAP_NEAR_LIMIT",
        severity="warning",
        params={"capacity_used": _r2(peak), "month": month},
    )


def _insight_cap_underused(
    capacity_used: list[float],
    **_: object,
) -> InsightItem | None:
    mean_used = float(np.mean(capacity_used))
    if mean_used >= CAP_UNDERUSED:
        return None
    return InsightItem(
        code="CAP_UNDERUSED",
        severity="info",
        params={"capacity_used": _r2(mean_used)},
    )


def _insight_cap_hire_suggested(
    capacity_used: list[float],
    **_: object,
) -> InsightItem | None:
    peak = max(capacity_used)
    if peak < CAP_HIRE_USED:
        return None
    month = int(np.argmax(capacity_used)) + 1
    return InsightItem(
        code="CAP_HIRE_SUGGESTED",
        severity="warning",
        params={"capacity_used": _r2(peak), "month": month},
    )


def _insight_cap_churn_from_overload(
    churn_rates: list[float],
    capacity_used: list[float],
    **_: object,
) -> InsightItem | None:
    peak_churn = max(churn_rates)
    if peak_churn < BASE_CHURN * CAP_OVERLOAD_CHURN_MULT:
        return None
    if max(capacity_used) <= CAP_BREACH_USED:
        return None
    month = int(np.argmax(churn_rates)) + 1
    return InsightItem(
        code="CAP_CHURN_FROM_OVERLOAD",
        severity="warning",
        params={"churn_rate": _r2(peak_churn), "month": month},
    )


def _insight_price_above_reference(price: float, **_: object) -> InsightItem | None:
    if price <= REFERENCE_PRICE:
        return None
    return InsightItem(
        code="PRICE_ABOVE_REFERENCE",
        severity="info",
        params={"price": _r2(price), "reference": _r2(REFERENCE_PRICE)},
    )


def _insight_price_below_reference(price: float, **_: object) -> InsightItem | None:
    if price >= REFERENCE_PRICE:
        return None
    return InsightItem(
        code="PRICE_BELOW_REFERENCE",
        severity="info",
        params={"price": _r2(price), "reference": _r2(REFERENCE_PRICE)},
    )


def _insight_price_conversion_drop(price: float, conv_p50: float, **_: object) -> InsightItem | None:
    expected = CONV_BASELINE * (REFERENCE_PRICE / max(price, EPS)) ** PRICE_ELASTICITY
    baseline_at_ref = CONV_BASELINE
    if price <= REFERENCE_PRICE:
        return None
    if expected >= baseline_at_ref * PRICE_CONV_DROP_RATIO:
        return None
    return InsightItem(
        code="PRICE_CONVERSION_DROP",
        severity="warning",
        params={
            "price": _r2(price),
            "conv": _r2(conv_p50),
            "expected_conv": _r2(float(np.clip(expected, 0.0, 1.0))),
        },
    )


def _insight_price_margin_thin(margin_p50: float, **_: object) -> InsightItem | None:
    if margin_p50 >= PRICE_MARGIN_THIN:
        return None
    return InsightItem(
        code="PRICE_MARGIN_THIN",
        severity="warning",
        params={"margin": _r2(margin_p50)},
    )


def _insight_price_strongest_lever(
    sensitivity: list[SensitivityItem],
    **_: object,
) -> InsightItem | None:
    if not sensitivity or sensitivity[0].param != "price":
        return None
    top = sensitivity[0]
    return InsightItem(
        code="PRICE_STRONGEST_LEVER",
        severity="info",
        params={"coefficient": _r2(top.coefficient), "rank": top.rank},
    )


def _insight_mkt_saturation(reach: float, ad_spend: float, **_: object) -> InsightItem | None:
    if reach < MKT_SATURATION_REACH:
        return None
    return InsightItem(
        code="MKT_SATURATION",
        severity="warning",
        params={"reach": _r2(reach), "ad_spend": _r2(ad_spend)},
    )


def _insight_mkt_efficient(reach: float, **_: object) -> InsightItem | None:
    if reach < MKT_EFFICIENT_REACH_LOW or reach > MKT_EFFICIENT_REACH_HIGH:
        return None
    return InsightItem(
        code="MKT_EFFICIENT",
        severity="info",
        params={"reach": _r2(reach)},
    )


def _insight_mkt_dependency_high(
    risk_components_last: list[float],
    **_: object,
) -> InsightItem | None:
    ad_dep = risk_components_last[3]
    if ad_dep < MKT_DEPENDENCY_COMPONENT:
        return None
    return InsightItem(
        code="MKT_DEPENDENCY_HIGH",
        severity="warning",
        params={"ad_dependency": _r2(ad_dep)},
    )


def _insight_mkt_underspend(ad_spend: float, **_: object) -> InsightItem | None:
    if ad_spend >= HALF_SATURATION * MKT_UNDERSPEND_RATIO:
        return None
    return InsightItem(
        code="MKT_UNDERSPEND",
        severity="info",
        params={"ad_spend": _r2(ad_spend), "half_saturation": _r2(HALF_SATURATION)},
    )


def _insight_mkt_cac_above_ltv(
    ad_spend: float,
    new_customers_p50: float,
    price: float,
    churn_p50: float,
    **_: object,
) -> InsightItem | None:
    if new_customers_p50 < EPS:
        return None
    cac = ad_spend / new_customers_p50
    ltv = price / max(churn_p50, BASE_CHURN)
    if cac <= ltv:
        return None
    return InsightItem(
        code="MKT_CAC_ABOVE_LTV",
        severity="critical",
        params={"cac": _r2(cac), "ltv": _r2(ltv)},
    )


def _insight_cash_runway_critical(
    runway_last: float | None,
    **_: object,
) -> InsightItem | None:
    if runway_last is None or runway_last >= CASH_RUNWAY_CRITICAL_MONTHS:
        return None
    return InsightItem(
        code="CASH_RUNWAY_CRITICAL",
        severity="critical",
        params={"runway_months": _r2(runway_last)},
    )


def _insight_cash_runway_warning(
    runway_last: float | None,
    **_: object,
) -> InsightItem | None:
    if runway_last is None:
        return None
    if runway_last < CASH_RUNWAY_CRITICAL_MONTHS or runway_last >= CASH_RUNWAY_WARNING_MONTHS:
        return None
    return InsightItem(
        code="CASH_RUNWAY_WARNING",
        severity="warning",
        params={"runway_months": _r2(runway_last)},
    )


def _insight_cash_profitable(runway_last: float | None, **_: object) -> InsightItem | None:
    if runway_last is not None:
        return None
    return InsightItem(code="CASH_PROFITABLE", severity="info", params={})


def _insight_cash_burn_rising(
    profits_p50: list[float],
    **_: object,
) -> InsightItem | None:
    if len(profits_p50) < CASH_BURN_COMPARE_MONTHS * 2:
        return None
    early = float(np.mean(profits_p50[:CASH_BURN_COMPARE_MONTHS]))
    late = float(np.mean(profits_p50[-CASH_BURN_COMPARE_MONTHS:]))
    if early >= 0.0 or late >= early:
        return None
    return InsightItem(
        code="CASH_BURN_RISING",
        severity="warning",
        params={"early_profit": _r2(early), "late_profit": _r2(late)},
    )


def _insight_cash_loss_probability(
    loss_prob_last: float,
    **_: object,
) -> InsightItem | None:
    if loss_prob_last < CASH_LOSS_PROB_WARN:
        return None
    severity = "critical" if loss_prob_last >= CASH_LOSS_PROB_CRIT else "warning"
    return InsightItem(
        code="CASH_LOSS_PROBABILITY",
        severity=severity,
        params={"loss_probability": _r2(loss_prob_last)},
    )


def _insight_rec_top_lever(
    sensitivity: list[SensitivityItem],
    **_: object,
) -> InsightItem | None:
    if not sensitivity:
        return None
    top = sensitivity[0]
    return InsightItem(
        code="REC_TOP_LEVER",
        severity="info",
        params={
            "coefficient": _r2(top.coefficient),
            "rank": float(top.rank),
        },
    )


def _insight_rec_second_lever(
    sensitivity: list[SensitivityItem],
    **_: object,
) -> InsightItem | None:
    if len(sensitivity) < 2:
        return None
    second = sensitivity[1]
    return InsightItem(
        code="REC_SECOND_LEVER",
        severity="info",
        params={
            "coefficient": _r2(second.coefficient),
            "rank": float(second.rank),
        },
    )


INSIGHT_RULES: Final[tuple[InsightFn, ...]] = (
    _insight_cap_breach,
    _insight_cap_near_limit,
    _insight_cap_underused,
    _insight_cap_hire_suggested,
    _insight_cap_churn_from_overload,
    _insight_price_above_reference,
    _insight_price_below_reference,
    _insight_price_conversion_drop,
    _insight_price_margin_thin,
    _insight_price_strongest_lever,
    _insight_mkt_saturation,
    _insight_mkt_efficient,
    _insight_mkt_dependency_high,
    _insight_mkt_underspend,
    _insight_mkt_cac_above_ltv,
    _insight_cash_runway_critical,
    _insight_cash_runway_warning,
    _insight_cash_profitable,
    _insight_cash_burn_rising,
    _insight_cash_loss_probability,
    _insight_rec_top_lever,
    _insight_rec_second_lever,
)


def _select_insights(ctx: dict[str, object]) -> list[InsightItem]:
    fired: list[InsightItem] = []
    for rule in INSIGHT_RULES:
        item = rule(**ctx)
        if item is not None:
            fired.append(item)
    fired.sort(key=lambda i: (SEVERITY_ORDER[i.severity], i.code))
    return fired[:INSIGHT_LIMIT]


def simulate(
    ad_spend: float = DEFAULT_AD_SPEND,
    price: float = DEFAULT_PRICE,
    team_size: int = DEFAULT_TEAM_SIZE,
    opex: float = DEFAULT_OPEX,
    cash_reserve: float = DEFAULT_CASH_RESERVE,
    seed: int | None = None,
) -> SimulationResult:
    """Run a vectorized (ITERATIONS, MONTHS) Monte Carlo SaaS projection."""
    t0 = time.perf_counter()
    used_seed = FIXED_SEED if seed is None else int(seed)
    rng = np.random.default_rng(used_seed)

    ad_spend_v = _noise_vector(float(ad_spend), "ad_spend", rng)
    price_v = _noise_vector(float(price), "price", rng)
    team_size_v = np.maximum(_noise_vector(float(team_size), "team_size", rng), 1.0)
    opex_v = np.maximum(_noise_vector(float(opex), "opex", rng), 0.0)
    cash_reserve_v = _noise_vector(float(cash_reserve), "cash_reserve", rng)

    cpl = rng.lognormal(np.log(BASE_CPL), CPL_SIGMA, (ITERATIONS, MONTHS))
    reach_v = ad_spend_v / (ad_spend_v + HALF_SATURATION)
    leads = (ad_spend_v[:, None] / cpl) * reach_v[:, None]
    conv = np.clip(
        rng.beta(CONV_ALPHA, CONV_BETA, (ITERATIONS, MONTHS))
        * (REFERENCE_PRICE / np.maximum(price_v[:, None], EPS)) ** PRICE_ELASTICITY,
        0.0,
        1.0,
    )
    new_customers = leads * conv
    capacity = team_size_v * CLIENTS_PER_HEAD
    monthly_costs = ad_spend_v + opex_v + team_size_v * COST_PER_HEAD

    base = np.zeros(ITERATIONS, dtype=float)
    customers = np.zeros((ITERATIONS, MONTHS), dtype=float)
    churn_rate = np.zeros((ITERATIONS, MONTHS), dtype=float)
    overload = np.zeros((ITERATIONS, MONTHS), dtype=float)
    served = np.zeros((ITERATIONS, MONTHS), dtype=float)
    capacity_used = np.zeros((ITERATIONS, MONTHS), dtype=float)

    for month_idx in range(MONTHS):
        base = base + new_customers[:, month_idx]
        over = np.maximum(0.0, base / capacity - 1.0)
        churn = BASE_CHURN + over * OVERLOAD_CHURN_FACTOR
        serv = np.minimum(base, capacity)
        customers[:, month_idx] = base
        churn_rate[:, month_idx] = churn
        overload[:, month_idx] = over
        served[:, month_idx] = serv
        capacity_used[:, month_idx] = base / capacity
        base = base - churn * base

    revenue = served * price_v[:, None]
    profit = revenue - monthly_costs[:, None]
    cash = cash_reserve_v[:, None] + np.cumsum(profit, axis=1)

    annual_revenue = revenue.sum(axis=1)
    annual_profit = profit.sum(axis=1)
    annual_margin = annual_profit / np.maximum(annual_revenue, EPS)
    ending_cash = cash[:, -1]

    annual_df = pd.DataFrame(
        {
            "revenue": annual_revenue,
            "profit": annual_profit,
            "margin": annual_margin,
            "ending_cash": ending_cash,
        }
    )
    annual = AnnualSummary(
        revenue=_percentile_triple(annual_df["revenue"]),
        profit=_percentile_triple(annual_df["profit"]),
        margin=_percentile_triple(annual_df["margin"]),
        ending_cash=_percentile_triple(annual_df["ending_cash"]),
    )

    counts_arr, edges_arr = np.histogram(annual_profit, bins=HISTOGRAM_BINS)
    histogram = HistogramBlock(
        metric="annual_profit",
        bin_edges=[_r2(float(e)) for e in edges_arr],
        counts=[int(c) for c in counts_arr],
    )

    lever_values = {
        "ad_spend": ad_spend_v,
        "price": price_v,
        "team_size": team_size_v,
        "opex": opex_v,
        "cash_reserve": cash_reserve_v,
    }
    raw_sensitivity: list[tuple[str, float]] = []
    for param in SENSITIVITY_PARAMS:
        coef = _pearson(lever_values[param], annual_profit)
        raw_sensitivity.append((param, coef))
    raw_sensitivity.sort(key=lambda item: abs(item[1]), reverse=True)
    sensitivity = [
        SensitivityItem(param=param, coefficient=_r2(coef), rank=rank)
        for rank, (param, coef) in enumerate(raw_sensitivity, start=1)
    ]

    month_frames: list[MonthSnapshot] = []
    capacity_used_p50: list[float] = []
    churn_p50_list: list[float] = []
    profit_p50_list: list[float] = []
    conv_month_p50 = float(pd.Series(conv[:, -1]).quantile(0.50))
    new_cust_month_p50 = float(pd.Series(new_customers.mean(axis=1)).quantile(0.50))
    reach_nominal = float(ad_spend) / (float(ad_spend) + HALF_SATURATION)

    for month_idx in range(MONTHS):
        rev_s = pd.Series(revenue[:, month_idx])
        prof_s = pd.Series(profit[:, month_idx])
        cust_s = pd.Series(customers[:, month_idx])
        churn_s = pd.Series(churn_rate[:, month_idx])
        used_s = pd.Series(capacity_used[:, month_idx])
        cash_s = pd.Series(cash[:, month_idx])
        margin_s = prof_s / rev_s.replace(0.0, np.nan)

        rev_pct = _percentile_triple(rev_s)
        prof_pct = _percentile_triple(prof_s)
        margin_p50 = _r2(float(margin_s.quantile(0.50))) if margin_s.notna().any() else _r2(0.0)
        customers_p50 = _r2(float(cust_s.quantile(0.50)))
        churn_p50 = _r2(float(churn_s.quantile(0.50)))
        used_p50 = _r2(float(used_s.quantile(0.50)))
        cash_p50 = _r2(float(cash_s.quantile(0.50)))
        profit_p50 = prof_pct[1]
        runway = _runway_months(cash_p50, profit_p50)

        risk = _risk_for_month(
            profit[:, month_idx],
            overload[:, month_idx],
            ad_spend_v,
            monthly_costs,
        )

        mkt_h, sales_h, support_h, ops_h, profit_h, churn_h, cash_h = _month_healths(
            reach=reach_nominal,
            price=float(price),
            conv_p50=float(pd.Series(conv[:, month_idx]).quantile(0.50)),
            capacity_used_p50=used_p50,
            churn_p50=churn_p50,
            margin_p50=margin_p50,
            loss_prob=risk.components[0],
            runway=runway,
        )
        nodes = _build_nodes(
            marketing_health=mkt_h,
            sales_health=sales_h,
            support_health=support_h,
            operations_health=ops_h,
            profit_health=profit_h,
            churn_health=churn_h,
            cash_health=cash_h,
        )

        capacity_used_p50.append(used_p50)
        churn_p50_list.append(churn_p50)
        profit_p50_list.append(profit_p50)

        month_frames.append(
            MonthSnapshot(
                index=month_idx + 1,
                revenue=rev_pct,
                profit=prof_pct,
                margin=margin_p50,
                customers=customers_p50,
                churn_rate=churn_p50,
                capacity_used=used_p50,
                cash=cash_p50,
                runway_months=runway,
                risk=risk,
                nodes=nodes,
            )
        )

    insights = _select_insights(
        {
            "capacity_used": capacity_used_p50,
            "churn_rates": churn_p50_list,
            "price": float(price),
            "conv_p50": conv_month_p50,
            "margin_p50": month_frames[-1].margin,
            "sensitivity": sensitivity,
            "reach": reach_nominal,
            "ad_spend": float(ad_spend),
            "risk_components_last": month_frames[-1].risk.components,
            "new_customers_p50": new_cust_month_p50,
            "churn_p50": churn_p50_list[-1],
            "runway_last": month_frames[-1].runway_months,
            "profits_p50": profit_p50_list,
            "loss_prob_last": month_frames[-1].risk.components[0],
        }
    )

    compute_ms = _r2((time.perf_counter() - t0) * 1000.0)
    return SimulationResult(
        meta=MetaBlock(
            engine_version=ENGINE_VERSION,
            iterations=ITERATIONS,
            months=MONTHS,
            seed=used_seed,
            compute_ms=compute_ms,
            currency=CURRENCY,
        ),
        annual=annual,
        months=month_frames,
        histogram=histogram,
        sensitivity=sensitivity,
        insights=insights,
    )
