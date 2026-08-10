# Aura Workspace backend

Monte Carlo simulation API for Aura Workspace. Python 3.11 on Render (`runtime.txt`); local development commonly uses 3.13.

## Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

On macOS / Linux:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

Set a shared secret (required for `/api/simulate`):

```powershell
$env:AURA_API_SECRET = "dev-secret"
$env:AURA_ENV = "development"
$env:AURA_ALLOWED_HOSTS = "localhost,127.0.0.1"
```

## Run

Start Uvicorn from the **repository root** so the `backend` package imports resolve:

```powershell
cd ..
.\backend\.venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000
```

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | none | Telemetry: status, engine version, uptime, NumPy warmup |
| `POST` | `/api/simulate` | header `X-Aura-Key` must match `AURA_API_SECRET` | Monte Carlo result package (PRD 6.2) |

Example simulate call:

```powershell
curl -s http://127.0.0.1:8000/api/simulate `
  -H "Content-Type: application/json" `
  -H "X-Aura-Key: dev-secret" `
  -d "{\"ad_spend\":8000,\"price\":149,\"team_size\":6,\"opex\":12000,\"cash_reserve\":120000}"
```

## Quality gates

From `backend/` with the venv active:

```powershell
ruff check .
pytest
```

## Environment

| Variable | Purpose |
| --- | --- |
| `AURA_API_SECRET` | Shared secret for `X-Aura-Key` |
| `AURA_ENV` | `production` disables `/docs`, `/redoc`, `/openapi.json` |
| `AURA_ALLOWED_HOSTS` | Comma-separated hosts for `TrustedHostMiddleware` |
| `AURA_MAX_CONCURRENT` | Global concurrent simulation cap (default `4`) |
