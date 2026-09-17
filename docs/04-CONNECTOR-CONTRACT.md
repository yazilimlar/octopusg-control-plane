# 04 · Connector Contract

Status: **PROPOSED** · v0.2 builds the framework with every connector at Level 0. Provider
specifics are written at the start of the block that enables each provider.
Sources: [S2 Connection Center](sources/S2-2026-09-17-gpt-planning-thread.md#connection-center),
[S2 Integration levels](sources/S2-2026-09-17-gpt-planning-thread.md#integration-levels),
[S2 Disconnecting safely](sources/S2-2026-09-17-gpt-planning-thread.md#disconnecting-safely),
[CONNECTOR_PLAN_v0.2](CONNECTOR_PLAN_v0.2.md).

## 1. Every connector declares

```ts
interface ConnectorDefinition {
  id: string;                    // 'vercel'
  provider: string;              // 'Vercel'
  auth: 'none'|'oauth'|'token'|'webhook-secret'|'local';
  resources: ResourceKind[];     // what it can discover
  observations: string[];        // fields it can report
  events: string[];              // event types it can emit (05)
  actions: ActionType[];         // empty until an execution block
  maxLevel: 0|1|2|3|4;           // ceiling set by owner decision, not by code
  scopes: {level: number; scopes: string[]; why: string}[]; // minimum scopes per level
  docs: string;                  // provider documentation reference, checked at block start
}
```

and implements

```ts
interface Connector {
  test(conn): Promise<Health>;                         // no side effects
  discover(conn, allowlist): Promise<Resource[]>;      // allowlisted resources only
  observe(conn, allowlist): Promise<Observation[]>;    // read-only
  // Level ≥ 2 only, added in later blocks:
  prepare?(conn, request): Promise<ActionPreview>;
  execute?(conn, approvedActionId): Promise<ExecutionRecord>;
}
```

v0.1's `ReadOnlyAdapter`/`Observation<T>` in `src/connectors.ts` is the seed; v0.2 extends it
without breaking the five disabled stubs.

## 2. Connection levels

| Level | Name | Allowed | Needs |
|---|---|---|---|
| 0 | Registered | Listed only | Nothing |
| 1 | Observed | `test`, `discover`, `observe` | Owner authorization of read scopes (Gate: Connector authorization) |
| 2 | Assisted | + `prepare` (drafts, diffs, plans) | Owner decision per connection |
| 3 | Approved execution | + `execute` for an approved action ID | Owner decision per action type |
| 4 | Controlled automation | + `execute` without per-item approval for a named, narrow action | Owner decision per action + template |

A connection's level can never exceed its connector's `maxLevel`. Raising a level is an
auditable event.

## 3. Connection lifecycle

`REGISTERED → AUTHORIZING → CONNECTED → (DEGRADED | PAUSED) → REVOKING → DISCONNECTED`

- **Connect** (owner): choose provider, account, products → OctopusG shows exact scopes and why →
  owner signs in on the provider's own site → credential stored in the credential store (macOS
  Keychain, OD-04) → `test` → `discover` → map regenerates → automations remain off.
- **Revoke** (owner): stop new events/actions → remove webhooks → revoke token at provider →
  delete Keychain item → keep non-sensitive audit → mark resources `disconnected` (never delete) →
  recompute graph → warn about dependent workflows.

## 4. Rules every connector obeys

1. Explicit resource allowlists; no arbitrary URL, path or query input.
2. Smallest scopes available; separate read and write credentials when the provider allows.
3. Timeouts, cancellation, bounded concurrency, respect rate limits; back off, never hammer.
4. Redact before persistence; discard response bodies outside the schema; reject secret-shaped
   values.
5. Errors stay errors: never shown as healthy, zero, or current.
6. No provider SDK in the browser bundle; no credential ever reaches the browser.
7. Fixture tests for: ok, stale, denied, revoked, rate-limited, unexpected shape, conflict.

## 5. Provider register

| Connector | First block | Initial max level | Notes |
|---|---|---|---|
| local-git | v0.2 | 1 (local, no credential) | Allowlisted paths only |
| github | v0.3 (OD-07) | 1 | Read-only token; no contents, no workflows |
| vercel | v0.3 | 1 | Projects, deployments, domains; no env values |
| http-probe | v0.3 | 1 | Approved routes only |
| tailscale | v0.4 | 1 | Device inventory; ACL/tag changes manual |
| n8n | v0.6 | 3 (test workflows) | One inbound webhook + results callback |
| gmail | v0.7 | 2 (drafts) | Google OAuth verification is the long pole |
| manychat | v0.8 | 1 → 4 per campaign | Observe first; templates later |
| meta-instagram / whatsapp-business | v0.8 | 2 → 4 per template | Official APIs, consent and windows enforced |
| squarespace | v0.9 | 1 | Orders, sales, site events |
| supabase | v0.9 | 1 (metadata) | Migrations are v0.10, tier Production |
