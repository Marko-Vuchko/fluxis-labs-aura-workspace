# Deploy runbook (vlasnik naloga)

Agent **ne** kreira Render servis, **ne** postavlja produkcione tajne, **ne** pokreće Vercel deploy i **ne** objavljuje WAF pravila. Ovaj dokument je redosled za vlasnika.

Repozitorijum: `Marko-Vuchko/fluxis-labs-aura-workspace` (javan). Vidljivost se ne menja.

## 0. Preduslovi

- GitHub nalog `Marko-Vuchko` ima pravo upisa u repo
- Render nalog (Free) i Vercel nalog (Hobby je dovoljan za hosting; WAF custom rules zavise od plana naloga)
- Lokalno: `vercel` CLI ulogovan, repo povezan sa Vercel projektom (`vercel link`) kada dođeš do WAF koraka

## 1. Render servis (backend)

Blueprint je `render.yaml` u korenu. Python 3.13 je zapisan u `backend/runtime.txt` (`python-3.13`); Blueprint to ogledava kao `PYTHON_VERSION=3.13.5` jer Render na native runtime-u čita tu env varijablu, ne ugnježdeni `runtime.txt`. NumPy 2.5 ne radi na 3.11.

### Opcija A: Blueprint (preporučeno)

1. Otvori [Render Dashboard](https://dashboard.render.com/) -> New -> Blueprint.
2. Poveži GitHub repo `Marko-Vuchko/fluxis-labs-aura-workspace`.
3. Potvrdi da Render vidi `render.yaml`.
4. Region mora ostati **Frankfurt** (polje je nepromenljivo posle kreiranja).
5. Apply Blueprint. Servis se zove `aura-workspace-api`, plan `free`.
6. Sačekaj prvi deploy. Health check ide na `GET /health`.
7. Otvori Environment i **iskopiraj** generisanu vrednost `AURA_API_SECRET`. Trebaće ti na Vercelu. Nemoj je commitovati.
8. Ako Render dodeli drugi hostname od `aura-workspace-api.onrender.com`, ažuriraj `AURA_ALLOWED_HOSTS` na taj host (bez `https://`).

### Opcija B: ručno

1. New -> Web Service, isti repo, runtime Python.
2. Region: Frankfurt. Instance: Free.
3. Build: `pip install -r backend/requirements.txt`
4. Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 4`
5. Health check path: `/health`
6. Env:

| Key | Value |
| --- | --- |
| `PYTHON_VERSION` | `3.13.5` (ogledalo `backend/runtime.txt`) |
| `AURA_ENV` | `production` |
| `AURA_API_SECRET` | jaka slučajna tajna (Render Generate) |
| `AURA_ALLOWED_HOSTS` | hostname servisa, npr. `aura-workspace-api.onrender.com` |
| `AURA_MAX_CONCURRENT` | `4` |

Start komanda ostaje **jedan** Uvicorn worker. Konkurentnost je ograničena i flagom `--limit-concurrency 4` i `AURA_MAX_CONCURRENT`.

### Provera Rendera

```bash
curl -sS https://aura-workspace-api.onrender.com/health
```

Očekuj JSON telemetriju, ne HTML. `/api/simulate` bez `X-Aura-Key` mora da padne. Ne izlaži taj URL u frontend kod.

Free instanca može da zaspi (cold start do ~60 s). To je očekivano; Boot Screen na frontendu to pokriva.

## 2. Vercel env varijable (frontend)

Importuj isti GitHub repo u Vercel. Varijable su **server-only**. Nijedna ne sme da ima prefiks `NEXT_PUBLIC_` osim opcionog `NEXT_PUBLIC_SITE_URL` za kanonski URL.

U Vercel Dashboard -> Project -> Settings -> Environment Variables, za **Production** i **Preview**:

| Key | Value | Notes |
| --- | --- | --- |
| `AURA_API_URL` | `https://aura-workspace-api.onrender.com` | bez trailing slash; isti host kao Render |
| `AURA_API_SECRET` | ista vrednost kao na Renderu | nikad u git, nikad `NEXT_PUBLIC_` |
| `AURA_API_URL_ALLOWED_HOSTS` | `aura-workspace-api.onrender.com` | opciono; SSRF allowlist za `AURA_API_URL`. Default je isti Render host. Ako Render dodeli drugi hostname, upiši ga ovde. |
| `NEXT_PUBLIC_SITE_URL` | produkcioni origin, npr. `https://<project>.vercel.app` | opciono, za metadata |

Development može da ostane na `.env.local` (`http://127.0.0.1:8000` + lokalni secret).

Posle upisa varijabli uradi **Redeploy** Production (vlasnik). Agent ne pokreće deploy.

BotID na `basic` nivou za `/api/simulate` podesi u Vercel projektu ako već nije uključen iz koda.

## 3. Redosled publish-ovanja WAF pravila

Komande su u [WAF.md](WAF.md). Ovde je samo redosled. Svaki `publish` radi vlasnik.

1. `vercel link` u korenu repo-a, ako već nije povezano.
2. Dodaj tri pravila, svako sa `--action log` (rate limit na `/api`, exploit sonde, nekorišćene HTTP metode).
3. `vercel firewall diff` - proveri da draft nema `deny` na širokim path-ovima.
4. `vercel firewall publish --yes` - log faza ide u produkciju, niko se ne blokira.
5. Otvori Firewall traffic view za svaki `ruleId`. Potvrdi da nema pogotaka od pravog UI toka (boot, slajderi, preseti).
6. Prebaci exploit sonde i nekorišćene metode na `deny` **samo u preview**, pa `publish`. Proveri preview URL.
7. Prebaci ista dva pravila na `deny` u produkciji, pa `publish`.
8. Rate limit: prvo `--action rate_limit` sa `--rate-limit-action log`, `publish`, pa tek onda `--rate-limit-action rate_limit`.
9. Attack Challenge Mode je hitan prekidač, nije deo ovog redosleda. Vidi runbook u [WAF.md](WAF.md).

Ako bilo koji korak pogodi prave korisnike, vrati to pravilo na `--action log` i ponovo `publish`. Nemoj `force` push, nemoj menjati vidljivost repozitorijuma, nemoj dirati zaštitu `main` grane.

## 4. Posle go-live checklista

- [ ] `GET /health` na Renderu prolazi
- [ ] Vercel `/api/health` vraća isti backend status (ne 5xx posle cold starta)
- [ ] Network tab na produkciji pokazuje CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options` / `frame-ancestors`
- [ ] U bundle-u nema `AURA_API_URL` ni `AURA_API_SECRET`
- [ ] GitHub Settings -> Code security: secret scanning uključen; Dependabot već ima `.github/dependabot.yml`
- [ ] Branch protection na `main`: required checks iz `.github/workflows/ci.yml` (Python + Node)
