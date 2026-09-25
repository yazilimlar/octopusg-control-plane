# ADR-0009 · DayOS Supabase connector design and authorization boundary

Status: **ACCEPTED** · proposed 2026-09-22 · accepted 2026-09-25 by the owner
([S14](../sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions))

Acceptance approves this design boundary only. It grants no G3, activates no provider, authorizes
no credential or Supabase access and begins no WP-17 implementation. `OG-CONN-015` becomes an
APPROVED implementation target owned by WP-17; WP-18 remains the provenance of this design.
Before this connector's G3, every OD-03 item relevant to it must be contained, and the G3 record
must state its relevance determination for every open item, recording UNKNOWN where canonical
evidence cannot establish one
([S14 decision 6](../sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions);
[containment register](../security/OD-03-CONTAINMENT.md)).

## Context

`OG-CONN-015` and the DayOS slice specification describe a narrow read-only Supabase metadata
surface, but the live project identity and authorization are not established. WP-16 provides only
a generic provider-neutral credential boundary. A connector-specific design must precede G3 and
implementation.

## Decision

WP-18 defines a design-only boundary for one future DayOS Supabase connector:

- project identity is resolved from an authoritative canonical configuration source and
  cross-validated against the `dayos` registry product;
- missing, invalid, ambiguous or stale identity remains `BLOCKED`;
- the initial allowlist contains project identity, schema name, migration inventory/state and
  provenance/authorization metadata only;
- object counts, rows, query results, SQL text, function bodies, credentials, connection strings,
  writes and migrations are prohibited;
- the only proposed read scope is `metadata:read`;
- the connector ceiling is Level 1 (Observed);
- G3 is represented as a not-authorized draft and must be granted separately by the owner;
- provider activation is a separately authorized WP-17 preflight sub-scope.

No provider, credential, network, Supabase or DayOS backend access is performed by WP-18.

## Authorization contract

The G3 record must contain the authoritative project reference, exact allowlist, exact scopes,
maximum level, owner decision evidence, expiry/review, and revocation procedure. A chat-provided
identifier cannot substitute for the authoritative configured source.

## Failure, redaction and revocation

The design fails closed on absent identity, missing authorization, scope mismatch, unexpected
response shape, stale or ambiguous provenance, or failed redaction. Only the declared metadata
schema may be persisted. Revocation returns the connection to blocked/Level 0 and retains only
non-sensitive governance evidence.
