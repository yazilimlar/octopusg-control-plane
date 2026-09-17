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
  `snapshot.observations`, `work/observations/latest.json` when a collector has run) on
  `octopusg/wp-02-truth-model`. Evidence: [WP-02](docs/evidence/WP-02.md).
- Still open for the owner: OD-02 / OG-SEC-008 — no off-machine recovery copy, and the reported
  Block 0 bundle was not found ([archive manifest](docs/archive/MANIFEST.md)).

<!-- GENERATED:STATUS:BEGIN -->
| | |
|---|---|
| Current milestone | **v0.2** — 27 requirements (0 verified) |
| Ledger | 89 requirements · 33 capabilities |
| Owner decisions referenced by v0.2 (see 09) | OD-01, OD-02, OD-05, OD-08 |
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
