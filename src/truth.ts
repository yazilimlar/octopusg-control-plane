// OctopusG truth model (OG-DATA-001) and local observation store (OG-DATA-002).
// Pure module: no I/O, no network, no clock. Every function that needs the current time
// takes `now` as an argument, so derivation and freshness are deterministic and testable.
// Sources: S1#truth-and-evidence-model, docs/01-SYSTEM-ARCHITECTURE.md#2-truth-model.

// ---------- 1. Truth states
// The five kinds of S1, plus the two states v0.1 already had. `unknown` and `blocked` stay
// first-class: absence of evidence is never silently upgraded to evidence.
export type TruthKind='declared'|'observed'|'derived'|'approved'|'executed';
export type TruthState=TruthKind|'unknown'|'blocked';
export const truthKinds:TruthKind[]=['declared','observed','derived','approved','executed'];
export const truthStates:TruthState[]=[...truthKinds,'unknown','blocked'];
export const isTruthState=(v:unknown):v is TruthState=>typeof v==='string'&&(truthStates as string[]).includes(v);

// v0.1 evidence values keep their meaning; this is a documented mapping, never a rename.
// `observed` in v0.1 means "the registry reports verified evidence"; `inferred` covers both
// declared intent (paths, URLs, declared dependencies) and calculated values (risk, drift).
export type LegacyEvidenceKind='observed'|'inferred'|'unknown'|'blocked';
export const truthOfLegacy=(kind:LegacyEvidenceKind,calculated=false):TruthState=>
 kind==='observed'?'observed':kind==='inferred'?(calculated?'derived':'declared'):kind;

// ---------- 2. Confidence
// Confidence is derived, never authored: it follows from the truth state and the freshness of
// the evidence behind it. It is a prioritization aid, not a probability.
export type Confidence='high'|'medium'|'low'|'none';
const confidenceLadder:Confidence[]=['none','low','medium','high'];
const baseConfidence:Record<TruthState,Confidence>={observed:'high',executed:'high',approved:'medium',declared:'medium',derived:'low',unknown:'none',blocked:'none'};
export const downgrade=(c:Confidence,steps=1):Confidence=>confidenceLadder[Math.max(0,confidenceLadder.indexOf(c)-steps)];
export const weakest=(list:Confidence[]):Confidence=>list.length?list.reduce((a,b)=>confidenceLadder.indexOf(a)<=confidenceLadder.indexOf(b)?a:b):'none';

// ---------- 3. Provenance and observations
export type ObservationStatus='ok'|'unknown'|'blocked'|'error';
export type Freshness='fresh'|'stale'|'not-collected';
export const adapters=['github','vercel','supabase','http-uptime','mac-status','local-git'] as const;
export type Adapter=typeof adapters[number];
export interface Provenance {adapter:Adapter;resource:string}
export interface Observation {
 projectId:string;field:string;value:unknown;truth:TruthState;source:Provenance;
 observedAt:string|null;collectedAt:string;expiresAt:string|null;status:ObservationStatus;reason?:string;
}
export interface ObservationFile {schemaVersion:1;collector:string;collectedAt:string;observations:unknown[]}
export const observationRequired=['projectId','field','value','truth','source','observedAt','collectedAt','expiresAt','status'] as const;
const observationOptional=['reason'];

// ---------- 4. Secret-shaped values are rejected before persistence
// Mirrors the credential shapes scripts/audit.mjs scans for. The audit is the repository-wide
// guard and is never loosened; this is the store's own pre-persistence filter.
export const secretShapes:RegExp[]=[
 /gh[pousr]_[A-Za-z0-9]{30,}/,
 /sk_(?:live|test)_[A-Za-z0-9]{20,}/,
 /AKIA[A-Z0-9]{16}/,
 /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/,
 /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 /https?:\/\/[^\s/:]+:[^\s/@]+@/,
];
export function looksSecret(value:unknown,depth=0):boolean{
 if(depth>6)return true; // refuse to vouch for structures deeper than the store accepts
 if(typeof value==='string')return secretShapes.some(re=>re.test(value));
 if(Array.isArray(value))return value.some(v=>looksSecret(v,depth+1));
 if(value&&typeof value==='object')return Object.entries(value as Record<string,unknown>).some(([k,v])=>looksSecret(k,depth+1)||looksSecret(v,depth+1));
 return false;
}

