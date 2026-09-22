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

## Decision

### Engineering and governance responsibilities

**Artemis** builds, reconstructs, analyzes, simulates, optimizes and engineers domain/spatial
systems. **OctopusG** governs the universe around those systems, including identity;
tenants/organizations; projects; agents/models; model/provider/version identity; provenance;
evidence; permissions; versions; challenges; disagreement; approvals; decisions; lifecycle/state
transitions; history/audit; accountability; and cost where applicable. These are architectural
responsibilities, not assertions that all such systems or governance mechanisms exist today.

No individual AI model, provider, LLM, vision model, generative model or agent is engineering
truth or final engineering authority. Independent models and specialist agents may participate
alongside authoritative measurements, project data, observations, standards, validated solvers
and human review. Evidence quality and authoritative observations outrank model consensus;
no majority vote establishes engineering truth.

**“Disagreement is data.”** Retain material dissent and counterevidence explicitly; do not
silently average, overwrite, hide or collapse them into false certainty. Structured claims must
be capable of retaining claim and object/entity identity; model/provider/version identity;
evidence and provenance; assumptions; confidence and uncertainty; dissent and counterevidence;
verification state; deterministic solver results where applicable; temporal state; human review
state; and approval state. A synthesis may resolve a challenge only with a traceable rationale
and authority; it must preserve the original claims and dissent.

### Deterministic engineering

Validated deterministic engineering solvers remain authoritative for numerical calculations
within their validated scope. Preserve inputs, assumptions, solver/version identity, scope and
results so numerical verification can be reviewed. Solver authority does not validate faulty
inputs, establish facts outside its scope or replace required engineering review.

AI may prepare, configure, orchestrate, interpret, compare, explain, critique, challenge and
synthesize. An LLM-generated numerical assertion must not silently become a validated structural
calculation, FEA result, CFD result, thermal calculation, electrical calculation, energy
calculation, code-compliance determination, cost calculation, schedule calculation or other
professional engineering result.

### Human authority and existing state models

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

The Engineering Consensus Graph, evidence bus, Spatial Reality Kernel, independent challenge
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
- No candidate system, provider integration, credential access, deployment or runtime change is
  authorized. The current Timeline remains unchanged; later UI/data work requires governance.
- Spatial Atlas E0–E5 definitions were not found in this worktree. EXP-001 retains the owner's
  candidate scale without establishing a second canonical taxonomy. Locate and reconcile the
  authoritative Atlas definitions before any future adoption or schema implementation.

## Validation and acceptance boundary

Local specification generation, specification validation, build/tests, local audit and semantic
review validate this documentation package only. OG-AI-005 remains PROPOSED with provisional
future acceptance criteria; this ADR remains PROPOSED pending formal owner acceptance.
