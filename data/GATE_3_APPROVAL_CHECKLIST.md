# GATE 3 — APPROVAL CHECKLIST

**Prepared:** 2026-09-15 · Claude (Opus 5)
**Status:** AWAITING OWNER APPROVAL. Nothing below is authorized, scheduled, or built.
**Per your instruction:** no execution script will be written until you approve specific items.

---

## How to read this

Every proposed action carries a **risk class**. The class determines how much scrutiny it
needs and whether it can be undone.

| Class | Meaning | Undo |
|---|---|---|
| **READ-ONLY** | Observes. Changes nothing. | Nothing to undo |
| **REVERSIBLE** | Changes local state; a single documented command restores the prior state exactly | Command stated per item |
| **LOCALLY MUTATING** | Changes local state in a way that is undoable but not by one command — a move, a copy, a config edit | Stated, multi-step |
| **REMOTELY IRREVERSIBLE** | Publishes to a third party. Cannot be fully unpublished | None. Prevention only |
| **PRODUCTION-AFFECTING** | Changes what live users see | Rollback exists but users see the intermediate state |

Approve item by item. Approving a category does not approve its members.

---

## A. Local bundle and backup actions

### A1 · Refresh the Financial Command Center bundle — **RECOMMENDED FIRST**

| | |
|---|---|
| **Class** | REVERSIBLE (additive — writes one new file, touches nothing else) |
| **Why now** | The existing bundle contains `d563ac76` only. FCC is now at `2731c29f`. **The two documentation files committed at Gate 2C exist in exactly one place on Earth: that working copy.** The bundle does not have them. |
| **Prerequisite** | None. FCC is at a clean known HEAD, verified at Gate 2D |
| **Rollback** | Delete the new bundle file. The old bundle is not overwritten — the new one is separately timestamped |
| **Risk if skipped** | A disk failure loses `PHASE_1_IMPLEMENTATION_PLAN.md` and the README changes permanently |

This is the cheapest, safest item on the list and it closes a live single-point-of-failure.
If you approve nothing else, approve this.

### A2 · Refresh the v0.7 bundle

| | |
|---|---|
| **Class** | REVERSIBLE (additive) |
| **Why** | v0.7 now has real git history (`bee2593f`, 52 files). The Gate 1B recovery copy is a pre-git directory snapshot — it preserves the files but not the commit |
| **Prerequisite** | None |
| **Rollback** | Delete the new bundle file |

### A3 · Restore `SHARE_SAFE_SUMMARY.txt` to both Gate 2C evidence folders

| | |
|---|---|
| **Class** | REVERSIBLE (a `cp`, never a `mv`) |
| **Why** | Both folders currently fail `--verify-evidence` because a manifested file was moved to the Desktop. Verified byte-identical — moved, not tampered — but a future reviewer would reasonably read the failure as tampering |
| **Prerequisite** | Locate the closure-run summary (`8e8f2735ee9c…`). The local-actions one is at `~/Desktop/SHARE_SAFE_SUMMARY.txt` |
| **Rollback** | Delete the copy |
| **Note** | If the closure summary cannot be found, record it as an accepted documented gap rather than reconstructing it — a reconstructed file would not match its manifest hash and would be worse than an honest absence |

### A4 · Encrypted recovery copy of the two Vercel preview environments

| | |
|---|---|
| **Class** | LOCALLY MUTATING |
| **Why** | Two *distinct* preview environments exist (digests `28339aca…` and `290d77d6…`). Neither is redundant. Vercel remains authoritative |
| **Prerequisite** | Decide the encryption method. **I will not read, print, or copy any secret value** — this item needs a mechanism you operate |
| **Rollback** | Delete the encrypted archive |
| **Constraint** | Must preserve **both** environments. Whichever is stale is itself a live misconfiguration to investigate separately |

---

## B. Private-remote creation

### B1 · Fix the two FCC pre-push gate defects — **BLOCKS B2**

