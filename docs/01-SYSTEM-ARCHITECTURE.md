# 01 · System Architecture

Status: **PROPOSED** · 2026-09-17 · Decisions: [ADR-0002](decisions/ADR-0002-modular-monolith-first.md),
[ADR-0004](decisions/ADR-0004-build-time-collectors.md)

## 1. The five planes

The planes are **responsibilities**, not servers. Until an ADR says otherwise they are folders
in one application ([ADR-0002](decisions/ADR-0002-modular-monolith-first.md)).
Source: [S1 System architecture](sources/S1-2026-09-17-conversation-export.md#system-architecture),
[S2 Target planes](sources/S2-2026-09-17-gpt-planning-thread.md#target-planes).

```text
 ┌──────────────────────────── MANAGEMENT PLANE (what the owner sees) ─────────────────────────┐
 │  Catalog · Map · Connection Center · Devices · Inbox · Approvals · Workflows · KPIs · Audit │
 └───────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                             │ reads a read-model; submits action requests
 ┌──────────────────────────── CONTROL PLANE (what should be, and the rules) ──────────────────┐
 │  Registry · Relationship graph · Policy & approvals · Drift · Provenance · STATE STORE      │
 └───────────────┬───────────────────────────────────────────────────────────┬─────────────────┘
                 │ observations / events in                                   │ approved actions out
 ┌───────────────▼──────────── INTEGRATION PLANE ──────┐   ┌──────────────────▼──── EXECUTION PLANE ─┐
 │ Connectors: GitHub · Vercel · Tailscale · Gmail ·   │   │ Local agent · n8n · provider actions ·  │
 │ Squarespace · Supabase · ManyChat · Meta · WhatsApp │   │ scheduled monitors · approved migrations │
 │ Read + translate into Observations and Events       │   │ Does work; returns execution evidence   │
 └───────────────┬─────────────────────────────────────┘   └──────────────────┬──────────────────────┘
                 │ read                                                        │ change
 ┌───────────────▼─────────── DATA PLANE (the managed estate) ─────────────────▼───────────────────┐
 │ Artemis · AgoraXAI Atlas · DayOS · BidRoomLive · FCC · Prime Industrial ERP · ventures ·        │
 │ repositories · checkouts · deployments · domains · databases · accounts · mailboxes             │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Plane | Owns | Must not |
|---|---|---|
| **Management** | Screens, filters, drill-downs, the owner's approval gestures | Hold credentials; call providers directly |
| **Control** | Registry, graph, policy evaluation, drift, provenance, the **State Store** (OctopusG's own records: observations, events, action requests, approvals, audit) | Execute side effects |
| **Integration** | Connectors that *read* and *translate* provider data into Observations/Events | Mutate anything |
| **Execution** | Executors that *perform* approved actions and return evidence | Decide policy; act without an approved action ID |
| **Data** | Nothing in OctopusG — it is the portfolio itself (the "managed estate") | — |

### Terminology note

"Data Plane" here means **the managed estate** — the real products and services OctopusG
observes and, later, changes. It is *not* OctopusG's database; that is the **State Store**
inside the Control Plane ([S3 Plane terminology](sources/S3-2026-09-17-claude-review.md#plane-terminology)).
Both names are kept so the owner's vocabulary and industry usage line up.

**Do you need all five?** As concepts, yes: they give every future feature an obvious home and
an obvious boundary. As deployable services, no — v0.2 through at least v0.5 are one local
application.

## 2. Truth model

Every value shown carries one of five kinds ([S1](sources/S1-2026-09-17-conversation-export.md#truth-and-evidence-model)):

| Kind | Meaning | v0.1 mapping |
|---|---|---|
| declared | Intended configuration in the registry | `inferred` (intended) / registry fields |
| observed | Measured from a connected system or device, with `observed_at` | `observed` (registry-verified) |
| derived | Calculated from declared + observed (risk, drift, health) | `inferred` (heuristic) |
| approved | Action authorized by owner or policy | simulation only in v0.1 |
| executed | Action performed, with result and evidence | none |

`unknown` and `blocked` remain first-class states. v0.2 extends the v0.1 `EvidenceKind`
without renaming existing values (requirement OG-DATA-001).

## 3. v0.2 runtime (as it will be built)

```text
data/PROJECT_REGISTRY_v1.6.yaml ─┐
data/registry.lock.json ─────────┼─► scripts/import-registry.mjs (fail-closed) ─► data/snapshot.json
gate documents ──────────────────┘
config/observe.allowlist.json ─► scripts/observe.mjs (owner runs it; read-only git) ─► work/observations/latest.json
fixtures/events/*.json ─────────────────────────────────────────────────────────────► (simulated inbox)
                                          │
                                          ▼
                     esbuild bundle (read-model inlined) ─► scripts/serve.mjs on 127.0.0.1:4317
                                                            GET/HEAD only · CSP connect-src 'none'
```

Why a build-time collector and not a live API: v0.1's security posture (static server, no
browser network client, audit-enforced) is valuable and cheap to keep. Observations are
collected by an explicit owner command and baked into the next build
([ADR-0004](decisions/ADR-0004-build-time-collectors.md)). A live local API is deferred until
the event inbox needs it (v0.6).

## 4. Code layout

v0.1 files stay where they are. New code goes into plane folders; moving v0.1 files is a
separate, optional work package.

```text
src/
  main.ts  model.ts  workflow.ts  connectors.ts  style.css   ← v0.1 (unchanged paths)
  core/          control plane: registry lock, graph, provenance, policy, events
  connectors/    integration plane: contract + per-provider modules (all disabled in v0.2)
  executors/     execution plane: empty in v0.2 (open-folder CLI lives in scripts/)
  ui/            management plane: new views
scripts/         import, observe, open, validate-spec, build, serve, audit
config/          allowlists (no secrets, ever)
fixtures/        test and simulation inputs
docs/            this pack
```

## 5. Deployment topology

| Milestone | Where OctopusG runs | Reachable from |
|---|---|---|
| v0.1 – v0.5 | Owner's Mac, `127.0.0.1:4317` | That Mac only |
| v0.4+ (devices) | + Tailscale on Mac and personal Windows (installed manually) | Owner's tailnet |
| Cloud control plane | **Not decided.** Requires an ADR covering authentication, MFA, hosting, secrets and agent channel | — |

Company-owned laptops are never enrolled ([06](06-SECURITY-AND-APPROVALS.md#1-trust-zones)).

## 6. Relationship to existing v0.1 documents

[`ARCHITECTURE.md`](ARCHITECTURE.md), [`DATA_MODEL.md`](DATA_MODEL.md) and
[`CONNECTOR_PLAN_v0.2.md`](CONNECTOR_PLAN_v0.2.md) remain valid descriptions of v0.1 and of the
connector safety rules. Where they conflict with this pack, this pack wins; the v0.1 documents'
registry-version statements are stale ([S4 Stale documentation](sources/S4-2026-09-17-v0.1-repository-inspection.md#stale-documentation)).

---
George Oktem · New York · 2026 · IPC Resiliency Partners
