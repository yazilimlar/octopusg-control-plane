// Read-only product monitor (OG-OBS-007). First instance: DayOS.
// Pure module, no I/O, no network, no clock: `now` is supplied by the caller. It composes what
// already exists — the registry (declared), the local Git observations (observed), the drift
// rows and the SHA comparison (derived), the connection records (blocked) and the safe open
// policy — into one view of a product. It collects nothing and adds no truth kind.
//
// Rules this module enforces by construction:
//  * a row is never "healthy"; its state says only what the evidence supports;
//  * no observation is `not-collected`, a failed one is `error`, an expired one is `stale`, a
//    permission gap is `blocked`, and a value nothing can establish is `unknown`;
//  * every row names its provenance — the registry path, or `adapter:resource` for an observation.
import type {Project,Raw} from './model.ts';
import {driftFor} from './model.ts';
import {hostedSource,repositoryId,type HostedSource} from './resources.ts';
import {indexObservations,readObservation,type Observation,type TruthState,type TruthValue} from './truth.ts';
import {driftRows,worstStatus,type DriftStatus,type DriftRow} from './drift.ts';
import {connectionsOf,levelNames,type ConnectorFile,type Level} from './connections.ts';
import {repoPage,type OpenAction} from './open.ts';

// DayOS is the first product with a monitor. Adding another is one line here, and only if the
// registry can support it: a monitor for a product with no declared source shows `unknown`.
export const monitoredProducts=['dayos'] as const;
export const hasMonitor=(id:string):boolean=>(monitoredProducts as readonly string[]).includes(id);

export type MonitorState='observed'|'declared'|'derived'|'unknown'|'not-collected'|'stale'|'error'|'blocked';
export const monitorStates:MonitorState[]=['observed','declared','derived','unknown','not-collected','stale','error','blocked'];
// Text for every state, so no badge has to carry the meaning alone.
export const monitorStateMeaning:Record<MonitorState,string>={
 observed:'Read from the checkout by the owner-run observer; the timestamp says when',
 declared:'Recorded in the registry or a config file; not re-checked here',
 derived:'Calculated from other rows; the provenance names its inputs',
 unknown:'Nothing available establishes this value',
 'not-collected':'No collector has recorded this yet (run npm run observe)',
 stale:'Observed, but the observation has expired; it proves nothing about now',
 error:'The collector tried and failed; the reason is shown',
 blocked:'Collection is not permitted by policy or connection level',
};

export interface MonitorRow {
 id:string;label:string;
 value:string;                       // what is shown; never a health claim
 state:MonitorState;                 // what the reader should conclude
 truth:TruthState;                   // five-kind truth of the value
 source:string;                      // provenance: registry path(s) or adapter:resource
 note:string;
 declared?:string;                   // for compared rows: what the registry declares
 drift?:DriftStatus;                 // for compared rows: declared vs observed
 observedAt?:string|null;expiresAt?:string|null;
}
export interface MonitorSection {id:'source'|'deployment'|'backend';title:string;rows:MonitorRow[]}
// The state of the collection as a whole: one place that says whether anything was read at all.
export interface Collection {
 state:'not-collected'|'fresh'|'stale'|'error'|'unknown';
 detail:string;observedAt:string|null;expiresAt:string|null;source:string;
}
export interface MonitorReport {
 productId:string;name:string;hosted:HostedSource|null;
 collection:Collection;drift:DriftStatus;driftRows:DriftRow[];
 sections:MonitorSection[];
 // A line the reader can quote. It never says "healthy".
 verdict:string;
}

const short=(sha:unknown):string=>typeof sha==='string'&&/^[0-9a-f]{40}$/.test(sha)?sha.slice(0,12):String(sha??'');
const treeText=(v:unknown):string=>{
 const t=v as {clean?:boolean;staged?:number;unstaged?:number;untracked?:number}|null;
 if(!t||typeof t!=='object')return 'not available';
 return t.clean?'clean':`not clean · ${t.staged??0} staged · ${t.unstaged??0} unstaged · ${t.untracked??0} untracked`;
};

// How a row that depends on an observation should read, given how that observation came out.
// Order matters: a failure path can never fall through to `observed`.
function stateOfRead(read:TruthValue,failure:Observation|undefined):MonitorState{
 if(read.freshness==='not-collected')return failure?(failure.status==='error'?'error':failure.status==='blocked'?'blocked':'unknown'):'not-collected';
 if(read.status==='error')return 'error';
 if(read.status==='blocked')return 'blocked';
 if(read.status==='unknown')return 'unknown';
 return read.freshness==='stale'?'stale':'observed';
}

