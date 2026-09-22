# S9 · Owner ownership declarations and client tenancy

Status: **Owner-confirmed declarations**, confirmed and corrected on 2026-09-21 by George
in the WP-15 implementation instruction. The filename retains the 2026-09-20 draft date.
The `work/incoming-cowork-2026-09-21/` handoff is input, not canon. This record supersedes
conflicting wording in S9-DRAFT; it is declared evidence, not independent legal verification.

## Owner declarations

1. Great Order LLC is owned and controlled by George. Partners may hold project- or
   product-specific contractual/economic interests at differing percentages. The holders,
   interests, scopes and percentages remain undeclared. This does not declare partner equity
   in Great Order LLC, nor a numeric percentage for George.
2. Great Order LLC owns and controls AgoraXAI as a business/platform. Specific domains,
   repositories, trademarks, software and other IP remain undeclared until separately documented.
3. Great Order LLC owns and controls Artemis as a business/division. Specific repositories,
   applications and other IP remain undeclared until separately documented.
4. Artemis provides engineering and software services through or for AgoraXAI. Great Order LLC
   receives services from AgoraXAI as an internal client and provides funding described by the
   owner as donations. No Artemis-to-AgoraXAI payment is declared. Other payments, intercompany
   charges, amounts, terms, accounting classification and tax treatment remain undeclared.
   “Donation” records the owner's description only, with no conclusion about deductibility or
   tax status.
5. AgoraXAI may engage multiple vendors, contractors and suppliers. None are individually declared.
6. Pınar Evleri is an external client owned independently by George's cousins, not by Great Order
   LLC, AgoraXAI or Artemis. Artemis provides software/services to Pınar Evleri. No ownership edge
   may cross from the internal group into Pınar Evleri. Cousins' individual identities and ownership
   percentages remain undeclared; the collective owner description is retained.
7. OctopusG starts as an internal control platform and must support future multi-organization and
   client tenancy. Future tenancy grants neither ownership of nor access to another tenant's
   resources. Current local catalog markers are not an authentication or access-control system.
8. Great Order LLC conducts at-cost sales through GreatOrder.org with Prime Industrial involved.
   Prime Industrial's exact role (supplier, seller of record, intermediary, reseller or operating
   brand) remains undeclared. “At-cost” and “non-profit sales” describe intended pricing only.
   No entity is declared nonprofit or tax-exempt. Ownership of greatorder.org, transaction amounts,
   accounting treatment and tax treatment remain undeclared. Possible nonprofit reorganization
   requires a future governed work package outside WP-15.

## WP-15 authorization and model

The owner authorized OG-REG-007 and OG-REG-008 from the handoff for implementation here.
Business nodes `organization:agoraxai` and `organization:artemis` are distinct from registry
products such as `agoraxai-web` and `artemis-omni`; business ownership never cascades to assets.
`client:pinar-evleri` is both the external client identifier and its tenancy. The historical
registry ID `pinarevleri` remains intact with that tenancy. George and the collectively described
cousins are party nodes, not invented legal entities. Membership in a tenancy is not ownership.
Unspecified registry rows remain `undeclared`, rather than being assigned to the internal group
by inference. The OctopusG registry row is explicitly internal under declaration 7.

Typed `owns` and `controls` edges require known, equal tenancies. Existing `platform_parent`
edges are checked against declared tenancy boundaries as well; two undeclared legacy endpoints
retain their recorded relationship without establishing legal ownership. Missing tenancy never
permits a known tenant's ownership edge. Explicit `provides_services_to`, `client_of`, `funds`
and (only with a separate declaration) `pays_for_services` may cross boundaries; they confer no
ownership or access. No provider or payment is invented from declarations 4, 5 or 8.

Scoped shares name a holder and an entity/project/product scope, a source and an interest kind
(`equity`, `contractual`, `economic` or `undeclared`). No unidentified partner is populated as a
holder. The share schema permits `undeclared` percentages and blocks attribution until known;
per-scope declared totals over 100 are rejected. Contractual/economic interests create no equity
or ownership edges. Internal organization roll-ups refuse client or undeclared-tenancy inputs
with a reason. All-registry inventory counts are explicitly inventory, not ownership roll-ups.

## Prior art (not a source of requirements, only of design ideas)

The Cowork handoff describes a non-canonical prototype; no prototype code, dependencies, test
claims or repository state were independently verified or adopted. The owner authorized recording
OG-OBS-008 (explained variance), OG-DATA-005 (cost basis/depreciation) and OG-DATA-006 (dated
compliance obligations) as PROPOSED and unscheduled only. Their candidate acceptance criteria
come from the handoff, not verified financial or legal guidance. No such functionality is built
by WP-15. The canonical repository remains `~/Projects/agoraxai/control-plane`.
