# Architecture — TrustLayer AI

Owners: Darsh + Teammate 4 · Status: frontend implemented (Phase 1); backend planned.

## System overview
```
Browser — Next.js (frontend/)
   │  HTTPS JSON  (POST /api/v1/analyze)
   ▼
FastAPI (backend/)                         ← not built yet
   ├── request validation + rate limiting
   ├── deterministic rules engine
   ├── Claude provider adapter (server-side key only)
   ├── Pydantic validation of model output
   ├── risk aggregation (RISK_RULES.md R1–R7)
   └── feedback / aggregate metrics (optional)
```
The browser never calls Claude directly. The backend owns the final risk decision.

## Frontend (Phase 1)
- Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4. Single route `/` (static).
- Data flow: `MessageForm` → `useAnalyzer` hook → `lib/analyzer.ts#analyzeMessage` →
  - `demo` mode (default): `lib/mock/mockAnalyzer.ts` — in-browser sample rules, ~900 ms delay,
    returns `analysis_mode: "demo"`.
  - `api` mode (`NEXT_PUBLIC_ANALYZER_MODE=api`): `fetch(NEXT_PUBLIC_API_BASE_URL + /api/v1/analyze)`.
- Response shape: `frontend/types/analysis.ts` ⇄ API_CONTRACT.md.
- Evidence highlighting: `lib/highlight.ts` finds each `finding.evidence` substring in the analysed text.
- Error preview for demos: append `?demoError=1` to the URL.

## Backend (Phase 3+, planned)
`backend/app/` — `main.py`, `api/` (routes), `core/` (config, logging), `models/`, `schemas/`
(Pydantic), `services/` (rules engine, aggregator, prompt builder, analyzer), `providers/` (Claude client).

## Deployment (planned)
Frontend on Vercel (`NEXT_PUBLIC_API_BASE_URL` → production API). API on Render / Fly.io with secrets in
the host dashboard. CORS allows only the deployed frontend origin.

## Decisions
| Date | Decision | Why |
|---|---|---|
| 2026-11-04 | No `src/` dir in frontend; page sections in `app/components/`, reusable parts in `components/` | Matches the agreed repo tree. |
| 2026-11-04 | Self-hosted fonts (`@fontsource-variable`) instead of `next/font/google` | Builds work offline / on restricted Wi-Fi. |
| 2026-11-04 | Inline SVG icon set instead of lucide-react; plain TS validation instead of RHF + Zod | Fewer dependencies for a one-form MVP; can be swapped later. |
| 2026-11-04 | Next.js 15.5.29 (patched backport) | Latest security fixes on the 15.x line. |
