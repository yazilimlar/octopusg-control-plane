# OD-03 containment register and runbook

Status: **Open** · created 2026-09-25 under
[S14](../sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions) ·
governs [OD-03](../09-ROADMAP.md#owner-decisions) and `OG-SEC-004`.

OD-03 requires every known plaintext-secret exposure covered by existing governance to be
contained ([06 §5](../06-SECURITY-AND-APPROVALS.md#5-secrets)). S14 authorizes **no exception**.
An open exposure blocks G3 for a proposed connector when it can materially compromise that
connector, its credential/provider boundary, its target system, its execution host or runtime, or
another relevant shared trust domain; otherwise it remains mandatory security debt without
automatically blocking an unrelated connector
([S14 decision 6](../sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions)).
Every G3 record states its relevance determination for every open item below.

**This file never contains a secret value.** It records locations, metadata, digests already
published in the pinned registry, decisions and evidence references only. Nothing in this file
authorizes deleting, moving, reading or rotating anything; each containment action below is an
owner-executed step, and steps that could affect live systems need their own authorization.

## States

```text
discovered → review required → containment action → evidence → contained
```

The event log is **append-only**. A later row supersedes an earlier one for the same item; no row
is edited or removed. Historical exposure records in the registry, the archive and the sources are
preserved as they are. An item may also end in `closed — not an exposure`, but only with evidence
and an owner decision.

OD-03 is satisfied when every item below reaches `contained` (or `closed — not an exposure`) with
evidence, and the owner records that in a source record. Until an item relevant to a proposed
connector reaches that state, `OG-SEC-004`'s precondition evaluates to "unresolved exposure" for
that connector and its G3 may not be granted.

## Register

| ID | Exposure (no values) | Where it is recorded | Current state |
|---|---|---|---|
| X-01 | Artemis Omni Vercel environment backup: a Desktop folder holding development, preview and production environment files | Pinned registry row `vercel-env-backup-artemis-omni` (`SECURITY_REVIEW_NEEDED`; metadata and digests only, contents never read); [Gate 3 checklist A4](../../data/GATE_3_APPROVAL_CHECKLIST.md); [06 §5](../06-SECURITY-AND-APPROVALS.md#5-secrets) | review required |
| X-02 | Artemis Omni `.vercel/.env.preview.local` in the main-oriented Artemis Omni checkout on the Desktop. Its digest differs from X-01's preview file: two distinct preview environments | Same registry row (`preview_comparison`); registry `projects[artemis-omni].current_local_paths` | review required |
| X-03 | Prime Industrial ERP: hard-coded Plaid, Gmail/SMTP (app password duplicated in plaintext), Squarespace and session secrets. The ERP's live invoice cron sources a `.env` file in the same Desktop folder; whether that file is part of X-03 is unverified | [S3 Change 4](../sources/S3-2026-09-17-claude-review.md#change-4--security-containment-first); [06 §5](../06-SECURITY-AND-APPROVALS.md#5-secrets); archived historical map (non-authoritative UX prototype, [manifest](../archive/MANIFEST.md)); registry `projects[prime-industrial-erp].active_automation` | review required |

**Considered and not registered.**

- *Supabase key architecture.* Unidentified; the recorded containment plan in
  [S3 Change 4](../sources/S3-2026-09-17-claude-review.md#change-4--security-containment-first) and the
  archived map included "Identify Supabase key architecture" and "Rotate Supabase/Postgres
  safely". That history is unchanged, but an unidentified architecture is not evidence of a
  plaintext exposure. It is a WP-17/G3 security-preflight unknown
  ([S14 decision 10](../sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions);
  [roadmap](../09-ROADMAP.md#wp-17-preflight-unknowns)).
- The registry's `secret-scan-wrong-set` and
`fcc_remote_blockers` records describe a pre-push *scanner defect* and an unverified history scan
for the Financial Command Center, not a known exposure. They stay governed by their own records.

## Relevance to the proposed DayOS Supabase connector (WP-17)

Determined from non-secret canonical evidence only. No secret content was read.

| Item | Relevant to WP-17 G3? | Basis |
|---|---|---|
| X-01 | **Yes — blocks** | Presumptively relevant (S14): Artemis Omni hosts DayOS, and the historical map links Artemis to Supabase as "env-linked / verify" |
| X-02 | **Yes — blocks** | Same: an Artemis Omni preview environment in an Artemis Omni checkout |
| X-03 | **UNKNOWN — not established** | Remains mandatory security debt. *Target system:* no canonical evidence links the ERP secrets (Plaid, Gmail/SMTP, Squarespace, session) to Supabase or DayOS; the map shows no ERP↔Supabase link. *Credential/provider boundary:* the connector's credential would be a Keychain reference (WP-16); nothing shows the ERP secrets grant Keychain access. *Execution host:* co-resident — the ERP runs at login on the same Mac (`launchd`, cron) that the owner-run collector would use (`personal-mac`), and its cron `.env` sits in the same Desktop folder as X-02 — but no evidence shows the exposed values can compromise that host. *Shared identity:* DayOS has Google OAuth routes and the ERP uses Gmail/SMTP; whether they share a Google account or client is not recorded. Under S14 an unestablished relationship does not block by itself; the WP-17 G3 record must restate this determination with any new evidence |

## Event log (append-only)

| Date (first recorded in canon) | Item | Transition | Evidence / reference | Recorded by |
|---|---|---|---|---|
| 2026-09-15/16 | X-01, X-02 | → discovered | Registry v1.4–v1.6 row `vercel-env-backup-artemis-omni`; permissions hardened at Gate 1B (700/600), iCloud sync confirmed off by owner | Registry (pre-existing) |
| 2026-09-17 | X-03 | → discovered | S3 Change 4; archived historical map | S3 (pre-existing) |
| 2026-09-18 | X-01…X-03 | → review required | OD-03 owner decision ([S6](../sources/S6-2026-09-18-owner-brand-decisions.md#v02-gate-decisions)); 06 §5 | OD-03 (pre-existing) |
| 2026-09-25 | X-01…X-03 | review required (confirmed; no exception; WP-17 relevance: X-01, X-02 yes, X-03 unknown) | S14 decisions 6 and 10 | Owner via S14 |

## Runbook (owner-executed; nothing here runs automatically)

Rules for every step: never open, print, paste, copy into chat or commit a secret value; record
only file names, byte sizes, dates, digests, provider-side confirmation that a rotation happened,
and the owner's decision. Take a verified backup before any destructive step. Stop and record if a
step would affect a live system not named in its authorization.

**X-01 / X-02 — Artemis Omni environment files** (Gate 3 A4)

1. *Decide* the encryption mechanism you operate (for example an encrypted macOS disk image).
   Record the decision, not the passphrase.
2. *Create one encrypted recovery copy preserving both preview environments* (A4 constraint).
   Evidence: archive name, location, byte size, creation date, and that both source digests
   (`28339aca…`, `290d77d6…`) were included.
3. *Investigate which preview environment is stale*, comparing against Vercel, the authoritative
   store, in the Vercel dashboard. Evidence: which one matches, as a statement only.
4. *Separate authorization required:* remove the plaintext copies (Desktop backup folder;
   `.vercel/.env.preview.local`), then decide whether any exposed value needs rotation in its
   provider. Evidence: removal confirmation by path; provider-side rotation confirmation by name.
5. Append `contained` for X-01 and X-02 with the evidence references.

**X-03 — Prime Industrial ERP secrets** (live system: invoice automation every four hours)

1. *Inventory by name only*: which secrets exist and where they are read from. Do not move the
   ERP folder, scripts or databases (registry: prohibited until unblocked).
2. *Plan rotation per provider* (Plaid, Gmail app password, Squarespace, session secret) with a
   cut-over that keeps the invoice cron working; take a verified backup of the ERP databases
   together with their `-wal`/`-shm` sidecars first (registry `data_handling_warning`).
3. *Separate authorization required* for each rotation and for any change to how the ERP reads
   secrets (for example moving to Keychain wrappers).
4. Evidence per secret: rotation confirmed in the provider (by name and date), the old value
   confirmed revoked, and the ERP confirmed working after cut-over. Append `contained`.

When the items relevant to a proposed connector are `contained` or `closed — not an exposure`, the
owner records that in a new source record; only then may that connector's G3 be considered. For
the DayOS Supabase connector that means X-01 and X-02, plus X-03 if its relevance is established,
and the WP-17 preflight unknowns in the [roadmap](../09-ROADMAP.md#wp-17-preflight-unknowns).
Items that do not block a connector remain open security debt until contained.
