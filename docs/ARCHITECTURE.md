# Architecture · v0.1

## Boundary and data flow

```text
Supplied YAML + governance Markdown (read-only originals)
  → byte-identical copies under data/
  → scripts/import-registry.mjs (lock-pinned SHA-256, strict YAML / IDs / row-count checks)
  → data/snapshot.json (deterministic build artifact)
  → src/model.ts (normalization, provenance, scores, filters, graph, drift)
  → src/main.ts (eight views, accessible native controls)
  → esbuild static bundle
  → Node static server on 127.0.0.1 only

Browser simulation actions → pure transition reducer → browser localStorage
                                       └→ separately labelled simulation log

Disabled adapter.collect() → blocked Observation[] → displayed inspection result
                           → no network / filesystem / execution
```

## Components

| File | Responsibility |
|---|---|
| `src/model.ts` | Evidence facts; project normalization; risk rules; taxonomy; search/filter intersection; declared graph edges; SHA comparisons |
| `src/workflow.ts` | Sequential stage machine, notes, typed local simulation records and persisted-shape validation |
| `src/connectors.ts` | Shared read-only observation envelope and disabled adapters |
| `src/main.ts` | Portfolio, matrix, ecosystem SVG and evidence list, drift, queue, timeline, KPIs, connectors |
| `scripts/import-registry.mjs` | YAML syntax/identity checks, source hashing, inert checklist extraction |
| `scripts/build.mjs` | No framework environment discovery; uses esbuild directly |
| `scripts/serve.mjs` | Four-path static file allowlist, loopback binding, Host check, no write methods, strict CSP |
| `scripts/audit.mjs` | Deliverable-scoped credential-pattern scan and local-boundary checks |

The app uses TypeScript and native HTML controls. There are no React, Next.js, Vercel, Supabase or GitHub runtime packages. `yaml`, `esbuild`, TypeScript, Node types, and Playwright are build/test dependencies only. The served application has no third-party runtime or network dependency.

## State ownership

The registry is the sole source for observed portfolio state. Raw registry records are preserved; normalized display fields cite paths into the records. Lifecycle and evidence quality are distinct. A proposed operation is not inferred to be authorized from its presence in a report. Plain-text commands are escaped for display and are never passed to an interpreter.

Filters and graph focus are in-memory view state. The approval simulation alone is persisted to browser localStorage. No registry edit feature exists. The queue can only move through allowed edges; meaningful notes are mandatory. The app never identifies a simulated note as an authenticated decision.

The history list displays gate sequence when exact timestamps are missing; unknown event times remain unavailable. Numeric graph coordinates are layout values, not measurement data. Risk scores are a documented inference over source signals.

## UI and accessibility

A fixed desktop navigation, dark navy surfaces, teal status accents and restrained Octopus favicon form the visual system. Mobile navigation scrolls; cards collapse to one column. Wide matrices and the ecosystem canvas have intentional local scroll containers. Tables use semantic headers. Native `dialog` supplies focus trapping and Escape dismissal. SVG nodes support keyboard focus/Enter/Space, and select/list alternatives expose relationships without depending on geometry or color. Reduced-motion preferences disable animation.

## Isolation enforcement

The server binds `127.0.0.1`, never `0.0.0.0`. It rejects unrecognized Host values, limits requests to GET/HEAD, ignores filesystem paths supplied in requests, and serves four hardcoded paths only. No proxy, shell route, process-control API, sync loop, credential store or connector enable toggle exists.

HTTP headers enforce CSP (`default-src 'none'`, self-hosted assets only, `connect-src 'none'`, `form-action 'none'`, no frames), no sniffing, no referrer, and no cache. UI source URLs are displayed as inert evidence strings, never probed or embedded. No secrets or environment discovery is part of the build.

This is a local app, not a hardened multi-user service. LocalStorage and local files can be edited by their owner. Do not present its simulation history as an immutable audit trail. The provided credential scan detects selected token formats and is not a universal proof of absence.

## Extension seam

Adapters emit the observation envelope in `src/connectors.ts`. In v0.2 a separate local ingestion service would validate and redact observations, preserve the immutable registry baseline, and normalize selected observations into the same Fact/Project display model. A reducer must preserve provenance and indicate stale/error states instead of replacing them with success. The UI's fact badges, tables, drift comparisons, and evidence drawers can display this merged read model without redesign.

Enabling live connectors, changing CSP for a local ingestion API, adding real owner authentication, and providing execution are separate future scopes. None is implemented or implicitly authorized by the adapter stubs.
