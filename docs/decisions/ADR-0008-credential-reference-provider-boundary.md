# ADR-0008 · Credential reference/provider boundary

Status: **PROPOSED** · 2026-09-21

## Context

OG-SEC-003 and OG-SEC-004 require secret containment before a real connector can be authorized.
The repository must represent enough metadata to resolve a credential without placing its value
in canonical records, source, UI, logs, observations, snapshots or generated artifacts. The owner
has authorized WP-16 but has not authorized any real credential access.

## Decision

OctopusG uses the provider-neutral boundary:

```text
CredentialRef → CredentialProvider → secure backing store
```

`CredentialRef` contains only the approved provider identifier and a bounded item label.
`CredentialProvider` owns any future resolution through an opaque callback boundary. Connectors,
business logic and canonical records never depend directly on an operating-system keychain.

macOS Keychain by label is the first supported local backing-store provider. The WP-16 adapter is
fail-closed unless an owner-run implementation is explicitly injected; WP-16 reads no real item.

## Containment rules

- Secret values, tokens, passwords, secret-bearing URLs and connection strings are rejected.
- Only non-secret references and necessary provider metadata may be persisted or rendered.
- Level 0 remains the default and no provider authorization is inferred from a reference.
- Provider-specific ADR and Connector Authorization G3 are required before a real connector.

## Consequences

The security boundary can be tested without credentials or network access. A later provider can be
added behind the same contract. A real macOS Keychain implementation and each connector require
separate owner review and must preserve the no-secret persistence boundary.
