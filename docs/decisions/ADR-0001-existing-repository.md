# ADR-0001 · Evolve the existing Control Plane repository into OctopusG

Status: **PROPOSED** (owner direction recorded in S1; formal acceptance at G1) · 2026-09-17

## Context
Control Plane v0.1 exists at `~/Projects/agoraxai/control-plane`: tested (15/15 unit, 15/15
browser), local-only, with a fail-closed registry importer and an isolation audit
([S4](../sources/S4-2026-09-17-v0.1-repository-inspection.md#validation-baseline)). The owner
named the product OctopusG ([S1](../sources/S1-2026-09-17-conversation-export.md#octopusg-product-definition)).

## Decision
OctopusG is built in this repository. No second repository, no rename or move. Product name
**OctopusG**; technical subsystem stays **AgoraXAI Control Plane**; code codename `Octopus`
stays where renaming would break stored state (OD-08).

## Consequences
+ Keeps working tests, security posture and history. + One place for AI sessions to start.
− The repository name does not say "OctopusG"; README and UI carry the name instead.
− The repository still has no remote (OD-02) — a single-copy risk until resolved.