// ---------- 5. Validation (fail-closed, value-free error messages)
const isoDate=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const timestamp=(v:unknown):boolean=>typeof v==='string'&&isoDate.test(v)&&!Number.isNaN(Date.parse(v));
export type Rejection={index:number;reason:string};
export function validateObservation(raw:unknown,index:number):{ok:true;value:Observation}|{ok:false;error:Rejection}{
 const bad=(reason:string)=>({ok:false as const,error:{index,reason}});
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return bad('not an object');
 const o=raw as Record<string,unknown>;
 for(const k of observationRequired)if(!(k in o))return bad(`missing ${k}`);
 for(const k of Object.keys(o))if(!(observationRequired as readonly string[]).includes(k)&&!observationOptional.includes(k))return bad(`unknown field ${k}`);
 if(typeof o.projectId!=='string'||!o.projectId)return bad('projectId must be a non-empty string');
 if(typeof o.field!=='string'||!o.field)return bad('field must be a non-empty string');
 if(!isTruthState(o.truth))return bad('truth is not a truth state');
 if(o.truth==='approved'||o.truth==='executed')return bad('an observation cannot assert approved or executed truth');
 const src=o.source as Record<string,unknown>|null;
 if(!src||typeof src!=='object'||Array.isArray(src))return bad('source must be an object');
 if(Object.keys(src).length!==2||typeof src.resource!=='string'||!src.resource)return bad('source must be {adapter, resource}');
 if(!(adapters as readonly string[]).includes(src.adapter as string))return bad('unknown adapter');
 if(!['ok','unknown','blocked','error'].includes(o.status as string))return bad('unknown status');
 if(o.observedAt!==null&&!timestamp(o.observedAt))return bad('observedAt must be an ISO timestamp or null');
 if(!timestamp(o.collectedAt))return bad('collectedAt must be an ISO timestamp');
 if(o.expiresAt!==null&&!timestamp(o.expiresAt))return bad('expiresAt must be an ISO timestamp or null');
 if('reason' in o&&typeof o.reason!=='string')return bad('reason must be a string');
 if(o.status==='ok'&&o.value===null)return bad('status ok requires a value');
 if(o.status==='ok'&&o.truth!=='observed'&&o.truth!=='derived')return bad('status ok requires observed or derived truth');
 if(looksSecret(o.value)||looksSecret(o.reason))return bad('secret-shaped value rejected before persistence');
 return {ok:true,value:{projectId:o.projectId,field:o.field,value:o.value,truth:o.truth,source:{adapter:src.adapter as Adapter,resource:src.resource},observedAt:o.observedAt as string|null,collectedAt:o.collectedAt as string,expiresAt:o.expiresAt as string|null,status:o.status as ObservationStatus,...('reason' in o?{reason:o.reason as string}:{})}};
}
export interface LoadResult {collector:string;collectedAt:string;records:Observation[];rejected:Rejection[]}
// Throws only for a file that is structurally not an observation file; individual bad records
// are rejected and reported, so one poisoned record can never poison the build.
export function loadObservationFile(raw:unknown,label='observation file'):LoadResult{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const f=raw as Record<string,unknown>;
 if(f.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(typeof f.collector!=='string'||!f.collector)throw new Error(`${label}: collector must be a non-empty string`);
 if(!timestamp(f.collectedAt))throw new Error(`${label}: collectedAt must be an ISO timestamp`);
 if(!Array.isArray(f.observations))throw new Error(`${label}: observations must be an array`);
 const records:Observation[]=[],rejected:Rejection[]=[];
 f.observations.forEach((o,i)=>{const r=validateObservation(o,i);r.ok?records.push(r.value):rejected.push(r.error);});
 // Deterministic order regardless of how the collector emitted them.
 records.sort((a,b)=>a.projectId.localeCompare(b.projectId)||a.field.localeCompare(b.field)||a.collectedAt.localeCompare(b.collectedAt));
 return {collector:f.collector,collectedAt:f.collectedAt as string,records,rejected};
}

// ---------- 6. Reading an observation: freshness, confidence, display state
export interface TruthValue {
 value:unknown;truth:TruthState;confidence:Confidence;freshness:Freshness;status:ObservationStatus;
 state:string;source:string;observedAt:string|null;collectedAt:string|null;expiresAt:string|null;reason?:string;
}
export const notCollected=(source:string):TruthValue=>
 ({value:null,truth:'unknown',confidence:'none',freshness:'not-collected',status:'unknown',state:'Not collected',source,observedAt:null,collectedAt:null,expiresAt:null});
export const freshnessOf=(o:Observation,now:string):Freshness=>
 o.expiresAt&&Date.parse(o.expiresAt)<=Date.parse(now)?'stale':'fresh';
export function readObservation(o:Observation|undefined,source:string,now:string):TruthValue{
 if(!o)return notCollected(source);
 const freshness=freshnessOf(o,now);
 const where=`${o.source.adapter}:${o.source.resource}`;
 const base:TruthValue={value:o.value,truth:o.truth,confidence:baseConfidence[o.truth],freshness,status:o.status,state:'',source:where,observedAt:o.observedAt,collectedAt:o.collectedAt,expiresAt:o.expiresAt,...(o.reason?{reason:o.reason}:{})};
 if(o.status==='error')return {...base,truth:'unknown',value:null,confidence:'none',state:`Error: ${o.reason??'collector reported an error'}`};
 if(o.status==='blocked')return {...base,truth:'blocked',value:null,confidence:'none',state:`Blocked: ${o.reason??'collection not permitted'}`};
 if(o.status==='unknown')return {...base,truth:'unknown',value:null,confidence:'none',state:`Unknown: ${o.reason??'collector returned no value'}`};
 if(freshness==='stale')return {...base,confidence:downgrade(base.confidence),state:`Stale · expired ${o.expiresAt}, observed ${o.observedAt??'unrecorded'}`};
 return {...base,state:`Observed ${o.observedAt??o.collectedAt}`};
}

// ---------- 7. Deterministic derivation and drift
export type DriftStatus='match'|'drift'|'unknown';
export interface Derivation {truth:'derived'|'unknown';status:DriftStatus;confidence:Confidence;state:string;inputs:string[]}
// Pure: same declared value, same observation and same `now` always give the same result.
// A non-ok or absent observation never proves a match and never proves drift; a stale one
// still compares, but the result is marked stale and its confidence is downgraded.
export function evaluateDrift(declared:{value:unknown;source:string},observation:Observation|undefined,now:string):Derivation{
 const read=readObservation(observation,declared.source,now);
 const inputs=[declared.source,...(observation?[`${observation.source.adapter}:${observation.source.resource}`]:[])];
 if(declared.value==null||read.value==null||read.status!=='ok')
  return {truth:'unknown',status:'unknown',confidence:'none',state:read.freshness==='not-collected'?'Not collected':read.state,inputs};
 const same=String(declared.value)===String(read.value);
 const confidence=read.freshness==='stale'?downgrade(weakest([baseConfidence.declared,read.confidence])):weakest([baseConfidence.declared,read.confidence]);
 return {truth:'derived',status:same?'match':'drift',confidence,
  state:`${same?'Declared and observed agree':'Declared differs from observed'}${read.freshness==='stale'?' · observation is stale':''}`,inputs};
}
export const indexObservations=(records:Observation[]):Map<string,Observation>=>{
 const map=new Map<string,Observation>();
 for(const o of records){const key=`${o.projectId}|${o.field}`;const prev=map.get(key);
  if(!prev||prev.collectedAt<o.collectedAt)map.set(key,o);}
 return map;
};
