# ADR-0011 · Multi-AI Engineering Core and Evidence-Governed Spatial Evolution

Status: **PROPOSED** · 2026-09-22

Requirement: OG-AI-005 · Capability: `multi-ai-engineering-core` (CONCEPT, unscheduled).
Source: [S13](../sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md#provenance).

## Context

The owner adopted multi-model / multi-AI engineering as an architectural principle. Prior
exploration needs durable repository history without converting experiments into delivered
systems or technology candidates into authorized work. The owner synthesis is recorded in S13;
the two canonical experiment records, EXP-001 and EXP-002, live only in
[Evolution History](../EVOLUTION-HISTORY.md). This ADR proposes the formal architecture boundary;
its status does not revoke the recorded owner direction or claim formal acceptance.

Reconciliation provenance: the owner subsequently supplied the Claude Code read-only red-team
findings and directed this clarification. The review findings are recorded from that owner-supplied
summary, not an independently inspected review artifact or retroactive wording attributed to S13.

## Decision

### Engineering and governance responsibilities

**Artemis** builds, reconstructs, analyzes, simulates, optimizes and engineers domain/spatial
systems. **OctopusG** governs the universe around those systems, including identity;
tenants/organizations; projects; agents/models; model/provider/version identity; provenance;
evidence; permissions; versions; challenges; disagreement; approvals; decisions; lifecycle/state
transitions; history/audit; accountability; and cost where applicable. These are architectural
responsibilities, not assertions that all such systems or governance mechanisms exist today.
Artemis outputs enter OctopusG with evidence, provenance and authority state; they do not bypass
human approval gates. OctopusG also governs solver provenance. It records authority; it does not
manufacture engineering authority from model agreement.

No individual AI model, provider, LLM, vision model, generative model or agent is engineering
truth or final engineering authority. Independent models and specialist agents may participate
alongside authoritative measurements, project data, observations, standards, validated solvers
and human review. Evidence quality and authoritative observations outrank model consensus;
no majority vote establishes engineering truth.

AI models and model ensembles have **no independent engineering approval authority**. They may
observe, interpret, generate hypotheses, propose, synthesize, critique, challenge, compare,
orchestrate, explain and configure permitted analyses. They must not silently convert a claim,
consensus, synthesis, simulation or recommendation into an approved engineering fact or decision.

Multi-model agreement is evidence to assess, not authority or proof of truth. Multiple agreeing
models must not be presumed to provide independent evidence, especially when they share providers,
training lineage, retrieval sources, prompts, tools or derived evidence. No voting, averaging,
majority, confidence score or consensus mechanism may silently erase dissent or establish
engineering truth.

**“Disagreement is data.”** Retain material dissent and counterevidence explicitly; do not
silently average, overwrite, hide or collapse them into false certainty. Structured claims must
be capable of retaining claim and object/entity identity; model/provider/version identity;
evidence and provenance; assumptions; confidence and uncertainty; dissent and counterevidence;
verification state; deterministic solver results where applicable; temporal state; human review
state; and approval state. AI synthesis may propose a challenge resolution; approval of that
resolution requires the owner and/or appropriately authorized human professional according to
role, domain and applicable professional responsibility, with a traceable rationale and explicit
human identity and authority. Preserve the original claims, dissent and counterevidence.

### Deterministic engineering

Validated deterministic engineering solvers remain authoritative for numerical calculations
only within their validated computational scope, assumptions, inputs, version, configuration and
provenance. Preserve these and the results so numerical verification can be reviewed. Solver
authority does not validate faulty inputs, establish facts outside its scope or replace required
engineering review. Solver output alone does not constitute owner approval, design approval,
professional certification or authorization to act.

AI may prepare, configure, orchestrate, interpret, compare, explain, critique, challenge and
synthesize. An LLM-generated numerical assertion must not silently become a validated structural
calculation, FEA result, CFD result, thermal calculation, electrical calculation, energy
calculation, code-compliance determination, cost calculation, schedule calculation or other
professional engineering result.

### Human authority and existing state models

The owner and/or appropriately authorized human professional is the final approval/decision gate
according to role, domain and applicable professional responsibility. For engineering decisions
requiring licensed professional judgment, OctopusG must preserve the responsible human
professional's approval; neither AI synthesis nor owner approval substitutes for that professional
responsibility. Approval records authorization within that human's remit, not proof of physical truth.

The required conceptual progression is:

```text
AI proposed
→ independently challenged/cross-checked
→ evidence supported
→ solver verified where applicable
→ engineer reviewed where required
→ owner/authorized party approved
→ issued
→ built
→ physically observed/validated
```

This is a sequence of evidence and authority gates, not a new runtime enum. Reconcile with
[the truth model](../DATA_MODEL.md#truth-model-v02-og-data-001),
[the local approval simulation](../DATA_MODEL.md#local-approval-simulation) and
[security and approvals](../06-SECURITY-AND-APPROVALS.md#4-approvals):

| Engineering concept | Existing terminology and boundary |
|---|---|
| AI proposed | `PROPOSED`; model output remains a sourced assertion, normally `derived`, never a physical observation merely because a model says so. |
| Independent challenge, evidence support, scoped solver verification | Evidence for `EVIDENCE` and `REVIEWED`; distinct review artifacts retain dissent, inputs and results. These checks do not confer approval. |
| Required engineer review | A specific professional review obligation associated with `REVIEWED`; generic review or another model's critique cannot substitute for it. |
| Owner/authorized-party approval | `OWNER_APPROVED` is only a conceptual correspondence; real authority requires authenticated identity, scope and recorded approval. Today's simulation provides none. |
| Issued and built | Distinct domain events with evidence, conceptually associated with authorized execution (`EXECUTING`, `executed`); neither is inferred from approval nor collapsed into the other. |
| Physically observed/validated | Dated `observed` evidence supports verification/completion (`VERIFIED`, `COMPLETED`) within scope; model or solver verification alone never proves a thing was built. |

The existing simulation's `ROLLED_BACK` path and terminal-state rules remain unchanged. Future
domain schemas must reconcile these gates before implementation. Requirement status, capability
status, evidence quality, scenario/time, approval status and physical lifecycle are separate
dimensions. Existing derived confidence/freshness rules remain unchanged; model-reported
confidence and future spatial evidence grades cannot silently replace them. Missing evidence
or authorization remains `unknown` or `blocked`.

### Candidate architecture and interoperability

The Engineering Evidence & Challenge Graph (historically “Engineering Consensus Graph”), evidence
bus, Spatial Reality Kernel, independent challenge
roles and spatial/engineering representations are candidates described in
[EXP-001](../EVOLUTION-HISTORY.md#exp-001). “Consensus” means traceable synthesis with explicit
uncertainty and dissent, not voting. Physical evidence, authoritative measurements, validated
calculation, standards, professional engineering review and authorized human decisions may
outweigh model agreement. Approval authorizes an action; it does not make a disputed physical
claim true.

No AI provider is structurally privileged. Provider examples in the history are replaceable or
role-specialized participants where technically appropriate, not architectural dependencies.
Open representations and applications may exchange governed canonical information without any
tool automatically becoming the sole source of truth. Visual realism does not establish
engineering accuracy. Existing observations and scenarios retain provenance and lineage.

## Consequences and scope

- One umbrella capability and one proposed requirement record the governance direction. No
  individual BIM, CFD, FEA, XR, NeRF, GIS, finance or other technology capability is added.
- EXP-001 and EXP-002 remain experiments, outside product registries and numbered work packages.
  No prototype calculation becomes validated engineering, tax or legal advice through this ADR.
- [ADR-0010](ADR-0010-progressive-delivery-and-evolution.md) governs progressive delivery. This
  record adds no Alpha scope, implementation schedule, reserved work-package number or UI work.
  EXP-001 is an experiment/evolution record, not an approved roadmap; its ordering establishes
  neither implementation priority nor sequence. Its candidate architecture requires separate
  promotion through governance and creates no work package or Alpha dependency. After the minimum
  safe foundation and first controlled integration, a privately deployed usable Alpha remains the
  near-term delivery priority. Future implementation should increasingly follow actual usage,
  evidence, testing and explicit owner authorization.
- No candidate system, provider integration, credential access, deployment or runtime change is
  authorized. The current Timeline remains unchanged; later UI/data work requires governance.
- Spatial Atlas E0–E5 definitions were not found in this worktree. EXP-001 retains the owner's
  candidate scale without establishing a second canonical taxonomy. Locate and reconcile the
  authoritative Atlas definitions before any future adoption or schema implementation.

## Open design considerations from the review

These questions preserve I2–I7 for future governed design; they define no schemas, new capabilities,
work packages or implementation commitments. I1 is addressed by the independence rule above;
I8 by the preferred graph name, with the historical name retained.

| Finding | Open design consideration |
|---|---|
| I2 — time and scenario/state | Distinguish observation/recording timestamps from scenario identity and spatial/lifecycle state; the conceptual `(x, y, z, t, s)` notation is not a field schema. |
| I3 — linkage | Define explicit links among claims, supersession, challenges, resolutions and solver runs without losing earlier evidence or dissent. |
| I4 — append-only provenance | Assess reuse of the existing [append-only event/provenance pattern](../05-EVENT-MODEL.md#3-rules), where status changes are new records, before designing claim history. |
| I5 — solver validation provenance | Define how solver validation scope, supporting validation evidence, assumptions, inputs, version, configuration and result provenance are recorded and linked. |
| I6 — tax/finance gates | Define a role/domain authority-gate table before operational use; scenario simulations cannot stand in for tax determinations, filings, accounting approval or professional certification. |
| I7 — spatial lifecycle and claim authority | Reconcile spatial/scenario lifecycle states with the claim-authority gates above without conflating proposed, built or observed states with approval. |

Deferred, not resolved here: a connector-style provider-identity contract; triggers for required
professional review; the E0–E5 namespace collision disclosed above and in EXP-001; the concrete
Artemis-to-OctopusG claim path; and role diversity versus provider diversity. The responsibility
boundary and human authority rules above do not specify these mechanisms.

## Validation and acceptance boundary

Local specification generation, specification validation, build/tests, local audit and semantic
review validate this documentation package only. OG-AI-005 remains PROPOSED with provisional
future acceptance criteria; this ADR remains PROPOSED pending formal owner acceptance.
