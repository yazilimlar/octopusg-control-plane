# Data model, evidence semantics and scoring

## Source snapshot

`data/schema.json` documents the portable snapshot and observation contract (JSON Schema 2020-12). `src/model.ts`, `src/workflow.ts` and `src/connectors.ts` are the TypeScript contracts. The importer first checks the pinned file's SHA-256 against `data/registry.lock.json`, then validates YAML parse errors/duplicate keys, the registry version and row count declared in that lock (currently `PROJECT_REGISTRY_v1.6.yaml`, version 1.6, 18 rows), required project strings, unique IDs, known categories, and checklist extraction count. The JSON Schema is documentation; there is no runtime dependency on a JSON Schema validator. Tests compare the entire parsed registry with the generated snapshot.

Snapshot fields:

- `schemaVersion: 1`
- `classification`: umbrella `AGORAXAI_UMBRELLA`, kind `INTERNAL_PLATFORM`, visibility `private`, codename `Octopus`
- `asOf`: source date, not current collection time
- `sources[]`: basename and SHA-256 of each of the three copied source documents
- `registry`: lossless parsed YAML; original per-project optional fields are retained
- `approvalCandidates[]`: checklist ID, title, source excerpt, and source reference. No imported approval status is inferred.
- `observations`: the local observation store (see below). Always present; `present: false` with empty `records` until a collector has run.

The registry has exactly 18 rows. Since registry v1.5.1 the Control Plane itself is a registry row (`agoraxai-control-plane`); it is also classified in snapshot metadata. `NOT_A_PROJECT` remains visible under Security artifacts.

## Truth model (v0.2, OG-DATA-001)

