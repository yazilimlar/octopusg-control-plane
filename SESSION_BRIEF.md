# Session brief — OctopusG

Read this first in every AI session. Keep it under one page.

## Where we are

- Repository `~/Projects/agoraxai/control-plane`, **no remote**. `main` = `6a4954f` (Control
  Plane v0.1). Block 0 (architecture pack) is `d5f1c6b` on `octopusg/block-0`, **approved by the
  owner as the versioned working baseline (Gate G1), amendable through ADRs**. WP-01 is on
  `octopusg/wp-01-registry-lock`, branched from Block 0.
- The app pins registry **v1.6** (18 rows) through `data/registry.lock.json`; v1.5.1 stays in
  `data/` as history. Evidence: [WP-01](docs/evidence/WP-01.md).
- WP-02 added the five-kind truth model and the local observation store (`src/truth.ts`,
  `snapshot.observations`) on `octopusg/wp-02-truth-model` and is **accepted by the owner at
  Gate G2** (`d1b8f8b`). Evidence: [WP-02](docs/evidence/WP-02.md).
- WP-03 added the owner-run local Git observer (`npm run observe`), the declared device record
  and the trust-zone / tier / level policy and is **accepted by the owner at Gate G4**
  (`e26d4ad`). Evidence: [WP-03](docs/evidence/WP-03.md).
- Batch A is on `octopusg/batch-a-catalog-graph`: WP-04 adds the typed resource catalog and
  graph (`src/resources.ts`, `config/entities.json`). OD-05 is resolved — Great Order LLC exists
  as owner-confirmed declared data and owns nothing that is not separately declared.
  Evidence: [WP-04](docs/evidence/WP-04.md). WP-05 then generated the lane-layout map with
  colour-by and preset controls (`src/graphview.ts`). Evidence: [WP-05](docs/evidence/WP-05.md).
  **Batch A is accepted by the owner**; its five requirements are VERIFIED.
- Batch B is on `octopusg/batch-b-status-devices`: WP-06 adds declared-versus-observed drift,
  truth and freshness badges and the visible OctopusG naming (OD-08: UI text only — the schema
  constant and the `agoraxai.octopus.workflow.v1` key are unchanged).
  Evidence: [WP-06](docs/evidence/WP-06.md). WP-10 then added the Devices and Requirements views
  (declared records only; the ledger projected into `data/requirements.json` at build time).
  Evidence: [WP-10](docs/evidence/WP-10.md).
- The WP-03 macOS path repair is `b86a0ff` on `octopusg/fix-observer-macos-paths`, **imported and
  validated by the owner on the Mac** (94/94, audit PASS). Evidence:
  [WP-03-REPAIR-01](docs/evidence/WP-03-REPAIR-01.md).
- Batch C is on `octopusg/batch-c-connections-events`: WP-07 adds the connector contract
  (`src/connections.ts`, `config/connectors.json`) and the Connection Center — every connector
  defined, every connection at **level 0 (Registered)**, every owner action visible but disabled
  with its reason, and the `maxLevel` ceiling enforced by the loader, by `canRaiseLevel` and by
  the committed file. Evidence: [WP-07](docs/evidence/WP-07.md).
  WP-08 then added the docs/05 event envelope and the simulated inbox (`src/events.ts`,
  `fixtures/events/*.json`): every row labelled SIMULATED, none countable, status changes
  appended rather than edited, duplicate deliveries removed on `(connector, provider_event_id)`.
  Evidence: [WP-08](docs/evidence/WP-08.md).
- Batch C is accepted by the owner (`bc5665a`, validated on the Mac); OG-CONN-002, OG-CONN-003,
  OG-EVT-001 and OG-EVT-002 are IMPLEMENTED and await the gate.
- The final v0.2 batch is on `octopusg/batch-d-actions-acceptance`: WP-09 adds the safe open
  actions (`src/open.ts`, `npm run open -- <product-id>`) and the tier/level action request with
  the seven-field docs/06 §3 record (`src/actions.ts`). No declared trust zone permits T3 or T4,
  and nothing in the repository can execute an action. Evidence: [WP-09](docs/evidence/WP-09.md).
  WP-11 then closed the batch with the v0.2 acceptance record: `npm run validate:spec` now
  enforces that every finished work package has a record naming its requirements, the commands
  run, their results and its **open questions**, and all eleven records meet it.
  Evidence: [WP-11](docs/evidence/WP-11.md).
- **At the gate:** 16 v0.2 requirements are IMPLEMENTED and awaiting the owner. `OG-SEC-008`
  (OD-02, off-machine recovery copy) is the one v0.2 requirement that cannot close without an
  owner decision, and `platform-resilience` stays PLANNED because of it.
