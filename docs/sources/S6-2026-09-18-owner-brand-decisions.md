# S6 — Owner brand decisions for OctopusG (2026-09-18)

> **Source record.** The owner (George Oktem) stated these decisions directly, in the Cowork
> session of 2026-09-18, when supplying the brand asset and instructing that OG-UI-007 be
> implemented. They are recorded here verbatim in substance so the requirement has a governed
> repository source rather than `UNSOURCED`. Cite as `S6#<heading-slug>`.

---

## Owner brand decisions

The owner resolved three questions that had been left open when OG-UI-007 was first proposed:

1. **Authoritative file.** The PNG the owner attached on 2026-09-18 is the authoritative initial
   OctopusG logo. Its bytes are preserved unmodified as
   [`assets/brand/octopusg-logo-master.png`](../../assets/brand/octopusg-logo-master.png) and its
   hash, dimensions, format, byte size and transparency are recorded in
   [`assets/brand/BRAND-ASSETS.json`](../../assets/brand/BRAND-ASSETS.json).

2. **Provenance and use authorization.** The asset is owner-supplied and owner-authorized for use
   in OctopusG. It was produced through owner-directed ChatGPT image-generation iterations. It is
   recorded as a **proprietary project brand asset supplied and authorized by the owner**.
   OctopusG claims no third-party authorship, no third-party licensing, no copyright registration
   and no legal exclusivity, and nothing in this repository should be read as such a claim.

3. **Tagline.** The approved tagline is **"Architect-Engineer of Complex Systems"**. It belongs in
   the application where it remains legible. It need not appear in compact header or favicon
   contexts.

## Scope of the brand work

The owner instructed one focused branding commit: move OG-UI-007 into v0.2, preserve the source
bytes as the master, record provenance, use a stable application-owned asset directory, create
only the minimum optimized derivatives, strip metadata from served derivatives while preserving
the master, keep visible accessible "OctopusG" text and meaningful alternative text, and verify
local-only loading, responsive sizing, contrast and overflow. Semantic map, truth, risk, connector
and status colours are not to be changed, unrelated screens are not to be redesigned, and the
internal schema constant `Octopus`, export compatibility and the `agoraxai.octopus.workflow.v1`
localStorage key are to be preserved.

## v0.2 gate decisions

Recorded at the same time, as conservative owner positions for the v0.2 gate:

- **OD-03** — all connectors remain Level 0 and unauthorized. Any real connector requires a
  separate v0.3 connector-specific ADR and owner approval.
- **OD-04** — no credential store is selected in v0.2. Credential handling remains blocked until
  immediately before the first approved real connector.
- **Observer allowlist** — the current one-entry allowlist is sufficient for v0.2. Expansion will
  be an explicit later configuration action.
- **Trust zones** — the prohibition on T3/T4 and production actions is retained. No production
  execution is authorized in v0.2.
- **Great Order LLC** — existence is retained as owner-confirmed declared data, with no ownership
  relationships inferred.
- **OG-SEC-008** — stays pending until the owner has placed the final complete-history bundle in
  an off-device location. Recovery must not be marked verified before that action.
