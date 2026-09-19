// Declared-versus-observed drift (OG-OBS-002).
// Pure module: it compares what the registry declares with what the local observer recorded.
// Absence of evidence is never health: a missing, failed or stale observation yields `unknown`
// or `stale`, never `match`. `now` is supplied by the caller, so results are deterministic.
import type {Project,Raw} from './model.ts';
import type {HostedSource} from './resources.ts';
import {indexObservations,readObservation,type Observation,type TruthState,type Confidence,type Freshness} from './truth.ts';

export type DriftStatus='match'|'differs'|'stale'|'unknown';
export const driftStatuses:DriftStatus[]=['match','differs','stale','unknown'];
// What the reader should conclude — spelled out so no badge has to carry the meaning alone.
export const driftMeaning:Record<DriftStatus,string>={
 match:'Declared and observed agree',
 differs:'Declared and observed disagree',
 stale:'Last observation has expired; agreement cannot be claimed',
 unknown:'Not enough evidence to compare',
};
export interface DriftRow {
 field:string;label:string;
 declared:string;declaredSource:string;
 observed:string;observedSource:string;
 status:DriftStatus;truth:TruthState;confidence:Confidence;freshness:Freshness;
 observedAt:string|null;expiresAt:string|null;state:string;note:string;
}

const text=(v:unknown):string=>v==null?'':typeof v==='string'?v:JSON.stringify(v);
// The three comparisons the registry can actually support today. A product that is a branch of
// another product's repository (OG-OBS-007) compares against the derived hosted source where it
// declares nothing itself; the source string then cites both registry rows it came from.
export const comparisons=[
 {field:'path',label:'Checkout path',observationField:'head_sha',
  declaredOf:(p:Project,h:HostedSource|null=null)=>{
   const own=p.raw.current_local_paths?.[0]?.path??p.raw.intended_local_path??p.raw.git_state?.path??null;
   if(own==null&&h)return {value:h.path,source:h.pathSource};
   return {value:own,
    source:p.raw.current_local_paths?.[0]?.path?`projects[${p.id}].current_local_paths[0].path`:p.raw.intended_local_path?`projects[${p.id}].intended_local_path`:`projects[${p.id}].git_state.path`};},
  observedOf:(o:Observation)=>o.source.resource},
 {field:'branch',label:'Branch',observationField:'branch',
  declaredOf:(p:Project,_h:HostedSource|null=null)=>({value:p.raw.git_state?.branch??p.raw.current_local_paths?.[0]?.branch??p.raw.manager_branch?.ref??null,
   source:p.raw.git_state?.branch?`projects[${p.id}].git_state.branch`:p.raw.current_local_paths?.[0]?.branch?`projects[${p.id}].current_local_paths[0].branch`:`projects[${p.id}].manager_branch.ref`}),
  observedOf:(o:Observation)=>text(o.value)},
 {field:'remote','label':'Remote configured',observationField:'remote_names',
  declaredOf:(p:Project,h:HostedSource|null=null)=>{
   if(typeof p.raw.canonical_repo!=='string'&&h?.remote)return {value:'yes',source:h.remoteSource!};
   return {value:typeof p.raw.canonical_repo==='string'?'yes':p.raw.git_state?.remotes===0||/^NONE/.test(text(p.raw.current_local_paths?.[0]?.remote))?'no':null,
    source:typeof p.raw.canonical_repo==='string'?`projects[${p.id}].canonical_repo`:`projects[${p.id}].git_state.remotes`};},
  observedOf:(o:Observation)=>Array.isArray(o.value)?(o.value.length?'yes':'no'):''},
] as const;

export function driftRows(project:Project,observations:Observation[],now:string,hosted:HostedSource|null=null):DriftRow[]{
 const index=indexObservations(observations);
 return comparisons.map(c=>{
  const declared=c.declaredOf(project,hosted);
  const observation=index.get(`${project.id}|${c.observationField}`);
  const read=readObservation(observation,declared.source,now);
  const observedValue=observation&&read.status==='ok'?c.observedOf(observation):'';
  const base={field:c.field,label:c.label,declared:text(declared.value)||'undeclared',declaredSource:declared.source,
   observed:observedValue||'not collected',observedSource:observation?read.source:'no observation',
   truth:read.truth,confidence:read.confidence,freshness:read.freshness,observedAt:read.observedAt,expiresAt:read.expiresAt,state:read.state};
  // Ordered so that no failure path can fall through to `match`.
  if(!observation)return {...base,status:'unknown' as DriftStatus,note:'No observation has been collected for this field. Run npm run observe.'};
  if(read.status!=='ok')return {...base,status:'unknown' as DriftStatus,observed:'not available',note:read.state};
  if(read.freshness==='stale')return {...base,status:'stale' as DriftStatus,note:`${read.state}. A stale observation is never reported as agreement.`};
  if(declared.value==null)return {...base,status:'unknown' as DriftStatus,note:'The registry declares nothing to compare with.'};
  const same=text(declared.value)===observedValue;
  return {...base,status:same?'match' as DriftStatus:'differs' as DriftStatus,
   note:same?'Declared value equals the observed value at the time of collection.':'The observed value differs from the declared value. Neither is assumed correct.'};
 });
}
// One status per project for a table cell: the weakest of its rows, never the best.
export const worstStatus=(rows:readonly {status:DriftStatus}[]):DriftStatus=>
 rows.some(r=>r.status==='differs')?'differs'
 :rows.some(r=>r.status==='stale')?'stale'
 :rows.every(r=>r.status==='match')&&rows.length>0?'match':'unknown';
// Text equivalent of every badge, for screen readers and greyscale.
export const driftSummary=(rows:DriftRow[]):string=>{
 const status=worstStatus(rows);
 return `${status}: ${driftMeaning[status]}`;
};
export const freshnessLabel:Record<Freshness,string>={fresh:'fresh','stale':'stale','not-collected':'not collected'};
export function badgeText(row:{truth:TruthState;freshness:Freshness;confidence:Confidence;observedAt:string|null}):string{
 const when=row.observedAt?`, observed ${row.observedAt}`:'';
 return `${row.truth}, ${freshnessLabel[row.freshness]}${when}, confidence ${row.confidence}`;
}
// Registry-only rows (no observation anywhere) must never be summarised as agreement.
export const hasObservation=(project:Project,observations:Observation[]):boolean=>
 observations.some(o=>o.projectId===project.id);
export type {Raw};
