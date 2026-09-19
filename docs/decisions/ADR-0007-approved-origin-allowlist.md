# ADR-0007 · Exact-allowlist origin, superseding the zero-remote audit rule

Status: **ACCEPTED** (design owner-authorized 2026-09-18; deferred-execution checklist steps 2–8
executed 2026-09-18 — see [Deferred execution](#deferred-execution); step 9 is owner-run elsewhere,
not this session's) · supersedes the open risk noted in
[ADR-0001](ADR-0001-existing-repository.md) ("the repository still has no remote (OD-02) — a
single-copy risk until resolved")

## Context

`scripts/audit.mjs` asserts the repository has zero Git remotes (`assert.equal(remote,'','No
remote allowed')`), and `CLAUDE.md` rule 7 says this script is never to be loosened. OD-02
recorded this as deliberate but unresolved: "decide the remote separately — it changes the audit's
zero-remote rule and needs an ADR" ([09-ROADMAP](../09-ROADMAP.md#owner-decisions)). OG-SEC-008
cannot move past `PROPOSED` without a confirmed off-machine recovery copy, and the
`platform-resilience` capability stays `PLANNED` because of it. On 2026-09-18 the owner authorized
a specific, bounded resolution: not "any remote," but one exact private repository
([S7](../sources/S7-2026-09-18-owner-v03-platform-foundation-authorization.md#owner-authorization)).

## Decision

1. **The zero-remote rule becomes an exact-allowlist rule.** `scripts/audit.mjs` will assert that
   `git remote` output is either empty or contains only one remote, named `origin`, whose URL is
   exactly one of two approved forms of the same repository:
   `https://github.com/yazilimlar/octopusg-control-plane.git` (default/preferred) or
   `git@github.com:yazilimlar/octopusg-control-plane.git` (approved fallback, added
   2026-09-18 during execution — HTTPS pushes proved unreliable on the owner's network,
   confirmed by an empty `git ls-remote` after repeated HTTPS push attempts; the SSH push then
   succeeded, verified by `git ls-remote` showing matching branch and `v0.2.0` tag SHAs). Any
   other remote, any additional remote, or either URL under a different name still fails the
   audit — the check gets narrower in what it forbids, not broader in what it permits.
2. **The repository must be private before any push.** Visibility is verified private *before* the
   first push, and re-verified after — never assumed.
3. **The remote is the recovery copy, once verified.** OG-SEC-008 closes only after (a) the push
   completes, (b) the remote's default-branch HEAD and the `v0.2.0` tag are confirmed byte-equal to
   local, and (c) visibility is confirmed private. All three now hold (2026-09-18); OG-SEC-008 is
   `VERIFIED`.
4. **CI and preview follow the same repository, nothing else.** GitHub Actions CI runs only the
   existing `npm ci --ignore-scripts`, `npm run validate`, `npm run validate:spec` — no new
   commands, no secrets. A Vercel project may link to this one repository for **preview
   deployments only**; production deployment and any custom domain stay out of scope for this ADR.
5. **No other Never-list item moves.** Supabase, Gmail, Calendar, social, banking, Squarespace,
   DayOS and every other external account stay untouched. This ADR authorizes exactly one GitHub
   remote and one Vercel preview project, nothing else.

## Deferred execution

This ADR was **designed and recorded** in one session, then **executed** (steps 2–8) in a later,
explicitly re-permissioned session on 2026-09-18. Both sessions' evidence lives in
[docs/evidence/WP-13.md](../evidence/WP-13.md) (design section, then an "Execution" section).

- `scripts/audit.mjs` was **not modified** in the design session — CLAUDE.md rule 7 forbade
  loosening it until the owner accepted this ADR and edited CLAUDE.md/`.claude/settings.json`
  themselves. The owner made that edit on 2026-09-18; the execution session then applied the
  Decision §1 change (and its later HTTPS+SSH amendment) under that permission.
- Step 1 (CLAUDE.md / `.claude/settings.json` edit) was done by the owner directly, then committed
  by the execution session at the owner's explicit instruction once the owner confirmed it was the
  intended Step 1.
- Steps 2–8 below are marked with their outcome. Step 9 (Vercel) was explicitly out of scope for
  the execution session and stays owner-run elsewhere.

**Checklist and outcome:**

1. ✅ **Executed by the owner directly.** `CLAUDE.md`'s Never list and `.claude/settings.json`
   updated to reflect the allowlist exception, then committed.
2. ✅ **Executed.** `scripts/audit.mjs` changed per Decision §1 (later amended same-day for the
   HTTPS+SSH allowlist); `npm run validate` confirmed the audit passed with zero remotes
   beforehand. See [WP-13 evidence, Execution §1](../evidence/WP-13.md#what-was-executed).
3. ✅ **Executed.** Private GitHub repository `yazilimlar/octopusg-control-plane` created; visibility
   verified private via `gh repo view` before any push.
4. ✅ **Executed.** `git remote add origin` (HTTPS first, then changed to the SSH form after HTTPS
   pushes proved unreliable — see the Decision §1 amendment above).
5. ✅ **Executed.** All local branches and the annotated `v0.2.0` tag pushed (via SSH).
6. ✅ **Executed.** Remote branch HEADs and the `v0.2.0` tag independently verified byte-equal to
   local via `git ls-remote` and `gh api`; visibility re-verified private. Full SHA table in
   [WP-13 evidence](../evidence/WP-13.md#local-vs-remote-shas).
7. ✅ **Executed.** OG-SEC-008 moved to `VERIFIED`; `platform-resilience` moved to `AVAILABLE`; this
   ADR moved to `ACCEPTED`.
8. ⚠️ **Not yet triggered — trigger-scoping gap, not a failed run.** The workflow file exists only
   on `octopusg/v0.3-platform-foundation`, not on `main`, so pushing `main` didn't fire the
   `push: branches: [main]` trigger, and no PR exists to fire `pull_request:`. `gh run list` shows
   no runs. Opening a PR would trigger it but needs `gh pr create`/`gh pr merge` permission this
   session does not have. See [WP-13 evidence, CI status](../evidence/WP-13.md#ci-status).
9. **Owner-run elsewhere**, not this session's — unstarted, as scoped from the start.

## Consequences

+ OG-SEC-008 gets an exact, reviewable path to closing instead of an open-ended "add a remote"
  risk.
+ The audit script's guarantee stays meaningful: it names precisely one allowed destination rather
  than accepting any remote.
+ CI and a protected preview become possible without weakening any existing local-only guarantee
  before this session ends.
− The repository gains an external dependency (GitHub, then Vercel) it did not have before; the
  audit script's simplest possible invariant ("no remotes, ever") is replaced by a slightly more
  complex one that must be kept in sync with the one approved URL.
− CI's protection (a green run before the risk is considered covered) is not yet exercised — see
  step 8's trigger-scoping gap above; the audit and evidence guarantees hold regardless, but the
  "GitHub Actions catches a regression before it reaches the recovery copy" benefit is not yet
  proven end-to-end.
