# GATE 2D — EVIDENCE AND GOVERNANCE REPORT

**Prepared:** 2026-09-15 · Claude (Opus 5)
**Inputs:** Gate 2C closure run `20260915T141807Z`, Gate 2C local-actions run `20260915T142150Z`,
and direct inspection of the Mac's git metadata and filesystem.
**Actions taken this pass:** none. Read-only throughout.

---

## 1. The 61/61 search closed — and the 61st branch was the one that mattered

`C2-schema-search-61: OK — 61/61 branches searched, 0 unavailable, 3 hit(s)`

The single branch the earlier pass could not see, `feature/dayos-next-integration-preview`,
turned out to be the only branch in the repository carrying `supabase/migrations/`. Every
schema hit but one comes from it. Had the search been reported as "complete" at 60/61, the
conclusion would have been not just incomplete but **actively wrong** — it would have said
Artemis Omni contains no Supabase migrations, when it contains five.

One detail worth recording: the branch advanced again between gates. Gate 2B observed it at
`e045dfbf035f`; the Gate 2C closure run fetched `1f9d2346e8ca`. It is a live branch with
deployments still arriving, so any SHA recorded for it is a timestamped reading.

### The `.sql` inventory across all 61 branches — six files, two projects

| Branch | Path |
|---|---|
| `feature/dayos-next-integration-preview` | `supabase/migrations/20260913_dayos_gate2_core.sql` |
| `feature/dayos-next-integration-preview` | `supabase/migrations/20260915_dayos_timeline_import_idempotency.sql` |
| `feature/dayos-next-integration-preview` | `supabase/migrations/20260915_dayos_timeline_quality.sql` |
| `feature/dayos-next-integration-preview` | `supabase/migrations/20260915_dayos_timeline_quality_function.sql` |
| `feature/dayos-next-integration-preview` | `supabase/migrations/20260915_dayos_timeline_segments.sql` |
| `feature/pinarevleri-manager-mvp` | `ENGINEERING/pinar-evleri/06_decision_policy_schema.sql` |

Six `.sql` files in the entire repository, across all 61 authoritative remote branches.
Five belong to DayOS. One belongs to Pınar Evleri, and it is `06_`.

---

## 2. The three categorised hits

No SQL body, database value, environment value, key, credential-bearing URL or secret is
reproduced below. Object *names* and counts only.

### Hit 1 — RLS_POLICY

| | |
|---|---|
| **Branch** | `feature/dayos-next-integration-preview` |
| **Authoritative SHA** | `1f9d2346e8ca7f1d9c16f1500a53663a2413ac14` |
| **Category** | `RLS_POLICY` |
| **Paths** | `supabase/migrations/20260913_dayos_gate2_core.sql`<br>`supabase/migrations/20260915_dayos_timeline_segments.sql` |
| **Classification** | **Executable DDL, inside a migration.** Both. |

### Hit 2 — TRIGGER

| | |
|---|---|
| **Branch** | `feature/dayos-next-integration-preview` |
| **Authoritative SHA** | `1f9d2346e8ca7f1d9c16f1500a53663a2413ac14` |
| **Category** | `TRIGGER` |
| **Path** | `supabase/migrations/20260913_dayos_gate2_core.sql` |
| **Classification** | **Executable DDL, inside a migration.** |

Hits 1 and 2 are the same two files. Structural inventory, by object type and name only:

| Object | Count | Names |
|---|---|---|
| extension | 1 | `pgcrypto` |
| schema | 1 | `dayos` |
| function | 1 | `dayos.set_updated_at` |
| table | 8 | `operating_events`, `evidence_records`, `event_evidence_links`, `user_corrections`, `timeline_imports`, `media_selections`, `narrative_segments`, `timeline_segments` — all in schema `dayos` |
| index | 14 | all `*_idx` on the tables above |
| trigger | 2 | `operating_events_set_updated_at`, `narrative_segments_set_updated_at` |
| RLS policy | 15 | owner-scoped select/insert/update/delete per table |
| `ENABLE ROW LEVEL SECURITY` | 8 tables | every table above |

