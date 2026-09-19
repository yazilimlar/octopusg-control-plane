# S8 — Owner directive: read-only Artemis DayOS monitoring (2026-09-19)

> **Source record.** The owner (George Oktem) issued this directive in the Claude Code session of
> 2026-09-19 that follows the merge of PR #1 (`f93aa8f`, CI green on `main`). It is recorded here in
> substance so the requirement it grounds has a governed source rather than `UNSOURCED`. Cite as
> `S8#<heading-slug>`.

---

## Owner directive

Proceed autonomously with the next approved vertical slice: read-only Artemis DayOS monitoring, inside
OctopusG, delivered as one uninterrupted implementation session on one new feature branch, ending in
a pull request into `main` that the owner reviews and merges. The session may inspect the local
Artemis DayOS source repository with read-only filesystem and Git commands, implement, test, commit
locally, push only the feature branch to the approved `origin`, and open the pull request.

## Scope

1. Identify the authoritative DayOS repository and project records from evidence; do not guess.
2. Show the declared source repository, local checkout, branch, observed HEAD, working-tree state,
   deployment reference, observation timestamp, freshness and drift.
3. Show explicit Unknown, Not collected, Stale, Error and Blocked states rather than implying health.
4. Provide safe launch/open actions only where existing OctopusG policy permits them.
5. Integrate DayOS into the existing portfolio, resource graph, drift, inbox/status and evidence
   model where appropriate.
6. Add a focused DayOS detail/monitoring view that is useful to the owner.
7. Preserve provenance for every displayed status.
8. Keep the implementation modular, deterministic and read-only, reusing the existing observer,
   truth model, resource catalog, drift model, action policy and UI components; no parallel
   monitoring architecture.
9. If the authoritative DayOS source cannot be established, stop and report the evidence gap.

## Boundaries

No write to any Artemis or DayOS repository; no DayOS application mutation; no Supabase access; no
provider credentials or OAuth; no Vercel project or deployment; no production action; no DNS or
domain change; no email, social-media or messaging connection; no secrets; no package installation
or dependency change; no broad visual redesign; no invented live status; no merge to `main`; no
bundle.

## Relationship to the earlier specification

The directive names "the existing DayOS slice specification"
([docs/NEXT-SLICE-DAYOS-MONITORING.md](../NEXT-SLICE-DAYOS-MONITORING.md)). That document specializes
`OG-CONN-015` (Supabase read-only metadata) and is blocked on a credential store, a Supabase
Connector Authorization and a Supabase ADR — all of which the boundaries above rule out for this
session. The directive's scope items 1–9 describe a different surface (source repository, checkout,
Git observation, deployment reference), which that document lists as out of its scope. This record
therefore grounds a new requirement for that surface, `OG-OBS-007`; `OG-CONN-015` is untouched and
its Supabase preconditions still stand. The Supabase side of the DayOS monitor is shown only as a
declared inventory plus an explicit **blocked** state.

## Observer allowlist

The owner's gate position of 2026-09-18 ([S6](S6-2026-09-18-owner-brand-decisions.md#v02-gate-decisions))
was that the one-entry observer allowlist was sufficient for v0.2 and that "expanding it is an
explicit later configuration action". Observing the DayOS checkout with the existing observer, as
the scope requires, cannot be done without listing it. The session added exactly one entry
(`dayos` → `~/Projects/artemis-omni`) and pinned the allowlist's full content in a test. Whether the
directive is the owner's explicit configuration action is recorded as an open question for the owner
in [WP-14](../evidence/WP-14.md#open-questions).
