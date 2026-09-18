# S7 — Owner authorization for the v0.3 platform foundation (2026-09-18)

> **Source record.** The owner (George Oktem) issued this direction directly, in the Cowork
> session of 2026-09-18 that follows WP-12 (`165397c`), approving the branded v0.2 implementation
> and authorizing a specific, bounded next step: an exact-allowlist exception to the zero-remote
> rule, a private GitHub repository, CI, and a protected non-production Vercel preview. It is
> recorded here verbatim in substance so the requirements it grounds have a governed source rather
> than `UNSOURCED`. Cite as `S7#<heading-slug>`.

---

## Owner authorization

The owner approved the current branded v0.2 implementation and its implemented requirements,
subject to successful local validation, and authorized, in this order:

1. Freezing the validated baseline as OctopusG v0.2.0.
2. Replacing the "zero remotes" audit rule with an **exact-allowlist** rule permitting only
   `https://github.com/yazilimlar/octopusg-control-plane.git`.
3. Creating that repository under GitHub account `yazilimlar`, **private**.
4. Pushing the complete OctopusG Git history to it, then verifying remote privacy and remote HEAD.
5. Treating the verified private remote as the required off-device recovery copy and, once
   verified, closing **OG-SEC-008**.
6. Adding GitHub Actions CI that runs the existing validation and specification checks.
7. Creating a Vercel preview project (`octopusg-control-plane`) on the $0/free tier, linked to the
   private repository, deploying a **protected preview only** — never production.
8. Preparing local, preview and production environment separation.
9. Updating ADRs, requirements, evidence, `SESSION_BRIEF.md` and operating documentation
   accordingly.

## Scope and budget

Budget is $0; no paid plan or paid feature is authorized. No production deployment, no production
domain, no DNS change. No Supabase, Gmail, Calendar, social media, banking, Squarespace, DayOS or
other external product connection in this session. No secret value is to be read, displayed or
committed; no `.env` file with credentials is to be created. No existing test or security check is
to be weakened. No local path, observation or internal portfolio data is to be exposed publicly.
The repository must never become public. No branch is to be deleted and no history rewritten.
Staging is exact-path only, never `git add -A`. No package installation beyond `npm ci` against the
committed lockfile.

## Session execution boundary

`CLAUDE.md`'s Never list — pushing, adding a remote, deploying, or calling
Vercel/GitHub/Supabase/Google/Meta/Tailscale/n8n — is enforced independently of this
authorization; it is a checked-in, session-level control (also enforced in
`.claude/settings.json`), not merely a missing-requirement gap that a source citation closes. This
authorization makes the **design** of the exact-allowlist exception (ADR-0007) and the **local,
inert preparation** of its supporting artifacts (CI workflow file, documentation) buildable in this
session. It does **not** by itself permit this AI session to run `git remote add`, `git push`,
create a GitHub repository, or perform any Vercel action — those require either the owner
performing them directly, or an explicit, separate edit to `CLAUDE.md` and `.claude/settings.json`
by the owner (not by this session, from this chat instruction alone), followed by a session
re-authorized under the changed rule.

## What was resolved this session

- The preflight checks passed: branch `octopusg/wp-brand-og-ui-007`, HEAD
  `165397c9fb1803f0985e5b9daf603b743f548519`, clean working tree, `npm run validate` (131/131,
  audit PASS, 0 remotes) and `npm run validate:spec` (PASS) all confirmed before any change.
- Work proceeds on `octopusg/v0.3-platform-foundation`, branched from that HEAD.
- The remote/push/CI-run/deploy actions themselves remain **not performed** in this session; see
  [ADR-0007](../decisions/ADR-0007-approved-origin-allowlist.md) for the deferred execution
  checklist handed back to the owner.
