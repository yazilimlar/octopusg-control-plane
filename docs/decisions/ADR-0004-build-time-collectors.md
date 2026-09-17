# ADR-0004 · v0.2 observations come from owner-run collectors, not a live server API

Status: **PROPOSED** · 2026-09-17

## Context
v0.1 serves a static bundle with `connect-src 'none'`, no browser network client, and an audit
that enforces both ([S4 Architecture as built](../sources/S4-2026-09-17-v0.1-repository-inspection.md#architecture-as-built)).
v0.2 needs local Git observation.

## Options
1. Add a local JSON API to `serve.mjs` and relax CSP. 2. Owner-run CLI writes observations to a
git-ignored file; the build inlines them. 3. Background daemon.

## Decision
Option 2. `npm run observe` → `work/observations/latest.json` → `npm run build`. The UI shows
`observed_at` and marks data stale after `expires_at`. The server and CSP are unchanged.

## Consequences
+ No new attack surface; audit rules unchanged. + Observation is always an explicit owner act.
− Data is only as fresh as the last run (made visible, not hidden). − Real-time inbox needs a
new ADR in v0.6.