| | |
|---|---|
| **Class** | REVERSIBLE (script change only; nothing executes) |
| **Defect 1** | Existing-origin test is a substring match. `…/yazilimlar/financial-command-center-public.git` passes it. Needs normalised exact `host/owner/repo` comparison across SSH and HTTPS forms |
| **Defect 2** | Secret scan walks the filesystem and matches filenames. A push sends tracked content across all reachable history. It cannot see a key inside a tracked `.ts` file, and cannot see a secret in commit 1 that was removed in commit 2 |
| **Prerequisite** | Your approval to write the revision |
| **Rollback** | Revert to v2C.2 |

### B2 · Create the FCC private repository and push

| | |
|---|---|
| **Class** | **REMOTELY IRREVERSIBLE** |
| **Prerequisites** | B1 complete and re-tested · A1 complete (a current backup exists before publishing) · authenticated `gh` user verified == `yazilimlar` · visibility verified PRIVATE **before** push and **again after** · tracked-content history scan clean · working tree clean |
| **Rollback** | **NONE.** Deleting a GitHub repository does not un-disclose anything already fetched. Prevention is the only control |
| **Standing rule** | PRIVATE at creation. Never create-then-flip. Never public, ever |
| **My position** | Do not approve until B1 is done. The current gate would pass a repository containing a secret in a tracked source file, and I would rather say that plainly than let a green check stand in for a real one |

---

## C. Directory relocation

### C1 · Move `~/Desktop/v0.7` into the container structure

| | |
|---|---|
| **Class** | LOCALLY MUTATING |
| **Target** | `~/Projects/agoraxai/atlas/lycian-turkiye` (leaf does not exist yet — deliberately) |
| **Prerequisite** | A2 · confirm nothing references the Desktop path (no script, cron, launchd entry, or editor workspace) |
| **Rollback** | `mv` back. Git history travels with the directory; the repository is self-contained and has no remote |
| **Risk** | Low. No remote, no deployment, no automation known to reference it — *known* being the operative word, which is what the prerequisite check is for |

### C2 · Relocate the Artemis Omni checkouts

| | |
|---|---|
| **Class** | LOCALLY MUTATING |
| **Prerequisite** | **`~/Desktop/motion graphic/` is hard-coded twice in the live ERP cron job.** Moving or renaming it breaks live invoice automation |
| **Rollback** | `mv` back, and re-verify the cron job actually runs |
| **My position** | **Do not approve in Gate 3.** This is entangled with E-class ERP work. Sequence it after the ERP dependency is resolved, not before |

### C3 · Create remaining container leaf directories

| | |
|---|---|
| **Class** | REVERSIBLE |
| **Prerequisite** | None |
| **Rollback** | `rmdir` (empty directories only) |
| **Note** | Leaves were deliberately **not** created at Gate 1A because `git clone` and `git worktree add` refuse non-empty directories. Create a leaf only at the moment its content arrives — not in advance |

---

## D. Pınar schema recovery

### D1 · Phase A — two dashboard pages

| | |
|---|---|
| **Class** | **READ-ONLY** |
| **What** | Migration history page · SQL Editor saved snippets and history. Nothing else |
| **Prerequisite** | None |
| **Rollback** | Nothing to undo |
| **Cost** | Two page loads |
| **Why first** | Determines whether `01_`–`05_` are *recovered verbatim* or must be *reconstructed lossily*. Doing the long schema capture before this answer is work in the wrong order |
| **Document** | `PINAR_SUPABASE_PHASE_A_CHECKPOINT.md` |

**This is the item I would approve next after A1.** It is free, read-only, and it is the only
remaining path to the actual files.

### D2 · Phase A continued — full dashboard schema capture

| | |
|---|---|
| **Class** | READ-ONLY |
| **Prerequisite** | D1 returns empty (if D1 finds the files, D2 is unnecessary) |
| **Scope** | Tables, columns, indexes, functions, triggers, RLS policies and the RLS-enabled flag, roles, extensions |
| **Known gap** | The Supabase table UI does not render `EXCLUDE` constraints — the single most important object. Expect to need D3 |

