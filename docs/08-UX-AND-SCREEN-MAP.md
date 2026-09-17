# 08 · UX and Screen Map

Status: **PROPOSED** · v0.1 visual system (dark navy, teal accents, native controls, keyboard
access, reduced motion) is kept. Product name shown in the UI becomes **OctopusG** in v0.2.

## 1. Screens

| Screen | Purpose | v0.1 | v0.2 | Later |
|---|---|---|---|---|
| Portfolio (Catalog) | All products; search, filters, evidence drawer | ✓ | + resources per product, freshness badges, open actions | — |
| Matrix | Wide comparison table | ✓ | + observed branch/HEAD/dirty count columns | — |
| Map (Ecosystem) | Generated relationship graph | ✓ 18 nodes / 8 edges | typed resource nodes, lane layout, separate lifecycle vs risk encodings, view presets | deployment, domain, device, data-flow views (v0.3–v0.4) |
| Deployment drift | Source vs production SHA | ✓ | + declared-vs-observed path/HEAD drift | live Vercel data (v0.3) |
| Connection Center | Connector cards, levels, health | stubs | framework, all Level 0, lifecycle shown, no auth | real connections (v0.3+) |
| Devices | Enrolled devices and capabilities | — | Mac (declared) + trust-zone table | Tailscale status (v0.4), agent (v0.5) |
| Inbox | Normalized events | — | simulated from fixtures | real (v0.3 deployments, v0.6 webhooks, v0.7 mail) |
| Approvals | Action requests and decisions | simulation | + tier/level policy evaluation (still simulated) | real approvals (v0.10) |
| Workflows | n8n workflows | — | — | v0.6 |
| Timeline / Audit | Gate history, simulation log | ✓ | + observation runs | append-only audit (v0.6+) |
| KPIs | Registry calculations; unavailable metrics | ✓ | + freshness coverage KPI | sales/leads (v0.9) |
| Requirements | Spec status inside the app | — | read-only view of capabilities and requirement counts | — |

## 2. Card anatomy (Connection Center)

Provider · account label · associated products · level (0–4) · authentication type · granted
scopes · last successful sync · webhook health · credential status (never the value) · data
freshness · approved actions · owner actions (test, reconnect, pause, revoke — disabled in v0.2).
Source: [S2 Connection Center](sources/S2-2026-09-17-gpt-planning-thread.md#connection-center).

## 3. Map rules

- Nodes and edges come only from the graph; no hand-placed coordinates in data.
- Lanes: Owner/Entity · Products · Repositories & checkouts · Deployments & domains ·
  Services & accounts · Devices. Layout is computed.
- Color encodes **one** dimension at a time (a toggle chooses lifecycle, risk, or truth kind).
- Declared, observed and derived edges are visually distinct (solid, double, dashed).
- The historical [`portfolio_architecture_map_v1.html`](archive/portfolio_architecture_map_v1.html)
  is a visual reference only.

## 4. Safe open actions (v0.2)

| Action | Implementation | Why |
|---|---|---|
| Open website | Normal link, `rel="noopener noreferrer"`, only for registry URLs | Navigation is not a network call from the app |
| Open provider | Link to the provider dashboard URL recorded in the registry/connector definition | Same |
| Open folder | Show path + **Copy** button; `npm run open -- <product-id>` opens the allowlisted path in Finder | A web page cannot and should not open local folders |
