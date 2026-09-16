# Data model, evidence semantics and scoring

## Source snapshot

`data/schema.json` documents the portable snapshot and observation contract (JSON Schema 2020-12). `src/model.ts`, `src/workflow.ts` and `src/connectors.ts` are the TypeScript contracts. The importer actively validates YAML parse errors/duplicate keys, registry version 1.4, row count 17, required project strings, unique IDs, known categories, and checklist extraction count. The JSON Schema is documentation; there is no runtime dependency on a JSON Schema validator. Tests compare the entire parsed registry with the generated snapshot.

Snapshot fields:

- `schemaVersion: 1`
- `classification`: umbrella `AGORAXAI_UMBRELLA`, kind `INTERNAL_PLATFORM`, visibility `private`, codename `Octopus`
- `asOf`: source date, not current collection time
- `sources[]`: basename and SHA-256 of each of the three copied source documents
- `registry`: lossless parsed YAML; original per-project optional fields are retained
- `approvalCandidates[]`: checklist ID, title, source excerpt, and source reference. No imported approval status is inferred.

The registry remains exactly 17 rows. The new Control Plane is classified in snapshot metadata and is not silently inserted as an 18th registry project. `NOT_A_PROJECT` remains visible under Security artifacts.

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
