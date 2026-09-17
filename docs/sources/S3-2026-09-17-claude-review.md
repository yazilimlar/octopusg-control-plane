# S3 — Claude review of the GPT plan (2026-09-17)

> **Source record.** Claude's feedback on S2, given before development started. Condensed to
> its decisions and recommendations. Items here are *recommendations*; each one that changes
> scope is listed as an owner decision in `docs/09-ROADMAP.md`. Cite as `S3#<heading-slug>`.

---

## Verdict

GPT's direction is sound: build-versus-buy, read-only first, requirement IDs, and keeping the
company laptop out. Four changes are recommended before development.

## Change 1 — sources must be in the repo

A coding session in the repository cannot see chat conversations. Asking it to "capture the full
future vision" from a one-paragraph list invites invented requirements. Fix: export the
conversations into `docs/sources/`, and require every requirement's `source` to cite a file and
section. If no source exists, the item is marked `UNSOURCED` rather than invented. A second model
reads the sources and the ledger and flags anything missing.

## Change 2 — right-size Block 0

Eleven documents plus YAML, traceability, ADRs and a brief in one pass produce more than the
owner can review. Detailed acceptance criteria for v0.5+ (ManyChat, WhatsApp) are guesswork
because provider APIs will change. Recommended split: 0a decisions (constitution, plane
definitions, v0.2 scope, ADRs); 0b ideas ledger (every capability, one line, status, source);
0c full requirement records only for the next milestone; deeper specs (device agent, connector
contract details, event model) written just-in-time at the start of the block that needs them.

## Change 3 — narrower v0.2

The v0.2 boundary bundles catalog, map, Git observation, Connection Center framework, event
model, simulated inbox and approval model. An approval model with nothing real to approve is
speculative. Recommended: v0.2 = catalog, generated map, local Git observation,
provenance/freshness; v0.3 = Connection Center framework plus GitHub and Vercel read-only;
v0.4 = events, inbox and approvals together with the first real action. GitHub is missing from
the early blocks although it is the source of truth for code; add it with or before Vercel.

## Change 4 — security containment first

The historical architecture map lists plaintext Plaid, Gmail and Squarespace secrets and an
unresolved Supabase key architecture. Once OctopusG holds tokens for everything it becomes the
most dangerous asset in the portfolio. Do not connect it to anything until containment is done.
Keep v0.2 local-only on the Mac (127.0.0.1) with macOS Keychain as the credential store. A cloud
deployment requires authentication, MFA, access control and remote agents — its own block and an
explicit owner decision.

## Plane terminology

Industry meanings: management plane = where a person looks and decides; control plane = desired
state plus rules (registry, graph, policies, audit); data plane = where the real work and traffic
happen. Using "Data Plane" for the ventures is loose; "Managed Estate" is clearer. OctopusG's own
records (registry, events, audit log) are separate again — the **State Store**. In code: one app,
four folders — `ui/` (management), `core/` (control), `connectors/` (integration), `executors/`
(execution).

## Session setup guidance

1. Launch the coding session in the repository root and connect only that folder.
2. Use `CLAUDE.md` (auto-loaded) and import `SESSION_BRIEF.md` from it.
3. Enforce prohibited actions with deny rules in `.claude/settings.json` (e.g. `git push`,
   `vercel`, reading `.env*`) — a prompt is a request, a permission is enforcement.
4. One work package per session; start in plan mode; fresh session for the next package.
5. One Git worktree per package if two sessions ever run at once; one model edits a tree.
6. Hand work between models through files in Git (e.g. `reviews/WP-03-gpt-review.md`); the
   implementer may record objections before building. Evidence decides, not model agreement.
7. Give OctopusG a read-only MCP server so any AI session can query the registry instead of
   guessing — add right after v0.2.

## Sizing rules

One work package = one requirement family, about ten files or fewer, one pull request, and a
clear pass/fail demo. Connector size ≈ sign-in type × resources read × webhooks × write actions.
Vercel read-only is small; Gmail send is large mainly because of Google OAuth verification.

Accounts per block: v0.2 none (local Git only); v0.3 GitHub and Vercel read-only tokens; devices
— Tailscale installed manually, API later; workflows — decide self-hosted vs cloud n8n (direct
webhooks may suffice for a while); communications — Google Cloud project and OAuth consent,
ManyChat, Meta Business verification, WhatsApp Business Platform.

## Historical map critique

`portfolio_architecture_map_v1.html` is a good seed that should become a generated view:
hand-typed x/y positions will not scale (needs lane-based automatic layout); `status` mixes risk
(critical/high/low) with lifecycle (active/planned/target) — split into two fields; facts carry
no `observed_at`/source; ownership is ambiguous ("George / Great Order LLC" vs the AgoraXAI
umbrella) — record which legal entity owns OctopusG and each product.

## Pre-development checklist

1. Verify `~/Projects/agoraxai/control-plane` exists, is the code behind 127.0.0.1:4317, and
   whether it has a remote (if not, it carries the backup risk the map flags elsewhere).
2. Export conversations into `docs/sources/`.
3. Decide: local-only v0.2; security containment first; owning entity; Block 0 split.
4. Run Block 0a with the source-citation rule.
