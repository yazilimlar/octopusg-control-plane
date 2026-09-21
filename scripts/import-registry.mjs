import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseDocument} from 'yaml';
import {loadObservationFile} from '../src/truth.ts';
// The pinned registry is declared once, in data/registry.lock.json (OG-REG-002). Every
// expected value below comes from the lock; a mismatch fails the build and names the file.
const LOCK='data/registry.lock.json';
const lock=JSON.parse(await readFile(LOCK,'utf8'));
if(typeof lock.filename!=='string'||!/^PROJECT_REGISTRY_v[0-9][0-9A-Za-z.-]*\.yaml$/.test(lock.filename))throw new Error(`${LOCK}: filename must be a bare PROJECT_REGISTRY_v*.yaml name inside data/`);
if(typeof lock.registry_version!=='string'||!lock.registry_version)throw new Error(`${LOCK}: registry_version must be a non-empty string`);
if(typeof lock.sha256!=='string'||!/^[a-f0-9]{64}$/.test(lock.sha256))throw new Error(`${LOCK}: sha256 must be 64 lowercase hex characters`);
if(!Number.isInteger(lock.project_row_count)||lock.project_row_count<1)throw new Error(`${LOCK}: project_row_count must be a positive integer`);
const registryPath=`data/${lock.filename}`;
const registryBytes=await readFile(registryPath).catch(()=>{throw new Error(`${registryPath} is missing; ${LOCK} pins it`);});
const registrySha=createHash('sha256').update(registryBytes).digest('hex');
if(registrySha!==lock.sha256)throw new Error(`${registryPath} SHA-256 ${registrySha} does not match ${LOCK} (${lock.sha256})`);
const names=[lock.filename,'GATE_2D_REPORT.md','GATE_3_APPROVAL_CHECKLIST.md'];
const sources=await Promise.all(names.map(async name=>{const text=await readFile(`data/${name}`,'utf8');return {name,text,sha256:createHash('sha256').update(text).digest('hex')};}));
// A source document containing a literal browser network API identifier is inlined into
// dist/main.js by esbuild and then trips scripts/audit.mjs with an opaque message. Fail
// here instead, naming the file. This TIGHTENS ingestion; it never loosens it.
const bannedClientApi=/\bfetch\s*\(|XMLHttpRequest|new WebSocket|sendBeacon\s*\(/;
for(const s of sources)if(bannedClientApi.test(s.text))throw new Error(`${s.name} contains a literal browser network API identifier; it would be inlined into the bundle and trip scripts/audit.mjs. Reword the source text instead of loosening the audit.`);
const doc=parseDocument(sources[0].text,{uniqueKeys:true});
if(doc.errors.length)throw new Error(doc.errors.map(x=>x.message).join('\n'));
const registry=doc.toJS({maxAliasCount:100});
if(registry.registry_version!==lock.registry_version||registry.project_row_count!==lock.project_row_count||!Array.isArray(registry.projects)||registry.projects.length!==lock.project_row_count)throw new Error(`${registryPath}: expected registry v${lock.registry_version} with exactly ${lock.project_row_count} rows (from ${LOCK}); found v${registry.registry_version}, project_row_count ${registry.project_row_count}, ${Array.isArray(registry.projects)?registry.projects.length:'no'} rows`);
const ids=new Set();
const categories=['AGORAXAI_UMBRELLA','AGORAXAI_PLATFORM','ARTEMIS_PLATFORM','PRODUCT','VENTURE','LAB','ARCHIVE','NOT_A_PROJECT'];
for(const p of registry.projects){
 for(const k of ['id','canonical_name','category','lifecycle','evidence_level'])if(typeof p[k]!=='string'||!p[k])throw new Error(`Invalid project field ${k}`);
 if(ids.has(p.id))throw new Error(`Duplicate ID ${p.id}`);ids.add(p.id);
 if(!categories.includes(p.category))throw new Error(`Unknown category ${p.category}`);
}
const approvalCandidates=[...sources[2].text.matchAll(/^### ([A-Z]\d+) · (.+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(m=>({id:m[1],title:m[2].replaceAll('**',''),evidence:m[3].trim(),source:`GATE_3_APPROVAL_CHECKLIST.md#${m[1]}`}));
if(approvalCandidates.length<10)throw new Error('Checklist parsing lost items');
// Local observation store (OG-DATA-002). The file is written by an owner-run collector
// (WP-03); the build only reads it when it is there. No network, no clock: freshness is
// computed at read time from the timestamps each record carries.
const OBSERVATIONS='work/observations/latest.json';
let observations={present:false,source:OBSERVATIONS,collector:null,collectedAt:null,records:[],rejected:[]};
const observationText=await readFile(OBSERVATIONS,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
if(observationText!==null){
 if(bannedClientApi.test(observationText))throw new Error(`${OBSERVATIONS} contains a literal browser network API identifier; it would be inlined into the bundle and trip scripts/audit.mjs. Fix the collector output instead of loosening the audit.`);
 let parsed;
 try{parsed=JSON.parse(observationText);}catch(error){throw new Error(`${OBSERVATIONS} is not valid JSON: ${error.message}`);}
 const loaded=loadObservationFile(parsed,OBSERVATIONS);
 observations={present:true,source:OBSERVATIONS,collector:loaded.collector,collectedAt:loaded.collectedAt,records:loaded.records,rejected:loaded.rejected};
 for(const r of loaded.rejected)console.log(`Rejected observation #${r.index}: ${r.reason} (value not stored, not printed)`);
 console.log(`Observations: ${loaded.records.length} accepted, ${loaded.rejected.length} rejected from ${OBSERVATIONS} (collector ${loaded.collector}).`);
}
const snapshot={schemaVersion:1,classification:{umbrella:'AGORAXAI_UMBRELLA',kind:'INTERNAL_PLATFORM',visibility:'private',codename:'Octopus'},asOf:registry.generated_at,sources:sources.map(({name,sha256})=>({name,sha256})),registry,approvalCandidates,observations};
// OG-REG-007 / WP-15: validate a preserved working snapshot without writing it.
// This mode still performs every ingestion check above and rejects any byte mismatch.
const snapshotText=JSON.stringify(snapshot,null,2)+'\n';
const snapshotMode=process.env.OCTOPUSG_SNAPSHOT_MODE??'write';
if(!['write','check'].includes(snapshotMode))throw new Error('Invalid OCTOPUSG_SNAPSHOT_MODE; expected write or check');
if(snapshotMode==='check'){
 if(await readFile('data/snapshot.json','utf8')!==snapshotText)throw new Error('data/snapshot.json differs from validated inputs; check mode leaves it untouched');
 console.log('Snapshot check PASS; data/snapshot.json was not written.');
}else await writeFile('data/snapshot.json',snapshotText);
console.log(`Parsed registry v${registry.registry_version}: ${ids.size}/${registry.project_row_count} unique rows; ${approvalCandidates.length} proposed checklist items. Source SHA-256: ${sources[0].sha256}`);