### D3 · Phase B — read-only catalog queries

| | |
|---|---|
| **Class** | READ-ONLY, but **executes SQL**, which your standing instruction currently prohibits |
| **Prerequisite** | D2 complete · **explicit separate authorization from you** |
| **Rollback** | Nothing to undo — every query is a single `SELECT` |
| **Caution** | `pg_get_functiondef` returns whole function bodies. If any function embeds a key or webhook URL, it appears in that output. Read the results yourself before pasting them anywhere |
| **Status** | Written out in `SUPABASE_SCHEMA_RECOVERY_PLAN.md` §3. **Not authorized** |

### D4 · Write the consolidated baseline migration

| | |
|---|---|
| **Class** | LOCALLY MUTATING (writes one new file) |
| **Prerequisite** | D1–D3 complete |
| **Rollback** | Delete the file |
| **Constraint** | **One honest consolidated baseline**, dated and headed as reconstructed-from-live-schema, recording that `01_`–`05_` were lost and that history before this point is not reproducible. **Not five fabricated files.** Manufacturing plausible `01_`–`05_` would put an invented history into the repository — the same class of error as erasing "Artemis Atlas MVP" from the record, pointed the other way |

---

## E. Pınar asset replacement

### E1 · Source original photography from off-machine

| | |
|---|---|
| **Class** | Not a Claude action — **yours** |
| **Why** | The search is complete and the shortlist is **empty**. All 72 unique matches examined; none is Pınar Evleri property photography. The only `pinar`/`evleri` matches were the seven repository files themselves |
| **Candidate sources** | Your phone or camera roll · iCloud not downloaded locally · Dropbox not synced · an external drive · a message thread · the two live Airbnb listings (`rooms/36961615`, `rooms/36963978`) |
| **Prerequisite** | None |

### E2 · Read-only search by image capture date and dimensions

| | |
|---|---|
| **Class** | READ-ONLY |
| **Why** | A filename search structurally cannot find `IMG_4821.jpeg`. If you can give a rough date window for when the photographs were taken, metadata is a far better instrument than names |
| **Prerequisite** | A date window from you |
| **Rollback** | Nothing to undo |
| **Output** | A listing for **you** to judge. No copying |

### E3 · Replace the five invalid `.webp` files

| | |
|---|---|
| **Class** | LOCALLY MUTATING |
| **Prerequisite** | E1 or E2 produces real photography |
| **Rollback** | Git restores the broken originals — they are committed, which is precisely why git recovery of the *valid* images is impossible: the blob SHAs are identical across branches, so the files were committed broken |
| **Note** | 9 of 12 page references point at a file that cannot decode, including the logo in all three placements. This is a content blocker for any Pınar deployment |

### E4 · `--copy-selected-assets`

| | |
|---|---|
| **Class** | LOCALLY MUTATING |
| **Status** | **DO NOT RUN.** The allowlist would be empty. The mode exists for when there is something to copy |

---

## F. Pınar extraction

### F1 · Extract Pınar Evleri into one private repository

| | |
|---|---|
| **Class** | LOCALLY MUTATING, then **REMOTELY IRREVERSIBLE** at the push |
| **Target structure** | `apps/site` · `apps/manager` · `packages/property-data` |
| **Honest caveat** | The code has **no such split today**. The manager is `app/pinarevleri/manage/*`, a child route with its own `layout.tsx`. This boundary would be **introduced, not preserved** |
| **Prerequisites** | D1–D4 complete (schema captured) · E1/E3 complete (assets real) · B1 fix applied to whatever pre-push gate is used · the manager-branch question answered: are `demo` and `persistent-demo` demo-grade or intended production? |
| **Rollback** | Local: delete the new repository directory; the source remains in `artemis-omni` untouched. Remote: none, once pushed |
| **Blocker** | **Do not merge `feature/pinarevleri-manager-mvp`.** Standing instruction, unchanged. Preserve the branch |
| **Advantage** | Pınar has **no live route** (`/pinarevleri` is a genuine 404). Unlike Rainbow Botanics, extraction needs no redirect planning |
| **My position** | Not a Gate 3 item. Both prerequisites — schema and assets — are currently unmet, and one of them depends on photographs that may not exist |