- WP-12 implemented the brand (`octopusg/wp-brand-og-ui-007`). The owner resolved the authoritative
  file, the provenance and use authorization, and the tagline
  ([S6](docs/sources/S6-2026-09-18-owner-brand-decisions.md),
  [ADR-0006](docs/decisions/ADR-0006-brand-asset-and-tagline.md)), so **OG-UI-007 is v0.2 and
  IMPLEMENTED**. The owner's PNG is the master in `assets/brand/`, byte for byte; three
  metadata-free derivatives are served from `public/brand/`; the tagline is
  *Architect-Engineer of Complex Systems*. `validate:spec` now finishes with **zero warnings**.
  Evidence: [WP-12](docs/evidence/WP-12.md).
- v0.2 gate positions recorded by the owner: OD-03 (connectors stay Level 0), OD-04 (no credential
  store yet), the one-entry observer allowlist, the T3/T4 prohibition, Great Order LLC existence
  only — see [09-ROADMAP](docs/09-ROADMAP.md#owner-decisions).
- Still open for the owner: OD-02 / OG-SEC-008 — no off-machine recovery copy, and the reported
  Block 0 bundle was not found ([archive manifest](docs/archive/MANIFEST.md)). **OG-SEC-008 stays
  pending until the owner places the final complete-history bundle off-device, and v0.2 is not
  frozen until that copy is confirmed.**
- WP-13 (`octopusg/v0.3-platform-foundation`, branched from `165397c`) designed the v0.3 platform
  foundation the owner authorized on 2026-09-18
  ([S7](docs/sources/S7-2026-09-18-owner-v03-platform-foundation-authorization.md),
  [ADR-0007](docs/decisions/ADR-0007-approved-origin-allowlist.md), OD-11): an exact-allowlist
  exception to the zero-remote rule for exactly one private GitHub remote, GitHub Actions CI
  running the existing `validate`/`validate:spec` commands, and a protected, preview-only Vercel
  deployment. **OG-GOV-007 is v0.3 and IMPLEMENTED** — `.github/workflows/validate.yml` is
  committed and inert until a remote exists. **OG-SEC-009 stays PROPOSED** — no Vercel action was
  taken. Nothing was pushed, no remote was added, `scripts/audit.mjs` is unchanged (CLAUDE.md rule
  7), and OG-SEC-008 stays exactly where it was: ADR-0007 gives it an exact path to closing, not a
  shortcut to it. The next vertical slice after this foundation — read-only Artemis DayOS Supabase
  monitoring — is specified, not built, in
  [docs/NEXT-SLICE-DAYOS-MONITORING.md](docs/NEXT-SLICE-DAYOS-MONITORING.md). Evidence:
  [WP-13](docs/evidence/WP-13.md).

<!-- GENERATED:STATUS:BEGIN -->
| | |
|---|---|
| Current milestone | **v0.2** — 28 requirements (10 verified) |
| Ledger | 92 requirements · 34 capabilities |
| Owner decisions referenced by v0.2 (see 09) | OD-01, OD-02, OD-05, OD-08, OD-11 |
| Next work package | WP-01 |
<!-- GENERATED:STATUS:END -->

## Start-of-session checklist

1. `pwd` is the repository root; `git status --short` is clean or explained.
2. You are on `octopusg/wp-nn-<slug>`, not `main`.
3. You know the work package and its requirement IDs ([09 Roadmap](docs/09-ROADMAP.md#v02-work-packages)).
4. You have listed the files you will change and the tests you will add.
5. You have restated what is prohibited (see `CLAUDE.md`).

## Where things are

| Need | File |
|---|---|
| What OctopusG is and must never do | [docs/00-PRODUCT-CONSTITUTION.md](docs/00-PRODUCT-CONSTITUTION.md) |
| Planes and v0.2 runtime | [docs/01-SYSTEM-ARCHITECTURE.md](docs/01-SYSTEM-ARCHITECTURE.md) |
| The contract | [docs/requirements/REQUIREMENTS.yaml](docs/requirements/REQUIREMENTS.yaml) |
| Work packages and owner decisions | [docs/09-ROADMAP.md](docs/09-ROADMAP.md) |
| How to work | [docs/10-OPERATING-MODEL.md](docs/10-OPERATING-MODEL.md) |
| What was actually discussed | [docs/sources/](docs/sources/) |

## End-of-session checklist

`npm run validate` · `npm run spec:write` · `npm run validate:spec` · write
`docs/evidence/WP-nn.md` · commit on the branch · do not push.
