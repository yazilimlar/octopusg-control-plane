# ADR-0005 · Requirements must cite sources; traceability is generated

Status: **PROPOSED** · 2026-09-17

## Context
A coding session cannot see chat history. Requirements written without sources get invented
([S3 Change 1](../sources/S3-2026-09-17-claude-review.md#change-1--sources-must-be-in-the-repo)).
Hand-maintained traceability drifts.

## Decision
- Conversations and inspections are stored under `docs/sources/` and never edited afterwards.
- Every requirement and capability has `source:` entries of the form `S<n>#<heading-slug>`,
  checked by `scripts/validate-spec.mjs`.
- `docs/requirements/TRACEABILITY.md`, the capability table in `docs/03-CAPABILITY-ATLAS.md` and
  the status block in `SESSION_BRIEF.md` are generated (`npm run spec:write`) and checked for
  staleness (`npm run validate:spec`).
- Detailed acceptance criteria are required for the next milestone only; later milestones carry
  provisional criteria marked as such.
- Human approval identifies the governed object and intent. Machine-resolvable immutable
  identifiers are obtained from the authoritative system and cross-validated rather than manually
  retranscribed through chat; unresolved identity remains blocked.

## Consequences
+ Completeness can be checked mechanically and by a second model reading `docs/sources/`.
+ No drift between the YAML and the tables. − Editing requirements needs one extra command.
