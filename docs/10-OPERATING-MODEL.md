# 10 · Operating Model

Status: **PROPOSED** · How the owner and AI models build OctopusG without losing control.
Sources: [S1 AI collaboration model](sources/S1-2026-09-17-conversation-export.md#ai-collaboration-model),
[S2 Session startup protocol](sources/S2-2026-09-17-gpt-planning-thread.md#session-startup-protocol),
[S3 Session setup guidance](sources/S3-2026-09-17-claude-review.md#session-setup-guidance).

## 1. Roles

| Who | Does | Does not |
|---|---|---|
| Owner | Approves gates, authorizes accounts, accepts milestones, resolves OD items | Hand-edit generated sections |
| GPT | Architecture review, contracts, milestone review → `reviews/` files | Edit the working tree during a milestone |
| Claude | Implements one work package at a time, tests, writes evidence | Change scope, connect accounts, push |
| Other models (Gemini, DeepSeek, Codex) | Independent critique on request → `reviews/` files | Edit the same files in parallel |
| Git | Source of truth, history, isolation | — |

Evidence wins over model agreement. There is no voting.

## 2. Setting up a session (the minutiae)

1. **Folder.** Start the session *in the repository root*:
   `cd ~/Projects/agoraxai/control-plane && claude`. In Cowork, connect only this folder. The
   start folder decides what the model can see and which `CLAUDE.md` loads. Never start in `~`,
   `~/Desktop` or `~/Projects`.
2. **Branch.** `git switch -c octopusg/wp-nn-<slug>` before any edit. One package per branch.
3. **Context.** `CLAUDE.md` loads automatically and imports `SESSION_BRIEF.md`. Nothing else
   is needed at start; the model reads the listed requirement IDs on demand.
4. **Permissions.** `.claude/settings.json` blocks push, remotes, provider CLIs, network tools,
   `.env*`/key reads and dependency installs. Personal overrides go in
   `.claude/settings.local.json` (git-ignored). Keep deny rules; loosen only by ADR.
5. **Plan first.** Start in plan mode. The plan must list: requirement IDs, files to touch,
   tests to add, prohibited actions, and how acceptance will be shown.
6. **Fresh context.** One package per conversation. When a package ends, start a new session;
   long sessions drift.
7. **Parallel work.** Only with `git worktree add ../control-plane-wp-nn octopusg/wp-nn-…`, on
   non-overlapping files, one model per worktree.

## 3. Prompt for a work-package session

```text
Work package: WP-nn (see docs/09-ROADMAP.md).
Requirements: OG-…, OG-… (docs/requirements/REQUIREMENTS.yaml).
Start in plan mode. Confirm pwd, branch and git status. List the files you will change.
Implement only these requirements. Add the tests named in each requirement.
Finish with: npm run validate && npm run validate:spec, then write docs/evidence/WP-nn.md
(commands run, results, requirement status changes, open questions). Do not push.
```

## 4. Definition of done (per requirement)

Requirement exists with source → design reference in this pack → code → named tests exist
and pass → `npm run validate` and `npm run validate:spec` pass → evidence file → status moved
to `IMPLEMENTED` (by implementer) → `VERIFIED` (by owner at the milestone gate).

Requirement status values: `PROPOSED` · `APPROVED` · `IMPLEMENTED` · `VERIFIED` · `DEFERRED` ·
`REJECTED`.

## 5. Handoffs between models

- Reviews are files: `reviews/<milestone-or-WP>-<model>.md`, each finding tied to a requirement
  ID or file path.
- The implementer answers in the same file (`Response:` accept / reject with evidence).
- No model rewrites another model's document wholesale; changes arrive as diffs.

## 6. Adding something new

1. Put the conversation or note in `docs/sources/Sn-<date>-<slug>.md`.
2. Add or update a capability (status `CONCEPT`) and at least one requirement (`PROPOSED`) citing it.
3. `npm run spec:write` → `npm run validate:spec`.
4. The owner assigns a milestone at the next gate.

## 7. Sizing

A work package: one requirement family, ≈10 files or fewer, one branch, a pass/fail demo.
A connector: auth type × resources × webhooks × write actions — read-only connectors are small;
anything that sends messages or needs provider app review is large
([S3 Sizing rules](sources/S3-2026-09-17-claude-review.md#sizing-rules)).
