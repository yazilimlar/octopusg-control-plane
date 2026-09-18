# Next vertical slice — read-only Artemis DayOS monitoring

Status: **specification only — not implemented**. Written 2026-09-18 per the owner's v0.3
platform-foundation direction
([S7](sources/S7-2026-09-18-owner-v03-platform-foundation-authorization.md)), which explicitly
authorized writing this slice and explicitly excluded building it in the same session.

This document specializes the existing, already-ledgered **OG-CONN-015** ("Supabase read-only
metadata," `v0.9`, `acceptance_provisional: true`) for the specific `dayos` registry product,
rather than proposing a new requirement — OG-CONN-015 already covers this shape of work and its
acceptance criteria are marked provisional precisely so a concrete slice like this one can fill
them in when the block starts.

## Why DayOS, and why this is "next"

`dayos` is a registered product (`data/PROJECT_REGISTRY_v1.6.yaml`, `category: PRODUCT`,
`lifecycle: ACTIVE_DEVELOPMENT`) with a dedicated Supabase schema and five identified migration
files under `supabase/migrations/`. It is the only product in the pinned registry with enough
structured, already-inventoried backend evidence (schema name, migration file list, object
inventory) to make a **read-only** monitoring slice concrete rather than speculative — the registry
already did the discovery work; this slice only proposes surfacing it through OctopusG's existing
truth model instead of a static document.

## Scope (read-only, declared-vs-observed, no write path)

**In:**
- A new declared resource kind (or an extension of the existing typed graph, `src/resources.ts`)
  representing the `dayos` Supabase project: schema name, migration file inventory, and
  object counts already captured in the registry — as **declared** truth, exactly as v0.1/v0.2
  treat every other registry-sourced fact.
- A read-only Supabase observation collector, gated the same way the local Git observer is gated
  in WP-03: an explicit allowlist entry (one project, one connection string label — never the
  string itself), owner-run, local, and refusing anything outside its declared scope.
- Drift comparison: declared migration inventory (from the registry) vs. observed migration table
  state (from the collector) — same `unknown`-until-observed, `stale`-if-old, never-invents-a-match
  discipline as `src/truth.ts` already enforces for Git observation (WP-02, WP-03).
- A Connection Center entry for a Supabase connector at Level 0 initially (OG-CONN-002/003 already
  define the framework this slot fits into), raised to Level 1 (observed) only through a G3
  Connector Authorization, per ADR-0003.

**Out (unchanged from OG-CONN-015's existing acceptance criterion):**
- No rows, no query results, no function bodies, no credentials — schema and migration inventory
  only, owner-reviewed and sanitized before it is ever rendered.
- No write, no migration execution, no schema change from OctopusG.
- No other DayOS surface (its own app, its own deploys, its own domain) — this slice is about the
  Supabase backend only, not "DayOS monitoring" in general.

## Preconditions this slice is blocked on

Per OG-CONN-015's existing `dependencies: [OG-SEC-003]` (credential store) and OD-04 ("no
credential store is selected in v0.2 ... credential handling stays blocked until immediately before
the first approved real connector"), this slice cannot start until:

1. A credential store is chosen and implemented (OG-SEC-003, OG-SEC-004) — still `PLANNED`.
2. The owner runs Connector Authorization (G3) for this specific Supabase project: exact project
   ref, exact scopes (read-only), and the max level it may reach.
3. A Supabase-specific ADR, per OD-03: "any real connector needs its own v0.3 connector-specific
   ADR and owner approval."

None of these preconditions were addressed in this session. This document is scope and design
only, so that when the owner chooses to pull this slice forward (it is currently ledgered at
`v0.9`; the roadmap's block ordering is an owner/roadmap decision this document does not make),
the next session has an exact starting point instead of a blank one.

## Suggested acceptance criteria (to replace OG-CONN-015's `acceptance_provisional`)

- Declared migration inventory for `dayos` is rendered from the registry, unchanged from today.
- An owner-run, local, read-only Supabase collector produces schema/migration-table observations
  and writes them through the same `work/observations/latest.json` mechanism WP-03 already
  established for Git — no new persistence pattern.
- Drift between declared and observed migration state is shown using the existing five-kind truth
  model (`declared` / `observed` / `derived` / `unknown` / `blocked`) — no new truth kind.
- The connector is defined at Level 0 by default, exactly like every other connector in
  `config/connectors.json` today, and raising it requires the same `canRaiseLevel` + `maxLevel`
  mechanism WP-07 built.
- No credential value, connection string, or row-level data ever appears in the UI, in
  `data/requirements.json`, or in any committed file — verified by extending `scripts/audit.mjs`'s
  existing pattern scan, not by a new mechanism.

## Open question for the owner

Whether to pull this slice forward from `v0.9` to sit alongside the other v0.3 connector work
(Vercel/GitHub read-only), given that the registry evidence for `dayos` is unusually complete
already. This document takes no position — it is a roadmap-ordering decision, not an
implementation one.
