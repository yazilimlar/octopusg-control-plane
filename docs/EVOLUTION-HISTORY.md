# Evolution History

The canonical durable development/evolution ledger for OctopusG and its recorded architectural
exploration. This initial ledger captures the Multi-AI Engineering Core direction and two
Rainbow House reference experiments; it does not retrospectively claim a complete release history.

## Meaning and authority

| Category | Meaning |
|---|---|
| DECISION | Something deliberately adopted, with the adopting authority and source recorded. |
| EXPERIMENT | Something explored or prototyped; record what was reported versus independently verified. |
| CANDIDATE | Something potentially worth developing, without implementation authorization. |
| WORK PACKAGE | Authorized bounded implementation work, governed by requirements and evidence. |
| RELEASE / MILESTONE | A governed delivered state, supported by delivery and acceptance evidence. |

Presence in this history **does not imply approval, production status, implementation or
authoritative truth**. Category and explicit status must be read together. A pivotal architectural
moment does not by itself constitute a delivered RELEASE / MILESTONE. Record meaningful changes
with dates, sources, scope, uncertainties and links; preserve earlier observations and decisions
when appending later evidence or supersession. Existing requirements, ADRs and work-package
evidence remain their respective authorities.

EXP-001 and EXP-002 below are the sole canonical experiment records. Other documents should link
to these identifiers rather than duplicate their full records. Neither is a product registry
row, a numbered work package or a reservation of a future WP identifier.

The current Timeline UI is unchanged. A later governed UI/data package may consume a source-backed
projection of this history. Delivery sequencing remains in
[ADR-0010](decisions/ADR-0010-progressive-delivery-and-evolution.md).

## Provenance and lineage

