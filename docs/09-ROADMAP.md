# 09 · Roadmap

Status: **PROPOSED** · 2026-09-17 · Requirement-level detail:
[`REQUIREMENTS.yaml`](requirements/REQUIREMENTS.yaml) · generated coverage:
[`TRACEABILITY.md`](requirements/TRACEABILITY.md)

## Blocks and milestones

One block is finished — requirements verified, evidence written, owner acceptance — before the
next starts. Source: [S1 Development roadmap](sources/S1-2026-09-17-conversation-export.md#development-roadmap).

| Block | Milestone | Deliverable | Authority | External accounts needed |
|---|---|---|---|---|
| 0 | `B0` | Architecture and requirements pack (this) | None | None |
| 1–2 | `v0.2` | Registry-driven cockpit; generated maps; local Git observation; provenance; Connection Center framework; simulated inbox; approval model | Read-only, local | None |
| 3 | `v0.3` | First real connectors: Vercel (+ GitHub, OD-07) read-only; HTTP probes; credential store; kill switch; registry MCP server | Level 1 | GitHub + Vercel read-only tokens |
| 4 | `v0.4` | Tailscale device inventory | Level 1 | Tailscale (installed manually on Mac + Windows) |
| 5 | `v0.5` | Local Mac/Windows agent; allowlisted local actions | T2 local, approved | None new |
| 6 | `v0.6` | Local state store; webhook receiver; real inbox; n8n bridge | Test workflows | n8n (self-hosted or cloud — decide at block start) |
| 7 | `v0.7` | Gmail inquiry → draft pilot | Level 2 (drafts) | Google Cloud project + OAuth consent |
| 8 | `v0.8` | ManyChat / Instagram / WhatsApp Business | Approved templates | ManyChat; Meta Business; WhatsApp Business Platform |
| 9 | `v0.9` | Squarespace sales, business KPIs, Supabase metadata | Read-only | Squarespace; Supabase read access |
| 10 | `v0.10` | Real approvals; guarded deployments, migrations, config changes | T3/T4 with approval | Write scopes, per decision |
| 11 | `v0.11` | Bounded AI agents | Policy-controlled | — |
| — | `unscheduled` | Cloud control plane; external observability; third-party comms backends | — | — |

## Owner gates

| Gate | When | Owner decides |
|---|---|---|
| G1 Architecture approval | After this pack | 00, 01, 06, v0.2 scope, ADRs, owner decisions below |
| G2 MVP acceptance | End of v0.2 | All v0.2 requirements `VERIFIED` with evidence |
| G3 Connector authorization | Start of each connector block | Exact account, scopes, max level |
| G4 Action authorization | Before any level ≥ 2 | Which action types move from observe to act |

Source: [S1 Canonical next step](sources/S1-2026-09-17-conversation-export.md#canonical-next-step).

## v0.2 scope

In: registry lock and v1.6 ingestion · typed resource catalog · generated relationship map with
presets · local Git observation (owner-run CLI) · declared-vs-observed drift ·
truth/freshness model · Connection Center framework (all Level 0) · event envelope and simulated
inbox · action-request/policy model (simulated) · safe open actions · devices screen (declared) ·
requirements view · OctopusG naming.

Out: any external account · any network call from the app or collector · any write to a
checkout or provider · real approvals · background schedules.

Source: [S1 OctopusG v0.2 boundary](sources/S1-2026-09-17-conversation-export.md#octopusg-v02-boundary).

## v0.2 work packages

Each package is one session, one branch (`octopusg/wp-nn-<slug>`), roughly ten files or fewer,
and ends with `docs/evidence/WP-nn.md`. Order matters; arrows are hard dependencies.

| WP | Title | Requirements | Depends on |
|---|---|---|---|
| WP-01 | Baseline reconciliation, archive and registry lock | OG-GOV-005, OG-GOV-006, OG-REG-002, OG-REG-003, OG-SEC-008 | OD-01, OD-02 |
| WP-02 | Truth model and observation store | OG-DATA-001, OG-DATA-002 | WP-01 |
| WP-03 | Local Git observer and device record | OG-OBS-001, OG-DEV-001, OG-SEC-002 | WP-02 |
| WP-04 | Resource catalog and typed graph | OG-REG-004, OG-REG-005, OG-MAP-002 | WP-02 |
| WP-05 | Generated map and presets | OG-MAP-003, OG-MAP-004 | WP-04 |
| WP-06 | Freshness badges, drift, OctopusG naming | OG-UI-002, OG-UI-003, OG-OBS-002 | WP-03, WP-04 |
| WP-07 | Connection Center framework | OG-CONN-002, OG-CONN-003 | WP-03 |
| WP-08 | Event envelope and simulated inbox | OG-EVT-001, OG-EVT-002 | WP-02 |
| WP-09 | Action model and safe open actions | OG-ACT-001, OG-ACT-002 | WP-03, WP-04 |
| WP-10 | Devices and requirements views | OG-UI-004, OG-UI-005 | WP-03 |
| WP-12 | Brand asset and tagline | OG-UI-007 | WP-06 |
| WP-11 | v0.2 acceptance | OG-GOV-004 + every v0.2 requirement | WP-01…WP-10, WP-12 |

**If OD-06 is accepted** (narrower v0.2), WP-07, WP-08 and WP-09's policy half move to v0.3.

## Owner decisions

`BLOCKING` items stop the named work package. Everything else has a recommended default that
applies unless the owner says otherwise.

| ID | Decision | Recommended default | Blocks |
|---|---|---|---|
| OD-01 | Where is `PROJECT_REGISTRY_v1.6.yaml` (SHA-256 `494bd33e…3286`)? It is not in the repo, which pins v1.5.1 ([S4](sources/S4-2026-09-17-v0.1-repository-inspection.md#registry-discrepancy)). | **Resolved in WP-01:** found at `~/Desktop/artemis-website/`, hash verified, copied to `data/` and pinned by `data/registry.lock.json`. | — |
| OD-02 | The repository has no remote and the registry says no backup; S1 says a verified bundle exists. Where is the recovery copy? Add a private GitHub remote? | Confirm bundle location now; decide the remote separately (it changes the audit's zero-remote rule and needs an ADR). WP-01 verified the v0.1 bundle but it is on the same disk; the Block 0 bundle was not found ([manifest](archive/MANIFEST.md)). | **BLOCKING** OG-SEC-008 |
| OD-03 | Finish containment of known plaintext secrets before any connector authorization? | **Owner decision 2026-09-18 ([S6](sources/S6-2026-09-18-owner-brand-decisions.md#v02-gate-decisions)):** yes. All connectors stay at Level 0 and unauthorized. Any real connector needs its own v0.3 connector-specific ADR and owner approval. | **BLOCKING** v0.3 G3 |
| OD-04 | Credential store for v0.3 collectors | **Owner decision 2026-09-18 ([S6](sources/S6-2026-09-18-owner-brand-decisions.md#v02-gate-decisions)):** no credential store is selected in v0.2. Credential handling stays blocked until immediately before the first approved real connector. macOS Keychain by label remains the candidate, not the choice. | v0.3 |
| OD-05 | Which legal entity owns OctopusG and each product (historical map says "Great Order LLC"; registry umbrella is AgoraXAI)? | **Owner clarification 2026-09-17:** Great Order LLC exists and is owner-confirmed (`legal_entity:great-order-llc`, truth `declared`, source `owner-confirmed`). It is **not** declared to own AgoraXAI, Artemis, OctopusG or any domain, repository, product, venture, IP or contract; every such ownership stays absent or `undeclared` until the owner declares it specifically. Recorded in `config/entities.json` (WP-04). | Resolved for v0.2 |
| OD-06 | Narrow v0.2 (move Connection Center, inbox, policy to v0.3) per [S3 Change 3](sources/S3-2026-09-17-claude-review.md#change-3--narrower-v02) | Keep the S1 boundary (owner-carried decision); revisit at G1 | Scope only |
| OD-07 | Add GitHub read-only alongside Vercel in v0.3 | Yes | v0.3 |
| OD-08 | Rename code identifiers from `Octopus` to `OctopusG`? | UI text only; keep schema const and localStorage key so saved simulation state survives. **Extended 2026-09-18:** the brand mark and the tagline "Architect-Engineer of Complex Systems" are owner-authorized for the interface ([ADR-0006](decisions/ADR-0006-brand-asset-and-tagline.md), [S6](sources/S6-2026-09-18-owner-brand-decisions.md#owner-brand-decisions)); identifiers are still untouched. | — |
| OD-09 | Is Pınar Evleri retained in the portfolio? | Retained as registered; no extraction work in OctopusG | — |
| OD-10 | Runbooks (add connector/product/device, move repository, revoke) | Write each at the start of the block that first needs it | — |

**Other v0.2 gate positions recorded by the owner on 2026-09-18**
([S6](sources/S6-2026-09-18-owner-brand-decisions.md#v02-gate-decisions)):

- **Observer allowlist** — the current one-entry allowlist is sufficient for v0.2. Expanding it is
  an explicit later configuration action.
- **Trust zones** — the prohibition on T3/T4 and on production actions is retained. No production
  execution is authorized in v0.2.
- **Great Order LLC** — existence stays owner-confirmed declared data; no ownership relationship is
  inferred.
- **OG-SEC-008** — stays pending until the owner has placed the final complete-history bundle in an
  off-device location. Recovery is not to be marked verified before that.
