# ADR-0002 · Modular monolith first

Status: **PROPOSED** · 2026-09-17

## Context
Five planes were defined ([S1 System architecture](../sources/S1-2026-09-17-conversation-export.md#system-architecture)).
Splitting them into services now would add hosting, auth between services, and deployment
work before any contract is proven.

## Decision
One application, one repository, one process (plus owner-run CLI scripts). Planes are folders
(`src/core`, `src/connectors`, `src/executors`, `src/ui`) with one-way dependencies:
`ui → core ← connectors`, `core → executors` only through approved action IDs. A plane becomes a
separate process only by a later ADR with a concrete reason (e.g. webhook receiver in v0.6,
device agent in v0.5).

## Consequences
+ Small operational surface; the v0.1 static security model survives.
+ Contracts can be tested in-process. − Import rules must be enforced by review (a lint rule can
be added later).
