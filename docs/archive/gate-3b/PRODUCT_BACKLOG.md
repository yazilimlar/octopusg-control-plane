# AGORAXAI — PRODUCT BACKLOG

After Gate 3B the portfolio is recorded, the control plane is frozen and reversible, and the
governance scaffolding has done its job. What follows is product work, ordered by what unblocks the
most. Sizes are rough: **S** ≈ an hour, **M** ≈ half a day, **L** ≈ a day or more.

---

## Now — the three things with real consequences

**1 · Get the control plane off a single disk · S**
The v0.1 bundle is the only restore point and it lives on the same machine as the repository. A
private remote, or a copy to any second location, removes the one failure mode that would lose the
work outright. This is the B2 decision in product terms, and it is currently held pending your word.

**2 · Finish Pınar Evleri as a product, not an extraction · M**
Option B is prepared, tested and unscheduled: fresh history at `~/Projects/ventures/pinar-evleri`
with blob-SHA provenance, preflight green, destination clear. What it needs after extraction is
product decisions, not more analysis — five of eight `.webp` assets are invalid and need
re-exporting, and the manager surface has no schema behind it (see item 3).

**3 · Rebuild the Pınar decision-policy schema · M**
`01_`–`05_` are absent from all 61 authoritative remote branches; only `06_decision_policy_schema.sql`
survives. The recovery plan exists and is read-only. This is now a small greenfield data-model
exercise rather than a search.

---

## Next — the control plane earns its keep

**4 · Live evidence instead of recorded evidence · L**
Five connectors exist, all disabled and returning `blocked`. The dashboard currently renders what a
registry file says was true on the day it was written. Enabling even one — git state for local
checkouts — turns drift detection from a recorded claim into a measurement. Start local-only; the
loopback and CSP posture should survive it.

**5 · Make repointing the registry a one-command operation · S**
Four pinned sites plus a full revalidate plus a commit is why the tool is still on v1.5.1 while
v1.6 exists. A `npm run repoint -- <file>` that edits the pins, revalidates and reports would make
each future registry revision cheap instead of a gated event.

**6 · Approval queue → something you actually act on · M**
22 parsed proposals with a simulation-only workflow. It persists, logs and refuses to execute. The
next step is the smallest real one: let a completed item write its outcome back to a governance file
so the queue and the record stop being separate things.

**7 · Retire the two stale notes in the registry · S**
Lines 893 and 911 still say the tool must be repointed at v1.5. Already stale when v1.5 was issued;
deliberately left alone during the repair. Fold into the next registry revision.

---

## Later — worth doing, nothing depends on it

**8 · Publish the control plane as a read-only static site · M**
It is already a static bundle with no network client. A private hosted copy would let you open the
portfolio from anywhere without the loopback server. Needs a deployment decision, and the governance
policy already says how: PR → preview → promote a reviewed preview.

**9 · Second view of the ecosystem map · S**
The map renders from a hardcoded layout array rather than from the registry. Deriving the order
means new projects appear without a code edit.

**10 · Supabase Phase A · S, yours**
Dashboard-only, human-performed, read-only checkpoint. Still unexecuted. It gates any future work
that touches the database and costs you ten minutes.

---

## Not on this list

FCC ever becoming public · Pınar branch merges · ERP file, database, cron or launchd changes ·
secret reads, rotations or deletions · DNS or domain changes · production deploys outside the
promote-a-reviewed-preview path.