Every value can state how it is known. The five kinds come from
[S1](sources/S1-2026-09-17-conversation-export.md#truth-and-evidence-model); `unknown` and
`blocked` stay first-class, so absence of evidence is never upgraded to evidence.

| Truth | Meaning | Where it comes from | v0.1 kind it displays with |
|---|---|---|---|
| `declared` | Intended configuration in the registry | registry rows | `inferred` |
| `observed` | Measured from a system or device, with `observed_at` | registry-recorded verification (v0.1) or an observation record (v0.2) | `observed` |
| `derived` | Calculated from declared and observed values (risk, health, drift) | `src/model.ts`, `evaluateDrift` | `inferred` |
| `approved` | Action authorized by owner or policy | approval simulation only, until v0.10 | — |
| `executed` | Action performed, with result and evidence | nothing produces it yet | — |
| `unknown` / `blocked` | Evidence absent, or collection not permitted | anywhere | unchanged |

v0.1 evidence values keep their meaning: `truthOfLegacy` in `src/truth.ts` maps `observed` →
`observed`, `inferred` → `declared` (or `derived` when the value is calculated), and leaves
`unknown` / `blocked` alone. No v0.1 value was renamed and no v0.1 test changed.

**Confidence** is derived, never authored: `observed`/`executed` → high, `approved`/`declared`
→ medium, `derived` → low, `unknown`/`blocked` → none; a stale observation drops one step, and a
derived value takes the weakest of its inputs. It is a prioritization aid, not a probability.

## Observation store (v0.2, OG-DATA-002)

An owner-run collector writes `work/observations/latest.json`; `work/` is git-ignored, so
observations are never committed. Since WP-03 that collector is `npm run observe`
([07 §1](07-DEVICE-AGENT-SPEC.md#1-v02--local-git-observer-a-cli-not-an-agent--built-in-wp-03)),
which reads only the repositories listed in `config/observe.allowlist.json`. The build reads that file **when it exists** and copies the
accepted records into `snapshot.observations`. Nothing is fetched, at build time or in the browser.

```json
{"schemaVersion": 1, "collector": "scripts/observe.mjs", "collectedAt": "2026-09-17T11:00:00Z",
 "observations": [{"projectId": "dayos", "field": "head_sha", "value": "1f9d2346…",
   "truth": "observed", "source": {"adapter": "local-git", "resource": "~/Projects/dayos"},
   "observedAt": "2026-09-17T11:00:00Z", "collectedAt": "2026-09-17T11:00:00Z",
   "expiresAt": "2026-09-18T11:00:00Z", "status": "ok"}]}
```

- **Provenance** is mandatory: `source.adapter` (`github`, `vercel`, `supabase`, `http-uptime`,
  `mac-status`, `local-git`) plus a resource identifier, displayed as `adapter:resource`.
- **Validation is fail-closed.** A file that is not an observation file throws and stops the
  build; an individual record that is malformed, uses an unknown adapter or claims `approved` or
  `executed` truth is rejected with a value-free reason and recorded in
  `snapshot.observations.rejected`. One bad record never poisons the build.
- **Secret-shaped values are rejected before persistence**, at any depth of the value, using the
  credential shapes `scripts/audit.mjs` scans for. The audit itself is never loosened.
- **Freshness is read-time, not build-time.** Records carry `observedAt`, `collectedAt` and
  `expiresAt`; freshness is computed when the value is read, against a caller-supplied `now`.
  Absent → `Not collected`; `status: error` → `Error: <reason>`; past `expiresAt` → `Stale · …`
  with confidence downgraded. The snapshot therefore stays byte-deterministic.
- **Derivation is deterministic**: `evaluateDrift(declared, observation, now)` is a pure function.
  An absent or non-ok observation yields `unknown` — never a match and never a drift.
- **Merging is additive**: a declared registry fact is replaced only where an observation covers
  that exact project and field, and the declared value is kept in the fact's note. With no
  observations the read model is identical to v0.1's.

## Typed resource catalog and graph (v0.2, OG-REG-004, OG-MAP-002)

`src/resources.ts` derives a catalog from the pinned snapshot and the validated observations —
nothing is fetched, no DNS is queried, no provider API is called and no directory is scanned.
The same snapshot always produces the same catalog, sorted by identifier.

| Kind | Derived from | Identifier |
|---|---|---|
| `repository` | `canonical_repo` (SSH or HTTPS form, parsed; an unparseable value yields no resource) | `repository:<host>:<owner>/<repo>` |
| `checkout` | `intended_local_path`, `current_local_paths[].path`, `git_state.path` | `checkout:<device>:<path>` |
| `domain` | `intended_url` (declared) and `production_state.serving_deployment.aliases` (observed) | `domain:<hostname>` |
| `deployment` | `production_state.serving_deployment` | `deployment:<provider>:<id>` |
| `document` | the SHA-256-verified sources of this build | `document:<file name>` |

`<device>` is `undeclared`: the registry declares paths, not machines, and an observation records
a path, not a device. Device attribution arrives with OG-DEV-002 (v0.4). A checkout becomes
`observed` only where an observation covers that exact path with status `ok`; a failed, stale or
differently-pathed observation leaves it `declared`.

Edges are typed and directional, and every one carries a truth kind and a source path. The types
are exactly those in [02 §3](02-DOMAIN-MODEL.md#3-relationship-types): `platform_parent`,
`consumed_by`, `depends_on`, `successor_of`, `source_repository`, `checked_out_at`,
`deployed_on`, `serves`. **Ownership is `platform_parent` and nothing else** — a shared
repository or a shared production host is flagged as shared, never turned into ownership, and
Artemis never owns an AgoraXAI Atlas row. The eight declared v0.1 edges are preserved inside the
typed graph.

### Legal entities (OG-REG-005, OD-05)

A legal entity is declared data about **existence**, kept in `config/entities.json` rather than in
the pinned registry. `legal_entity:great-order-llc` (Great Order LLC) is recorded with truth
`declared` and source `owner-confirmed`. Nothing about ownership follows from it: ownership of a
product, platform, domain, repository, venture, intellectual property or contract appears only
where the owner declares that exact relationship, and every product without such a declaration
reports `undeclared` with truth `unknown`. An entity is never a graph node and never an edge
endpoint, and no entity is defaulted, inherited from a platform parent or inferred from a name.

## Normalized Project

`Project` contains ID, name, source category, taxonomy, lifecycle, evidence class, path/repository/URL/deployment/backend Facts, blocker strings, inferred next action, risk, health, risk band, score reasons, and the untouched raw row.

`Fact = {value, kind, source, note?}`. Nulls display as Unavailable and use `unknown`. Intended URLs and paths use `inferred`; actual source-recorded values may be observed. No canonical checkout is invented from the first current path. Projects without a designated path show unknown and expose recorded locations separately.

Evidence classes:

| Kind | Meaning |
|---|---|
| observed | The registry reports verified evidence. This build did not remeasure the underlying system. |
| inferred | Reported/unverified, intended, declared design relationship, or derived heuristic. |
| unknown | Missing or explicitly unresolved evidence. |
| blocked | Constraint on an operation or observation; independent of whether source facts were observed. |

`verified (metadata and digests only — contents never read)` maps to observed but retains the full bounded source text. `reported` maps to inferred with original evidence_level preserved in the raw drawer. The Pınar live schema hypothesis remains inferred; the DayOS live backend remains unknown even though migration files were measured.

## Taxonomy

AGORAXAI_UMBRELLA → AgoraXAI (1); AGORAXAI_PLATFORM → AgoraXAI Atlas (2); ARTEMIS_PLATFORM → Artemis (4); PRODUCT → Products (4); VENTURE → Ventures (3); LAB → Labs (1); ARCHIVE → Archive (1); NOT_A_PROJECT → Security artifacts (1).

The graph uses `platform_parent` for an observed ownership edge, `successor_candidate` for an inferred historical edge, and `consumed_by` for inferred dependencies. It never turns shared repositories into ownership. There are 8 explicit edges: 1 parent, 1 historical, and 6 declared consumer relationships.

## Risk rule version risk-v0.1

These weights are proposed application heuristics, not owner-provided ratings or measured probability.

| Signal | Points |
|---|---:|
| Unknown row evidence | 30 |
| Reported row evidence | 15 |
| Recorded constraints | 10 each, capped at 30 |
| Pınar highest schema exposure | 40 |
| Lifecycle explicitly blocked | 35 |
| Security-review lifecycle | 40 |
| Missing expected route recorded | 15 |
| Artemis side-branch production divergence | 25 |
| Stale FCC bundle | 20 |

Constraints comprise explicit `blockers`; Pınar severity; FCC remote block and backup gap; ERP prohibited actions; security-artifact environment divergence; and Artemis transition prerequisites not beginning with MET. Scoring the count of constraints is intentionally coarse, not a probability model. Open decisions are retained without automatically treating every decision as a blocker.

`risk = min(100, sum(points)); health = 100 − risk`. High: risk ≥ 60; Elevated: ≥ 30; Lower: < 30. Every reason includes a source path. With current evidence, Pınar is 85 and ERP is 65. No scored signals does not establish safety. There are no random or synthetic health readings.

## Drift

Source SHA precedence: `git_state.head`, `git_state.post`, `manager_branch.sha`, then the explicitly recorded HEAD in `current_local_paths`. Source branch follows the corresponding registry context. These are recorded development/feature refs, not a designated release target.

Only the six rows with evidence of a shared Artemis production surface are associated with `production_state.serving_deployment.git_commit_sha`: Artemis Omni, DayOS, Pınar, Workbench, Rainbow Botanics, ERP. The shared host SHA is not evidence that every row is deployed there. Route absence is displayed separately. Compare exact SHAs only when both exist; otherwise status is Unknown. No ahead/behind, release distance, outage duration or time lag is calculated.

## Local approval simulation

`Workspace = {version:1, entries:Entry[], log:ActionLog[]}`.

`Entry = {id,title,stage,note,updatedAt,demo:true}`.

`ActionLog = {id,itemId,from,to,note,at,demo:true}`.

Sequential path: PROPOSED → EVIDENCE → REVIEWED → OWNER_APPROVED → EXECUTING → VERIFIED → COMPLETED. EXECUTING and VERIFIED may terminate at ROLLED_BACK. Terminal states cannot advance. Transition notes require at least 8 characters and the UI caps them at 2,000. Local timestamps record simulation interactions. Owner identity, real authorization and execution evidence are unavailable.

## Adapter observations

`Observation<T>` includes projectId, field, value/null, evidence class, adapter/resource source, observedAt, collectedAt, expiresAt, status, and reason. Disabled adapters set value/observedAt/expiresAt to null and status/evidence to blocked. collectedAt is the real instant a local stub response was requested, never a claimed service observation time.
