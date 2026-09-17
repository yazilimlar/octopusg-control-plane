# 07 · Device Agent Specification

Status: §1 **BUILT** in WP-03 (OG-OBS-001, OG-DEV-001, OG-SEC-002); §2 remains **CONCEPT**
(target v0.5), written just-in-time at the start of Block 5.
Source: [S2 Multi-device control](sources/S2-2026-09-17-gpt-planning-thread.md#multi-device-control).

## 1. v0.2 — local Git observer (a CLI, not an agent) — built in WP-03

- Command: `npm run observe` (owner runs it; no schedule, no background process).
- Input: `config/observe.allowlist.json` — explicit list of `{product_id, path}` pairs. No
  home-directory crawl, no globbing.
- Allowed commands, via `execFile` with fixed arguments, a timeout, and `GIT_OPTIONAL_LOCKS=0`
  (so `git status` does not rewrite the index — observation must not modify the checkout):
  `git -C <path> rev-parse --abbrev-ref HEAD`, `git -C <path> rev-parse HEAD`,
  `git -C <path> status --porcelain=v1` (**counts only** are kept, never filenames),
  `git -C <path> remote` (names only; URLs are not stored).
- Output: `work/observations/latest.json` (git-ignored) with `observed_at`, `expires_at`
  (default 24 h), and per-path status: `ok` · `missing` · `not_a_repo` · `error`.
- Never: fetch, pull, push, clone, checkout, switch, add, commit, reset, clean, merge, rebase,
  submodule; never write anything into an observed repository; never read file contents, diffs,
  untracked filenames, `.env*`, Git configuration values, environment variables or hook output;
  never run repository hooks; never follow a symlink out of the declared path.

### As built (WP-03)

| Piece | Where |
|---|---|
| Command | `npm run observe` → `scripts/observe.mjs` (owner runs it; no schedule, no daemon) |
| Logic | `src/observe.ts` — allowlist validation, canonical path resolution, the five commands, counts-only status, atomic write |
| Policy and devices | `config/policy.json` (OG-SEC-002), `config/devices.json` (OG-DEV-001), checked by `src/policy.ts` and `src/devices.ts` |
| Allowlist | `config/observe.allowlist.json` — explicit `{productId, path}` entries; `~/` form so no user name is committed; globs, `..`, relative paths and duplicates are refused |
| Output | `work/observations/latest.json` (git-ignored), written 0600 to a temporary file and renamed; every record is validated by the WP-02 store first |

The exact argument vectors, all run through `execFile` with `GIT_OPTIONAL_LOCKS=0`,
`GIT_TERMINAL_PROMPT=0`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_ALLOW_PROTOCOL=`,
`-c core.hooksPath=/dev/null -c core.fsmonitor=false -c gc.auto=0` and a per-command timeout
(default 5 s):

```text
git -C <path> rev-parse --show-toplevel     repository root validation
git -C <path> rev-parse HEAD                current HEAD SHA
git -C <path> rev-parse --abbrev-ref HEAD   current branch name
git -C <path> status --porcelain=v1         counts only: staged / unstaged / untracked
git -C <path> remote                        remote NAMES only; `remote -v` is never run
```

Each run records `head_sha`, `branch`, `working_tree` (counts) and `remote_names` per repository,
or one record with status `unknown`/`error` and a reason for `missing`, `not_a_repo`, a symlink
escape, a path inside another repository, or a timeout. Freshness, confidence and drift come
from the WP-02 truth model.

**Only an enrolled, personally owned device may run it.** `canObserve` refuses an
employer-owned device, a device that is not enrolled, a trust zone without local access, and a
device that does not declare `read_git_status`.

## 2. v0.5 — enrolled device agent (concept)

Declared device record (example from S2):

```yaml
device:
  id: personal-macbook
  owner: gokmen
  trust_zone: personal
  capabilities: [read_git_status, launch_local_app, run_tests, update_approved_repo]
  prohibited: [read_secrets, arbitrary_shell, unattended_deletion]
```

Concept behaviors: authenticated enrollment; heartbeat and online status (via Tailscale,
v0.4); report checkouts and detect moved directories (ask before updating the registry);
execute only allowlisted, parameter-validated commands for an approved action ID; queue actions
while offline and run them only after re-validation on reconnect; return execution evidence.

Open questions for Block 5 (not decided now): agent language/runtime; transport (Tailscale
direct vs. outbound-only channel); Windows parity; update and uninstall procedure.

## 3. Never

Company-owned devices; arbitrary shell; secret reading; unattended deletion; self-granted
capabilities.