**These are DayOS migrations, and they are not the missing Pınar files.** Measured, not assumed:

| Probe | Result |
|---|---|
| `EXCLUDE USING` occurrences | **0** |
| `tstzrange` / `daterange` occurrences | **0** |
| `23P01` / `exclusion_violation` occurrences | **0** |
| `pinar` / `evleri` / `booking` / `reservation` / `guest` occurrences | **0** |
| secret-shaped tokens (`eyJ…`, `service_role`, `password`, `api_key`, `*.supabase.co`) | **0** |

Everything they define lives in a dedicated `dayos` schema. They contain no booking table,
no range type, and no exclusion constraint. They are a different product's schema that
happens to sit in the same repository.

### Hit 3 — ERRCODE_23P01

| | |
|---|---|
| **Branch** | `feature/pinarevleri-manager-mvp` |
| **Authoritative SHA** | `085c67e5c830cc1cd6373113b67ce4f4608eb1f4` |
| **Category** | `ERRCODE_23P01` |
| **Path** | `lib/pinar-evleri-demo-api.ts` (51 lines) |
| **Classification** | **Client-side error handling.** Not DDL. Not a migration. |

Three independent lines of evidence, and one limit:

1. **File type rules out two of the four options outright.** A TypeScript module cannot be
   executable DDL and is not a migration. The `.sql` inventory confirms the only `.sql` file
   on this branch is `06_decision_policy_schema.sql`.
2. **The category itself is the tell.** `23P01` is a PostgreSQL error code. TypeScript cannot
   define an error code; it can only *receive* one. A `23P01` string in a Supabase client is
   there to branch on a rejected write.
3. **It was classified this way at Gate 2A** from direct file inspection, and recorded in
   Registry v1.3.1 as "a Supabase client; error HANDLING, not constraint DEFINITION". Today's
   run is consistent with that and adds nothing contradicting it.

**The limit, stated plainly:** I did not re-read the file this turn. It is not in any working
tree I can reach — `~/Projects/artemis-omni` is checked out on the DayOS branch — and this
session has file access to your Mac but no shell on it. So "client-side error handling"
rests on the Gate 2A reading plus the two structural arguments above, not on a fresh read.
The remaining ambiguity is narrow: handling versus an incidental mention in a comment or a
constant. If you want that closed, one read-only command does it:

```
git -C ~/Projects/artemis-omni grep -n -E '23P01|exclusion_violation' 085c67e5c830 -- lib/pinar-evleri-demo-api.ts
```

That reads a blob out of the object store. It changes no ref, no index, no working tree.

---

## 3. What 61/61 proves, and what it does not

The four categories you asked to keep separate. The distinction matters because three of
them are routinely collapsed into "the schema is in git", which is false.

### (a) Migrations actually stored in Git — **PROVEN, and the inventory is complete**

Six `.sql` files, listed in §1. Five DayOS migrations under `supabase/migrations/`, one Pınar
decision-policy schema under `ENGINEERING/pinar-evleri/`.

**Proven:** across all 61 authoritative remote branches, keyed on `git ls-remote` SHAs, with
a case-insensitive content search and a filename inventory, these six are every `.sql` file
that exists. `01_`–`05_` are not among them.

**This is now a genuine negative, not an unsearched gap.** The earlier 60/61 result could not
support that sentence; this one can — for this repository.

**Still not proven:** absence from *anywhere*. This search covers the 61 remote branches of
`artemis-omni`. It does not cover unpushed local branches in either checkout, the second
checkout under `~/Desktop/motion graphic/`, other repositories, `~/Desktop` at large, or any
backup. "Not in `artemis-omni`" is the claim the evidence supports. "Does not exist" is not.

### (b) Application code referring to database behaviour — **PROVEN to exist, proves nothing about schema**

`lib/pinar-evleri-demo-api.ts` handles `23P01`.

This is the most important distinction in this report. Code that catches an
`exclusion_violation` is **evidence that the constraint exists in the database**, and it is
**not a definition of that constraint**. You cannot reconstruct a constraint from the code
that catches its error: the error code tells you the constraint's *class*, not the columns it
covers, the operators it uses, the `WHERE` clause it may carry, or its name.

