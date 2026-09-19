# OctopusG — instructions for AI coding sessions

This file loads automatically in every Claude Code session started in this folder.
Keep it short. Detail lives in the files it points to.

## Identity

- Product: **OctopusG** (OctopusGinormous) — the AgoraXAI Portfolio Operating System.
- Technical subsystem: AgoraXAI Control Plane. Codename in code: `Octopus`.
- Repository: `~/Projects/agoraxai/control-plane`. Exactly one remote is permitted, named
  `origin`, at either the HTTPS form `https://github.com/yazilimlar/octopusg-control-plane.git`
  or the SSH form `git@github.com:yazilimlar/octopusg-control-plane.git` — both name the same
  repository, and that repository must be **private** (ADR-0007). HTTPS is the default and
  preferred form; SSH is approved because HTTPS pushes proved unreliable on the owner's network
  (confirmed empty `git ls-remote` after repeated HTTPS push attempts; SSH then succeeded). Do not
  rename, move, or create a second repository, and do not add any other remote.
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
   fail-closed. `scripts/audit.mjs` may be changed **only** to implement ADR-0007 Decision §1
   exactly — asserting that the remote set is either empty or exactly one `origin` at the approved
   URL. Never loosen it further.

## Owner-approved exception — ADR-0007 (accepted 2026-09-18)

Status: **ACCEPTED** by George Oktem. This exception is deliberately narrow.

Permitted, and only in this exact shape:

- `git remote add origin` at either
  `https://github.com/yazilimlar/octopusg-control-plane.git` (default/preferred) or
  `git@github.com:yazilimlar/octopusg-control-plane.git` (approved fallback — HTTPS pushes were
  unreliable on the owner's network; SSH is the currently configured origin)
- `git push origin …` to that remote (never `--force`, never `--delete`)
- `gh repo create yazilimlar/octopusg-control-plane --private`, `gh repo view` and read-only
  `gh api repos/yazilimlar/octopusg-control-plane/…` calls against it
- `gh run list` / `view` / `watch` to confirm CI
- Verify visibility is **private** before the first push and again after it. If it is ever public,
  stop and report.

## Never (also enforced in `.claude/settings.json`)

- Add any remote other than the one approved `origin` above; force-push; delete remote branches;
  rewrite history; make the repository public.
- Deploy to production, attach a production domain, or change DNS.
- Call Vercel from this machine. Vercel is operated by the owner from a separate authorized
  session; `vercel:*` stays denied here.
- Call Supabase/Google/Meta/Tailscale/n8n, or connect any other external account. That is always
  an owner action.
- Read `.env*`, keys, Keychain items, or any secret value. Never print or commit a token.
- Install or add dependencies (`npm ci` from the lockfile is fine).
- Delete files outside `work/` or `dist/`.

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
