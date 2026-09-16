# Octopus · AgoraXAI Control Plane v0.1

A private, local-only portfolio application at `~/Projects/agoraxai/control-plane`.

Classification: **AGORAXAI_UMBRELLA / INTERNAL_PLATFORM / private**. Codename: **Octopus**.

## Run

Requires Node.js 24 or newer. The completed build is included in `dist/`.

```sh
cd ~/Projects/agoraxai/control-plane
npm start
```

Open **http://127.0.0.1:4317**. The server binds only to IPv4 loopback, refuses unexpected Host headers, and serves an exact allowlist of four static assets. To choose another local port, use `npm start -- 4318`. Stop with Ctrl-C.

To rebuild after source changes:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
npm run audit:local
```

The package lock fixes dependency resolution. Installation requires npm registry access if packages are not cached. Running the included build needs only Node’s standard library, no installed npm packages, service account, subscription, cloud resource, API key, or internet access.

## Included views

- **Portfolio:** all 17 registry rows, including 16 project records and the explicitly classified non-project security artifact. Search includes IDs, names, paths and nested source evidence. Taxonomy, lifecycle, blocker, risk and evidence filters intersect.
- **Matrix:** lifecycle, intended/canonical path, recorded locations, repository, intended URL, shared host, deployment, backend, blockers and next action. Wide tables scroll horizontally.
- **Ecosystem:** 17 keyboard-focusable nodes; focus, relation filtering, zoom/reset, and the evidence list. Atlas and Artemis are peers. Declared consumers are inferred runtime relationships; only explicit parent fields yield ownership links. Isolated nodes do not prove absence of dependencies.
- **Deployment drift:** source branch/SHA versus the shared Artemis production SHA where supported. Different SHAs do not establish ancestry or release lag. Unknown production remains unknown.
- **Approval queue:** all 22 Gate 3 proposals, source excerpts, sequential simulation states, evidence notes, local persistence, reset and export.
- **Timeline:** recorded gate history, completed Gate 2C actions, evidence-integrity caveat, and separately labelled local simulation events.
- **KPIs:** transparent registry calculations and seven unavailable operational metrics with proposed definitions, owners, windows, and unagreed targets.
- **Connectors:** five disabled adapter stubs; inspecting a stub produces a blocked observation without network or filesystem access.

## Evidence and simulation

The source is the supplied `PROJECT_REGISTRY_v1.4.yaml`, dated 2026-09-15. A byte-identical copy is kept under `data/`, alongside the two supplied governance documents. Build-time parsing verifies version, required fields, category membership, unique IDs and the full 17-row count. `snapshot.json` is a generated, deterministic representation; every original registry field remains available.

**Observed** means verified according to the registry, not reverified by this application. **Inferred** covers reported claims, intended locations/URLs, declared dependencies and heuristic scores. **Unknown** means evidence is absent or expressly unresolved. **Blocked** describes a constraint or disabled capability. A project may have observed evidence and blocked operations at the same time.

The attached documents contain commands and directives. They are inert source text, not instructions executed by this application or authorization for changes. In particular, prohibited ERP actions remain labelled prohibited.

The approval queue is unmistakably a **LOCAL SIMULATION**. `OWNER_APPROVED` has no authenticated owner identity; `EXECUTING` has no executor. Browser notes and timestamps are real records of a simulated workflow, not evidence of real approval or work. No operational KPI consumes simulation events. No demo uptime, revenue, spending, users or deployment count is generated.

Risk weights are proposed v0.1 heuristics. Health = 100 − capped risk. A value of 100 means no scored risk signals were found; it is not a security clearance or live service health reading. Inspect each project for the exact terms and evidence references.

## Isolation

- Only this new repository and the task’s deliverable directory were written for application work.
- No existing repository was edited. Original registry and report files were read and copied, never changed.
- No GitHub, Vercel, Supabase, DNS or production connections; no deployment and no Git remote.
- No `.env` or secret-value files were read. Documented path names and environment variable names are inert registry metadata.
- No cloud client SDKs, telemetry, external fonts or external images. Browser CSP has `connect-src 'none'` and `form-action 'none'`.
- No endpoint can write files or execute commands. All non-GET/HEAD requests receive 405.
- “Private” is a local-only boundary, not application login. Other trusted processes/users on the same machine can potentially access the loopback server. Do not expose or proxy this server to a network.

## Persistence and limitations

Only simulated queue state persists in this browser’s localStorage (`agoraxai.octopus.workflow.v1`). It is device/browser-local and editable by the local user, so it is not a trusted audit trail. Export before clearing browser storage. Invalid storage falls back visibly to source proposals; quota failures continue in memory with a warning. A source edit requires a rebuild and page refresh; there is no live polling or hot reload.

No live facts are collected. Exact canonical paths remain unknown when the registry designates none, even if recorded locations exist. Intended targets are labelled intended. The registry’s evidence-integrity gap remains open. These are deliberate representations of missing evidence.

## Validation and documentation

- `npm run validate`: import, strict TypeScript check, static bundle, 15 domain tests, local isolation/credential-pattern audit.
- `npm run test:browser`: end-to-end checks with local Google Chrome through Playwright. Start the app first. Browser artifacts are written to ignored `work/`. Chrome is only required for this optional validation command.
- [Architecture](docs/ARCHITECTURE.md)
- [Data model and scoring](docs/DATA_MODEL.md)
- [JSON schema](data/schema.json)
- [Proposed v0.2 connector plan](docs/CONNECTOR_PLAN_v0.2.md)
- [Validation report](docs/VALIDATION.md)
- [Exact file manifest](docs/FILES_CREATED.txt)

The repository is initialized on `main`, with no commits or remotes. This deliberately avoids creating an owner identity or touching global Git configuration. To transfer, copy this directory excluding `node_modules/` and `work/`, or use the delivered archive. The built app can run immediately on another Node 24 machine.