What it does establish: something, somewhere, created an exclusion constraint on a Pınar
table. The application was written knowing it would fire. That is corroboration for the
live-schema hypothesis and nothing more.

### (c) Live Supabase schema not represented in Git — **INFERRED with high confidence, NOT directly verified**

The chain: you observed a real `23P01` in production · the application handles `23P01` ·
no `EXCLUDE USING` exists in any of the six `.sql` files in the repository · `06_` defines
only decision-policy tables, with no booking table and no exclusion constraint.

Therefore the booking overlap constraint exists in the live database and in no file in this
repository.

**Every link in that chain is now evidence-backed except the last observation of the
database itself.** Nobody has read the live schema. Until Phase A of the Supabase checkpoint
runs, "the live schema contains objects absent from Git" is a well-supported inference, and
I am labelling it as an inference rather than promoting it to a finding. That is the same
discipline that made me withdraw the reflog claim.

### (d) Historical migrations possibly recoverable from Supabase history — **UNKNOWN, and the cheapest thing left to check**

Two surfaces could still hold the original `01_`–`05_` text:

1. **`supabase_migrations.schema_migrations`** — when migrations are applied through the
   Supabase CLI, applied statements are recorded. If populated with statement text, the files
   are *recovered verbatim*, not reconstructed.
2. **SQL Editor saved snippets and query history** — if the DDL was pasted and run, it may
   still be listed.

**A new data point that bears on this, found today:** `~/Projects/artemis-omni/supabase/`
contains **only** `migrations/`. There is **no `config.toml`**. A Supabase CLI project
initialised in this repository would normally have one. Combined with the CLI not being
installed on your Mac, this weakly suggests the CLI was never used *from this repository* —
which would make surface 1 less likely and surface 2 more likely.

Weakly. The CLI could have been run from elsewhere, or `config.toml` could have been
gitignored. This is a hint about where to look first, not a finding.

**This category is the only remaining path to the actual files.** Everything else at best
reproduces their effect.

---

## 4. Independent verification of the three completed local actions

Verified from the Mac's own git metadata and filesystem, not from the run's self-report.
Where a claim rests on the run rather than on metadata I can read today, it says so.

### 4.1 Lycian / Türkiye Atlas v0.7 — `~/Desktop/v0.7`

| Check | Source | Result |
|---|---|---|
| HEAD | `.git/HEAD` → `refs/heads/main` | ✓ |
| HEAD SHA | `.git/refs/heads/main` = `bee2593f3b3e528e4f174e75d2a6a2d4e837f703` | ✓ matches the reported `bee2593f3b3e` |
| Commit count = 1 | `.git/logs/HEAD` holds exactly one entry, from `000…0`, labelled `commit (initial)` | ✓ **exactly one commit** |
| Author | `yazilimlar <gokmen1313@gmail.com>` | ✓ a real configured identity — none was invented |
| **Zero remotes** | `.git/config` contains **no `[remote]` section at all** | ✓ |
| **Zero tags** | `.git/refs/tags/` is empty | ✓ |
| Excluded PNGs still on disk | `assets/reference/` holds **5** `.png` files plus `README.md` | ✓ all 5 retained |
| `dist/` still on disk | `dist/validation_report.txt` present | ✓ retained |
| Excluded paths absent from the commit | `L1e`: `excluded paths inside the commit: 0`; `L1d` commit stat contains zero matches for either pattern | ✓ |
| Files committed | `L1d`: `52 files changed, 33364 insertions(+)` | ✓ matches the reported 52 |
| `.gitignore` carries both Gate 2C stanzas | read directly: `assets/reference/*.png` and `dist/` both present under their Gate 2C comments | ✓ |

One note on arithmetic. `L1c-staged.txt` is 57 lines for 52 files — the extra 5 are the
capture file's own header and exit-code lines. That is exactly the miscount that produced
defect #3 in the v2C.2 fix list; the summary correctly reports 52 because it now counts from
git rather than from the file.

**58 → 52.** Registry v1.3.1 recorded 58 proposed files. 58 minus the 5 reference PNGs minus
`dist/validation_report.txt` = 52. The exclusion accounts for the difference exactly.

