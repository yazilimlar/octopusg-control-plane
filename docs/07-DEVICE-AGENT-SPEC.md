# 07 · Device Agent Specification

Status: **CONCEPT** (target v0.5) · Only the v0.2 local Git observer is specified in detail
now; the rest is written just-in-time at the start of Block 5.
Source: [S2 Multi-device control](sources/S2-2026-09-17-gpt-planning-thread.md#multi-device-control).

## 1. v0.2 — local Git observer (a CLI, not an agent)

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
- Never: fetch, pull, write, read file contents, read `.env*`, follow symlinks outside the path.

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