Recorded 2026-09-22 from [S13](sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md#provenance),
the canonical owner synthesis of prior multi-AI assisted exploration. Experiment dates, original
artifact paths, model versions and individual contribution assignments are not supplied here;
this record does not invent them or claim to have independently inspected the prior artifacts.

Preserve meaningful lineage across owner direction, GPT/Codex, Gemini, DeepSeek, Grok, Claude
where later introduced, and other future AI systems where relevant. This list is not a verified
chronology or attribution of each feature to a model. No provider is the owner or canonical
authority. The repository remains canonical; additional provenance can be appended when sourced.

## Multi-AI Engineering Core architectural direction

Category: **DECISION** · Recorded: **2026-09-22** · Status: **owner architectural/governance
principle adopted; formal ADR PROPOSED; no implementation authorized**.

Source: [S13 adopted principles](sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md#adopted-architectural-and-governance-principles).
Architecture: [ADR-0011](decisions/ADR-0011-multi-ai-engineering-core-and-evidence-governance.md).
Ledger: [OG-AI-005](requirements/REQUIREMENTS.yaml), PROPOSED; `multi-ai-engineering-core`,
CONCEPT, target `unscheduled`.

Core engineering is multi-model / multi-AI by design. No single AI is engineering truth or final
authority. **“Disagreement is data.”** Evidence quality and authoritative observations outrank
model consensus; there is no majority vote for engineering truth. Material dissent stays visible.
Validated deterministic solvers retain numerical authority within their validated scope;
required engineering review and authorized human approval remain explicit gates. Artemis
engineers domain/spatial systems; OctopusG governs their surrounding evidence, identity,
permissions, decisions, accountability and history as detailed in ADR-0011.

## EXP-001

Title: **Rainbow House Panorama Room / Spatial Reality Kernel**\
Category: **EXPERIMENT**\
Status: **experiment / reference implementation concept**\
Recorded: **2026-09-22**; exploration date not independently established.\
Source: [S13](sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md#experiments-and-reference-implementations).

The Panorama Room is the prototype spatial cell in the owner's exploration. This record
preserves the concept; it does not assert that a Spatial Reality Kernel or any candidate below
has been implemented. Its conceptual progression is:

```text
REALITY → EVIDENCE → SPATIAL KERNEL → MULTIPLE MODELS → SIMULATIONS
→ DESIGNS → DECISIONS → BUILT REALITY → NEW OBSERVATIONS
```

### Visual evidence and layered model

The owner's synthesis reports candidate reconstruction anchors revealed by visual evidence:
suspended ceiling grid; tiled floor grid; extensive glazing; rectangular openings; sliding-glass
openings; glazed/French-style doors; vertical posts/partitions; continuous window ledge/bench;
perimeter baseboard heating; receptacles; switches/controls; wall lighting; recessed lighting;
ceiling fan/light; wood paneling/trim; exterior patio; driveway; vegetation/landscape; and distant
terrain/view context. These are uncertain visual interpretations, not authoritative existing-
condition facts, verified dimensions, materials, functions or equipment identities. Original
evidence and physical verification would be needed to establish them.

Preserve distinct layers:

```text
REALITY / EVIDENCE
GEOMETRY
SEMANTICS
ENGINEERING
DESIGN
SIMULATION
TEMPORAL / SCENARIO
```

### Candidate architecture from the experiment

Category: **CANDIDATE** throughout the following concepts, including the exploratory “God Mode”
label. This label grants no special authority. None is an implemented-functionality claim,
approved technical design, separate capability or authorized work package.

#### A. Constraint-Assisted Reconstruction

Instead of “What shape probably appears?”, conceptually ask: “What geometrically and physically
consistent state best explains the available evidence?” Preserve the conceptual objective:

```text
X* = argmin_X [
  w_photo * E_photo +
  w_lidar * E_lidar +
  w_measure * E_measure +
  w_geometry * E_geometry +
  w_semantic * E_semantic +
  w_physics * E_physics
]
```

Here X is a candidate state; the E terms represent evidence/constraint errors and the w terms
their conceptual weights. No numerical weights, implementation or validation are specified.
Authoritative measurements should generally outrank inferred geometry. An optimization result
must retain material residual conflicts and dissent rather than disguising them through weights.

Candidate constraints: parallelism, perpendicularity, verticality, repeated modules, ceiling
grids, floor grids, wall intersections, rectangular openings, known dimensions, depth observations
and building-system constraints.

#### B. Anchor Graph / Survey Control Network

Avoid exhaustive manual measurement by using strategic control dimensions: floor-to-ceiling
height, ceiling-grid module, known tile dimension, representative door width, sliding-door width,
window dimensions, sill height, partition dimensions, post dimensions and major room dimensions.
AI/reconstruction geometry could be adjusted against this control network; no control dimension
has been measured or assigned an authoritative value by this record.

#### C. Structured Reality Sweep

Candidate capture sequence: Pass A — geometry/depth; Pass B — overlapping photographs/video;
Pass C — details/MEP; Pass D — physical control measurements; Pass E — exterior continuation
through openings/site/façade.

Conceptual scale progression: Room → House → Property → Terrain/GIS context.

#### D. Neural / Reality Capture Fusion

Candidate inputs/representations: photogrammetry, NeRF where useful, 3D Gaussian Splatting,
point clouds, LiDAR/depth, imagery/video, optional thermal/multispectral observations,
PBR/appearance representation and environmental/GIS/weather/solar context.

| Representation | Candidate forms |
|---|---|
| REALITY REPRESENTATION | point cloud / imagery / splat / neural representation / textured mesh |
| ENGINEERING REPRESENTATION | parametric BIM / semantic solids / analytical model / engineering graph |

They may be spatially registered, but **visual realism does not establish engineering accuracy**.
Neither representation automatically becomes authoritative merely through a conversion.

#### E. Nested Spatial Universes / Cells

Conceptual hierarchy, not an inventory of verified assets or implemented cells:

```text
EARTH
└── USA
    └── New York
        └── Marlboro
            └── Rainbow House Property
                ├── Terrain
                ├── Landscape
                ├── House
                │   ├── Floors
                │   │   ├── Panorama Room
                │   │   └── other cells
                │   ├── Mechanical
                │   └── Electrical
                ├── Pool
                ├── Greenhouse
                ├── Trinity Hearth
                └── Utilities
```

Local coordinate systems may inherit transforms from parent spatial frames.

#### F. Semantic Spatial Graph

Conceptual relationships; example IDs below are illustrative, not existing canonical objects:

```text
PanoramaRoom
├── contains → Window_W07
├── contains → Door_D03
├── boundedBy → Wall_E02
├── heatedBy → Baseboard_H04
├── illuminatedBy → Light_L03
├── observedBy → Evidence_IMG_x
└── simulatedBy → Analysis_Run_x
```

#### G. Parametric Reconstruction

Engineering truth should not be permanently reduced to an uneditable triangle mesh. Candidate
parameters:

| Object | Parameters |
|---|---|
| ROOM | width, depth, ceiling_height |
| WINDOW | width, height, sill_height, frame_depth, orientation |
| BASEBOARD | length, height, system/zone |
| CEILING_GRID | module_x, module_y, elevation |

Verified changes may propagate through dependent geometry while retaining provenance and
rechecking affected claims and analyses.

#### H. Evidence Confidence

The owner's candidate conceptual scale is E0 — unknown; E1 — AI inferred; E2 — photograph
supported; E3 — multi-view supported; E4 — depth/LiDAR supported; E5 — physically measured /
authoritative. Preserve future **Reality Confidence Mode** as a candidate visual exposure of
uncertainty, not an existing mode or a guarantee from a sensor type.

Reconcile with Artemis Spatial Atlas evidence conventions before adoption. No canonical Spatial
Atlas E0–E5 definitions were found in this worktree; this list records the owner's proposal and
does **not** establish a duplicate canonical taxonomy or redefine any existing Atlas grade.
The unrelated E-numbered approval checklist items are not spatial evidence grades. Existing
[truth and derived-confidence conventions](DATA_MODEL.md#truth-model-v02-og-data-001) remain
authoritative here. Evidence grade, model-reported confidence, uncertainty and approval are
distinct; obtaining imagery or depth alone does not prove engineering accuracy.

#### I. Spatial Branching / Git for Physical Reality

Existing reality must not be overwritten by alternatives. Conceptual scenario names, not Git
branches created by this package:

```text
existing/2026-09-22
├── option/window-upgrade
├── option/open-plan
├── option/net-zero
├── option/minimal-renovation
└── option/observatory-room
```

Potential branch deltas: geometry, semantics, cost, energy, schedule, risk, evidence, simulations
and approvals. OctopusG governs lineage and state transitions; a scenario is not observed reality.

#### J. Temporal / Scenario Reality

Candidate state space: **(x, y, z, t, s)**, where t = time and s = scenario/state.
Examples: historical/as-built, observed existing, proposed, construction phase, completed,
maintained, degraded and alternative universe. These are conceptual domain states, not new
runtime enum values. New observations must not silently overwrite old observations.

#### K. Multi-Physics Federation

Potential domains: thermal, energy, solar/daylight, CFD, FEA/structural, electrical, HVAC,
lighting, cost, schedule, constructability, carbon and maintenance. AI agents orchestrate
validated specialist tools instead of impersonating them. Each result retains the tool's
validated scope, inputs and assumptions under ADR-0011.

#### L. Generative Multi-Objective Engineering

Potential objectives: cost, energy, daylight, glare, structural effect, constructability,
carbon, maintenance, schedule, code constraints and view preservation. Preserve Pareto tradeoffs
and explicit constraints; do not automatically produce an opaque AI-defined “best” design.
Human review and approval govern selection.

#### M. Digital Twin Maturity

Conceptual maturity: model-driven twin → model + environmental context → model + sensors →
model + building systems → calibrated predictive twin. An uninstrumented model must not be
described as a live operational twin. No maturity stage is claimed as delivered here.

#### N. View Preservation Engine

A concrete Rainbow House candidate use case: interior observer points / view cones may interact
with terrain, structures, existing vegetation, proposed vegetation, plant-growth models and
time. Questions include which vegetation could obstruct a protected view, when obstruction may
occur, allowable growth envelopes and comparison of landscape alternatives. Results would
depend on sourced geometry, observations and explicit growth assumptions; no forecast is asserted.

#### O. XR / Collaborative Spatial Engineering

Multi-user XR/spatial collaboration remains a future candidate only, with no implementation
implied.

### Engineering Consensus Graph

Category: **CANDIDATE**. Conceptual flow, not an existing pipeline:

```text
PHYSICAL REALITY
      ↓
REALITY EVIDENCE BUS
      ↓
multiple independent models / agents
      ↓
ENGINEERING CONSENSUS GRAPH
      ↓
explicit disagreement / uncertainty
      ↓
SPATIAL REALITY KERNEL
      ↓
parametric BIM / reality representation / GIS
      ↓
ARTEMIS ENGINEERING
      ↓
validated domain solvers
      ↓
design / engineering states
      ↓
OCTOPUSG GOVERNANCE
```

“Consensus” does **not** mean majority voting. Physical evidence, authoritative measurements,
validated calculation, standards, professional engineering review and authorized human decisions
may outweigh model agreement. OctopusG governance applies across the flow, including evidence,
permissions and approvals; its final position in this conceptual diagram does not postpone
governance until after engineering. The human gates in ADR-0011 apply throughout.

### Multi-AI red team and challenge model

Category: **CANDIDATE**. Roles may include perception agent, geometry agent, semantic/BIM agent,
design agent, structural agent, thermal/energy agent, CFD agent, electrical agent, cost agent,
schedule/constructability agent, code/standards agent, evidence auditor, contradiction/challenge
agent and synthesis agent.

One AI may propose; another may challenge; another may inspect evidence; another may independently
verify assumptions. Material dissent must remain visible to OctopusG. Multiple labels or outputs
do not themselves establish independence; provenance must let reviewers assess shared inputs,
assumptions and model lineage.

No AI provider is structurally privileged. GPT/OpenAI, Claude/Anthropic, Gemini/Google, Grok/xAI,
DeepSeek, local/open models, future models and specialist systems should be interchangeable or
role-specialized participants where technically appropriate. These are provider examples, not
architectural dependencies, configured integrations or assertions that each performed a role.

### Open and interoperable representations

Category: **CANDIDATE strategy**, not an implementation commitment. Possible formats/components
include IFC, glTF/GLB, LAS/LAZ, GeoJSON, 3D Tiles, JSON / JSON-LD, PostgreSQL/PostGIS and object
storage. Revit, Blender, FreeCAD, Three.js, Cesium, Unreal and future engineering applications
should be capable of acting as consumers/producers around governed canonical information;
no application automatically becomes the sole source of truth.

## EXP-002

Title: **Rainbow House STR Tax Studio**\
Category: **EXPERIMENT**\
Status: **experiment / reference implementation**\
Recorded: **2026-09-22**; development dates not independently established.\
Source: [S13](sources/S13-2026-09-22-owner-multi-ai-engineering-milestone.md#experiments-and-reference-implementations).

### Owner-reported development lineage

```text
initial interactive single-file HTML concept
→ AI-assisted critique/revision
→ expanded financial/tax simulator
→ responsive/mobile prototype
→ candidate future property/finance intelligence capability
```

The lineage records the owner's synthesis; this package has not independently executed or
validated those prototypes. The last stage is a CANDIDATE direction, not a new capability row,
product, authorized work package or delivered finance/tax engine.

### Demonstrated and candidate concepts retained

The owner-reported prototype exploration and candidate extensions include the following. S13
does not establish feature-by-feature implementation or verification status, so this list makes
no such claim:

- Purchase price, land allocation, financing/mortgage and amortization.
- Seasonal ADR (average daily rate), occupancy scenarios, cleaning/turn assumptions, operating
  expenses and property-management assumptions.
- NOI (net operating income), debt service and cash flow.
- Depreciation classes, cost-segregation scenarios, bonus-depreciation assumptions, taxable-income
  modeling, depreciation vs taxable-income visualization and asset/tax mapping.
- Conservative/Base/Strong scenarios, ten-year ledger/projection and equity trajectory.
- Hold-vs-sell, sale waterfall and recapture modeling.
- Mobile/responsive UX.

### Tax and finance authority boundary

EXP-002 demonstrates product direction and interaction/modeling ideas. **It is not validated
tax advice.** Do not canonize prototype tax/legal conclusions. Model-generated tax rates,
bonus-depreciation conclusions, W-2 offset treatment, material-participation conclusions, STR
qualification, depreciation schedules, recapture treatment and sale tax treatment are not
authoritative merely because an AI prototype calculated them. No rates, eligibility findings
or legal conclusions are adopted here.

Future canonical tax/finance logic must support authoritative citations; tax-year versioning;
jurisdiction; entity type; tax/filing status where relevant; effective dates; explicit assumptions;
independent testing; an audit trail; and CPA/tax-professional review or handoff where appropriate.
Scenarios and visualizations must retain their assumptions and uncertainty. No finance/tax engine
is implemented or authorized by this record.

## Scope and open architecture questions

This ledger documents owner direction and exploration under OG-AI-005; it leaves Alpha scope,
the current Timeline, runtime, provider activation and delivery authorization unchanged.
No release, new numbered work package or product registration is created.

Before future design/implementation authorization, locate the authoritative Spatial Atlas
evidence definitions and original experiment artifacts where available; reconcile the candidate
evidence scale and domain gates with canonical models; define solver validation scopes and
independent challenge criteria. These are open architecture questions, not assigned work.
