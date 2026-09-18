# OctopusG — instructions for AI coding sessions

This file loads automatically in every Claude Code session started in this folder.
Keep it short. Detail lives in the files it points to.

## Identity

- Product: **OctopusG** (OctopusGinormous) — the AgoraXAI Portfolio Operating System.
- Technical subsystem: AgoraXAI Control Plane. Codename in code: `Octopus`.
- Repository: `~/Projects/agoraxai/control-plane` (branch `main`, no remote). Do not rename,
  move, or create a second repository.
- Owner and final authority: George Oktem.

## Read before doing anything

@SESSION_BRIEF.md

Authoritative, in this order: `docs/00-PRODUCT-CONSTITUTION.md` →
`docs/requirements/REQUIREMENTS.yaml` → `docs/09-ROADMAP.md` → ADRs in `docs/decisions/`.
Chat history, reflogs, filenames and memory are **not** authoritative.

## Rules

1. Confirm `pwd`, `git branch --show-current` and `git status --short` before editing.
2. Work on exactly one work package (`WP-xx`) per session, on its own branch
   `octopusg/wp-xx-<slug>`. List the files you will touch before touching them.
3. Every change cites requirement IDs (`OG-XXX-nnn`). No requirement → stop and propose one in
   `docs/requirements/REQUIREMENTS.yaml` with status `PROPOSED`; do not build it.
4. Every requirement cites a source in `docs/sources/`. If none exists, write `UNSOURCED` and ask.
5. Report uncertainty. Never fill a gap with a guess about repository, registry or account state.
6. Done means: `npm run validate` and `npm run validate:spec` pass, the requirement's tests exist
   and pass, and evidence is written to `docs/evidence/WP-xx.md`.
7. Preserve v0.1 behavior unless a requirement says otherwise. The registry importer stays
   fail-closed. Never loosen `scripts/audit.mjs`.

## Never (also enforced in `.claude/settings.json`)

- Push, add remotes, deploy, or call Vercel/GitHub/Supabase/Google/Meta/Tailscale/n8n.
- Read `.env*`, keys, Keychain items, or any secret value.
- Install or add dependencies (`npm ci` from the lockfile is fine).
- Delete files outside `work/` or `dist/`.
- Connect external accounts. That is always an owner action.

## Commands

```sh
npm ci --ignore-scripts --no-audit --no-fund   # from lockfile only
npm run validate        # build + unit tests + local audit (v0.1 contract)
npm run validate:spec   # requirements, sources, links, traceability
npm run spec:write      # regenerate generated sections after editing REQUIREMENTS.yaml
npm run observe         # owner-run read-only Git observation of allowlisted repositories
npm run open -- <id>    # owner-run: open one allowlisted repository in the file manager
npm start               # http://127.0.0.1:4317
```
