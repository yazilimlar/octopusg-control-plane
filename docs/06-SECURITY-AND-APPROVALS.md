# 06 · Security and Approvals

Status: **PROPOSED — needs owner Architecture Approval** · 2026-09-17

OctopusG will eventually hold access to almost everything the owner runs. That makes it the
most valuable target in the portfolio. This document exists to keep that power small, visible
and revocable ([S3 Change 4](sources/S3-2026-09-17-claude-review.md#change-4--security-containment-first)).

## 1. Trust zones

| Zone | Devices / systems | OctopusG access |
|---|---|---|
| `personal` | Owner's Mac | Enrolled. Local Git observation (v0.2); allowlisted actions (v0.5) |
| `personal-later` | Owner's personal Windows laptop | Enrolled only after the agent contract is stable (v0.5) |
| `employer` | Company-owned laptop | **BROWSER_ONLY / UNMANAGED / NO_LOCAL_ACCESS** — no agent, scan, credential, or employer-system change without explicit written employer authorization |
| `cloud` | Provider accounts | Scoped credentials, level ceilings, action tiers |

Sources: [S2 Work laptop trust zone](sources/S2-2026-09-17-gpt-planning-thread.md#work-laptop-trust-zone),
[S1 Device and trust-zone model](sources/S1-2026-09-17-conversation-export.md#device-and-trust-zone-model).

## 2. Action tiers (risk of the action)

| Tier | Examples | Rule | Minimum connection level |
|---|---|---|---|
| T0 Observe | Git status, deployment health, message arrival | Automatic | 1 |
| T1 Prepare | Email draft, migration plan, config diff | Automatic | 2 |
| T2 Reversible | Run tests, create branch, restart preview | One-click approval | 3 |
| T3 Production | DB migration, deployment promotion | Explicit approval **+ preview** | 3 |
| T4 Critical | DNS, secrets, deletion, money | Strong confirmation, verified backup, audit | 3 (never 4) |

**Rule:** an action may run only if `connection.level ≥ tier.min_level` **and** the policy for
that action type allows it **and** the required approval is recorded **and** preconditions pass.
Level 4 (controlled automation) is only available for named T0–T2 actions with a fixed template.

Source: [S2 Database and configuration changes](sources/S2-2026-09-17-gpt-planning-thread.md#database-and-configuration-changes).

## 3. What a T3/T4 action request must contain

1. Proposed change (migration, diff, command) · 2. Affected objects · 3. Backup status and
location · 4. Dry-run or preview result · 5. Rollback procedure · 6. Owner approval (who,
when, note) · 7. Execution evidence (output, before/after observation).

An AI recommendation is never sufficient on its own.

## 4. Approvals

- v0.1–v0.9: approvals are **simulated** and labelled as such. `OWNER_APPROVED` in the v0.1
  queue has no authenticated identity and must never be promoted into a real approval.
- A real approval (v0.10) requires authenticated owner identity, per-item scope, evidence
  references, durable append-only storage, integrity protection and revocation
  ([CONNECTOR_PLAN_v0.2](CONNECTOR_PLAN_v0.2.md#real-approvals-are-separate)).

## 5. Secrets

- **Store:** macOS Keychain for anything OctopusG uses on the Mac (OD-04). Vercel remains the
  authoritative store for application environment variables (registry governance decision).
- **Never:** in the registry, repository, bundle, browser storage, logs, events, prompts, or
  screenshots. The UI shows credential *status* only.
- **Reading:** only the collector/executor process reads a credential, at call time, by
  reference (`CredentialRef`).
- **Existing exposure first:** plaintext secrets recorded in the historical map (ERP Plaid,
  Gmail, Squarespace, session secrets) and the `vercel-env-backup-artemis-omni` registry row
  (`SECURITY_REVIEW_NEEDED`) must be contained **before** any v0.3 connector authorization
  (OD-03). *Scope clarified 2026-09-25 ([S14](sources/S14-2026-09-25-owner-canonicalization-and-pre-wp17-decisions.md#decisions),
  not an exception):* each exposure blocks G3 for a connector it can materially compromise — the
  connector, its credential/provider boundary, its target system, its execution host or runtime,
  or another relevant shared trust domain. All remain mandatory security debt. Items, relevance
  and state: [OD-03 containment register](security/OD-03-CONTAINMENT.md).

## 6. Kill switch and blast radius

- One control pauses every connection and executor (v0.3+).
- Each connection is revocable on its own; revocation follows the lifecycle in
  [04](04-CONNECTOR-CONTRACT.md#3-connection-lifecycle).
- Read and write credentials are separate where providers allow.
- Short-lived tokens preferred; long-lived admin tokens prohibited.

## 7. Local application boundary (inherited from v0.1, kept in v0.2)

Loopback-only server; GET/HEAD only; Host check; CSP `default-src 'none'`, `connect-src 'none'`;
no browser network client; audit enforced by `npm run audit:local`. "Private" means local-only,
not authenticated — other local users/processes could reach the port. Do not proxy or expose it.

## 8. Messaging

Official business APIs only; consent, rate limits and messaging windows enforced by the
connector; no scraping or human-imitating automation; human approval for pricing, contracts,
disputes and sensitive personal matters. Gmail starts at draft-only.
([S2 Automated Gmail messages](sources/S2-2026-09-17-gpt-planning-thread.md#automated-gmail-messages),
[S2 WhatsApp automation](sources/S2-2026-09-17-gpt-planning-thread.md#whatsapp-automation))

## 9. AI agents

Bounded AI agents (v0.11) act only through the same ActionRequest → policy → approval path as a
human-initiated action. They never hold credentials directly and cannot raise a connection level.
