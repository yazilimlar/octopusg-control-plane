# ADR-0010 · Progressive delivery and evidence-driven evolution

Status: **PROPOSED** · 2026-09-22

## Context

OctopusG needs a durable sequencing rule after its minimum safe foundation and first controlled
integration. A fully enumerated future roadmap would create false commitments and speculative
work-package identifiers. This principle is recorded in [S12](../sources/S12-2026-09-22-owner-progressive-delivery-principle.md#decisions).

## Decision

OctopusG follows progressive delivery. After the minimum safe foundation and first controlled
integration are established, prioritize a privately deployed usable Alpha. Continue governed work
packages throughout Alpha, Beta, production and subsequent evolution, with future work
increasingly driven by actual usage, testing, operational evidence and newly authorized
capabilities.

Future ideas remain in an unnumbered candidate backlog until sufficiently defined and authorized.
The roadmap must not create speculative numbered work-package placeholders. Evolution History UI
surfacing is deferred to a later governed package.

## Consequences

- The roadmap records sequencing principles and current dependencies without reserving future WP
  numbers.
- Usage, tests, operational evidence and authorization become stronger inputs as the product
  advances.
- A privately deployed usable Alpha is a delivery priority after the minimum safe foundation and
  first controlled integration.
- A later governed package may define the Evolution History UI; this ADR does not implement it.
