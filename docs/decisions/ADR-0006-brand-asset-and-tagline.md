# ADR-0006 · The OctopusG brand asset, its provenance and the approved tagline

Status: **ACCEPTED** (owner decision, 2026-09-18) · supersedes nothing

## Context
The owner supplied an OctopusG logo. No requirement covered a brand asset, so WP-08 recorded it as
**OG-UI-007 (PROPOSED)** with source `UNSOURCED` and built nothing, per CLAUDE.md rules 3 and 4.
Three things were open: which file was authoritative, the provenance and licence position, and
whether the wordmark's tagline belonged in the interface. On 2026-09-18 the owner resolved all
three and instructed implementation
([S6](../sources/S6-2026-09-18-owner-brand-decisions.md#owner-brand-decisions)).

A brand asset is different from the rest of this repository: it is a binary the application serves,
it cannot be regenerated from the registry, and a claim about its licensing would be a claim about
the outside world. It therefore needs a decision record rather than only a requirement.

## Decision
1. **The master is the owner's bytes.** `assets/brand/octopusg-logo-master.png` is the attached
   file, byte for byte, including its own metadata. It is never served and never re-encoded.
   `assets/brand/` is the application-owned asset directory for sources of record; `public/brand/`
   holds what the build serves.
2. **Provenance is recorded, not asserted beyond what the owner said.** The asset is
   owner-supplied and owner-authorized for use in OctopusG, produced through owner-directed
   ChatGPT image-generation iterations, and classified as a proprietary project brand asset
   supplied and authorized by the owner. OctopusG claims **no** third-party authorship, **no**
   third-party licensing, **no** copyright registration and **no** legal exclusivity. This is a
   record of an owner statement, not legal advice or a legal position.
3. **Derivatives are crops and resizes, never redesigns.** Three are served: the full lockup, a
   compact symbol centred on a square canvas by transparent padding (never stretching), and a
   64px favicon reduced from that same symbol. Each is produced from the master by crop and
   Lanczos resize only, and each is stripped of metadata; every one is recorded with its hash,
   dimensions, byte size and derivation in `assets/brand/BRAND-ASSETS.json`, and
   `tests/brand.test.ts` recomputes those values and fails if a served file drifts from its record.
4. **The tagline is "Architect-Engineer of Complex Systems"**, shown where it stays legible and
   omitted from compact header and favicon contexts, exactly as the owner specified.
5. **The brand never carries meaning.** The mark's colours are decorative. Semantic colour —
   map encodings, truth kinds, risk bands, connector state, status badges — is untouched, and the
   visible word "OctopusG" remains real text, never an image, so it is readable, selectable and
   available to a screen reader.
6. **Dark-surface handling is placement, not recolouring.** The wordmark is dark navy and would
   fail contrast on the application's dark background, so the full lockup is shown on a light
   plate. The asset itself is never recoloured, inverted or otherwise altered.

## Consequences
+ OG-UI-007 has a governed source and can leave `UNSOURCED`; `validate:spec` finishes with zero
  warnings.
+ A served brand file cannot silently change: its hash is in the repository and a test checks it.
+ The record says only what the owner said, so it cannot become an accidental legal claim.
− The repository now carries ~1.2 MB of binary assets, and a future logo change means a new master,
  regenerated derivatives and an updated manifest rather than an edit in place.
− A light plate behind the lockup is a visual exception in a dark interface; it is deliberate and
  documented here so it is not "fixed" later by recolouring the mark.
