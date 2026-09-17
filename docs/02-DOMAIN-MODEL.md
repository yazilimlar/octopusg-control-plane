# 02 · Domain Model

Status: **PROPOSED** · 2026-09-17 · Entities marked *(v0.2)* are built in v0.2; others are
defined now so later blocks do not invent incompatible shapes.

## 1. Entities

| Entity | Key fields | Plane | First built |
|---|---|---|---|
| **LegalEntity** | `id`, `name` | Control | v0.2 (data only; see OD-05) |
| **Product** (registry row) | `id`, `canonical_name`, `category`, `lifecycle`, `evidence_level`, raw row | Control | v0.1 |
| **Resource** | `id`, `kind`, `label`, `product_ids[]`, `provenance` | Control | *(v0.2)* |
| **Relationship** | `from`, `to`, `type`, `truth`, `source` | Control | v0.1 (8 edges) → *(v0.2)* typed |
| **Fact / Observation** | `subject`, `field`, `value`, `truth`, `source`, `observed_at`, `collected_at`, `expires_at`, `status` | Control | v0.1 envelope → *(v0.2)* |
| **Device** | `id`, `trust_zone`, `capabilities[]`, `prohibited[]`, `online` | Control | v0.2 (Mac, declared only) |
| **Connector** | `id`, `provider`, `plane`, `resources[]`, `max_level`, `status` | Integration | *(v0.2)* framework |
| **Connection** | `id`, `connector_id`, `account_label`, `product_ids[]`, `level`, `scopes[]`, `credential_ref`, `health`, `last_sync_at` | Integration | *(v0.2)*, all Level 0 |
| **CredentialRef** | `store` (`keychain`), `item_label` — never a value | Control | v0.3 |
| **Event** | see [05](05-EVENT-MODEL.md) | Control | *(v0.2)* simulated |
| **Capability** | `id`, `title`, `status`, `target`, `requirements[]` | Governance | Block 0 |
| **Policy** | `action_type`, `tier`, `min_level`, `approval`, `preconditions[]` | Control | *(v0.2)* model |
| **ActionRequest** | `id`, `action_type`, `target`, `tier`, `proposed_by`, `plan`, `preview`, `rollback` | Control | *(v0.2)* simulated |
| **Approval** | `action_request_id`, `decision`, `decided_by`, `decided_at`, `note` | Control | v0.1 simulation → real v0.10 |
| **ExecutionRecord** | `action_request_id`, `executor`, `started_at`, `result`, `evidence[]` | Execution | v0.5 |
| **Workflow** | `id`, `engine` (`n8n`), `state`, `product_ids[]` | Execution | v0.6 |
| **Lead / Conversation** | `id`, `channel`, `product_id`, `campaign`, `status` | Control | v0.7 |

## 2. Resource kinds

`repository`, `checkout` (a repository on a device path), `deployment`, `vercel_project`,
`domain`, `database`, `mailbox`, `social_account`, `workflow`, `device`, `account`,
`document` (governance evidence), `service` (local process such as the ERP).

v0.2 derives `repository`, `checkout`, `domain`, `deployment` and `document` resources from
existing registry fields (`canonical_repo`, `current_local_paths`, `intended_url`,
`production_state`, `consumes`). Nothing is fetched.

## 3. Relationship types

| Type | From → To | Example | Source of truth |
|---|---|---|---|
| `platform_parent` | product → product | Atlas → Lycian/Türkiye Atlas | registry (declared) |
| `consumed_by` / `depends_on` | product → product | Artemis consumes Atlas | registry (declared) |
| `successor_of` | product → product | AgoraXAI Atlas ← Artemis Atlas MVP | registry (declared) |
| `source_repository` | product → repository | Artemis Omni → GitHub repo | registry / GitHub |
| `checked_out_at` | repository → checkout | artemis-omni → `~/Projects/artemis-omni` | registry / observer |
| `hosted_on` | checkout → device | checkout → personal Mac | device agent |
| `deployed_on` | product → vercel_project | Artemis Omni → Vercel | Vercel connector |
| `serves` | deployment → domain | dpl_… → artemis.agoraxai.com | Vercel connector |
| `reachable_via` | device → network | Mac → Tailscale | Tailscale connector |
| `managed_by` | social_account → service | Artemis Instagram → ManyChat | ManyChat connector |
| `executes_in` | workflow → engine | lead normalizer → n8n | n8n connector |
| `creates_leads_for` | channel → product | Instagram → Artemis | event correlation |

Ownership edges come **only** from explicit declared fields. Shared repositories or hosts never
imply ownership ([S1 Resolved portfolio taxonomy](sources/S1-2026-09-17-conversation-export.md#resolved-portfolio-taxonomy)).

## 4. Identifiers

- Products keep registry IDs (`artemis-omni`).
- Resources: `<kind>:<stable-natural-key>` — e.g. `checkout:personal-mac:~/Projects/artemis-omni`,
  `domain:artemis.agoraxai.com`, `repository:github:yazilimlar/artemis-omni`.
- Events: ULID-style sortable IDs; Action requests `ACT-yyyymmdd-nnn`.
- Requirements `OG-<FAMILY>-nnn`; capabilities kebab-case; work packages `WP-nn`.

## 5. Portfolio taxonomy (unchanged from v0.1)

AgoraXAI umbrella · AgoraXAI Platforms (Atlas, **OctopusG**) · Artemis · Products · Ventures ·
Labs · Archive · Security artifacts (`NOT_A_PROJECT`). Atlas-family membership stays derived
from `platform_parent` as implemented in `src/model.ts`.

## 6. Status vocabularies — two fields, never one

- **lifecycle** (what stage a thing is in): registry values, e.g. `ACTIVE_DEVELOPMENT`.
- **risk band** (how worried to be): `High` / `Elevated` / `Lower` from risk-v0.1.

The historical map mixed these in one `status` field; OctopusG keeps them separate
([S3 Historical map critique](sources/S3-2026-09-17-claude-review.md#historical-map-critique)).
