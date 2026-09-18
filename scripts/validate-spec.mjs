// OctopusG specification validator (OG-GOV-002).
//   node scripts/validate-spec.mjs          check only (CI / session end)
//   node scripts/validate-spec.mjs --write  regenerate generated sections, then check
// Uses only Node built-ins and the `yaml` package already in package-lock.json.
// Reads files only. Never touches the network, Git, or anything outside this repository.
import {readFile, writeFile, readdir, access} from 'node:fs/promises';
import {parseDocument} from 'yaml';

const WRITE = process.argv.includes('--write');
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
const exists = async (p) => access(p).then(() => true, () => false);
const REQ_FILE = 'docs/requirements/REQUIREMENTS.yaml';

// ---------- load ledger
const text = await readFile(REQ_FILE, 'utf8');
const doc = parseDocument(text, {uniqueKeys: true});
if (doc.errors.length) { console.error(doc.errors.map((e) => e.message).join('\n')); process.exit(1); }
const L = doc.toJS();
const E = L.enums;
const milestones = L.milestones.map((m) => m.id);
const mIndex = Object.fromEntries(milestones.map((m, i) => [m, i]));
const wpIds = new Set(L.work_packages.map((w) => w.id));
const odIds = new Set(L.owner_decisions);
const reqs = L.requirements, caps = L.capabilities;
const byId = new Map();

