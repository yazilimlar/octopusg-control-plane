# OctopusG Context Gateway

Generated 2026-09-27 from `origin/main` at `c6620d9` (merge of PR #8). Machine-readable
companion: [`octopusg-context.json`](octopusg-context.json).

## 1. Purpose

This file is a **map, not an authority**. It indexes the repository so a new AI agent (any model
or provider) can find the controlling sources quickly. It decides nothing, changes no status and
replaces no record. If this file and a primary source disagree, **the primary source wins**, and
this file is stale. Read the primary source before any consequential decision.

## 2. Agent reading rules

1. **Authority order** (from [CLAUDE.md](CLAUDE.md) and the
   [constitution](docs/00-PRODUCT-CONSTITUTION.md)): `docs/00-PRODUCT-CONSTITUTION.md` →
   `docs/requirements/REQUIREMENTS.yaml` → `docs/09-ROADMAP.md` → ADRs in `docs/decisions/`.
   Chat history, reflogs, filenames and model memory are **not** authoritative.
2. **Owner decisions** enter the repository as source records `docs/sources/S<n>-…md` (sources are never
   edited afterwards; [ADR-0005](docs/decisions/ADR-0005-source-cited-requirements.md)).
   A decision that exists only in a conversation does not exist.
3. **Evidence is not authority.** `docs/evidence/*.md` records what was run and what came back;
   it does not approve anything. Approval comes from the owner via a source record or gate.
4. **Status words are the repository's.** Requirement: `PROPOSED · APPROVED · IMPLEMENTED ·
   VERIFIED · DEFERRED · REJECTED`. ADR: `PROPOSED · ACCEPTED`. Capability: `CONCEPT · PLANNED ·
   READY · BUILDING · VALIDATING · AVAILABLE · DEFERRED · RETIRED`. Evolution history: `DECISION ·
   EXPERIMENT · CANDIDATE · WORK PACKAGE · RELEASE / MILESTONE`. `IMPLEMENTED` is not
   `VERIFIED`; `PROPOSED` is not accepted.
5. **Current vs historical:** canonical state is `origin/main`. Other branches, local worktrees,
   `work/` and `dist/` are not canonical evidence ([SESSION_BRIEF.md](SESSION_BRIEF.md)).
6. **Contradictions** are listed in §14; do not reconcile them yourself — report them.
7. **UNKNOWN** means the repository cannot establish it. Do not fill it with a guess.
8. **Experimental lineages** (for example a future "OctopusG // <Model> Mutant") are never
   canonical OctopusG unless accepted through the governance above. None exists in the repository.

### Gateway authority classes

| Class | Meaning here |
|---|---|
| `CANONICAL_CURRENT` | Controls now, on `origin/main` |
| `CANONICAL_HISTORICAL` | On `main`, true for its time, kept as provenance; not the current rule |
| `SUPERSEDED` | Explicitly superseded by a named later source |
| `SOURCE_RECORD` | Owner decision / conversation / inspection record (`docs/sources/`) |
| `EVIDENCE` | Work-package or maintenance evidence (`docs/evidence/`) |
| `GENERATED` | Produced by `npm run spec:write`; never hand-edited |
| `EXPERIMENTAL` | Exists, deliberately non-canonical (e.g. local UI Lab branch) |
| `CANDIDATE` | Recorded idea without implementation authorization |
| `TRANSIENT` | Local, git-ignored or machine-specific (`work/`, `dist/`, worktrees) |
| `UNKNOWN` | Not establishable from the repository |

The repository's own status field is always kept alongside, unchanged.

## 3. What OctopusG is

*"OctopusG is the AgoraXAI Portfolio Operating System"* — one private cockpit for the owner's
portfolio: what exists, where it lives, how it connects, what changed, what needs a decision. It
coordinates external services rather than replacing them. Technical subsystem: AgoraXAI Control
Plane; code codename `Octopus`. Today it is a **local, loopback-only, read-only** TypeScript/esbuild
static app plus owner-run CLI scripts.
Sources: [constitution §1–2](docs/00-PRODUCT-CONSTITUTION.md#1-identity),
[README](README.md) (partly stale, §14), [01 architecture](docs/01-SYSTEM-ARCHITECTURE.md).

## 4. Authority / governance model

| Actor | May | Source |
|---|---|---|
| Owner (George Oktem) | Final authority: changes the constitution, accepts ADRs, grants gates G1–G4, authorizes accounts, credentials, connectors, pushes, deployments | [constitution §1, §6](docs/00-PRODUCT-CONSTITUTION.md#6-how-this-document-changes), [09 Owner gates](docs/09-ROADMAP.md#owner-gates) |
| Implementing AI session | One work package per session on its own branch; cite requirement IDs; write evidence; never change scope, connect accounts or read secrets | [CLAUDE.md Rules](CLAUDE.md), [10 §1](docs/10-OPERATING-MODEL.md#1-roles) |
| Reviewing AI models | Independent critique; no parallel edits; no voting — evidence wins | [10 §1](docs/10-OPERATING-MODEL.md#1-roles), [ADR-0011](docs/decisions/ADR-0011-multi-ai-engineering-core-and-evidence-governance.md) (PROPOSED) |
| Git / `origin/main` | Source of truth and history | [10 §1](docs/10-OPERATING-MODEL.md#1-roles), [SESSION_BRIEF](SESSION_BRIEF.md) |

Gates ([09](docs/09-ROADMAP.md#owner-gates)): **G1** architecture approval · **G2** MVP (v0.2)
acceptance — all v0.2 requirements VERIFIED · **G3** connector authorization (exact account,
scopes, max level) · **G4** action authorization (level ≥ 2). Hard never-list and the single
narrow ADR-0007 remote exception: [CLAUDE.md](CLAUDE.md), enforced in
[`.claude/settings.json`](.claude/settings.json). In short, **never without explicit owner
authorization**: add another remote, force-push, delete remote branches, rewrite history, make the
repository public, deploy or touch production/DNS, call Vercel, Supabase, Google, Meta, Tailscale
or n8n, read `.env*`/keys/Keychain or print any secret, install dependencies, delete files
outside `work/` or `dist/`, loosen `scripts/audit.mjs` beyond ADR-0007 §1.

## 5. Current canonical state

| Item | State | Source |
|---|---|---|
| Canonical branch | `origin/main` of private `yazilimlar/octopusg-control-plane`; PRs #1–#9 merged; HEAD `c6620d9` at generation | `git log main`, [SESSION_BRIEF](SESSION_BRIEF.md) |
| Released tag | `v0.2.0` → `165397c` (WP-12) | `git tag` |
| Controlling delivery sequence | canonical truth/security preparation → **OD-03 containment** → narrow **WP-17** preflight + implementation → first *governed* DayOS/Supabase observation → usable **local-private Alpha** → evidence-driven evolution | [S14](docs/sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#controlling-delivery-sequence), [09](docs/09-ROADMAP.md#current-delivery-sequence) |
| Next work package | **WP-17** (OG-CONN-015, APPROVED, v0.3) — *not started* | [09 v0.3 WPs](docs/09-ROADMAP.md#v03-work-packages) |
| Gates | No G3 granted; no provider or credential active; every connector at Level 0; G2 not recorded | [S14](docs/sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions), [SESSION_BRIEF](SESSION_BRIEF.md) |
| Blockers of WP-17 | OD-03 items X-01, X-02 (block); X-03 relevance UNKNOWN; six preflight unknowns | [OD-03 register](docs/security/OD-03-CONTAINMENT.md#relevance-to-the-proposed-dayos-supabase-connector-wp-17), [09 preflight](docs/09-ROADMAP.md#wp-17-preflight-unknowns) |
| Ledger | 99 requirements · 39 capabilities · 14 source keys (S1–S14) · 13 milestones · OD-01…OD-11; v0.2: 30 requirements (11 VERIFIED, 19 IMPLEMENTED) | [REQUIREMENTS.yaml](docs/requirements/REQUIREMENTS.yaml) |

## 6. Recommended reading order

| Level | Read | Why |
|---|---|---|
| 0 Orientation | this file → [SESSION_BRIEF.md](SESSION_BRIEF.md) → [CLAUDE.md](CLAUDE.md) | where things are; session rules; never-list |
| 1 Governance | [00 constitution](docs/00-PRODUCT-CONSTITUTION.md) → [10 operating model](docs/10-OPERATING-MODEL.md) → [ADR-0005](docs/decisions/ADR-0005-source-cited-requirements.md) | authority, roles, how records work |
| 2 Current state | [S14](docs/sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md) → [09 roadmap](docs/09-ROADMAP.md) (sequence, Alpha, gates, owner decisions) → [OD-03 register](docs/security/OD-03-CONTAINMENT.md) | what controls now and what blocks |
| 3 Architecture | [01 system](docs/01-SYSTEM-ARCHITECTURE.md) → [02 domain](docs/02-DOMAIN-MODEL.md) → [06 security](docs/06-SECURITY-AND-APPROVALS.md) → [04 connector contract](docs/04-CONNECTOR-CONTRACT.md) → [ADR-0008](docs/decisions/ADR-0008-credential-reference-provider-boundary.md) → [ADR-0009](docs/decisions/ADR-0009-dayos-supabase-boundary.md) | planes, truth model, trust, connectors |
| 4 WP history | §7 below → the relevant `docs/evidence/WP-nn.md` | what was built and proven |
| 5 ADR / requirements | §8, §9 → [TRACEABILITY.md](docs/requirements/TRACEABILITY.md) | decisions and contract |
| 6 Evidence / validation | §16 → `tests/`, `scripts/validate-spec.mjs`, `scripts/audit.mjs` | how claims are checked |
| 7 Implementation | [DATA_MODEL.md](docs/DATA_MODEL.md) → `src/` → `config/` → `scripts/` | code-level truth |

## 7. Work package index

18 numbered WPs are declared in `REQUIREMENTS.yaml` `work_packages` (WP-01…WP-18). No other
numbered WP is discoverable. Requirement statuses are from the ledger at `c6620d9`.

| WP | Title | Requirements (status) | Evidence | Landing on `main` |
|---|---|---|---|---|
| WP-01 | Baseline reconciliation and registry lock | OG-GOV-005, OG-GOV-006, OG-REG-002, OG-REG-003 (IMPLEMENTED) | [WP-01](docs/evidence/WP-01.md) | `bcee664` |
| WP-02 | Truth model and observation store | OG-DATA-001, OG-DATA-002 (VERIFIED) | [WP-02](docs/evidence/WP-02.md) | `d1b8f8b` ("accepted at Gate G2" per SESSION_BRIEF; see C8) |
| WP-03 | Local Git observer and device record | OG-OBS-001, OG-DEV-001, OG-SEC-002 (VERIFIED) | [WP-03](docs/evidence/WP-03.md), [repair](docs/evidence/WP-03-REPAIR-01.md) | `e26d4ad`, repair `b86a0ff` |
| WP-04 | Resource catalog and typed graph | OG-REG-004, OG-REG-005, OG-MAP-002 (VERIFIED) | [WP-04](docs/evidence/WP-04.md) | `7a81ed2` |
| WP-05 | Generated map and presets | OG-MAP-003, OG-MAP-004 (VERIFIED) | [WP-05](docs/evidence/WP-05.md) | `0489465` |
| WP-06 | Freshness badges, drift, OctopusG naming | OG-UI-002, OG-UI-003, OG-OBS-002 (IMPLEMENTED) | [WP-06](docs/evidence/WP-06.md) | `354699b` |
| WP-07 | Connection Center framework | OG-CONN-002, OG-CONN-003 (IMPLEMENTED) | [WP-07](docs/evidence/WP-07.md) | `4c682e9` |
| WP-08 | Event envelope and simulated inbox | OG-EVT-001, OG-EVT-002 (IMPLEMENTED) | [WP-08](docs/evidence/WP-08.md) | `bc5665a` |
| WP-09 | Action model and safe open actions | OG-ACT-001, OG-ACT-002 (IMPLEMENTED) | [WP-09](docs/evidence/WP-09.md) | `c6a71db` |
| WP-10 | Devices and requirements views | OG-UI-004, OG-UI-005 (IMPLEMENTED) | [WP-10](docs/evidence/WP-10.md) | `f2ad90d` |
| WP-11 | v0.2 acceptance | OG-GOV-004 (IMPLEMENTED) | [WP-11](docs/evidence/WP-11.md) | `c221451` |
| WP-12 | Brand asset and tagline | OG-UI-007 (IMPLEMENTED) | [WP-12](docs/evidence/WP-12.md) | `165397c` = tag `v0.2.0` |
| WP-13 | v0.3 platform foundation (approved origin, CI, protected preview) | OG-SEC-008 (VERIFIED), OG-GOV-007 (IMPLEMENTED), OG-SEC-009 (PROPOSED) | [WP-13](docs/evidence/WP-13.md) | design `42d949a`, execution `8b3850a` |
| WP-14 | Read-only DayOS monitor | OG-OBS-007 (IMPLEMENTED) | [WP-14](docs/evidence/WP-14.md) | PR #2 `4a2ab03` |
| WP-15 | Ownership declarations and client tenancy | OG-REG-007, OG-REG-008 (IMPLEMENTED) | [WP-15](docs/evidence/WP-15.md) | PR #3 `359f39c` |
| WP-16 | Credential reference and connector security foundation | OG-SEC-003, OG-SEC-004 (IMPLEMENTED) | [WP-16](docs/evidence/WP-16.md) | PR #4 `adc3f4c` |
| WP-17 | Artemis DayOS Supabase read-only observation connector | OG-CONN-015 (APPROVED) | — **not started** | — |
| WP-18 | DayOS Supabase connector design and authorization boundary (design only) | none; design provenance for OG-CONN-015 | [WP-18](docs/evidence/WP-18.md) | PR #6 `7b207d2` |

Notes: WP-18 precedes WP-17 by design (S14 decision 2). Dependencies: [09 v0.2 WPs](docs/09-ROADMAP.md#v02-work-packages),
[09 v0.3 WPs](docs/09-ROADMAP.md#v03-work-packages). Non-numbered work on `main`:
Block 0 (`d5f1c6b`, [B0](docs/evidence/B0.md)), MAINT-01 (PR #9 `4629cf1`,
[evidence](docs/evidence/MAINT-01-local-observation-overlay.md)), governance PRs #1, #5, #7, #8.

## 8. ADR index

| ADR | Title | Status (file) | Effect |
|---|---|---|---|
| [0001](docs/decisions/ADR-0001-existing-repository.md) | Evolve the existing repository into OctopusG | PROPOSED | one repository, no rename |
| [0002](docs/decisions/ADR-0002-modular-monolith-first.md) | Modular monolith first | PROPOSED | one app/process; planes as folders (see §14) |
| [0003](docs/decisions/ADR-0003-read-only-first.md) | Read-only first | PROPOSED | Level 0 → 1 only via G3; ≥2 via G4 |
| [0004](docs/decisions/ADR-0004-build-time-collectors.md) | Owner-run build-time collectors | PROPOSED | `npm run observe` → build; no live API |
| [0005](docs/decisions/ADR-0005-source-cited-requirements.md) | Source-cited requirements; generated traceability | PROPOSED | `S<n>#slug` sources, validated |
| [0006](docs/decisions/ADR-0006-brand-asset-and-tagline.md) | Brand asset and tagline | **ACCEPTED** 2026-09-18 | master bytes, derivatives, tagline |
| [0007](docs/decisions/ADR-0007-approved-origin-allowlist.md) | Exact-allowlist origin | **ACCEPTED** 2026-09-18 | supersedes the zero-remote rule |
| [0008](docs/decisions/ADR-0008-credential-reference-provider-boundary.md) | Credential reference/provider boundary | PROPOSED | `CredentialRef → CredentialProvider → store` |
| [0009](docs/decisions/ADR-0009-dayos-supabase-boundary.md) | DayOS Supabase connector boundary | **ACCEPTED** 2026-09-25 (S14) | design boundary for WP-17; no G3 |
| [0010](docs/decisions/ADR-0010-progressive-delivery-and-evolution.md) | Progressive delivery | PROPOSED | specialized by S14 sequence |
| [0011](docs/decisions/ADR-0011-multi-ai-engineering-core-and-evidence-governance.md) | Multi-AI Engineering Core | PROPOSED | architecture/history direction only |

Supersession: ADR-0007 supersedes the zero-remote audit rule; ADR-0009 supersedes
[NEXT-SLICE-DAYOS-MONITORING.md](docs/NEXT-SLICE-DAYOS-MONITORING.md) as design authority.

## 9. Requirements, sources, traceability

- **Contract:** [REQUIREMENTS.yaml](docs/requirements/REQUIREMENTS.yaml) — `sources`,
  `milestones`, `work_packages`, `owner_decisions`, `capabilities`, `requirements`. IDs are
  `OG-<FAMILY>-nnn`, permanent. Search by ID; read `status`, `milestone`, `work_package`,
  `source`, `acceptance`, `tests`.
- **Sources:** `docs/sources/S1…S14` (S5 is the archived
  [PRODUCT_BACKLOG.md](docs/archive/gate-3b/PRODUCT_BACKLOG.md)). Heading anchors are validated.
- **Generated (do not edit):** [TRACEABILITY.md](docs/requirements/TRACEABILITY.md), the
  capability table in [03 atlas](docs/03-CAPABILITY-ATLAS.md), `data/requirements.json`, the
  status block in SESSION_BRIEF.
- **Owner decisions OD-01…OD-11:** [09 Owner decisions](docs/09-ROADMAP.md#owner-decisions).

## 10. Milestone / evolution timeline

| Date | Milestone / decision | Record | SHA |
|---|---|---|---|
| 2026-09-16 | Control Plane v0.1 frozen baseline | [archive](docs/archive/MANIFEST.md) | `6a4954f` |
| 2026-09-17 | Block 0 architecture pack; G1 working baseline (per SESSION_BRIEF) | [B0](docs/evidence/B0.md) | `d5f1c6b` |
| 2026-09-17/18 | v0.2 WP-01…WP-12 | §7 | `bcee664`…`165397c` |
| 2026-09-18 | Brand + gate positions (OD-03, OD-04) | [S6](docs/sources/S6-2026-09-18-owner-brand-decisions.md), ADR-0006 | — |
| 2026-09-18 | v0.2.0 tagged; approved origin; OG-SEC-008 VERIFIED | [S7](docs/sources/S7-2026-09-18-owner-v03-platform-foundation-authorization.md), ADR-0007, [WP-13](docs/evidence/WP-13.md) | `165397c`, `8b3850a` |
| 2026-09-19 | DayOS monitor | [S8](docs/sources/S8-2026-09-19-owner-dayos-monitoring-directive.md), WP-14 | `4a2ab03` |
| 2026-09-20/21 | Ownership and tenancy | [S9](docs/sources/S9-2026-09-20-owner-ownership-declarations.md), WP-15 | `359f39c` |
| 2026-09-21/22 | Credential boundary | [S10](docs/sources/S10-2026-09-21-owner-wp16-authorization.md), WP-16, ADR-0008 | `adc3f4c` |
| 2026-09-22 | Progressive delivery | [S12](docs/sources/S12-2026-09-22-owner-progressive-delivery-principle.md), ADR-0010 | `66df94c` |
| 2026-09-22 | DayOS Supabase design boundary | [S11](docs/sources/S11-2026-09-22-owner-wp18-authorization.md), WP-18, ADR-0009 | `7b207d2` |
| 2026-09-22/23 | Multi-AI engineering history (EXP-001/002) | [S13](docs/sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md), ADR-0011, [Evolution History](docs/EVOLUTION-HISTORY.md) | `c2245c9` |
| 2026-09-25 | Canonicalization; ADR-0009 accepted; WP-17 next; OD-03 register | [S14](docs/sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md) | `c6620d9` |
| 2026-09-25 | Local observations moved to git-ignored overlay | [MAINT-01](docs/evidence/MAINT-01-local-observation-overlay.md) | `4629cf1` |

## 11. Current architecture map

| Area | Controlling source | Status |
|---|---|---|
| Planes, runtime, topology | [01](docs/01-SYSTEM-ARCHITECTURE.md), [ADR-0002](docs/decisions/ADR-0002-modular-monolith-first.md) | CANONICAL_CURRENT (ADR PROPOSED) |
| Domain / entities / ownership / tenancy | [02](docs/02-DOMAIN-MODEL.md), [DATA_MODEL](docs/DATA_MODEL.md), [S9](docs/sources/S9-2026-09-20-owner-ownership-declarations.md) | CANONICAL_CURRENT |
| Truth, evidence, provenance, freshness | [01 §2](docs/01-SYSTEM-ARCHITECTURE.md#2-truth-model), [DATA_MODEL](docs/DATA_MODEL.md#truth-model-v02-og-data-001), `src/truth.ts` | CANONICAL_CURRENT |
| Authority / trust zones / tiers / approvals | [06](docs/06-SECURITY-AND-APPROVALS.md), `config/policy.json` | CANONICAL_CURRENT |
| Connectors and levels | [04](docs/04-CONNECTOR-CONTRACT.md), [ADR-0003](docs/decisions/ADR-0003-read-only-first.md), `config/connectors.json` | CANONICAL_CURRENT |
| Credential / provider | [ADR-0008](docs/decisions/ADR-0008-credential-reference-provider-boundary.md), `src/credentials.ts`, [WP-16](docs/evidence/WP-16.md) | implemented; ADR PROPOSED |
| DayOS Supabase connector | [ADR-0009](docs/decisions/ADR-0009-dayos-supabase-boundary.md), `src/supabase-boundary.ts` | design ACCEPTED; not implemented |
| Events / inbox | [05](docs/05-EVENT-MODEL.md) | CANONICAL_CURRENT (simulated) |
| Devices / observer | [07](docs/07-DEVICE-AGENT-SPEC.md), `scripts/observe.mjs`, `config/observe.allowlist.json` | CANONICAL_CURRENT |
| AI / multi-model engineering, "Reality Kernel", temporal/scenario lineage | [ADR-0011](docs/decisions/ADR-0011-multi-ai-engineering-core-and-evidence-governance.md), [Evolution History](docs/EVOLUTION-HISTORY.md), OG-AI-005 | PROPOSED / CANDIDATE only |
| Attention and decision architecture | none on `main` | UNKNOWN on `main` (see §12) |
| UI / projection | [08 UX map](docs/08-UX-AND-SCREEN-MAP.md), `src/main.ts` | CANONICAL_CURRENT |

## 12. Product / UI context

- **Current UI (canonical):** v0.1 views plus v0.2 additions — [08](docs/08-UX-AND-SCREEN-MAP.md),
  `src/main.ts`, `src/style.css`, brand per [ADR-0006](docs/decisions/ADR-0006-brand-asset-and-tagline.md).
  Cockpit summary OG-UI-006 is PROPOSED (v0.6).
- **UI Lab (EXPERIMENTAL, not on `main`):** local branch `octopusg/ui-lab-foundation`
  (reviewed SHA `9bc5cea`, not pushed). On that branch only (paths do **not** exist on `main`): charter
  `docs/ui-lab/UI-LAB-SPEC.md`, state/handoff `docs/ui-lab/UI-LAB-STATE.md`, sources S15/S16,
  requirement OG-UI-008 (IMPLEMENTED, unscheduled), `src/lab/`. It defines Athena/Orion themes
  (provisional v0), an octagonal grouping projection, 18 surfaces (incl. attention and decision
  surfaces) over **demo data only**. It is not canonical until merged through governance; this
  gateway cannot see it from `main`.
- Mobile/responsive: canonical v0.1 app has mobile navigation ([ARCHITECTURE.md](docs/ARCHITECTURE.md#ui-and-accessibility));
  a canonical cross-device UI architecture is UNKNOWN.

## 13. Security / authorization context

- Hard boundaries: [constitution §4](docs/00-PRODUCT-CONSTITUTION.md#4-hard-boundaries-all-milestones-until-the-owner-changes-this-section);
  secrets policy [06 §5](docs/06-SECURITY-AND-APPROVALS.md#5-secrets); kill switch [06 §6](docs/06-SECURITY-AND-APPROVALS.md#6-kill-switch-and-blast-radius).
- **OD-03 containment**: no exception; X-01, X-02 block WP-17 G3; X-03 relevance UNKNOWN
  ([register](docs/security/OD-03-CONTAINMENT.md)). The register contains no secret values; never
  read secret content to resolve anything.
- OD-04: no credential store selected; macOS Keychain adapter exists fail-closed, no credential
  accessed ([WP-16](docs/evidence/WP-16.md)).
- Remote: exactly one private `origin`, HTTPS or SSH form ([ADR-0007](docs/decisions/ADR-0007-approved-origin-allowlist.md)),
  checked by `scripts/audit.mjs` + `scripts/audit-remotes.mjs`.
- Vercel preview OG-SEC-009 is PROPOSED; Vercel is owner-operated elsewhere ([CLAUDE.md](CLAUDE.md)).
- App runtime: loopback server, CSP `connect-src 'none'`, no browser network client
  (`scripts/serve.mjs`, audited).

## 14. Current frontier

**Active / next:** WP-17 preflight and implementation, after OD-03 containment of relevant items
([09](docs/09-ROADMAP.md#current-delivery-sequence)). **Blocked:** WP-17 G3 (X-01, X-02; preflight
unknowns). **Candidates (unnumbered):** registry MCP server OG-AI-001; multi-AI engineering
([09 backlog](docs/09-ROADMAP.md#candidate-backlog-unnumbered)). **Awaiting owner:** G2 for the
IMPLEMENTED v0.2 requirements; OG-SEC-009; acceptance status of PROPOSED ADRs.

**Contradictions and staleness (recorded, not resolved):**

| # | Finding | Sources |
|---|---|---|
| C1 | Constitution header says "PROPOSED — awaiting owner Architecture Approval"; SESSION_BRIEF says Block 0 was approved as the working baseline at G1. ADR-0001…0005 files still say PROPOSED ("formal acceptance at G1"). | [00](docs/00-PRODUCT-CONSTITUTION.md), [SESSION_BRIEF](SESSION_BRIEF.md), [ADR-0001](docs/decisions/ADR-0001-existing-repository.md) |
| C2 | SESSION_BRIEF "Current" names PRs #1–#7 / `c2245c9`; `main` is at PR #9/#8 `c6620d9`. Its "Known debt" item describes a correction later merged as MAINT-01 (PR #9). | [SESSION_BRIEF](SESSION_BRIEF.md), [MAINT-01](docs/evidence/MAINT-01-local-observation-overlay.md) |
| C3 | SESSION_BRIEF generated table says "Next work package: none"; roadmap says WP-17 next, not started. | [SESSION_BRIEF](SESSION_BRIEF.md), [09](docs/09-ROADMAP.md#v03-work-packages) |
| C4 | README says "local repository, no remote"; ADR-0007 approved origin exists. README refresh deferred by S14 decision 9. | [README](README.md), [S14](docs/sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions) |
| C5 | 10 Operating Model: Claude "does not push"; results go to `reviews/` files. CLAUDE.md permits ADR-0007 pushes; no `reviews/` directory exists. | [10](docs/10-OPERATING-MODEL.md#1-roles), [CLAUDE.md](CLAUDE.md) |
| C6 | ADR-0002 describes `src/core`, `src/connectors`, `src/executors`, `src/ui`; as-built `src/` is flat. | [ADR-0002](docs/decisions/ADR-0002-modular-monolith-first.md), `src/` |
| C7 | CLAUDE.md requires `octopusg/wp-xx-<slug>` branches; merged work also used `governance/…`, `maint/…` branches. | [CLAUDE.md](CLAUDE.md), `git log main` |
| C8 | SESSION_BRIEF records WP-02 accepted "at Gate G2" and WP-03 "at Gate G4"; the roadmap defines G2 as end-of-v0.2 MVP acceptance and G4 as action authorization. | [SESSION_BRIEF](SESSION_BRIEF.md), [09 gates](docs/09-ROADMAP.md#owner-gates) |

**UNKNOWN:** G2 acceptance date/record for v0.2 as a whole; X-03 relevance to WP-17; Supabase
key architecture; authoritative DayOS project identity; whether DayOS migrations are applied;
G3 record format; canonical attention/decision/temporal architecture; formal G1 acceptance
record for the constitution.

## 15. Historical / superseded material

- [`docs/archive/`](docs/archive/MANIFEST.md): byte-identical Gate records; never edit; overrides nothing.
- `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/CONNECTOR_PLAN_v0.2.md`: v0.1-era; the
  architecture pack wins where they conflict ([01 §6](docs/01-SYSTEM-ARCHITECTURE.md#6-relationship-to-existing-v01-documents)).
- [NEXT-SLICE-DAYOS-MONITORING.md](docs/NEXT-SLICE-DAYOS-MONITORING.md): SUPERSEDED by ADR-0009.
- `data/PROJECT_REGISTRY_v1.4.yaml`, `data/PROJECT_REGISTRY_v1.5.yaml`, `data/PROJECT_REGISTRY_v1.5.1.yaml`: history; v1.6 is pinned by `data/registry.lock.json`.
- Sources S1–S4 are conversation/inspection exports: evidence of what was said, cited by anchor.
- Branches other than `main` and local worktrees: TRANSIENT unless merged.

## 16. Evidence and validation

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run validate        # build + typecheck + unit tests (tests/*.test.ts) + local audit
npm run validate:spec   # ledger, sources/anchors, links, traceability, evidence shape
npm run test:browser    # tests/browser.mjs, needs `npm start` (http://127.0.0.1:4317)
```

CI: [`.github/workflows/validate.yml`](.github/workflows/validate.yml) runs `validate` and
`validate:spec`. Evidence contract (sections Requirements / Validation / Open questions):
[WP-11](docs/evidence/WP-11.md), enforced in `scripts/validate-spec.mjs`. Local observations live
in git-ignored `work/observations/` and never become canonical
([MAINT-01](docs/evidence/MAINT-01-local-observation-overlay.md)).

## 17. Agent onboarding checklist

- [ ] Read this file, then SESSION_BRIEF.md and CLAUDE.md.
- [ ] `pwd`, `git branch --show-current`, `git status --short`; start from fresh `origin/main`.
- [ ] Identify the authority for your task: a numbered WP, an owner source record, or an explicit owner instruction. None → stop and ask.
- [ ] Read the WP's requirements in REQUIREMENTS.yaml, their sources, the relevant ADRs and prior evidence.
- [ ] Restate the never-list (CLAUDE.md): no secrets, no providers, no unapproved remote, no force-push, no deploy, no dependency installs.
- [ ] Check §13/§14 for gates and blockers touching your task.
- [ ] Treat §14 contradictions as open; do not resolve them silently.
- [ ] Finish with `npm run validate`, `npm run spec:write`, `npm run validate:spec`, evidence file, local commit.

## 18. Context qualification questions

1. What is the authority order, and where do owner decisions have to be recorded to count?
2. Which WP is next, what requirement does it implement, and why does WP-18 precede it?
3. Which gates exist, which one does WP-17 need, and has it been granted?
4. Which OD-03 items block WP-17's G3, which is UNKNOWN, and why may you not read the files to find out?
5. What is the difference between IMPLEMENTED and VERIFIED here, and which v0.2 WPs are only IMPLEMENTED?
6. Is ADR-0008 accepted? What was built under it, and what does that imply for its status?
7. What does ADR-0007 permit and exactly what does it forbid?
8. Where do local observations live, and why are they not canonical truth?
9. What are the five truth kinds, and what should the UI show when nothing was observed?
10. Which document is superseded by ADR-0009, and what changed?
11. What is the controlling delivery sequence up to the local-private Alpha?
12. Is "Reality Kernel" canonical architecture? Where does it appear and with what status?
13. Is the UI Lab canonical? Where does it live and what data may it use?
14. What does the Evolution History ledger's presence of an item imply about approval?
15. What would you do if SESSION_BRIEF and the roadmap disagree about the next WP?
16. Which commands define "done", and what must the evidence file contain?
