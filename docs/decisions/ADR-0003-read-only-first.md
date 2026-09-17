# ADR-0003 · Read-only first for every connection

Status: **PROPOSED** · 2026-09-17

## Context
The discussion repeatedly required observing before acting
([S2 Integration levels](../sources/S2-2026-09-17-gpt-planning-thread.md#integration-levels),
[S1 Connector and automation strategy](../sources/S1-2026-09-17-conversation-export.md#connector-and-automation-strategy)).

## Decision
Every connection starts at Level 0 (registered) and moves to Level 1 (observed) only through
owner Connector Authorization (G3). Levels 2–4 require a separate owner Action Authorization (G4)
per action type. v0.2 has no connection above Level 0 except the local Git observer, which reads
allowlisted paths and holds no credential.

## Consequences
+ Mistakes surface as wrong *displays*, not wrong *changes*. + Each connector's value is proven
before it gets power. − Useful automations (Gmail drafts, ManyChat replies) arrive later.