// ---------- GitHub-style heading slugs
const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const anchorCache = new Map();
async function anchorsOf(path) {
  if (anchorCache.has(path)) return anchorCache.get(path);
  const seen = new Map(), set = new Set();
  let fence = false;
  for (const line of (await readFile(path, 'utf8')).split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
    const m = !fence && /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const base = slug(m[2].replace(/[*_`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'));
    const n = seen.get(base) ?? 0; seen.set(base, n + 1);
    set.add(n ? `${base}-${n}` : base);
  }
  anchorCache.set(path, set); return set;
}

// ---------- sources
const citedCount = new Map();
async function checkSources(owner, list) {
  if (!Array.isArray(list) || !list.length) return err(`${owner}: no source`);
  for (const s of list) {
    if (s === 'UNSOURCED') { warn(`${owner}: UNSOURCED — needs an owner-supplied source`); continue; }
    const m = /^(S\d+)#([\p{L}\p{N}_-]+)$/u.exec(s);
    if (!m) { err(`${owner}: malformed source "${s}"`); continue; }
    const file = L.sources[m[1]];
    if (!file) { err(`${owner}: unknown source ${m[1]}`); continue; }
    if (!(await exists(file))) { err(`${owner}: source file missing ${file}`); continue; }
    if (!(await anchorsOf(file)).has(m[2])) { err(`${owner}: ${m[1]} has no heading #${m[2]}`); continue; }
    citedCount.set(s, (citedCount.get(s) ?? 0) + 1);
  }
}

// ---------- requirements
const required = ['id', 'title', 'plane', 'milestone', 'priority', 'status', 'risk', 'source', 'dependencies', 'acceptance', 'tests'];
for (const r of reqs) {
  const who = r.id ?? '(missing id)';
  for (const k of required) if (r[k] === undefined || r[k] === null || r[k] === '') err(`${who}: missing ${k}`);
  const m = /^OG-([A-Z]+)-(\d{3})$/.exec(r.id ?? '');
  if (!m) err(`${who}: ID must look like OG-FAM-nnn`);
  else if (!E.family.includes(m[1])) err(`${who}: unknown family ${m[1]}`);
  if (byId.has(r.id)) err(`${who}: duplicate ID`);
  byId.set(r.id, r);
  for (const [k, e] of [['plane', E.plane], ['priority', E.priority], ['status', E.status], ['risk', E.risk]])
    if (r[k] !== undefined && !e.includes(r[k])) err(`${who}: ${k} "${r[k]}" not in enum`);
  if (!(r.milestone in mIndex)) err(`${who}: unknown milestone ${r.milestone}`);
  if (!Array.isArray(r.acceptance) || !r.acceptance.length) err(`${who}: acceptance must be a non-empty list`);
  if (!Array.isArray(r.tests) || !r.tests.length) err(`${who}: tests must be a non-empty list`);
  if (r.tests?.includes('TBD') && r.milestone !== 'unscheduled') err(`${who}: tests TBD only allowed for unscheduled`);
  if (['IMPLEMENTED', 'VERIFIED'].includes(r.status))
    for (const t of r.tests ?? []) if (!(await exists(t))) err(`${who}: ${r.status} but test/evidence file missing: ${t}`);
  if (r.milestone === 'v0.2' && !wpIds.has(r.work_package)) err(`${who}: v0.2 requirement needs a valid work_package`);
  if (r.work_package && !wpIds.has(r.work_package)) err(`${who}: unknown work_package ${r.work_package}`);
  for (const od of r.owner_decisions ?? []) if (!odIds.has(od)) err(`${who}: unknown owner decision ${od}`);
  await checkSources(who, r.source);
}
// dependencies: existence, milestone order, cycles
for (const r of reqs) for (const d of r.dependencies ?? []) {
  const dep = byId.get(d);
  if (!dep) { err(`${r.id}: dependency ${d} does not exist`); continue; }
  if (d === r.id) err(`${r.id}: depends on itself`);
  if (mIndex[dep.milestone] > mIndex[r.milestone]) err(`${r.id} (${r.milestone}) depends on later ${d} (${dep.milestone})`);
}
const state = new Map();
function visit(id, path) {
  if (state.get(id) === 'done') return;
  if (state.get(id) === 'active') return err(`dependency cycle: ${[...path, id].join(' → ')}`);
  state.set(id, 'active');
  for (const d of byId.get(id)?.dependencies ?? []) if (byId.has(d)) visit(d, [...path, id]);
  state.set(id, 'done');
}
for (const id of byId.keys()) visit(id, []);

// evidence for completed work (OG-GOV-004); v0.1 baseline is evidenced by its own tests
const evidenceDir = 'docs/evidence';
const evidenceText = (await exists(evidenceDir))
  ? (await Promise.all((await readdir(evidenceDir)).filter((f) => f.endsWith('.md')).map((f) => readFile(`${evidenceDir}/${f}`, 'utf8')))).join('\n')
  : '';
for (const r of reqs)
  if (['IMPLEMENTED', 'VERIFIED'].includes(r.status) && r.milestone !== 'v0.1' && !evidenceText.includes(r.id))
    err(`${r.id}: ${r.status} but no docs/evidence/*.md mentions it`);

// OG-GOV-004: a finished work package must have its own record, and that record must say what
// was run, what came back, which requirement statuses moved, and what is still open. The check
// is on the shape of the record, not on its prose: it cannot judge whether the answers are good,
// only that the four questions were answered somewhere.
const evidenceFileFor = async (wp) => {
  const path = `${evidenceDir}/${wp}.md`;
  return (await exists(path)) ? readFile(path, 'utf8') : null;
};
for (const wp of L.work_packages) {
  const finished = reqs.filter((r) => r.work_package === wp.id && ['IMPLEMENTED', 'VERIFIED'].includes(r.status));
  if (!finished.length) continue;
  const text = await evidenceFileFor(wp.id);
  if (text === null) { err(`${wp.id}: ${finished.length} finished requirement(s) but no ${evidenceDir}/${wp.id}.md`); continue; }
  const who = `${evidenceDir}/${wp.id}.md`;
  for (const r of finished) if (!text.includes(r.id)) err(`${who}: does not name ${r.id}`);
  // requirement status changes
  if (!/^##+\s+Requirements/m.test(text)) err(`${who}: needs a "## Requirements" section listing the status changes`);
  // commands run, and their results
  const validation = /^##+\s+(Validation|Commands and results)/m.test(text);
  if (!validation) err(`${who}: needs a validation section naming the commands that were run`);
  if (!/npm run validate/.test(text)) err(`${who}: does not record that npm run validate was run`);
  if (!/PASS|passed|fail 0|\d+\/\d+/.test(text)) err(`${who}: records commands but no result`);
  // open questions
  if (!/^##+\s+Open questions/m.test(text)) err(`${who}: needs an "## Open questions" section (write "None." if there are none)`);
}

// ---------- capabilities
const inCap = new Set();
const capIds = new Set();
for (const c of caps) {
  if (capIds.has(c.id)) err(`capability ${c.id}: duplicate`); capIds.add(c.id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) err(`capability ${c.id}: id must be kebab-case`);
  if (!E.capability_status.includes(c.status)) err(`capability ${c.id}: bad status ${c.status}`);
  if (!(c.target in mIndex)) err(`capability ${c.id}: unknown target ${c.target}`);
  if (!c.requirements?.length) err(`capability ${c.id}: no requirements`);
  for (const id of c.requirements ?? []) { if (!byId.has(id)) err(`capability ${c.id}: unknown requirement ${id}`); inCap.add(id); }
  await checkSources(`capability ${c.id}`, c.source);
}
for (const id of byId.keys()) if (!inCap.has(id)) err(`${id}: not linked to any capability`);
for (const m of milestones) if (!reqs.some((r) => r.milestone === m)) err(`milestone ${m} has no requirements`);

// ---------- roadmap work-package table must agree with the ledger
const roadmap = await readFile('docs/09-ROADMAP.md', 'utf8');
for (const line of roadmap.split('\n')) {
  const m = /^\|\s*(WP-\d\d)\s*\|[^|]*\|([^|]*)\|/.exec(line);
  if (!m) continue;
  if (!wpIds.has(m[1])) { err(`09-ROADMAP: unknown ${m[1]}`); continue; }
  const listed = new Set(m[2].match(/OG-[A-Z]+-\d{3}/g) ?? []);
  const ledger = new Set(reqs.filter((r) => r.work_package === m[1]).map((r) => r.id));
  for (const id of ledger) if (!listed.has(id)) err(`09-ROADMAP: ${m[1]} row is missing ${id}`);
  for (const id of listed) if (!ledger.has(id)) err(`09-ROADMAP: ${m[1]} row lists ${id}, ledger does not`);
}
for (const od of odIds) if (!roadmap.includes(`| ${od} |`)) err(`09-ROADMAP: owner decision ${od} not described`);

// ---------- generated sections
const count = (key) => reqs.reduce((a, r) => (a[r[key]] = (a[r[key]] ?? 0) + 1, a), {});
const esc = (s) => String(s).replaceAll('|', '\\|');
// `UNSOURCED` is a permitted placeholder (CLAUDE.md rule 4): the requirement exists but the
// owner has not yet supplied a source. It has no file to link to, so it renders as plain text.
const srcLink = (s, prefix) => { if (s === 'UNSOURCED') return '**UNSOURCED**'; const [k, a] = s.split('#'); return `[${k}#${a}](${prefix}${L.sources[k].replace('docs/', '')}#${a})`; };
const countTable = (key, order) => {
  const c = count(key);
  return `| ${key} | count |\n|---|---:|\n` + order.filter((k) => c[k]).map((k) => `| ${k} | ${c[k]} |`).join('\n');
};

const uncited = [];
for (const [k, file] of Object.entries(L.sources))
  if (['S1', 'S2'].includes(k))
    for (const a of await anchorsOf(file)) if (!a.startsWith(k.toLowerCase() + '--') && !citedCount.has(`${k}#${a}`)) uncited.push(`${k}#${a}`);

let trace = `# Traceability — generated

> Generated by \`npm run spec:write\` from [REQUIREMENTS.yaml](REQUIREMENTS.yaml). Do not edit.
> Chain: source → requirement → work package → tests → evidence → milestone.

## Totals

${reqs.length} requirements · ${caps.length} capabilities · ${Object.keys(L.sources).length} sources

${countTable('milestone', milestones)}

${countTable('plane', E.plane)}

${countTable('status', E.status)}

${countTable('risk', E.risk)}
`;
for (const m of milestones) {
  const rs = reqs.filter((r) => r.milestone === m);
  if (!rs.length) continue;
  const title = L.milestones.find((x) => x.id === m).title;
  trace += `\n## ${m} — ${title}\n\n| ID | Title | Plane | Status | Risk | WP | Depends on | Sources | Tests |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of rs)
    trace += `| ${r.id} | ${esc(r.title)}${r.acceptance_provisional ? ' *(provisional)*' : ''} | ${r.plane} | ${r.status} | ${r.risk} | ${r.work_package ?? '—'} | ${r.dependencies.join(', ') || '—'} | ${r.source.map((s) => srcLink(s, '../')).join('<br>')} | ${r.tests.map((t) => '`' + t + '`').join('<br>')} |\n`;
}
trace += `\n## Capability → requirements\n\n| Capability | Status | Target | Requirements |\n|---|---|---|---|\n`;
for (const c of caps) trace += `| ${c.id} | ${c.status} | ${c.target} | ${c.requirements.join(', ')} |\n`;
trace += `\n## Source sections not cited by any requirement\n\nReview these during a completeness check; most are context, not features.\n\n`;
trace += uncited.length ? uncited.map((s) => `- ${srcLink(s, '../')}`).join('\n') + '\n' : '_None._\n';

const capTable = `\n| Capability | Status | Target | Provider | Requirements | Source |\n|---|---|---|---|---|---|\n` +
  caps.map((c) => `| **${c.id}** — ${esc(c.title)} | ${c.status} | ${c.target} | ${c.provider ?? '—'} | ${c.requirements.join(', ')} | ${c.source.map((s) => srcLink(s, '')).join('<br>')} |`).join('\n') +
  `\n\n${caps.length} capabilities · generated from REQUIREMENTS.yaml\n`;

const next = reqs.filter((r) => r.milestone === 'v0.2');
const brief = `\n| | |\n|---|---|\n| Current milestone | **v0.2** — ${next.length} requirements (${next.filter((r) => r.status === 'VERIFIED').length} verified) |\n| Ledger | ${reqs.length} requirements · ${caps.length} capabilities |\n| Owner decisions referenced by v0.2 (see 09) | ${[...new Set(next.flatMap((r) => r.owner_decisions ?? []))].sort().join(', ') || 'none'} |\n| Next work package | ${L.work_packages.find((w) => next.some((r) => r.work_package === w.id && !['IMPLEMENTED', 'VERIFIED'].includes(r.status)))?.id ?? 'none'} |\n`;

async function section(path, name, body) {
  const s = await readFile(path, 'utf8');
  const b = `<!-- GENERATED:${name}:BEGIN -->`, e = `<!-- GENERATED:${name}:END -->`;
  const i = s.indexOf(b), j = s.indexOf(e);
  if (i < 0 || j < i) return err(`${path}: missing ${name} markers`);
  const out = s.slice(0, i + b.length) + body + s.slice(j);
  if (out === s) return;
  if (WRITE) await writeFile(path, out); else err(`${path}: generated ${name} section is stale — run npm run spec:write`);
}
// ---------- generated build input for the requirements view (OG-UI-005)
// Deterministic projection of the ledger, written next to the other generated artefacts.
// It carries no path, no host and no secret: only requirement and capability metadata.
const evidenceFiles = (await exists(evidenceDir)) ? (await readdir(evidenceDir)).filter((f) => f.endsWith('.md')).sort() : [];
const evidenceByRequirement = {};
for (const file of evidenceFiles) {
  const body = await readFile(`${evidenceDir}/${file}`, 'utf8');
  for (const r of reqs) if (body.includes(r.id)) (evidenceByRequirement[r.id] ??= []).push(file);
}
const requirementsData = {
  schemaVersion: 1,
  generatedBy: 'scripts/validate-spec.mjs',
  updated: L.updated,
  milestones: L.milestones.map((m) => ({id: m.id, title: m.title})),
  workPackages: L.work_packages.map((w) => ({id: w.id, title: w.title})),
  capabilities: caps.map((c) => ({id: c.id, title: c.title, status: c.status, target: c.target, requirements: [...c.requirements]})),
  requirements: reqs.map((r) => ({
    id: r.id, title: r.title, plane: r.plane, milestone: r.milestone, workPackage: r.work_package ?? null,
    priority: r.priority, status: r.status, risk: r.risk, dependencies: [...(r.dependencies ?? [])],
    acceptance: [...r.acceptance], acceptanceProvisional: r.acceptance_provisional === true,
    tests: [...r.tests], sources: [...r.source], ownerDecisions: [...(r.owner_decisions ?? [])],
    evidence: [...(evidenceByRequirement[r.id] ?? [])],
  })),
};
const requirementsJson = JSON.stringify(requirementsData, null, 2) + '\n';
const requirementsFile = 'data/requirements.json';
const currentRequirements = (await exists(requirementsFile)) ? await readFile(requirementsFile, 'utf8') : '';
if (currentRequirements !== requirementsJson) {
  if (WRITE) await writeFile(requirementsFile, requirementsJson);
  else err(`${requirementsFile} is stale — run npm run spec:write`);
}
// It is a build input for the browser: it must never carry a machine path or a secret shape.
for (const [, hit] of requirementsJson.matchAll(/\/Users\/[^/"\s]+|\/home\/[^/"\s]+|C:\\\\Users\\\\[^\\"\s]+/g))
  err(`${requirementsFile}: contains a machine-specific path (${hit.slice(0, 12)}…)`);

const traceFile = 'docs/requirements/TRACEABILITY.md';
const oldTrace = (await exists(traceFile)) ? await readFile(traceFile, 'utf8') : '';
if (oldTrace !== trace) { if (WRITE) await writeFile(traceFile, trace); else err(`${traceFile} is stale — run npm run spec:write`); }
await section('docs/03-CAPABILITY-ATLAS.md', 'CAPABILITIES', capTable);
await section('SESSION_BRIEF.md', 'STATUS', brief);

// ---------- Markdown links and requirement mentions
async function mdFiles(dir) {
  const out = [];
  for (const d of await readdir(dir, {withFileTypes: true})) {
    const p = `${dir}/${d.name}`;
    if (d.isDirectory()) { if (d.name !== 'archive') out.push(...await mdFiles(p)); }
    else if (d.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const files = [...await mdFiles('docs'), 'CLAUDE.md', 'SESSION_BRIEF.md', 'README.md'];
for (const f of files) {
  const strict = true; // README reconciled in WP-01 (OG-GOV-005): its links are now checked like every other file
  const body = (await readFile(f, 'utf8')).replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/') + 1) : '';
  for (const [, target] of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    const [p, a] = target.split('#');
    const resolved = p ? new URL(p, `file:///${dir}`).pathname.slice(1) : f;
    if (!(await exists(resolved))) { (strict ? err : warn)(`${f}: broken link ${target}`); continue; }
    if (a && resolved.endsWith('.md') && !(await anchorsOf(resolved)).has(a)) (strict ? err : warn)(`${f}: missing anchor ${target}`);
  }
  if (!f.startsWith('docs/sources/') && f !== 'docs/requirements/TRACEABILITY.md')
    for (const [id] of body.matchAll(/OG-[A-Z]+-\d{3}/g)) if (!byId.has(id)) err(`${f}: mentions unknown requirement ${id}`);
}

// ---------- pinned registry statements must match data/registry.lock.json (OG-GOV-005)
const LOCK = 'data/registry.lock.json';
if (!(await exists(LOCK))) err(`${LOCK} is missing`);
else {
  const lock = JSON.parse(await readFile(LOCK, 'utf8'));
  for (const f of ['README.md', 'docs/DATA_MODEL.md']) {
    const t = await readFile(f, 'utf8');
    if (!t.includes(lock.filename)) err(`${f}: does not name the pinned registry ${lock.filename}`);
    if (!new RegExp(`\\b${lock.project_row_count}[ -]rows?\\b`).test(t)) err(`${f}: does not state the pinned row count (${lock.project_row_count} rows)`);
    for (const [, n] of t.matchAll(/\b(\d+)(?:[ -](?:registry|project))?[ -]rows?\b/g))
      if (Number(n) !== lock.project_row_count) err(`${f}: states ${n} rows; ${LOCK} pins ${lock.project_row_count}`);
  }
}

// ---------- report
const fmt = (o) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(' ');
console.log(`Spec: ${reqs.length} requirements, ${caps.length} capabilities, ${files.length} Markdown files checked.`);
console.log(`  by milestone: ${fmt(count('milestone'))}`);
console.log(`  by plane:     ${fmt(count('plane'))}`);
console.log(`  by status:    ${fmt(count('status'))}`);
console.log(`  uncited S1/S2 sections: ${uncited.length}`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`FAIL  ${e}`);
if (errors.length) { console.log(`validate:spec FAILED with ${errors.length} error(s).`); process.exit(1); }
console.log(`validate:spec PASS${WRITE ? ' (generated sections written)' : ''}.`);