export function collectionOf(productId:string,observations:Observation[],now:string):Collection{
 const index=indexObservations(observations);
 const head=index.get(`${productId}|head_sha`);
 const failure=index.get(`${productId}|repository`);
 if(!head&&failure){
  const read=readObservation(failure,`projects[${productId}]`,now);
  return {state:failure.status==='error'?'error':'unknown',detail:read.state,observedAt:read.observedAt,expiresAt:read.expiresAt,source:read.source};
 }
 if(!head)return {state:'not-collected',detail:'No observation has been recorded for this product. Run npm run observe on the enrolled device, then rebuild.',observedAt:null,expiresAt:null,source:'no observation'};
 const read=readObservation(head,`projects[${productId}]`,now);
 if(read.status==='error')return {state:'error',detail:read.state,observedAt:read.observedAt,expiresAt:read.expiresAt,source:read.source};
 if(read.status!=='ok')return {state:'unknown',detail:read.state,observedAt:read.observedAt,expiresAt:read.expiresAt,source:read.source};
 return {state:read.freshness==='stale'?'stale':'fresh',detail:read.state,observedAt:read.observedAt,expiresAt:read.expiresAt,source:read.source};
}

// The connection gate for a provider: blocked unless a connection covers this product at level 1
// or higher. Level 0 (Registered) is the ceiling the owner recorded for every connection today.
export function connectionGate(file:ConnectorFile,connectorId:string,productIds:string[]):{state:MonitorState;reason:string;source:string}{
 const covering=connectionsOf(file,connectorId).filter(c=>c.productIds.some(id=>productIds.includes(id)));
 const source=`config/connectors.json#${connectorId}`;
 if(!covering.length){
  const levels=[...new Set(connectionsOf(file,connectorId).map(c=>c.level))];
  return {state:'blocked',source,reason:`No ${connectorId} connection covers ${productIds.join(' or ')}; every ${connectorId} connection is at level ${levels.length?levels.join('/'):'0'} (${levelNames[(levels[0]??0) as Level]}) and none is authorized.`};
 }
 const c=covering[0];
 if(c.level<1)return {state:'blocked',source:`${source}:${c.id}`,reason:`${c.id} is at level ${c.level} (${levelNames[c.level as Level]}). Level 1 needs an owner Connector Authorization; no credential is stored.`};
 return {state:'not-collected',source:`${source}:${c.id}`,reason:`${c.id} is at level ${c.level}, but no collector for it exists in this build.`};
}