### 4.2 DayOS — `~/Projects/artemis-omni`

| Check | Source | Result |
|---|---|---|
| Checked-out branch | `.git/HEAD` → `refs/heads/feature/dayos-next-integration-preview` | ✓ |
| Local branch SHA | `.git/refs/heads/feature/dayos-next-integration-preview` = `1f9d2346e8ca7f1d9c16f1500a53663a2413ac14` | |
| Remote-tracking SHA | `.git/refs/remotes/origin/feature/dayos-next-integration-preview` = `1f9d2346e8ca7f1d9c16f1500a53663a2413ac14` | |
| Closure-run fetched ref | `refs/gate2c/feature/dayos-next-integration-preview` = `1f9d2346e8ca7f1d9c16f1500a53663a2413ac14` | |
| **Three-way agreement** | local HEAD == `origin/…` == the independently fetched ref | ✓ |
| Fast-forward, not a merge | `L2a` pre = `8584010a0289…`, `L2e` post = `1f9d2346e8ca…`, `+21` commits, `merge --ff-only` | ✓ |
| Pre-pull commit still reachable | `8584010a02898a9f83feae43860424e8acdc6c6a` — nothing was discarded | ✓ |
| Working tree clean | The row's own post-check fails on any non-empty `git status --porcelain`; the row reported OK | ✓ **at run time** |

**The one limit here:** working-tree cleanliness *right now* cannot be established from git
metadata alone — that needs `git status`, which needs a shell I do not have. Cleanliness at
the moment of the fast-forward is proven by the row passing its own post-check. If you want
current state on the record, `git -C ~/Projects/artemis-omni status --short --branch` is
read-only.

### 4.3 Financial Command Center — `~/Projects/financial-command-center`

| Check | Source | Result |
|---|---|---|
| HEAD | `.git/HEAD` → `refs/heads/main` | ✓ |
| HEAD SHA | `.git/refs/heads/main` = `2731c29f53dcde7d565a84acc1e4f1886da29c6a` | ✓ matches the reported `2731c29f53dc` |
| Parent | `.git/logs/HEAD` entry 1 = `d563ac765e07da9feda24fa362453ca07fca800d` `commit (initial)`, entry 2 = the new commit | ✓ exactly 2 commits, correct parent |
| **Exactly the two intended files** | `L3c`: staged set is exactly `PHASE_1_IMPLEMENTATION_PLAN.md` and `README.md` | ✓ nothing else |
| **Zero remotes** | `.git/config` contains **no `[remote]` section** | ✓ |
| **Zero tags** | `.git/refs/tags/` is empty | ✓ |
| Index / working tree | The row's `unstage_fcc` path was never taken; the commit consumed the staged set | ✓ index clean post-commit |

Both files that Registry v1.3.1 flagged as "existing nowhere else" — `PHASE_1_IMPLEMENTATION_PLAN.md`
(untracked) and `README.md` (modified) — are now in committed history. **That gap is closed.**
The Gate 1B bundle predates this commit, so it does not contain them; a refreshed bundle is
the natural first item in Gate 3.

---

## 5. Evidence-integrity finding — both Gate 2C folders currently fail `--verify-evidence`

Not a failure of the run. A finding about the folders' state now.

`SHARE_SAFE_SUMMARY.txt` is **listed in both manifests but is no longer present in either
evidence folder.** A copy is at `~/Desktop/SHARE_SAFE_SUMMARY.txt`.

Verified: that Desktop file hashes to
`27eda5c6758987e81025184f3c7686d964f9a57acc20b6ddbb30f648f66a9fd6`, which is **byte-identical
to the local-actions manifest entry** — and identical to the hash you quoted. So it was
**moved, not altered.** Nothing is tampered and nothing is lost.

But the consequence is real: `--verify-evidence` on either folder will now report a missing
file and exit 1, and a future reviewer would reasonably read that as evidence tampering.

