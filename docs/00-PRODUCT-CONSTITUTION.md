# 00 · OctopusG Product Constitution

Status: **PROPOSED — awaiting owner Architecture Approval** · Version 0.2-draft · 2026-09-17

This is the highest-authority document in the repository. If another document, a model, or a
chat message disagrees with it, this document wins until the owner changes it.

## 1. Identity

| Item | Value |
|---|---|
| Product name | **OctopusG** (short for **OctopusGinormous**) |
| Product statement | *OctopusG is the AgoraXAI Portfolio Operating System.* |
| Technical subsystem | AgoraXAI Control Plane (codename `Octopus` in code) |
| Canonical repository | `~/Projects/agoraxai/control-plane` — the only OctopusG repository |
| Portfolio position | AgoraXAI Platforms layer, peer of AgoraXAI Atlas; not part of Artemis |
| Frozen baseline | Control Plane v0.1, commit `6a4954f` |
| Next release | OctopusG v0.2 (local, private, read-only) |
| Owner | George Oktem — product authority, account authorization, production approval |

Sources: [S1 Current position](sources/S1-2026-09-17-conversation-export.md#current-position),
[S1 OctopusG product definition](sources/S1-2026-09-17-conversation-export.md#octopusg-product-definition),
[S4 Git state](sources/S4-2026-09-17-v0.1-repository-inspection.md#git-state).

## 2. Purpose

OctopusG gives the owner one cockpit for the whole AgoraXAI portfolio: what exists, where it
lives, how things connect, what changed, what needs a decision, and what was done. It
**coordinates** external services; it does not replace them
([S2 Build versus buy](sources/S2-2026-09-17-gpt-planning-thread.md#build-versus-buy)).

## 3. Principles

1. **Observe broadly, propose intelligently, act narrowly under explicit capabilities.**
   ([S2](sources/S2-2026-09-17-gpt-planning-thread.md#first-communications-pilot))
2. **Evidence over assertion.** Every displayed fact is *declared*, *observed*, *derived*,
   *approved* or *executed*, with a source and a time. Unknown stays unknown.
   ([S1 Truth and evidence model](sources/S1-2026-09-17-conversation-export.md#truth-and-evidence-model))
3. **Read-only first.** Each connection starts at the lowest authority level and moves up only
   by a separate owner decision. ([ADR-0003](decisions/ADR-0003-read-only-first.md))
4. **Declared relationships, not ownership by accident.** A project does not belong inside
   another merely because it was built with it; dependencies are not ownership.
5. **Generated, never hand-drawn.** Maps and summaries are rendered from the registry and
   observations. ([S2 Architecture map updates](sources/S2-2026-09-17-gpt-planning-thread.md#architecture-map-updates-from-connections))
6. **Fail closed.** Unexpected input, scope, redirect, or permission stops the operation and is
   shown; it is never silently converted into success.
7. **Owner actions stay owner actions.** Login, MFA, OAuth consent, business verification,
   and production approval are never automated or bypassed.
8. **Requirements before code.** No feature is complete without a requirement, design
   reference, implementation, test and verification evidence.
   ([S1 Requirements and completeness model](sources/S1-2026-09-17-conversation-export.md#requirements-and-completeness-model))
9. **Build one block completely before starting several partially.**

## 4. Hard boundaries (all milestones until the owner changes this section)

- No production mutation without an approved action at the matching tier
  ([06](06-SECURITY-AND-APPROVALS.md)).
- No secret value is ever stored in the registry, source control, the bundle, browser storage,
  logs or AI prompts.
- Company-owned devices are outside the trust boundary: browser-only, no agent, no scanning,
  no credentials ([S1 Device and trust-zone model](sources/S1-2026-09-17-conversation-export.md#device-and-trust-zone-model)).
- Messaging uses only official business APIs; no scraping, no human-imitating bots, no cold
  outreach, no personal WhatsApp monitoring ([S1 Messaging boundaries](sources/S1-2026-09-17-conversation-export.md#messaging-boundaries)).
- Sensitive, contractual, financial or dispute-related messages always need human approval.

## 5. v0.2 boundary (summary)

Local, private, read-only. Registry ingestion, catalog, generated relationship map, local Git
observation, provenance/freshness, Connection Center framework without any account,
normalized event model with a simulated inbox, approval policy model, safe open/deep-link
actions. **No external account connection and no production write.** Full scope:
[09 Roadmap](09-ROADMAP.md#v02-scope).

## 6. How this document changes

Only the owner changes this document. Proposed changes arrive as an ADR in
[`decisions/`](decisions/) with status `PROPOSED`, then the owner marks it `ACCEPTED`.

## 7. Document map

| # | Document | Answers |
|---|---|---|
| 00 | this file | What OctopusG is and must never do |
| 01 | [System architecture](01-SYSTEM-ARCHITECTURE.md) | The five planes and how v0.2 is built |
| 02 | [Domain model](02-DOMAIN-MODEL.md) | The nouns: products, resources, facts, events, actions |
| 03 | [Capability atlas](03-CAPABILITY-ATLAS.md) | Every idea discussed, with status and target |
| 04 | [Connector contract](04-CONNECTOR-CONTRACT.md) | What every integration must implement |
| 05 | [Event model](05-EVENT-MODEL.md) | How things that happened are recorded |
| 06 | [Security and approvals](06-SECURITY-AND-APPROVALS.md) | Trust zones, tiers, levels, secrets |
| 07 | [Device agent spec](07-DEVICE-AGENT-SPEC.md) | Mac/Windows agents (concept) |
| 08 | [UX and screen map](08-UX-AND-SCREEN-MAP.md) | Screens per milestone |
| 09 | [Roadmap](09-ROADMAP.md) | Blocks, v0.2 work packages, owner decisions |
| 10 | [Operating model](10-OPERATING-MODEL.md) | How the owner and AI models work together |
| — | [Requirements](requirements/REQUIREMENTS.yaml) · [Traceability](requirements/TRACEABILITY.md) | The contract |

---
George Oktem · New York · 2026 · IPC Resiliency Partners
