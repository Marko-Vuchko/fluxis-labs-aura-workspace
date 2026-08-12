"""FastAPI simulation service for Aura Workspace."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
import math
import os
import time
from collections import deque
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import asdict
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from backend.engine import ENGINE_VERSION, simulate

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MAX_BODY_BYTES = 4 * 1024
# Behind the Vercel BFF, request.client.host is shared egress - not per visitor.
# Per-user limiting lives on the Next edge / WAF; this is a host overload guard.
OVERLOAD_LIMIT_REQUESTS = int(os.getenv("AURA_OVERLOAD_LIMIT", "300"))
OVERLOAD_LIMIT_WINDOW_S = 60.0
SEED_MIN = 0
SEED_MAX = 2_147_483_647
MAX_CONCURRENT = int(os.getenv("AURA_MAX_CONCURRENT", "4"))
AURA_ENV = os.getenv("AURA_ENV", "development").lower()
IS_PRODUCTION = AURA_ENV == "production"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("aura")

_started_at = time.perf_counter()
_numpy_warmup_ms = 0.0
_semaphore: asyncio.Semaphore | None = None
_overload_bucket: deque[float] = deque()
_overload_lock = asyncio.Lock()


def _allowed_hosts() -> list[str]:
    raw = os.getenv("AURA_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
    hosts = [h.strip() for h in raw.split(",") if h.strip()]
    if "testserver" not in hosts:
        hosts.append("testserver")
    return hosts


def _api_secret() -> str:
    return os.getenv("AURA_API_SECRET", "")


def _client_ip(request: Request) -> str:
    if request.client is None:
        return "unknown"
    return request.client.host


def _hash_ip(ip: str) -> str:
    material = f"{_api_secret()}:{ip}".encode()
    return hashlib.sha256(material).hexdigest()[:16]


def _sanitize_for_json(value: Any) -> Any:
    """Replace non-finite floats so 422 bodies stay JSON-compliant."""
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if isinstance(value, dict):
        return {key: _sanitize_for_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_sanitize_for_json(item) for item in value]
    return value


# ---------------------------------------------------------------------------
# Request model (PRD 6.1)
# ---------------------------------------------------------------------------
class SimulationRequest(BaseModel):
    """Validated simulation levers. Unknown fields and non-finite floats are rejected."""

    model_config = ConfigDict(extra="forbid")

    ad_spend: float = Field(default=8_000.0, ge=0, le=50_000, allow_inf_nan=False)
    price: float = Field(default=149.0, ge=10, le=2_000, allow_inf_nan=False)
    team_size: int = Field(default=6, ge=1, le=50)
    opex: float = Field(default=12_000.0, ge=0, le=100_000, allow_inf_nan=False)
    cash_reserve: float = Field(default=120_000.0, ge=0, le=500_000, allow_inf_nan=False)
    seed: int | None = Field(default=None, ge=SEED_MIN, le=SEED_MAX)

    @field_validator("ad_spend", "price", "opex", "cash_reserve", mode="after")
    @classmethod
    def _reject_non_finite(cls, value: float) -> float:
        if not math.isfinite(value):
            raise ValueError("must be a finite number")
        return value


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject bodies larger than 4 KB before application parsing."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                length = int(content_length)
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Invalid Content-Length"},
                )
            if length > MAX_BODY_BYTES:
                return JSONResponse(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    content={"detail": "Request body too large"},
                )

        if request.method in {"POST", "PUT", "PATCH"}:
            body = await request.body()
            if len(body) > MAX_BODY_BYTES:
                return JSONResponse(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    content={"detail": "Request body too large"},
                )

        return await call_next(request)


class OverloadGuardMiddleware(BaseHTTPMiddleware):
    """Global sliding window to protect the host when traffic arrives via one BFF IP."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        now = time.monotonic()
        async with _overload_lock:
            while (
                _overload_bucket
                and (now - _overload_bucket[0]) > OVERLOAD_LIMIT_WINDOW_S
            ):
                _overload_bucket.popleft()
            if len(_overload_bucket) >= OVERLOAD_LIMIT_REQUESTS:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Service overloaded"},
                )
            _overload_bucket.append(now)
        return await call_next(request)


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    global _numpy_warmup_ms, _semaphore
    _semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    t0 = time.perf_counter()
    await asyncio.to_thread(simulate)
    _numpy_warmup_ms = round((time.perf_counter() - t0) * 1000.0, 1)
    logger.info("numpy_warmup_ms=%s", _numpy_warmup_ms)
    yield


app = FastAPI(
    title="Aura Workspace",
    version=ENGINE_VERSION,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    lifespan=lifespan,
)

# Middleware order: last added runs first on the request path.
app.add_middleware(GZipMiddleware, minimum_size=256)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts())
app.add_middleware(OverloadGuardMiddleware)
app.add_middleware(BodySizeLimitMiddleware)

if not IS_PRODUCTION:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Aura-Key"],
    )


# ---------------------------------------------------------------------------
# Security dependencies and handlers
# ---------------------------------------------------------------------------
async def require_api_key(
    x_aura_key: str | None = Header(default=None, alias="X-Aura-Key"),
) -> None:
    secret = _api_secret()
    provided = x_aura_key or ""
    # Constant-time compare; reject empty configured secret in all environments.
    if not secret or not hmac.compare_digest(provided, secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )


def _validation_client_detail(exc: RequestValidationError) -> dict[str, str]:
    """Log full validator output server-side; return a generic client body."""
    logger.info(
        "validation_rejected errors=%s",
        _sanitize_for_json(jsonable_encoder(exc.errors())),
    )
    return {"detail": "Invalid request"}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=_validation_client_detail(exc),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    _request: Request,
    exc: Exception,
) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_validation_client_detail(exc),
        )
    logger.exception("unhandled_error type=%s", type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ---------------------------------------------------------------------------
# Routes (PRD 6.2 / 6.3)
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "engine_version": ENGINE_VERSION,
        "uptime_s": round(time.perf_counter() - _started_at, 1),
        "numpy_warmup_ms": _numpy_warmup_ms,
    }


@app.post("/api/simulate")
async def api_simulate(
    payload: SimulationRequest,
    request: Request,
    _: None = Depends(require_api_key),
) -> dict[str, Any]:
    if _semaphore is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service starting",
        )

    async with _semaphore:
        result = await asyncio.to_thread(
            simulate,
            payload.ad_spend,
            payload.price,
            payload.team_size,
            payload.opex,
            payload.cash_reserve,
            payload.seed,
        )

    risk_score = result.months[-1].risk.score if result.months else None
    logger.info(
        "simulate ip_hash=%s compute_ms=%s risk_score=%s seed=%s",
        _hash_ip(_client_ip(request)),
        result.meta.compute_ms,
        risk_score,
        result.meta.seed,
    )
    return asdict(result)
