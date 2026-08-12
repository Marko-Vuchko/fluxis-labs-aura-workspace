# Security Policy

## Reporting a vulnerability

Please report security issues **privately**. Do not open a public GitHub issue, pull request, or discussion for a vulnerability.

**Preferred channel:** GitHub Private Vulnerability Reporting

https://github.com/Marko-Vuchko/fluxis-labs-aura-workspace/security/advisories/new

If that form is unavailable, email the maintainer through the GitHub profile of [Marko-Vuchko](https://github.com/Marko-Vuchko) and say that the message is a security report for Aura Workspace. Do not attach secrets, production `.env` files, or customer data unless we ask for a specific redacted sample.

Include:

- A short description of the issue and its impact
- Steps to reproduce, or a proof of concept that does not exploit third parties
- Affected URL, endpoint, or component if known
- Whether you believe the issue is already being exploited

## Scope

In scope:

- This repository (`Marko-Vuchko/fluxis-labs-aura-workspace`)
- The Next.js frontend (Vercel) and the FastAPI Monte Carlo backend (Render) as deployed from this repo
- Authentication of the server-to-server `X-Aura-Key` path, injection, SSRF against the backend URL, CSP bypass, secret leakage into the browser bundle, and abuse of `/api/simulate`

Out of scope:

- Denial of service against third-party infrastructure
- Findings that require physical access, a compromised Vercel/Render/GitHub account, or a already-stolen `AURA_API_SECRET`
- Social engineering
- Issues in upstream dependencies with no demonstrated impact on this app (report those to the upstream project)
- Missing security headers on local `next dev` (production headers are enforced in `proxy.ts`)

## Response timeline

| Stage | Target |
| --- | --- |
| Acknowledgement | within 2 business days |
| Initial severity assessment | within 5 business days |
| Status update | at least every 7 days until resolved or declined |
| Fix for critical / high issues | 7 days after we confirm the report, or a public advisory if a fix needs more time |
| Fix for medium / low issues | 30 days after confirmation |

We will credit reporters in the advisory if they want that. We will not pay a bug bounty; this project runs at 0 USD/month.

## Maintainer notes

- Rotate `AURA_API_SECRET` on both Render and Vercel if it may have leaked.
- GitHub secret scanning is expected to stay enabled on this public repository.
- Do not commit `.env`, `.env.local`, or any real API secret.
