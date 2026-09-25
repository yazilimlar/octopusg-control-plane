# Evidence — MAINT-01 (local observations as a git-ignored overlay)

Date: 2026-09-25 · Proposed branch: `maint/local-observation-overlay` · Base:
`c2245c91b652ba9d77dfc6969371f2388944677f` (`origin/main`). Maintenance, not a work package;
semantically separate from WP-17.

## Scope and authority

Authorized for preparation by owner source record S14 (decision 7), which lands with the
separate governance change `governance/canonicalization-2026-09-25`; this record links it by
name so the two changes stay independent. It settles the debt named in
[S11](../sources/S11-2026-09-22-owner-wp18-authorization.md#decisions) decision 9. Requirements: OG-DATA-001 and
OG-DATA-002 (behaviour of the read model unchanged). Required invariant: a clean canonical
checkout and a legitimate local checkout containing governed observations must both pass
validation without treating locally generated observation state as canonical truth.

## Root cause

`npm run build` wrote validated local observations (from git-ignored
`work/observations/latest.json`) into the **tracked** `data/snapshot.json`. Local state therefore
became a modification of a canonical file, and `tests/truth.test.ts` "with no observations the
read model is exactly the v0.1 one" failed on any machine that had run the observer (180/181 in
WP-16 and WP-18). CI never saw it, because a clean checkout has no observation file.

## Change

- `scripts/import-registry.mjs`: the tracked snapshot always carries the empty observation block.
  Validated observations go to the git-ignored overlay
  `work/observations/snapshot-observations.json`, rewritten on every run (empty when no collector
  file exists, so it cannot go stale).
- `scripts/build.mjs`: injects the overlay into the local bundle at build time; no overlay means no
  observations.
- `src/main.ts`: reads observations from the injected overlay instead of the snapshot.
- `data/schema.json`: comment updated to describe the canonical/overlay split. Shape unchanged.
- `tests/truth.test.ts`: the strict assertion that the tracked snapshot carries no observations is
  **kept unchanged**. The build test now also proves that the tracked snapshot is byte-identical
  with and without a local observation file, that the overlay carries the validated records, that a
  secret-shaped value reaches neither file, and that removing the observation file empties the
  overlay. A new test builds the bundle with and without an overlay and proves observations reach
  the local runtime only through it.

Rejected alternative: relaxing the assertion to "if observations are present they must be valid"
(13 lines). It makes the suite green but keeps local state in a tracked file and removes the only
test-level guard against committing local observations as canonical truth.

## Requirements

No status changes. OG-DATA-001 and OG-DATA-002 keep their current status.

## Validation

| Check | Result |
|---|---|
| `npm run validate`, clean checkout | PASS — 182/182, audit PASS, snapshot untouched |
| `npm run validate` with the owner's 8 local Git observations present | PASS — 182/182; `data/snapshot.json` untouched; observations present in the bundle |
| `OCTOPUSG_SNAPSHOT_MODE=check npm run validate` with observations present | PASS — snapshot check PASS, 182/182 |
| Same observations on unmodified `origin/main` | FAIL — 180/181 and `data/snapshot.json` rewritten (the debt reproduced) |
| `npm run validate:spec` | PASS |

Local results above were on Node 22 with type stripping; GitHub CI (Node 24) results are recorded
on the pull request.

## Protected working snapshot

The owner's modified working copy of `data/snapshot.json` (SHA-256
`e7449145951e5f509443996673847fb7ad6a6b1c9a3b7ecd2aa7b18d21edf01d`, referenced in WP-16 and WP-18
evidence) is protected local evidence. Adoption returns it to canonical content on the next build
and moves its observations to the overlay. An exact archival copy, its manifest and a proof that
its eight observations reproduce through the overlay are kept on the owner's machine in the
git-ignored `work/evidence/protected-snapshot-2026-09-25/` before any rewrite.

## Open questions
- Check-mode validation of a "preserved working snapshot" (WP-15, WP-16, WP-18 practice) is no
  longer needed once local observations live only in the overlay.
