# Evidence — WP-03 repair 01 (macOS path canonicalisation)

Date: 2026-09-18 · Implementer: Claude (Cowork session) · Reviewer: owner on macOS
Branch: `octopusg/fix-observer-macos-paths`, from Batch B `f2ad90d`.
Requirement: OG-OBS-001 (already VERIFIED; this repair preserves its acceptance, and adds none).

## Symptom

On the owner's Mac, `npm run validate` passed ingestion, typecheck and build, and the unit suite
reported 92 total, 88 passed, 4 failed — all four in `tests/observe.test.ts`:
observed fields `['repository']` instead of the four expected; an undefined `working_tree`
record; a non-repository refused with `path resolves elsewhere (symlink escape)`; and a freshness
of `not-collected` where `fresh` was expected. The suite passes on Linux.

## Root cause — one defect, four symptoms

`mkdtempSync(join(tmpdir(), …))` returns a path under `/var/folders/…` on macOS, and `/var` is a
symlink to `/private/var`. `resolveTarget` requires `realpath(declared) === declared`, so every
fixture repository was refused as a symlink escape **before** any Git command ran. `observeTarget`
then returns its single `repository` failure record, which is exactly what each of the four
assertions saw.

Reproduced on Linux by running the **unmodified** `f2ad90d` source and tests with `TMPDIR` behind
a symlinked prefix (`<root>/var` → `<root>/private/var`):

| Run | Result |
|---|---|
| `f2ad90d` source + `f2ad90d` tests, aliased `TMPDIR` | 10 tests, 6 passed, **4 failed** — the same four, with the same messages as the Mac transcript |
| `f2ad90d` source + fixture root canonicalised | 10 tests, **10 passed** |

So failures 1, 2 and 4 are consequences of failure 3, and the defect is in the test fixture, not
in the observer's behaviour on a real allowlist.

## Repair

**Test fixture (the actual defect).** `scratch()` now canonicalises the temporary root with
`realpathSync` before any fixture path is built, so a fixture is never mistaken for a redirect.

**Production (deliberate, narrow hardening).** `resolveTarget` still requires the canonical path
to equal the declared path, with one exception: a closed, platform-scoped table of whole-prefix
aliases the operating system itself publishes — on macOS `/var → /private/var`,
`/tmp → /private/tmp`, `/etc → /private/etc`; empty on every other platform. Without it, a Mac
owner who lists a repository under `/tmp` or `/var` is refused with a misleading "symlink escape".
The rewrite is a whole-prefix match (`/variant` is not `/var`), and the alias table is injectable
for tests only.

## The security invariant is unchanged

| Case | Before | After |
|---|---|---|
| Declared path is a symlink to another repository | refused | **refused** |
| Symlink inside an aliased area (`<root>/var/listed` → another repo) | refused | **refused** (new test) |
| `..` traversal, globs, relative paths, duplicates | refused | refused |
| Path inside another repository, missing path, non-repository | refused | refused |
| Timeout, no-write, counts-only, names-only, atomic ignored output | unchanged | unchanged |
| Path under a documented OS alias prefix | refused (misleading reason) | resolved, and the **declared** path is still what gets stored |

## Tests

Added to `tests/observe.test.ts`:

- *a documented platform alias is not a symlink escape (macOS /var → /private/var)* — builds the
  macOS layout on any platform, asserts refusal without the alias table, resolution with it, four
  ok records through the aliased path, the declared path still stored, the exact darwin table, an
  empty table on other platforms, and that `/variant` is not rewritten.
- *an alias table never lets a real symlink through* — a symlink inside the aliased area and a
  plain symlink are both still refused, and the observation is an `error` record with a null value.

## Validation in this environment

| Command | Result |
|---|---|
| `npm run validate` | PASS · **94/94** unit tests (92 plus the two new) · typecheck · build · audit PASS, 0 credential-pattern matches, 0 remotes (95 files in a clean clone of this commit; 96 in the working copy, which also carries the ignored `Claude outputs/` directory — `scripts/audit.mjs` skips only `.git`, `node_modules` and `work`) |
| `npm run validate:spec` | PASS · 89 requirements · 33 capabilities · 0 warnings |
| `tests/observe.test.ts` with `TMPDIR` behind a symlinked prefix | 12/12 |
| `tests/browser.mjs` (throw-away copy, bundled Chromium) | **21/21**, executed on this branch: same checks as WP-10, 0 page errors, 0 external requests |

## What this cannot prove

Everything above ran on Linux. The macOS layout was emulated with a symlinked prefix, which
reproduces the reported failures exactly, but it is an emulation: real `/var/folders` behaviour,
the owner's Node build and macOS Git are not exercised here. **This repair is provisional until
`npm run validate` passes on the Mac.**

## Files

Modified: `src/observe.ts` (platform alias table, injectable for tests; `resolveTarget` and
`observeTarget` accept it), `tests/observe.test.ts` (canonical fixture root, two regression
tests), `docs/07-DEVICE-AGENT-SPEC.md` (the rule as built).
Regenerated: `data/requirements.json` (the ledger projection now lists this evidence file under
OG-OBS-001; `npm run validate:spec` fails if it is stale).
Added: `docs/evidence/WP-03-REPAIR-01.md`.

No requirement status changed, no other Batch B behaviour was touched, and nothing was installed,
pushed or contacted.
