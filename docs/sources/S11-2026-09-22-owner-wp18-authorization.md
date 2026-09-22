# S11 · Owner authorization for WP-18 DayOS Supabase design boundary

Status: **Owner authorization**, 2026-09-22. This record authorizes a design and governance
package only. It does not authorize Supabase access, credentials, provider activation, G3, or
connector implementation.

## Decisions

1. WP-18 is **DayOS Supabase Connector Design and Authorization Boundary**.
2. WP-17 remains **Artemis DayOS Supabase Read-Only Observation Connector** and remains reserved
   for implementation after WP-18 and G3.
3. The exact project identity must be resolved from an authoritative configured source and
   cross-validated. Until then the connector state is blocked.
4. The initial metadata allowlist excludes object counts and permits only identity, schema,
   migration inventory/state, provenance and authorization metadata.
5. Maximum connection level is Level 1 (Observed). No G3 is granted by WP-18.
6. Secure-provider activation is a separately authorized WP-17 preflight sub-scope. If it would
   change the WP-16 contract, work stops for a separate security package.
7. `OG-CONN-015` may advance only to APPROVED IMPLEMENTATION TARGET after WP-18 acceptance; it
   does not become implemented, connected, observed, or authorized.
8. The immutable-identifier approval lesson belongs in ADR-0005/source-traceability governance.
9. Snapshot/truth-model reconciliation remains separate technical debt.
