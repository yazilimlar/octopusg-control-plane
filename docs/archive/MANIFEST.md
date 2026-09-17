# Governance archive — manifest

Requirement: OG-GOV-006 · Work package: WP-01 · Verified 2026-09-17T15:07Z

This folder keeps the few Gate records OctopusG needs for provenance. Files here are
**byte-identical copies**; do not edit them. Everything else is recorded by location and
SHA-256 only. Authority order is unchanged: `docs/00-PRODUCT-CONSTITUTION.md` →
`docs/requirements/REQUIREMENTS.yaml` → `docs/09-ROADMAP.md` → ADRs. Nothing in this folder
overrides them.

Expected hashes come from S1 ("Control Plane completion") and `GATE_3B_COMPLETION.md`.
"Observed" values were computed on 2026-09-17 from files read through the Cowork bridge.

## Held in the repository

| Artifact | Repository path | Bytes | SHA-256 (observed) | Expected | Result | Role |
|---|---|---:|---|---|---|---|
| `PROJECT_REGISTRY_v1.6.yaml` | `data/PROJECT_REGISTRY_v1.6.yaml` | 71,450 | `494bd33e056350c15524a87fe73e9adc02bb6e8bfcd79ea4e801ec58f5b43286` | S1, GATE_3B_COMPLETION | MATCH | Authoritative registry at Gate 3B close; pinned by `data/registry.lock.json` |
| `GATE_3B_COMPLETION.md` | `docs/archive/gate-3b/GATE_3B_COMPLETION.md` | 4,020 | `af857c2ee727a46365527d4cbaadbff6654e710f6d523456a8a0a39528e01a1a` | S1 | MATCH | Verified Control Plane v0.1 completion record |
| `PRODUCT_BACKLOG.md` | `docs/archive/gate-3b/PRODUCT_BACKLOG.md` | 3,804 | `a0503632cdb0c81f616df806f00a1cfa90126e3a17223289549cd5386d2108a9` | S1 | MATCH | Historical backlog input; cited as source S5 |
| `portfolio_architecture_map_v1.html` | `docs/archive/portfolio_architecture_map_v1.html` | 19,069 | `4dec53cc57db28325355e98f3a4ad2437d61f57072ac7ba684f075a5118267ee` | S4 | MATCH | **Historical UX prototype — NOT authoritative system truth.** Reuse visual ideas only once the registry and graph drive the nodes |

Source copies were taken from `~/Desktop/artemis-website/` (file times 2026-09-16T15:50Z).

## Recorded by location only (not copied)

| Artifact | Location | Bytes | SHA-256 (observed) | Expected | Result | Why not copied |
|---|---|---:|---|---|---|---|
| `GATE_2C_2D_3_3B_ACTION_LOG.md` | `~/Desktop/artemis-website/GATE_2C_2D_3_3B_ACTION_LOG.md` | 28,426 | `7c785a5beb3d948390953101b7662e37df1987db06374519d3f618d34fb2b19d` | none recorded in S1 | FIRST RECORD | Reorganization-program action history, not OctopusG input; its substance is summarized in GATE_3B_COMPLETION.md |
| Gate 3B evidence directory | `~/Projects/_governance/gate3b/20260916T154601Z` | — | — | 27-entry manifest per GATE_3B_COMPLETION.md | NOT INSPECTED | Outside the granted folders; not needed for WP-01 |

## Git bundles (never copied into the repository)

| Bundle | Location | Bytes | SHA-256 (observed) | Heads | Result |
|---|---|---:|---|---|---|
| Control Plane v0.1 (frozen) | `~/Projects/_archives/2026-09-16/agoraxai-control-plane-6a4954fbb5b8-20260916T154601Z.bundle` | 98,716 | `a0efaf6396e7aa5c96e23daf789e32c5c0813893d47680a3b831dd60e70cd114` | `refs/heads/main` and `HEAD` → `6a4954fbb5b81bac67c26ee96b0b38231c057845` | MATCH (hash and size equal S1 and GATE_3B_COMPLETION; `git bundle verify` okay, complete history; cloned tree equals commit `6a4954f` in this repository) |
| OctopusG Block 0 | `~/Projects/_archives/2026-09-17/octopusg-block-0-d5f1c6b.bundle` (as reported by the owner) | — | — | expected `d5f1c6b2c53c1f34a9f7be7a049b48bd0c3f83e4` | **NOT FOUND** — at 2026-09-17T15:07Z `~/Projects/_archives/` contains only `2026-09-14/`, `2026-09-15/`, `2026-09-16/` and `artemis-test-legacy.bundle`; no `2026-09-17/` folder exists |

Both bundle locations are on the same disk as the repository. Neither is an off-machine
recovery copy, so OG-SEC-008 stays open (owner decision OD-02).

## PRODUCT_BACKLOG.md checked against the capability atlas

| Backlog item | OctopusG coverage |
|---|---|
| 1 · Control plane off a single disk | `platform-resilience` → OG-SEC-008 (open, OD-02) |
| 2 · Finish Pınar Evleri as a product | Portfolio product work, not OctopusG (OD-09: no extraction work in OctopusG) |
| 3 · Rebuild the Pınar decision-policy schema | Portfolio product work, not OctopusG |
| 4 · Live evidence instead of recorded evidence | `local-git-observation`, `truth-and-provenance` → OG-OBS-001, OG-DATA-001, OG-DATA-002 |
| 5 · One-command registry repoint | Partly met by OG-REG-002 (one lock file). The command itself was missing → **added** as CONCEPT `registry-repoint` / OG-REG-006 |
| 6 · Approval queue writes outcomes back to a governance record | Real approvals are OG-ACT-008; writing the outcome record was missing → **added** as CONCEPT `approval-outcome-records` / OG-ACT-009 |
| 7 · Retire two stale registry notes | Resolved inside registry v1.6 (both notes rewritten); nothing for OctopusG |
| 8 · Publish as a read-only static site | `cloud-control-plane` → OG-SEC-007 (unscheduled) |
| 9 · Ecosystem map derived from the registry | `system-maps` → OG-MAP-003, OG-MAP-004 |
| 10 · Supabase Phase A | Owner action outside OctopusG; `supabase-observation` → OG-CONN-015 covers later read-only metadata |