| Folder | Manifest entries | Non-manifest files present | Missing |
|---|---|---|---|
| `20260915T141807Z` (closure) | 13 | 12 | `SHARE_SAFE_SUMMARY.txt` (`8e8f2735ee9c…`) |
| `20260915T142150Z` (local) | 16 | 15 | `SHARE_SAFE_SUMMARY.txt` (`27eda5c67589…`) |

**Fix — copy the file back rather than moving it, so both locations hold it:**

```
cp ~/Desktop/SHARE_SAFE_SUMMARY.txt ~/Projects/_governance/gate2c/20260915T142150Z/SHARE_SAFE_SUMMARY.txt
/bin/bash ~/Desktop/artemis-website/GATE_2C_OWNER_COMMANDS.sh --verify-evidence ~/Projects/_governance/gate2c/20260915T142150Z
```

The closure folder's summary (`8e8f2735ee9c…`) I could not locate on the Desktop. If you
still have it, the same `cp` restores that folder too. If it is genuinely gone, say so and
I will record it in the action log as an accepted, documented gap — the folder's other 12
files still verify against their own hashes, and the summary is derivable from `RUN_LOG.txt`
and `ROW_STATUS.txt`, both of which are intact.

**Process note going forward:** treat an evidence folder as immutable once written. Copy out
of it; never move out of it.

---

## 6. The FCC pre-push gate is not yet safe to clear — confirming your item 10

You flagged the existing-origin test as a substring match. It is, and it is worse than it
looks. Both issues below must be fixed before `--fcc-private-remote` is cleared, and I have
**not** revised the script this pass, per your instruction not to build another execution
script until Gate 3 is approved.

### 6a. Existing-origin comparison — substring, not identity

The current test is a glob against the raw URL string. `yazilimlar/financial-command-center`
appears as a substring in URLs that are **not** your repository:

- `https://github.com/attacker/yazilimlar-financial-command-center-mirror.git`
- `git@evil.example.com:proxy/yazilimlar/financial-command-center.git`
- `https://github.com/yazilimlar/financial-command-center-public.git` ← the dangerous one

The last is a plausible accident rather than an attack, and it would pass. The fix is to
normalise both SSH (`git@host:owner/repo.git`) and HTTPS (`https://host/owner/repo.git`)
forms to a canonical `host/owner/repo` triple with any `.git` suffix stripped, and require
**exact equality** against `github.com/yazilimlar/financial-command-center` — host included,
so a look-alike host is rejected too.

### 6b. The secret scan checks the wrong thing entirely

`F1c` walks the **filesystem** and matches on **filename**. A push sends the **committed
tree and its history**. Those are different sets, and the gap runs both ways:

| Gap | Consequence |
|---|---|
| Scans the working tree, not the commit | A gitignored `.env` is flagged and blocks the push though it would never be pushed — a false positive that trains you to override the gate |
| Matches filenames only, never content | A service-role key inside `lib/config.ts` or a JWT in a README passes untouched — **the false negative that actually matters** |
| Scans only the current tree, never history | FCC has two commits. A secret introduced in `d563ac76` and removed later would still be pushed, because a push sends history |
| Walks `.next/` build output | Noise from files that are not tracked |

Today's read of the FCC tree found **zero** files matching the current gate's extension list
outside `node_modules/` and `.git/` — consistent with the Gate 2A assessment. But that is a
statement about filenames, not about content, and my listing hit the bridge's 2000-entry cap
so it is not a complete enumeration either. **It is not a clean bill of health, and I am not
offering it as one.**

The strengthened gate should scan what `git` would actually send — the tracked content at
every commit reachable from HEAD — for content patterns (`eyJ` JWT prefixes, `sk_live_`,
`AKIA`, `ghp_`, `service_role`, PEM `BEGIN … PRIVATE KEY` headers, long high-entropy strings)
and report **paths and match counts only, never matched values**.

Until both are done, `--fcc-private-remote` stays blocked. That is your call to keep, and I
agree with it.

---

## 7. Standing position

Nothing was executed this pass. No remote created, no directory moved, no asset copied, no
Supabase query or change, no production change, and no new execution script written.

Gate 2C is complete: closure 3 rows OK, local actions 3 rows OK, 0 failed, 0 skipped, all
three actions independently verified above.
