# 05 · Event Model

Status: **PROPOSED** · v0.2 defines the envelope and renders a **simulated** inbox from
fixtures. Real event sources start in v0.3 (deployment events) and v0.6 (webhooks).
Sources: [S1 Core capabilities discussed](sources/S1-2026-09-17-conversation-export.md#core-capabilities-discussed),
[S2 Build versus buy](sources/S2-2026-09-17-gpt-planning-thread.md#build-versus-buy).

## 1. Envelope

```ts
interface OctoEvent {
  id: string;                 // sortable unique ID
  type: string;               // 'deployment.failed', 'inquiry.received', 'comment.keyword_matched'
  occurred_at: string;        // provider time (ISO 8601)
  received_at: string;        // OctopusG time
  source: {connector: string; account?: string; resource?: string;
           provider_event_id?: string};  // the provider's own id; the de-duplication key in §3
  subject: {product_id?: string; resource_id?: string};
  summary: string;            // short, human-readable, no secrets or message bodies in v0.2
  severity: 'info'|'notice'|'warning'|'critical';
  truth: 'observed'|'derived'|'simulated';
  correlation_id?: string;    // links events of one story (comment → lead → draft → sent)
  requires_decision: boolean;
  status: 'new'|'acknowledged'|'actioned'|'dismissed';
  payload_ref?: string;       // pointer to redacted payload; never inline personal data in v0.2
}
```

## 2. Inbox behavior

The inbox answers the S2 cockpit questions: what happened · which product · which account ·
did an automation respond · does it need approval · what was executed · did it succeed · how did
the map change. Filters: product, connector, severity, requires-decision, status.

## 3. Rules

- Events are append-only; status changes are new records, not edits.
- `simulated` events are visibly labelled and never feed KPIs (same rule as v0.1's simulation).
- Personal data (names, emails, message text) is not stored until the communications block
  defines retention and redaction (OG-DATA-003).
- Duplicate provider deliveries are de-duplicated by `(connector, provider_event_id)`. An event
  that carries no `provider_event_id` has no provider identity and is never merged with another;
  de-duplication keeps the first delivery and drops the later ones.
- A status change is a new record of type `event.status_changed` carrying `correlation_id`; the
  original record is never edited, and the current status is the fold over those records.

## 4. Initial event types

| Type | Emitted by | Block |
|---|---|---|
| `observation.stale`, `observation.changed` | local-git, any connector | v0.2 |
| `drift.detected` | control plane | v0.2 |
| `connection.state_changed` | connection framework | v0.2 (simulated) |
| `deployment.created/succeeded/failed` | vercel | v0.3 |
| `device.online/offline` | tailscale / agent | v0.4 |
| `workflow.failed` | n8n | v0.6 |
| `inquiry.received`, `draft.prepared`, `message.sent` | gmail | v0.7 |
| `comment.keyword_matched`, `dm.replied`, `lead.created` | manychat / meta | v0.8 |
| `order.created`, `sale.recorded` | squarespace | v0.9 |
