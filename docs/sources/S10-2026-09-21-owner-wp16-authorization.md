# S10 · Owner authorization for WP-16 credential security foundation

Status: **Owner authorization**, 2026-09-21. This record captures the governed scope for
WP-16. It authorizes implementation of a provider-neutral credential-reference and connector
security foundation only; it does not authorize a provider connection, credential access, or
the DayOS Supabase slice.

## Decisions

1. WP-16 is titled **Credential Reference and Connector Security Foundation**.
2. The durable contract is `CredentialRef -> CredentialProvider -> secure backing store`.
   Connectors, canonical records and business logic must not depend directly on macOS Keychain.
3. macOS Keychain by label is the first supported local backing-store provider, behind the
   provider abstraction. No real credential may be accessed, created, inspected, rotated or stored
   during WP-16.
4. Repository, configuration, UI, logs, evidence, observations, snapshots, generated artifacts
   and canonical records may contain only non-secret references and provider metadata. They must
   not contain values, tokens, passwords, secret-bearing URLs, connection strings or equivalent
   secret material.
5. Supabase-specific design, its ADR and Connector Authorization G3 remain separate gates.
   OG-CONN-015 and WP-17 are not implemented by WP-16.
6. Snapshot/truth-model reconciliation is separate maintenance debt and is not part of WP-16.
