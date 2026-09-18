# ADR-0007 · Exact-allowlist origin, superseding the zero-remote audit rule

Status: **PROPOSED** (design owner-authorized 2026-09-18; execution deferred — see
[Deferred execution](#deferred-execution)) · supersedes the open risk noted in
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
   exactly `https://github.com/yazilimlar/octopusg-control-plane.git`. Any other remote, any
   additional remote, or that URL under a different name still fails the audit — the check gets
   narrower in what it forbids, not broader in what it permits.
2. **The repository must be private before any push.** Visibility is verified private *before* the
   first push, and re-verified after — never assumed.
3. **The remote is the recovery copy, once verified.** OG-SEC-008 closes only after (a) the push
   completes, (b) the remote's default-branch HEAD and the `v0.2.0` tag are confirmed byte-equal to
   local, and (c) visibility is confirmed private. Until all three hold, OG-SEC-008 stays
   `PROPOSED`.
4. **CI and preview follow the same repository, nothing else.** GitHub Actions CI runs only the
   existing `npm ci --ignore-scripts`, `npm run validate`, `npm run validate:spec` — no new
   commands, no secrets. A Vercel project may link to this one repository for **preview
   deployments only**; production deployment and any custom domain stay out of scope for this ADR.
5. **No other Never-list item moves.** Supabase, Gmail, Calendar, social, banking, Squarespace,
   DayOS and every other external account stay untouched. This ADR authorizes exactly one GitHub
   remote and one Vercel preview project, nothing else.

## Deferred execution

This ADR is **designed and recorded**, not **enacted**, in this session:

- `scripts/audit.mjs` is **not modified** here — CLAUDE.md rule 7 forbids loosening it, and the
  change described in Decision §1, however narrow, is a loosening. It takes effect only after the
  owner accepts this ADR (moving its status to `ACCEPTED`) and a session with the corresponding
  permission — CLAUDE.md's Never list edited by the owner, not asserted in a chat turn — makes the
  edit.
- No `git remote add`, `git push`, GitHub repository creation, or Vercel action was performed.
  Those remain session-Never-list items independent of this ADR's content
  ([S7#session-execution-boundary](../sources/S7-2026-09-18-owner-v03-platform-foundation-authorization.md#session-execution-boundary)).
- What *is* prepared: the CI workflow file (inert until the repository exists on GitHub — see
  `.github/workflows/validate.yml`), this design record, and the requirement/roadmap updates
  tracking it as `PROPOSED`/`IMPLEMENTED` where a local artifact genuinely exists, never
  `VERIFIED`.

**Exact checklist for the session (owner-run, or an explicitly re-permissioned session) that
performs the deferred steps:**

1. Edit `CLAUDE.md`'s Never list and `.claude/settings.json` to reflect the allowlist exception (a
   visible, owner-made change — not inferred from this ADR alone).
2. Apply the `scripts/audit.mjs` change in Decision §1; run `npm run validate` to confirm the
   audit still passes with zero remotes (unchanged local state).
3. Create the private GitHub repository `yazilimlar/octopusg-control-plane`; verify visibility is
   private via the API or UI before proceeding.
4. `git remote add origin https://github.com/yazilimlar/octopusg-control-plane.git`.
5. Push all branches and the annotated `v0.2.0` tag.
6. Verify remote default-branch HEAD SHA and tag SHA equal local; verify visibility is still
   private.
7. Move OG-SEC-008 to `VERIFIED` with the confirmed hashes recorded in
   `docs/evidence/WP-13.md`, and move the `platform-resilience` capability out of `PLANNED`.
8. Push again (or open a PR) to exercise the CI workflow; confirm it is green.
9. Create/link the Vercel project, deploy a preview, enable the strongest $0-tier protection,
   verify the deployed commit SHA, and record the protected preview URL and protection status in
   evidence. If protected-at-$0 is impossible, do not deploy — record the blocker instead.

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
− Until the deferred steps run, OG-SEC-008 and `platform-resilience` remain exactly where they were
  before this session — this ADR changes what closing them requires, not their current status.