export function monitorFor(project:Project,registry:Raw,observations:Observation[],connectors:ConnectorFile,now:string):MonitorReport|null{
 if(!hasMonitor(project.id))return null;
 const index=indexObservations(observations);
 const hosted=hostedSource(project.raw,registry);
 const collection=collectionOf(project.id,observations,now);
 const failure=index.get(`${project.id}|repository`);
 const rows=driftRows(project,observations,now,hosted);
 const rowOf=(field:string)=>rows.find(r=>r.field===field)!;
 const p=project.raw;const base=`projects[${project.id}]`;

 // ---- source: repository, checkout, branch, HEAD, working tree
 const repo=hosted?.remote?repositoryId(hosted.remote):null;
 const repository:MonitorRow=hosted&&repo
  ?{id:'repository',label:'Source repository',value:repo.label,state:'derived',truth:'derived',
    source:`${hosted.branchSource} + ${hosted.remoteSource}`,
    note:`${project.name} is the ${hosted.branch} branch of the ${hosted.hostId} repository. The registry declares the repository on the ${hosted.hostId} row; the link to ${project.name} is derived from the matching branch.`}
  :{id:'repository',label:'Source repository',value:'not established',state:'unknown',truth:'unknown',source:base,
    note:'The registry declares no repository for this product and no single other product checks out its branch, so none is assumed.'};
 const pathRow=rowOf('path'),branchRow=rowOf('branch'),remoteRow=rowOf('remote');
 const checkoutState:MonitorState=collection.state==='error'?'error':collection.state==='unknown'?'unknown'
  :pathRow.freshness==='not-collected'?'declared':pathRow.freshness==='stale'?'stale':'observed';
 const checkout:MonitorRow=hosted
  ?{id:'checkout',label:'Local checkout',value:hosted.path,state:checkoutState,
    truth:checkoutState==='observed'?'observed':'declared',source:hosted.pathSource,drift:pathRow.status,declared:pathRow.declared,
    observedAt:pathRow.observedAt,expiresAt:pathRow.expiresAt,
    note:checkoutState==='error'||checkoutState==='unknown'?`Path declared; the observer could not read it (${collection.detail}).`:`Path declared in the registry. ${pathRow.note}`}
  :{id:'checkout',label:'Local checkout',value:'not established',state:'unknown',truth:'unknown',source:base,note:'No checkout is declared for this product.'};

 const branchObs=index.get(`${project.id}|branch`);
 const branchRead=readObservation(branchObs,branchRow.declaredSource,now);
 const branchState=stateOfRead(branchRead,failure);
 const branch:MonitorRow={id:'branch',label:'Branch',value:branchState==='observed'||branchState==='stale'?branchRow.observed:branchRow.declared,
  state:branchState==='not-collected'?'declared':branchState,truth:branchState==='observed'||branchState==='stale'?branchRead.truth:'declared',
  source:branchState==='observed'||branchState==='stale'?branchRow.observedSource:branchRow.declaredSource,
  declared:branchRow.declared,drift:branchRow.status,observedAt:branchRow.observedAt,expiresAt:branchRow.expiresAt,
  note:`Declared ${branchRow.declared} (${branchRow.declaredSource}). ${branchRow.note}`};

 const headObs=index.get(`${project.id}|head_sha`);
 const drift=driftFor(project,registry,observations,now);
 const headRead=readObservation(headObs,drift.sourceSha.source,now);
 const headState=stateOfRead(headRead,failure);
 const headShown=headState==='observed'||headState==='stale';
 const headDrift:DriftStatus=!headShown?'unknown'
  :headState==='stale'?'stale'
  :drift.derived?.status==='match'?'match':drift.derived?.status==='drift'?'differs':'unknown';
 const head:MonitorRow={id:'head',label:'HEAD commit',value:headShown?short(headRead.value):short(drift.sourceSha.value),
  state:headState==='not-collected'?'declared':headState,truth:headShown?headRead.truth:'declared',
  source:headShown?headRead.source:drift.sourceSha.source,declared:short(drift.sourceSha.value),drift:headDrift,
  observedAt:headRead.observedAt,expiresAt:headRead.expiresAt,
  note:headShown
   ?`Declared ${short(drift.sourceSha.value)} at registry snapshot; ${drift.derived?.state??'not compared'}. The registry says this branch keeps advancing, so a difference is expected to be a later commit, not an error.`
   :`Only the registry reading ${short(drift.sourceSha.value)} is available; it is a timestamped snapshot, not the current HEAD. ${headRead.state}.`};

 const treeObs=index.get(`${project.id}|working_tree`);
 const treeRead=readObservation(treeObs,`${base}`,now);
 const treeState=stateOfRead(treeRead,failure);
 const tree:MonitorRow={id:'working_tree',label:'Working tree',
  value:treeState==='observed'||treeState==='stale'?treeText(treeRead.value):treeState==='not-collected'?'not collected':'not available',
  state:treeState,truth:treeState==='observed'||treeState==='stale'?treeRead.truth:'unknown',
  source:treeState==='not-collected'?`${base} (nothing recorded)`:treeRead.source,observedAt:treeRead.observedAt,expiresAt:treeRead.expiresAt,
  note:'Counts only; no file names or contents are ever read or stored. The registry recorded the host checkout as clean at Gate 2C run time, which is a past statement and is not compared.'};

 const remoteState=stateOfRead(readObservation(index.get(`${project.id}|remote_names`),remoteRow.declaredSource,now),failure);
 const remote:MonitorRow={id:'remote',label:'Remote configured',value:remoteRow.freshness==='not-collected'?'not collected':remoteRow.observed,
  state:remoteState==='not-collected'?'declared':remoteState,
  truth:remoteRow.truth,source:remoteRow.freshness==='not-collected'?remoteRow.declaredSource:remoteRow.observedSource,declared:remoteRow.declared,drift:remoteRow.status,
  observedAt:remoteRow.observedAt,expiresAt:remoteRow.expiresAt,
  note:'Whether a remote exists, by name only. The remote URL is never read and the remote is never contacted.'};

 // ---- deployment: what the registry recorded, and what no connector may yet ask
 const shared=!!registry.production_state?.serving_deployment;
 const serving=registry.production_state?.serving_deployment as Raw|undefined;
 const vercel=connectionGate(connectors,'vercel',[project.id,...(hosted?[hosted.hostId]:[])]);
 const deployment:MonitorSection={id:'deployment',title:'Deployment reference',rows:[
  {id:'production_status',label:'Recorded production status',value:String(p.production_status??'not recorded'),
   state:p.production_status?'declared':'unknown',truth:p.production_status?'declared':'unknown',source:`${base}.production_status`,
   note:'Recorded in the registry at snapshot time. It is a past reading of a route, not a live check, and a 404 there is not proof of an outage.'},
  {id:'serving_deployment',label:'Shared serving deployment',
   value:serving?`${String(serving.state??'unknown state')} · ${short(serving.git_commit_sha)} · ${String(serving.git_commit_ref??'unrecorded ref')}`:'not recorded',
   state:serving?'declared':'unknown',truth:serving?'declared':'unknown',source:'production_state.serving_deployment',
   note:'DayOS shares the Artemis host; this is the deployment that host was serving when the registry was captured. It was not re-queried.'},
  {id:'source_vs_serving',label:'Recorded source vs serving commit',value:drift.status,
   state:shared&&drift.status!=='Unknown'?'derived':'unknown',truth:shared&&drift.status!=='Unknown'?'derived':'unknown',
   source:`${drift.sourceSha.source} · ${drift.productionSha.source}`,
   note:`${drift.note} Both SHAs are registry readings; no ancestry is inferred.`},
  {id:'live_deployment',label:'Live deployment state',value:'not collected',state:vercel.state,truth:'blocked',source:vercel.source,
   note:vercel.reason},
 ]};

 // ---- backend: declared inventory only; nothing may ask the live project
 const supabase=connectionGate(connectors,'supabase',[project.id]);
 const inv=p.supabase?.object_inventory as Raw|undefined;
 const files=(p.supabase?.migration_files??[]) as string[];
 const backend:MonitorSection={id:'backend',title:'Supabase (declared inventory only)',rows:[
  {id:'migrations',label:'Declared migration inventory',
   value:files.length?`${files.length} migration files · ${(inv?.tables??[]).length} tables · ${inv?.rls_policy_count??'?'} RLS policies · schema ${(inv?.schema??[]).join(', ')||'?'}`:'not recorded',
   state:files.length?'declared':'unknown',truth:files.length?'declared':'unknown',source:`${base}.supabase`,
   note:'Measured from repository files at Gate 2C and recorded in the registry. It says what the files define, not what any live project contains.'},
  {id:'live_backend',label:'Applied to a live project',value:'not collected',state:supabase.state,truth:'blocked',source:supabase.source,
   note:`${supabase.reason} OG-CONN-015 needs a credential store (OG-SEC-003) and an owner Connector Authorization first. The registry also lists this as an open question.`},
 ]};

 const source:MonitorSection={id:'source',title:'Source and checkout',rows:[repository,checkout,branch,head,tree,remote]};
 // The three local comparisons plus the HEAD comparison: the weakest of them, never the best.
 const worst=worstStatus([...rows,{status:headDrift}]);
 const verdict=collection.state==='not-collected'
  ?`No observation collected. ${project.name} shows only what the registry declared; nothing here is a health statement.`
  :collection.state==='error'||collection.state==='unknown'
   ?`The observer could not read the checkout (${collection.detail}). Nothing is shown as current.`
   :`Local Git drift is ${worst}: ${collection.state==='stale'?'the observation has expired, so agreement cannot be claimed':'declared and observed were compared at the time of collection'}. This is source-control evidence only, not application health.`;
 return {productId:project.id,name:project.name,hosted,collection,drift:worst,driftRows:rows,sections:[source,deployment,backend],verdict};
}

// Open actions for the monitor, from the SAME policy as the project detail: a provider page is
// a plain link derived from the recorded remote; a folder is text plus Copy, never a link, and
// the only thing that opens one is `npm run open -- <id>` for an allowlisted, enrolled path.
export interface MonitorAction extends OpenAction {enabled:boolean}
export function monitorActions(report:MonitorReport,openPermitted:{allowlisted:boolean;reason:string}):MonitorAction[]{
 const h=report.hosted;
 if(!h)return [];
 const out:MonitorAction[]=[];
 const page=repoPage(h.remote);
 if(page&&h.remoteSource)out.push({kind:'provider',label:'Open repository',href:page,text:page,truth:'derived',source:h.remoteSource,enabled:true,
  note:'Derived from the remote the registry records. Opening it is navigation in your browser; this application never contacts the host and it does not pick the DayOS branch for you.'});
 out.push({kind:'folder',label:'Copy folder path',href:null,text:h.path,truth:'declared',source:h.pathSource,enabled:openPermitted.allowlisted,
  note:openPermitted.allowlisted
   ?`Shown as text. To open it, run npm run open -- ${report.productId} on the enrolled device.`
   :`Shown as text only. ${openPermitted.reason}`});
 return out;
}
