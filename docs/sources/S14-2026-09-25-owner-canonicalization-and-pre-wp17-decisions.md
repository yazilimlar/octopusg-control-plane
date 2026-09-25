# S14 · Owner canonicalization and pre-WP-17 decisions

Status: **Owner decision**, 2026-09-25. Recorded from two written owner directions of the same day
in a Claude (Cowork) session (the second refines decision 6 and adds decisions 10–11). The first
accepted a read-only reconciliation and truth/security preflight
against `origin/main` at `c2245c91b652ba9d77dfc6969371f2388944677f` as the basis for the next step.
This record authorizes canonical documentation and ledger corrections only. It grants no G3,
activates no provider or credential, authorizes no Supabase, DayOS or Vercel access, begins no
WP-17 implementation and performs no OD-03 containment action.

## Controlling delivery sequence

```text
canonical truth/security preparation
→ OD-03 containment
→ narrow WP-17 preflight and implementation
→ first GOVERNED OctopusG DayOS/Supabase observation
→ usable local-private Alpha
→ subsequent evolution increasingly driven by actual usage, testing, evidence
  and explicit owner authorization
```

This specializes [ADR-0010](../decisions/ADR-0010-progressive-delivery-and-evolution.md): the
"first controlled integration" is the narrow WP-17 DayOS/Supabase observation path.

## Decisions

1. **ADR-0009 is accepted.** [ADR-0009](../decisions/ADR-0009-dayos-supabase-boundary.md) moves to
   ACCEPTED. `OG-CONN-015` is recorded as an APPROVED implementation target (ledger status
   `APPROVED`, the ledger's spelling of S11 decision 7). This approves the design boundary only.
   It does not grant G3, activate a provider, authorize credentials, authorize Supabase access or
   begin WP-17 implementation.
2. **Implementation ownership.** WP-17 is the implementation package for `OG-CONN-015`; the
   ledger's `work_package` moves to WP-17. WP-18 remains the provenance of the design boundary
   ([S11](S11-2026-09-22-owner-wp18-authorization.md), ADR-0009,
   [WP-18 evidence](../evidence/WP-18.md)) and is not erased.
3. **Delivery priority.** `OG-CONN-015` moves to milestone `v0.3`, priority `NEXT`.
4. **Registry MCP server.** `OG-AI-001` leaves the active pre-Alpha sequence and becomes an
   unnumbered post-Alpha candidate. No work package or source record is created from the
   candidate package prepared outside this repository on 2026-09-24, and the server is not
   registered or activated anywhere.
5. **Local-private Alpha acceptance.** The criteria in
   [Local-private Alpha acceptance](#local-private-alpha-acceptance) below are adopted.
6. **OD-03 containment.** No exception is authorized. Every currently known unresolved
   plaintext-secret exposure covered by existing governance is mandatory security debt requiring
   containment, and blocks G3 for any connector it is relevant to (scope below).
   Secret values never enter repository records, prompts, chat output, logs or evidence. Nothing
   is deleted, moved or rotated by this decision. Historical exposure evidence is preserved, not
   rewritten. Containment state is recorded append-only
   (`discovered → review required → containment action → evidence → contained`) in the
   [OD-03 containment register](../security/OD-03-CONTAINMENT.md). Actual containment actions
   require separate owner execution and, where live ERP or other systems could be affected,
   separate authorization.

   **Scope of the G3 block (clarification, not an exception).** An unresolved known
   plaintext-secret exposure blocks G3 for a proposed connector when it can materially compromise
   that connector, its credential/provider boundary, its target system, its execution host or
   runtime, or another relevant shared trust domain. Other known exposures remain mandatory
   security debt and keep their security state, but do not automatically block an unrelated
   connector without evidence of a relevant trust-domain dependency or an explicit canonical rule
   establishing it. Each G3 record must state its relevance determination for every open
   exposure. Where canonical evidence cannot establish a relationship, it is recorded as UNKNOWN,
   never invented, and no secret content is read to resolve it.
7. **Truth-test debt.** An isolated maintenance correction may be prepared, separate from WP-17.
   Required invariant: a clean canonical checkout and a legitimate local checkout containing
   governed observations must both pass validation without treating locally generated
   observation state as immutable canonical truth. A candidate that merely passes is not
   automatically adopted, and no meaningful truth invariant may be weakened to make a test green.
8. **Out-of-band access.** Known historical out-of-band provider accesses are preserved as
   provenance. The Supabase project reference observed through a Claude connector on 2026-09-24
   is not authoritative identity under
   [ADR-0005](../decisions/ADR-0005-source-cited-requirements.md). WP-17 is the first *governed*
   OctopusG DayOS/Supabase observation path, not necessarily the first historical provider access.
9. **Stale canon.** The minimum navigation corrections are authorized: this record, the roadmap,
   the ledger and its generated projections, `SESSION_BRIEF.md`, a supersession notice on
   `docs/NEXT-SLICE-DAYOS-MONITORING.md`, ADR-0009 acceptance, and stale credential-store
   statements. A README refresh is deferred. This is not a general documentation cleanup.

10. **Supabase key architecture (formerly X-04).** An unidentified Supabase credential/key
    architecture is not itself evidence of a plaintext-secret exposure and is not an OD-03 register
    item. It is a WP-17/G3 security-preflight UNKNOWN and may block WP-17/G3 until resolved, for
    that reason. Historical evidence associating it with the recorded containment plan
    ([S3 Change 4](S3-2026-09-17-claude-review.md#change-4--security-containment-first), the
    archived historical map) is preserved unchanged.
11. **Protected local snapshot.** The owner's modified working copy of `data/snapshot.json`
    (SHA-256 `e7449145951e5f509443996673847fb7ad6a6b1c9a3b7ecd2aa7b18d21edf01d`) is protected
    local evidence. Before any operation that could rewrite it, an exact archival copy is kept in a
    git-ignored location with its path, SHA-256, context and purpose recorded, and its eight
    observations are shown to survive through the local observation overlay.

## Local-private Alpha acceptance

The Alpha must provide:

1. Green validation with local observations present and no accepted validation exception.
2. Loopback / local-private operation initially.
3. A documented refresh and start workflow.
4. The DayOS monitor showing the governed observation or an explicit blocked reason.
5. Source, freshness and the declared-versus-observed distinction.
6. Honest truth states and no unsupported health claims.
7. A passing audit and no secret-shaped tracked values.
8. Every connector other than the explicitly authorized DayOS connector at Level 0.
9. A documented revocation of the DayOS connector back to Level 0.
10. A recoverable, tagged Alpha state.
11. Straightforward owner usability: normal cockpit operation does not require knowledge of Git,
    terminal commands, work-package or ADR numbers, requirement IDs, evidence schemas or
    authorization internals. Technical setup and maintenance may still use Terminal during Alpha.
    Information follows progressive disclosure: operational state → plain-language explanation →
    evidence and provenance → detailed governance records.

Before owner acceptance of the Alpha: at least three genuine operating sessions across at least
three days, with material findings recorded. G2 need not be mechanically closed in full to call
the build Alpha; each remaining G2 item must instead be VERIFIED, explicitly DEFERRED, or
demonstrated not to block the Alpha use case, followed by explicit owner Alpha acceptance.