---

## G. Production and deployment changes

### G1 · Decide the production deployment mechanism

| | |
|---|---|
| **Class** | READ-ONLY at the decision stage — this is a conversation, not a command |
| **Finding** | Production serves a **CLI deployment from a side branch**, `feature/utility-3d-public-demo` at `dd623e07`, made by an agent session. Pushing to `main` does **not** update production |
| **Consequence** | Production is frozen at `dd623e07` until someone deploys again. `/pinarevleri`, `/workbench` and `/dayos-next` are 404 because that commit's tree is what production serves |
| **Prerequisite** | None — deciding costs nothing |
| **Why it belongs here** | Every later item in this list assumes a deployment story. Right now there isn't one, and that is a governance finding in its own right |

### G2 · Deploy from a canonical branch

| | |
|---|---|
| **Class** | **PRODUCTION-AFFECTING** |
| **Prerequisite** | G1 decided · a build verified from the canonical branch · an explicit decision about which routes should appear, since this would change what live users see |
| **Rollback** | Vercel can promote the previous deployment — `dpl_Hg27275LGFNYfkBiSQFWLKFS4X7m` is recorded — but users see the intermediate state |
| **Status** | Not proposed for Gate 3 |

### G3 · DNS, domains, subdomains

| | |
|---|---|
| **Class** | **PRODUCTION-AFFECTING** |
| **Status** | Frozen. No DNS change, no domain purchase. $0 budget and unchanged |

### G4 · ERP — anything at all

| | |
|---|---|
| **Class** | **PRODUCTION-AFFECTING** |
| **Status** | **BLOCKED.** `/erp` is live (HTTP 200). A cron job runs every 4 hours against a hard-coded path. `launchd` agent present. Any copy or move must take `prime_industrial.db` **with** its `-wal` and `-shm` sidecars, or checkpoint the WAL first |
| **Note** | The `lsof` observation showing no open handles was an *instant* reading, not evidence of dormancy |
| **Sequencing** | **Last.** After everything else |

---

## Recommended Gate 3 scope

If you want a minimal, high-value, low-risk Gate 3, it is four items:

| Item | Class | Why |
|---|---|---|
| **A1** — refresh the FCC bundle | REVERSIBLE | Closes a live single-point-of-failure created by Gate 2C's own commit |
| **A3** — restore the share-safe summaries | REVERSIBLE | Makes the evidence folders self-verify again |
| **D1** — Supabase Phase A, two pages | READ-ONLY | The only remaining path to the actual `01_`–`05_` files |
| **G1** — decide the deployment mechanism | READ-ONLY | Unblocks the thinking behind every later item |

Nothing in that set is irreversible. Nothing touches production, Supabase, the ERP, or any
remote. Together they close the one real data-loss exposure Gate 2C introduced, repair the
evidence trail, and answer the question that determines how much work the schema recovery
actually is.

**A2** and **C3** are safe to add if you want more motion. **B2**, **C2**, **F1** and
everything in **G** beyond G1 should wait.

---

## Standing prohibitions — unchanged

No Pınar extraction · no Pınar branch merge · no Rainbow Botanics extraction · no ERP file,
database, cron or launchd change · no secret value read, printed, deleted or rotated · no DNS
change · no domain purchase · no Supabase mutation, `supabase link`, dump or SQL execution ·
no software installation · no production deployment, redirect, alias or route change · no
public repository, ever, for Financial Command Center · no bulk asset copying · no branch or
checkout deletion · $0 budget, no billable operation.

**No execution script will be written until you approve specific items from this list.**
