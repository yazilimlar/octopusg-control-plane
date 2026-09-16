import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseDocument} from 'yaml';
const names=['PROJECT_REGISTRY_v1.5.1.yaml','GATE_2D_REPORT.md','GATE_3_APPROVAL_CHECKLIST.md'];
const sources=await Promise.all(names.map(async name=>{const text=await readFile(`data/${name}`,'utf8');return {name,text,sha256:createHash('sha256').update(text).digest('hex')};}));
// A source document containing a literal browser network API identifier is inlined into
// dist/main.js by esbuild and then trips scripts/audit.mjs with an opaque message. Fail
// here instead, naming the file. This TIGHTENS ingestion; it never loosens it.
const bannedClientApi=/\bfetch\s*\(|XMLHttpRequest|new WebSocket|sendBeacon\s*\(/;
for(const s of sources)if(bannedClientApi.test(s.text))throw new Error(`${s.name} contains a literal browser network API identifier; it would be inlined into the bundle and trip scripts/audit.mjs. Reword the source text instead of loosening the audit.`);
const doc=parseDocument(sources[0].text,{uniqueKeys:true});
if(doc.errors.length)throw new Error(doc.errors.map(x=>x.message).join('\n'));
const registry=doc.toJS({maxAliasCount:100});
if(registry.registry_version!=='1.5.1'||registry.project_row_count!==18||!Array.isArray(registry.projects)||registry.projects.length!==18)throw new Error('Expected registry v1.5.1 and exactly 18 rows');
const ids=new Set();
const categories=['AGORAXAI_UMBRELLA','AGORAXAI_PLATFORM','ARTEMIS_PLATFORM','PRODUCT','VENTURE','LAB','ARCHIVE','NOT_A_PROJECT'];
for(const p of registry.projects){
 for(const k of ['id','canonical_name','category','lifecycle','evidence_level'])if(typeof p[k]!=='string'||!p[k])throw new Error(`Invalid project field ${k}`);
 if(ids.has(p.id))throw new Error(`Duplicate ID ${p.id}`);ids.add(p.id);
 if(!categories.includes(p.category))throw new Error(`Unknown category ${p.category}`);
}
const approvalCandidates=[...sources[2].text.matchAll(/^### ([A-Z]\d+) · (.+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(m=>({id:m[1],title:m[2].replaceAll('**',''),evidence:m[3].trim(),source:`GATE_3_APPROVAL_CHECKLIST.md#${m[1]}`}));
if(approvalCandidates.length<10)throw new Error('Checklist parsing lost items');
const snapshot={schemaVersion:1,classification:{umbrella:'AGORAXAI_UMBRELLA',kind:'INTERNAL_PLATFORM',visibility:'private',codename:'Octopus'},asOf:registry.generated_at,sources:sources.map(({name,sha256})=>({name,sha256})),registry,approvalCandidates};
await writeFile('data/snapshot.json',JSON.stringify(snapshot,null,2)+'\n');
console.log(`Parsed registry v${registry.registry_version}: ${ids.size}/${registry.project_row_count} unique rows; ${approvalCandidates.length} proposed checklist items. Source SHA-256: ${sources[0].sha256}`);
