// Raw evidence is retained losslessly; display fields are derived explicitly below.
import {readObservation,indexObservations,evaluateDrift,truthOfLegacy,type Observation,type TruthState,type Confidence,type Freshness,type Derivation} from './truth.ts';
export type Raw = Record<string, any>;
// v0.1 evidence kinds are unchanged. The five-kind truth model (OG-DATA-001) lives in
// truth.ts; every Fact can carry its truth state alongside the legacy kind it displays with.
export type EvidenceKind = 'observed'|'inferred'|'unknown'|'blocked';
export type Taxonomy = 'AgoraXAI'|'AgoraXAI Atlas'|'AgoraXAI Platforms'|'Artemis'|'Products'|'Ventures'|'Labs'|'Archive'|'Security artifacts';
export interface Fact {value:string;kind:EvidenceKind;source:string;note?:string;truth?:TruthState;confidence?:Confidence;freshness?:Freshness;state?:string}
export interface RiskReason {points:number;label:string;source:string}
export interface Project {id:string;name:string;category:string;taxonomy:Taxonomy;lifecycle:string;evidence:EvidenceKind;path:Fact;repo:Fact;url:Fact;deployment:Fact;backend:Fact;blockers:string[];nextAction:Fact;risk:number;health:number;riskBand:string;reasons:RiskReason[];raw:Raw}
export const categories:Record<string,Taxonomy>={AGORAXAI_UMBRELLA:'AgoraXAI',AGORAXAI_PLATFORM:'AgoraXAI Platforms',ARTEMIS_PLATFORM:'Artemis',PRODUCT:'Products',VENTURE:'Ventures',LAB:'Labs',ARCHIVE:'Archive',NOT_A_PROJECT:'Security artifacts'};
// AGORAXAI_PLATFORM means a platform at the AgoraXAI level. It does NOT mean Atlas.
// Atlas-family membership is a DECLARED registry relationship, not a category: the
// Atlas row itself, plus any row naming it as platform_parent. The generic bucket is
// the default, so a platform that omits platform_parent is never absorbed into Atlas.
export const ATLAS_PLATFORM_ID='agoraxai-atlas';
export const isAtlasFamily=(p:Raw):boolean=>p.id===ATLAS_PLATFORM_ID||p.platform_parent===ATLAS_PLATFORM_ID;
export const taxonomyOf=(p:Raw):Taxonomy=>{const base=categories[p.category];return base==='AgoraXAI Platforms'&&isAtlasFamily(p)?'AgoraXAI Atlas':base;};
export const taxonomies:Taxonomy[]=['AgoraXAI','AgoraXAI Atlas','AgoraXAI Platforms','Artemis','Products','Ventures','Labs','Archive','Security artifacts'];
export function textValue(v:unknown):string{return typeof v==='string'?v:v==null?'Unavailable':JSON.stringify(v)}
export function fact(value:unknown,source:string,kind:EvidenceKind='observed',note?:string):Fact{return {value:textValue(value),kind:value==null?'unknown':kind,source,note};}
export function normalize(p:Raw,registry:Raw):Project {
 const source=`projects[${p.id}]`;
 const evidence:EvidenceKind=p.evidence_level.startsWith('verified')?'observed':p.evidence_level==='reported'?'inferred':'unknown';
 const blockers:string[]=[...(p.blockers||[])];
 if(p.schema_exposure)blockers.push(p.schema_exposure.severity);
 if(p.id==='financial-command-center')blockers.push(registry.fcc_remote_blockers.status,p.backup_status.gap);
 if(p.lifecycle.startsWith('BLOCKED'))blockers.push(...(p.prohibited_until_unblocked||[]).map((x:string)=>`PROHIBITED until unblocked: ${x}`));
 if(p.lifecycle==='SECURITY_REVIEW_NEEDED')blockers.push(p.preview_comparison.implication);
 if(p.transition_preconditions)blockers.push(...p.transition_preconditions.filter((x:Raw)=>!x.status.startsWith('MET')).map((x:Raw)=>`${x.precondition}: ${x.status}`));
 const reasons:RiskReason[]=[];
 if(evidence==='unknown')reasons.push({points:30,label:'Project evidence is unknown',source:source+'.evidence_level'});
 if(evidence==='inferred')reasons.push({points:15,label:'Reported evidence has not been verified',source:source+'.evidence_level'});
 if(blockers.length)reasons.push({points:Math.min(30,blockers.length*10),label:`${blockers.length} recorded blockers / prerequisites (10 each, capped at 30)`,source:source});
 if(p.schema_exposure)reasons.push({points:40,label:'Highest recorded schema / data-loss exposure',source:source+'.schema_exposure'});
 if(p.lifecycle.startsWith('BLOCKED'))reasons.push({points:35,label:'Lifecycle explicitly blocked',source:source+'.lifecycle'});
 if(p.lifecycle==='SECURITY_REVIEW_NEEDED')reasons.push({points:40,label:'Security review required',source:source+'.lifecycle'});
 if(/404|NOT CURRENTLY DEPLOYED/.test(p.production_status||''))reasons.push({points:15,label:'Expected route absent at snapshot (not proof of an outage)',source:source+'.production_status'});
 if(p.id==='artemis-omni')reasons.push({points:25,label:'Production built from a side branch; source differs',source:'production_state'});
 if(p.id==='financial-command-center')reasons.push({points:20,label:'Recovery bundle predates current HEAD',source:source+'.backup_status'});
 const risk=Math.min(100,reasons.reduce((a,x)=>a+x.points,0));
 const path=p.intended_local_path?fact(p.intended_local_path,source+'.intended_local_path','inferred','Intended target; existence is not verified'):p.git_state?.path?fact(p.git_state.path,source+'.git_state.path'):fact(null,source,'unknown','No canonical directory designated. See recorded locations.');
 const repo=p.canonical_repo?fact(p.canonical_repo,source+'.canonical_repo',evidence):p.git_state?.remotes===0?fact('No remote · recorded local Git only',source+'.git_state.remotes'):fact(null,source+'.canonical_repo');
 let deployment=fact(p.production_status||p.production_route||p.production_deployment,source+'.production_status');
 if(p.id==='artemis-omni')deployment=fact(`READY · ${registry.production_state.serving_deployment.git_commit_ref}`, 'production_state.serving_deployment');
 let backend=fact(null,source);
 if(p.supabase)backend=fact('DayOS schema files measured; live project and application unknown',source+'.supabase','unknown');
 if(p.schema_exposure)backend=fact('Supabase booking constraint hypothesized; live schema unread',source+'.schema_exposure.live_schema_hypothesis','inferred');
 if(p.active_automation)backend=fact('Local SQLite + cron + launchd; active production dependency',source+'.active_automation');
 const next=p.next_evidence?.[0]||p.open_decisions?.[0]||blockers[0]||p.open_items?.[0]||p.sequencing_recommendation;
 return {id:p.id,name:p.canonical_name,category:p.category,taxonomy:taxonomyOf(p),lifecycle:p.lifecycle,evidence,path,repo,url:fact(p.intended_url,source+'.intended_url','inferred','Intended URL, not a live verification'),deployment,backend,blockers,nextAction:fact(next,source,next?'inferred':'unknown',next?'Suggested next step from registry; not authorized':undefined),risk,health:100-risk,riskBand:risk>=60?'High':risk>=30?'Elevated':'Lower',reasons,raw:p};
}
export interface Filters {query:string;taxonomy:string;risk:string;status:string;evidence:string}
export function filterProjects(projects:Project[],f:Filters):Project[]{
 const q=f.query.trim().toLocaleLowerCase();
 return projects.filter(p=>(!q||`${p.name} ${p.id} ${p.category} ${JSON.stringify(p.raw)}`.toLocaleLowerCase().includes(q))&&(!f.taxonomy||p.taxonomy===f.taxonomy)&&(!f.risk||p.riskBand===f.risk)&&(!f.status||(f.status==='blocked'?p.blockers.length>0:p.lifecycle===f.status))&&(!f.evidence||p.evidence===f.evidence));
}
export interface Edge {from:string;to:string;kind:'ownership'|'dependency'|'historical';evidence:EvidenceKind;label:string;source:string}
export function edgesFor(projects:Project[]):Edge[]{
 const edges:Edge[]=[];
 for(const p of projects){
 if(p.raw.platform_parent)edges.push({from:p.raw.platform_parent,to:p.id,kind:'ownership',evidence:'observed',label:'Platform parent in registry',source:`projects[${p.id}].platform_parent`});
 if(p.raw.successor_candidate)edges.push({from:p.id,to:p.raw.successor_candidate,kind:'historical',evidence:'inferred',label:'Historical predecessor / successor candidate',source:`projects[${p.id}].successor_candidate`});
 if(p.raw.consumed_by)for(const id of p.raw.consumed_by)edges.push({from:p.id,to:id,kind:'dependency',evidence:'inferred',label:'Declared consumer; runtime integration unverified',source:`projects[${p.id}].consumed_by`});
 }
 return edges;
}
export interface Drift {id:string;sourceSha:Fact;sourceBranch:Fact;productionSha:Fact;status:string;note:string;derived?:Derivation;observedSha?:Fact}
// `observations` and `now` are optional: with none supplied the v0.1 comparison is returned
// unchanged. With an observation of the checkout's HEAD the comparison becomes a derived
// value with its own provenance and freshness (OG-DATA-001, OG-DATA-002).
export function driftFor(p:Project,registry:Raw,observations:Observation[]=[],now?:string):Drift{
 const r=p.raw;const s=`projects[${p.id}]`;const shared=['artemis-omni','dayos','pinarevleri','artemis-workbench','rainbow-botanics','prime-industrial-erp'].includes(p.id);
 const sha=r.git_state?.head||r.git_state?.post||r.manager_branch?.sha||r.current_local_paths?.find((x:Raw)=>x.head)?.head;
 const branch=r.git_state?.branch||r.manager_branch?.ref||r.current_local_paths?.find((x:Raw)=>x.head)?.branch;
 const prod=shared?registry.production_state.serving_deployment.git_commit_sha:null;
 const drift:Drift={id:p.id,sourceSha:fact(sha,s+'.git_state / manager_branch / current_local_paths'),sourceBranch:fact(branch,s),productionSha:fact(prod,shared?'production_state.serving_deployment.git_commit_sha':s),status:sha&&prod?(sha===prod?'Same SHA':'Different SHAs'):'Unknown',note:shared?'Production SHA belongs to the shared Artemis host. Source is a recorded local or feature branch, not a designated release target. Different SHAs do not establish ancestry, lag, or approval to deploy.':'Production mapping unavailable. No live query performed.'};
 if(!observations.length||!now)return drift;
 const observed=indexObservations(observations).get(`${p.id}|head_sha`);
 if(!observed)return drift;
 const read=observedFact(observed,s+'.git_state',now);
 return {...drift,observedSha:read,derived:evaluateDrift({value:sha??null,source:drift.sourceSha.source},observed,now)};
}
// ---------- observations merged into the read model (OG-DATA-002)
// Registry facts stay exactly as v0.1 built them until an observation covers the same field.
const observedFields:Record<string,keyof Project>={path:'path',repo:'repo',url:'url',deployment:'deployment',backend:'backend'};
const legacyKindOf=(truth:TruthState):EvidenceKind=>truth==='observed'||truth==='executed'?'observed':truth==='unknown'||truth==='blocked'?truth:'inferred';
export function observedFact(o:Observation,fallbackSource:string,now:string):Fact{
 const read=readObservation(o,fallbackSource,now);
 return {value:textValue(read.value),kind:legacyKindOf(read.truth),source:read.source,note:read.reason,truth:read.truth,confidence:read.confidence,freshness:read.freshness,state:read.state};
}
export function applyObservations(projects:Project[],observations:Observation[],now:string):Project[]{
 if(!observations.length)return projects;
 const index=indexObservations(observations);
 return projects.map(p=>{
  let changed=false;const next:Project={...p};
  for(const [field,key] of Object.entries(observedFields)){
   const o=index.get(`${p.id}|${field}`);
   if(!o)continue;
   const declared=p[key] as Fact;
   const merged=observedFact(o,declared.source,now);
   (next[key] as Fact)={...merged,note:merged.note??`Declared: ${declared.value}`};
   changed=true;
  }
  return changed?next:p;
 });
}
// Every Fact can state its truth: registry facts are declared (or observed when the registry
// itself recorded verification); calculated facts are derived. Nothing is upgraded silently.
export const truthOfFact=(f:Fact,calculated=false):TruthState=>f.truth??truthOfLegacy(f.kind,calculated);
