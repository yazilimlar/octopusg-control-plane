// Typed resource catalog and relationship graph (OG-REG-004, OG-REG-005, OG-MAP-002).
// Pure derivation from the pinned registry snapshot and already-validated local observations.
// No network, no DNS, no provider API, no filesystem discovery, no clock: the same snapshot
// always yields the same catalog, in the same order.
// Kinds and identifier conventions: docs/02-DOMAIN-MODEL.md §2 and §4. Edge types: §3.
import type {Raw} from './model.ts';
import type {Observation,TruthState} from './truth.ts';
import {indexObservations} from './truth.ts';

export const resourceKinds=['repository','checkout','domain','deployment','document'] as const;
export type ResourceKind=typeof resourceKinds[number];
export interface Resource {
 id:string;kind:ResourceKind;label:string;productIds:string[];truth:TruthState;source:string;note?:string;
}
// Registry relationships plus explicit S9 business relationships (OG-REG-007/008).
// A shared repository, service or funding edge never implies ownership or access.
export const edgeTypes=['platform_parent','consumed_by','depends_on','successor_of','source_repository','checked_out_at','deployed_on','serves','owns','controls','provides_services_to','pays_for_services','client_of','funds'] as const;
export type EdgeType=typeof edgeTypes[number];
export const ownershipEdgeTypes:EdgeType[]=['platform_parent','owns','controls'];
export interface TypedEdge {from:string;to:string;type:EdgeType;truth:TruthState;source:string;label:string}
export interface Catalog {resources:Resource[];edges:TypedEdge[];entities:LegalEntity[];ownership:OwnershipRecord[];subjects:Subject[];tenancies:TenancyRecord[];shares:ScopedShare[]}

// ---------- identifiers: <kind>:<stable natural key>
const host=(url:string):string|null=>{
 const match=/^(?:https?:\/\/)?([^/\s:@]+)(?::\d+)?(?:[/?#]|$)/.exec(url.trim());
 return match?match[1].toLowerCase():null;
};
// git@github.com:owner/repo.git and https://github.com/owner/repo(.git) → github.com:owner/repo.
// A form we cannot parse yields no resource at all; it is never guessed at.
export function repositoryId(remote:string):{id:string;label:string}|null{
 const ssh=/^[a-z0-9._-]+@([^:\s]+):([^\s]+?)(?:\.git)?$/i.exec(remote.trim());
 const https=/^https?:\/\/([^/\s:@]+)\/([^\s]+?)(?:\.git)?$/i.exec(remote.trim());
 const match=ssh??https;
 if(!match)return null;
 const [,h,path]=match;
 if(!path.includes('/'))return null;
 return {id:`repository:${h.toLowerCase()}:${path}`,label:`${h.toLowerCase()}/${path}`};
}
// Device attribution is deliberately absent: the registry declares paths, not machines, and an
// observation records a path, not a device. `undeclared` stays until OG-DEV-002 (v0.4).
export const checkoutId=(path:string,device='undeclared'):string=>`checkout:${device}:${path}`;
export const domainId=(hostname:string):string=>`domain:${hostname}`;
export const deploymentId=(provider:string,id:string):string=>`deployment:${provider}:${id}`;
export const documentId=(name:string):string=>`document:${name}`;

// ---------- declared organization model (OG-REG-005/007/008, S9, OD-05/09)
// Business nodes are separate from products and resources; ownership is never inherited.
export const UNDECLARED='undeclared';
export type Tenancy='internal'|`client:${string}`|`organization:${string}`|'undeclared';
export interface Subject {id:string;label:string;truth:TruthState;source:string;tenancy:Tenancy;confirmedOn?:string;note?:string}
export type LegalEntity=Subject;
export interface TenancyRecord {id:string;tenancy:Tenancy;source:string}
export interface OwnershipRecord {productId:string;entityId:string|null;entity:string;truth:TruthState;source:string}
export interface ScopedShare {
 scopeType:'entity'|'project'|'product';scopeId:string;holderId:string;
 interest:'equity'|'contractual'|'economic'|'undeclared';percentage:number|'undeclared';source:string;
}
export const entityIdPattern=/^legal_entity:[a-z0-9]+(-[a-z0-9]+)*$/;
const subjectIdPattern=/^(organization|person|party|client):[a-z0-9]+(-[a-z0-9]+)*$/;
const tenancyPattern=/^(internal|undeclared|(?:client|organization):[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const subjectKeys=['id','label','truth','source','tenancy','confirmedOn','note'];
export interface EntityFile {
 schemaVersion:1;entities:LegalEntity[];subjects:Subject[];products:TenancyRecord[];
 ownership:{productId:string;entityId:string;source:string}[];relationships:TypedEdge[];shares:ScopedShare[];
}
const record=(value:any,keys:string[],where:string)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`${where} is not an object`);
 for(const key of Object.keys(value))if(!keys.includes(key))throw new Error(`${where}: unknown field ${key}`);
};
const nonempty=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
function tenancy(value:unknown,where:string):Tenancy {
 if(value===undefined)return UNDECLARED;
 if(typeof value!=='string'||!tenancyPattern.test(value))throw new Error(`${where}: invalid tenancy`);
 return value as Tenancy;
}
function assertBoundary(from:string,to:string,type:string,tenancies:Map<string,Tenancy>,legacy=false):void {
 const a=tenancies.get(from)??UNDECLARED,b=tenancies.get(to)??UNDECLARED;
 // Legacy registry platform-parent declarations may predate tenancy. No newly declared
 // business ownership/control may rely on unknown tenancy, even at both endpoints.
 if(a!==b||a===UNDECLARED&&!legacy)
  throw new Error(`${type} edge ${from} (${a}) -> ${to} (${b}): ownership/control requires the same declared tenancy`);
}
export function loadEntities(raw:unknown,label='entities'):EntityFile {
 record(raw,['schemaVersion','$comment','entities','subjects','products','ownership','relationships','shares'],label);
 const f=raw as Record<string,any>;
 if(f.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 for(const key of ['entities','ownership'])if(!Array.isArray(f[key]))throw new Error(`${label}: ${key} must be an array`);
 for(const key of ['subjects','products','relationships','shares'])if(f[key]!==undefined&&!Array.isArray(f[key]))throw new Error(`${label}: ${key} must be an array`);
 const ids=new Map<string,Tenancy>();
 const subjects=(rows:any[],legal:boolean):Subject[]=>rows.map((e,i)=>{
  const where=`${label}: ${legal?'entities':'subjects'}[${i}]`;
  record(e,subjectKeys,where);
  if(typeof e.id!=='string'||!(legal?entityIdPattern:subjectIdPattern).test(e.id))throw new Error(`${where}: id must look like ${legal?'legal_entity:<kebab-case>':'organization/person/party/client:<kebab-case>'}`);
  if(ids.has(e.id))throw new Error(`${where}: duplicate id ${e.id}`);
  if(!nonempty(e.label))throw new Error(`${where}: label must be a non-empty string`);
  if(e.truth!=='declared')throw new Error(`${where}: truth must be "declared"`);
  if(!nonempty(e.source))throw new Error(`${where}: source must say where the declaration came from`);
  for(const key of ['confirmedOn','note'])if(e[key]!==undefined&&!nonempty(e[key]))throw new Error(`${where}: invalid ${key}`);
  const t=tenancy(e.tenancy,where);ids.set(e.id,t);
  return {...e,tenancy:t};
 });
 const entities=subjects(f.entities,true),other=subjects(f.subjects??[],false);
 const products:TenancyRecord[]=(f.products??[]).map((p:any,i:number)=>{
  const where=`${label}: products[${i}]`;
  record(p,['id','tenancy','source'],where);
  if(!nonempty(p.id)||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id))throw new Error(`${where}: invalid product id`);
  if(ids.has(p.id))throw new Error(`${where}: duplicate id ${p.id}`);
  if(!nonempty(p.source))throw new Error(`${where}: source required`);
  const t=tenancy(p.tenancy,where);ids.set(p.id,t);return {...p,tenancy:t};
 });
 const productsById=new Set(products.map(p=>p.id));
 const entityIds=new Set(entities.map(e=>e.id));
 const seenOwners=new Set<string>();
 const ownership=f.ownership.map((o:any,i:number)=>{
  const where=`${label}: ownership[${i}]`;
  record(o,['productId','entityId','source'],where);
  if(!entityIds.has(o.entityId))throw new Error(`${where}: entityId is not a declared entity`);
  if(!nonempty(o.productId))throw new Error(`${where}: productId must be a non-empty string`);
  if(!nonempty(o.source))throw new Error(`${where}: an ownership relationship needs an explicit owner declaration as its source`);
  if(!productsById.has(o.productId))throw new Error(`${where}: unknown product ${o.productId}`);
  if(seenOwners.has(o.productId))throw new Error(`${where}: duplicate ownership for ${o.productId}; use scoped shares for multiple interests`);
  seenOwners.add(o.productId);assertBoundary(o.entityId,o.productId,'owns',ids);
  return {...o};
 });
 const relations=new Set<string>();
 const relationships:TypedEdge[]=(f.relationships??[]).map((e:any,i:number)=>{
  const where=`${label}: relationships[${i}]`;
  record(e,['from','to','type','truth','source','label'],where);
  if(!['owns','controls','provides_services_to','pays_for_services','client_of','funds'].includes(e.type))throw new Error(`${where}: unsupported relationship type ${e.type}`);
  if(!ids.has(e.from)||!ids.has(e.to))throw new Error(`${where}: unknown endpoint ${e.from} -> ${e.to}`);
  if(e.from===e.to)throw new Error(`${where}: self relationship`);
  if(e.truth!=='declared'||!nonempty(e.source)||!nonempty(e.label))throw new Error(`${where}: declared truth, source and label required`);
  const key=`${e.type}|${e.from}|${e.to}`;
  if(relations.has(key))throw new Error(`${where}: duplicate relationship ${key}`);relations.add(key);
  if(ownershipEdgeTypes.includes(e.type))assertBoundary(e.from,e.to,e.type,ids);
  if(e.type==='owns'&&productsById.has(e.to)&&entityIds.has(e.from)){
   if(seenOwners.has(e.to))throw new Error(`${where}: duplicate ownership for ${e.to}; use scoped shares for multiple interests`);
   seenOwners.add(e.to);
  }
  return {...e};
 });
 const shares:ScopedShare[]=[];const totals=new Map<string,number>();const shareKeys=new Set<string>();
 for(const [i,v] of (f.shares??[]).entries()){
  const where=`${label}: shares[${i}]`;
  record(v,['scopeType','scopeId','holderId','interest','percentage','source'],where);
  if(!['entity','project','product'].includes(v.scopeType))throw new Error(`${where}: invalid scopeType`);
  if(!ids.has(v.scopeId)||(v.scopeType==='entity'?!/^(legal_entity|organization|client):/.test(v.scopeId):!productsById.has(v.scopeId)))throw new Error(`${where}: unknown or mismatched scope ${v.scopeId}`);
  if(!ids.has(v.holderId)||productsById.has(v.holderId))throw new Error(`${where}: unknown holder ${v.holderId}`);
  if(!['equity','contractual','economic','undeclared'].includes(v.interest))throw new Error(`${where}: invalid interest`);
  if(!nonempty(v.source))throw new Error(`${where}: source required`);
  if(v.percentage!==UNDECLARED&&(typeof v.percentage!=='number'||!Number.isFinite(v.percentage)||v.percentage<0||v.percentage>100))throw new Error(`${where}: percentage must be undeclared or a finite number from 0 to 100`);
  // Equity must not be a back door around ownership boundaries. Contractual/economic
  // interests are not equity and never generate an ownership edge.
  if(v.interest==='equity')assertBoundary(v.holderId,v.scopeId,'equity share',ids);
  const key=`${v.scopeId}|${v.holderId}|${v.interest}`;
  if(shareKeys.has(key))throw new Error(`${where}: duplicate share ${key}`);shareKeys.add(key);
  const total=(totals.get(v.scopeId)??0)+(v.percentage===UNDECLARED?0:v.percentage);
  if(total>100)throw new Error(`${where}: declared percentages exceed 100 for ${v.scopeId}`);
  totals.set(v.scopeId,total);shares.push({...v});
 }
 return {schemaVersion:1,entities,subjects:other,products,ownership,relationships,shares};
}

export const tenancyOf=(catalog:Catalog,id:string):Tenancy=>catalog.tenancies.find(t=>t.id===id)?.tenancy??UNDECLARED;
export function internalRollup(catalog:Catalog,rows:{id:string;value:number}[]):{ok:true;value:number}|{ok:false;reasons:string[]} {
 const reasons=rows.filter(r=>tenancyOf(catalog,r.id)!=='internal').map(r=>`${r.id}: ${tenancyOf(catalog,r.id)} excluded from internal roll-up`);
 if(rows.some(r=>!Number.isFinite(r.value)))reasons.push('Non-finite roll-up value');
 if(new Set(rows.map(r=>r.id)).size!==rows.length)reasons.push('Duplicate roll-up row');
 const value=rows.reduce((sum,r)=>sum+r.value,0);
 if(!Number.isFinite(value))reasons.push('Non-finite roll-up total');
 return reasons.length?{ok:false,reasons}:{ok:true,value};
}
export const percentageLabel=(share:ScopedShare):string=>share.percentage===UNDECLARED?UNDECLARED:`${share.percentage}%`;
export function attributeShare(share:ScopedShare,value:number):{ok:true;value:number;truth:'derived'}|{ok:false;reason:string} {
 if(share.percentage===UNDECLARED)return {ok:false,reason:`${share.scopeId}: ${share.holderId} percentage is undeclared; attribution blocked`};
 if(!Number.isFinite(value)||!Number.isFinite(share.percentage)||share.percentage<0||share.percentage>100)return {ok:false,reason:'Invalid attribution input'};
 return {ok:true,value:value*share.percentage/100,truth:'derived'};
}
export function ownershipOf(registry:Raw,entities?:EntityFile):OwnershipRecord[]{
 const productOwners=(entities?.relationships??[]).filter(e=>e.type==='owns'&&entities?.entities.some(s=>s.id===e.from))
  .map(e=>({productId:e.to,entityId:e.from,source:e.source}));
 const declared=new Map([...(entities?.ownership??[]),...productOwners].map(o=>[o.productId,o]));
 const byId=new Map((entities?.entities??[]).map(e=>[e.id,e]));
 return (registry.projects as Raw[]).map(p=>{
  const record=declared.get(p.id);
  return record
   ?{productId:p.id,entityId:record.entityId,entity:byId.get(record.entityId)?.label??record.entityId,truth:'declared' as TruthState,source:record.source}
   :{productId:p.id,entityId:null,entity:UNDECLARED,truth:'unknown' as TruthState,source:`projects[${p.id}]`};
 });
}

// ---------- hosted source (OG-OBS-007)
// Some products are a BRANCH of another product's repository: DayOS is a feature branch of the
// Artemis Omni repository, and the registry declares the checkout and the remote on the host
// row, not on the DayOS row. The link is derived, never declared: exactly one other product must
// list a checkout on the same branch, or nothing is linked at all (no guess between candidates).
export interface HostedSource {
 hostId:string;branch:string;branchSource:string;
 path:string;pathSource:string;
 remote:string|null;remoteSource:string|null;
}
export function hostedSource(p:Raw,registry:Raw):HostedSource|null{
 const branch=p.git_state?.branch;
 if(typeof branch!=='string'||!branch)return null;
 // A product that declares its own repository or checkout has nothing to derive.
 if(typeof p.canonical_repo==='string'||typeof p.intended_local_path==='string'||typeof p.git_state?.path==='string'||(p.current_local_paths??[]).length)return null;
 const hits:{host:Raw;index:number}[]=[];
 for(const host of registry.projects as Raw[]){
  if(host.id===p.id)continue;
  for(const [index,entry] of ((host.current_local_paths??[]) as Raw[]).entries())
   if(entry?.branch===branch&&typeof entry.path==='string')hits.push({host,index});
 }
 if(hits.length!==1)return null;
 const {host,index}=hits[0];
 const remote=typeof host.canonical_repo==='string'?host.canonical_repo:null;
 return {hostId:host.id,branch,branchSource:`projects[${p.id}].git_state.branch`,
  path:host.current_local_paths[index].path,pathSource:`projects[${host.id}].current_local_paths[${index}].path`,
  remote,remoteSource:remote?`projects[${host.id}].canonical_repo`:null};
}

// ---------- catalog
type Draft={resource:Resource;productId:string};
export function buildCatalog(registry:Raw,sources:{name:string}[]=[],observations:Observation[]=[],entities?:EntityFile):Catalog{
 // Revalidate even typed inputs: callers must not bypass the loader with an object cast.
 entities=entities?loadEntities(entities):undefined;
 const productIds=new Set<string>((registry.projects as Raw[]).map(p=>p.id));
 for(const p of entities?.products??[])if(!productIds.has(p.id))throw new Error(`Unknown registry product ${p.id} in tenancy declarations`);
 const subjects=[...(entities?.entities??[]),...(entities?.subjects??[])];
 const declaredTenancies=new Map((entities?.products??[]).map(p=>[p.id,p]));
 const tenancies:TenancyRecord[]=[...subjects.map(s=>({id:s.id,tenancy:s.tenancy,source:s.source})),
  ...(registry.projects as Raw[]).map(p=>declaredTenancies.get(p.id)??{id:p.id,tenancy:UNDECLARED as Tenancy,source:`projects[${p.id}]: tenancy undeclared`})];
 const tenancyIndex=new Map(tenancies.map(t=>[t.id,t.tenancy]));
 const drafts:Draft[]=[];
 const edges:TypedEdge[]=[...(entities?.relationships??[]),...(entities?.ownership??[]).map(o=>({from:o.entityId,to:o.productId,type:'owns' as const,truth:'declared' as const,source:o.source,label:'Explicit product ownership declaration'}))];
 const observed=indexObservations(observations);
 const add=(productId:string,resource:Resource)=>{drafts.push({resource,productId});return resource.id;};
 const edge=(from:string,to:string,type:EdgeType,truth:TruthState,source:string,label:string)=>edges.push({from,to,type,truth,source,label});

 for(const p of registry.projects as Raw[]){
  const base=`projects[${p.id}]`;
  // repository (declared in the registry; never contacted)
  let repositoryRef:string|null=null;
  if(typeof p.canonical_repo==='string'){
   const parsed=repositoryId(p.canonical_repo);
   if(parsed)repositoryRef=add(p.id,{id:parsed.id,kind:'repository',label:parsed.label,productIds:[p.id],truth:'declared',source:`${base}.canonical_repo`,
    ...(registry.projects.filter((x:Raw)=>x.canonical_repo===p.canonical_repo).length>1?{note:'Declared by more than one product; a shared repository never implies ownership'}:{})});
  }
  // checkouts: declared paths, upgraded to observed only where an observation covers the path
  const paths:{path:string;source:string;note?:string}[]=[];
  if(typeof p.intended_local_path==='string')paths.push({path:p.intended_local_path,source:`${base}.intended_local_path`,note:'Intended location; existence is not verified'});
  for(const [i,entry] of ((p.current_local_paths??[]) as Raw[]).entries())
   if(typeof entry?.path==='string')paths.push({path:entry.path,source:`${base}.current_local_paths[${i}].path`,...(entry.role?{note:String(entry.role)}:{})});
  if(typeof p.git_state?.path==='string')paths.push({path:p.git_state.path,source:`${base}.git_state.path`});
  for(const {path,source,note} of paths){
   const sighting=observed.get(`${p.id}|head_sha`);
   const isObserved=!!sighting&&sighting.status==='ok'&&sighting.source.resource===path;
   const id=add(p.id,{id:checkoutId(path),kind:'checkout',label:path,productIds:[p.id],
    truth:isObserved?'observed':'declared',source:isObserved?`${sighting!.source.adapter}:${sighting!.source.resource}`:source,...(note?{note}:{})});
   edge(repositoryRef??p.id,id,'checked_out_at',isObserved?'observed':'declared',source,
    repositoryRef?'Declared checkout of this repository':'Declared checkout; no repository is declared for this product');
  }
  // domains: intended URLs are declared intent, never a liveness claim
  if(typeof p.intended_url==='string'){
   const name=host(p.intended_url);
   if(name){
    const id=add(p.id,{id:domainId(name),kind:'domain',label:name,productIds:[p.id],truth:'declared',source:`${base}.intended_url`,note:'Intended URL; not a live verification'});
    void id;
   }
  }
 }

 // hosted products (OG-OBS-007): a branch of a host product's repository. The repository and
 // checkout resources already exist from the host row; this only attaches the hosted product to
 // them, as derived, and upgrades the checkout to observed where this product itself was observed.
 for(const p of registry.projects as Raw[]){
  const hosted=hostedSource(p,registry);
  if(!hosted)continue;
  const sources=`${hosted.branchSource} + ${hosted.pathSource}`;
  const repo=hosted.remote?repositoryId(hosted.remote):null;
  const sighting=observed.get(`${p.id}|head_sha`);
  const isObserved=!!sighting&&sighting.status==='ok'&&sighting.source.resource===hosted.path;
  const checkout=add(p.id,{id:checkoutId(hosted.path),kind:'checkout',label:hosted.path,productIds:[p.id],
   truth:isObserved?'observed':'declared',source:isObserved?`${sighting!.source.adapter}:${sighting!.source.resource}`:hosted.pathSource,
   note:`Checkout of the ${hosted.hostId} repository on branch ${hosted.branch}; derived link`});
  if(repo){
   add(p.id,{id:repo.id,kind:'repository',label:repo.label,productIds:[p.id],truth:'declared',source:hosted.remoteSource!});
   edge(p.id,repo.id,'source_repository','derived',sources,`Derived source repository: a branch of the ${hosted.hostId} repository`);
  }
  edge(repo?.id??p.id,checkout,'checked_out_at','derived',sources,'Checkout of this product’s branch; the resource is observed only where an observation covers it');
 }

 // portfolio-level production record: one deployment, its aliases, and the product that declares it
 const serving=registry.production_state?.serving_deployment as Raw|undefined;
 if(serving?.id){
  const deployment=deploymentId('vercel',String(serving.id));
  const declaring=(registry.projects as Raw[]).filter(p=>typeof p.production_deployment==='string'&&/production_state/.test(p.production_deployment)).map(p=>p.id);
  drafts.push(...declaring.map(productId=>({productId,resource:{id:deployment,kind:'deployment' as ResourceKind,label:`${serving.state??'unknown state'} · ${String(serving.git_commit_sha??'').slice(0,12)||'no SHA'}`,
   productIds:[productId],truth:'observed' as TruthState,source:'production_state.serving_deployment',note:'Recorded from a read-only provider query at snapshot time; not re-verified here'}})));
  for(const productId of declaring)
   edge(productId,deployment,'deployed_on','declared',`projects[${productId}].production_deployment`,'Product declares this production deployment');
  for(const [i,alias] of ((serving.aliases??[]) as string[]).entries()){
   const name=host(alias);
   if(!name)continue;
   drafts.push({productId:declaring[0]??'',resource:{id:domainId(name),kind:'domain',label:name,productIds:declaring.slice(0,1),truth:'observed',
    source:`production_state.serving_deployment.aliases[${i}]`,note:'Recorded alias of the serving deployment'}});
   edge(deployment,domainId(name),'serves','observed',`production_state.serving_deployment.aliases[${i}]`,'Deployment serves this alias');
  }
 }

 // governance documents: the byte-identical, hash-checked inputs of this build
 const ingestor=(registry.projects as Raw[]).find(p=>p.id==='agoraxai-control-plane')?.id;
 if(ingestor)for(const [i,s] of sources.entries())
  drafts.push({productId:ingestor,resource:{id:documentId(s.name),kind:'document',label:s.name,productIds:[ingestor],truth:'observed',
   source:`sources[${i}]`,note:'SHA-256 verified at build time'}});

 // declared product-to-product relationships (ownership only from platform_parent)
 for(const p of registry.projects as Raw[]){
  const base=`projects[${p.id}]`;
  if(typeof p.platform_parent==='string'){
   if(!productIds.has(p.platform_parent))throw new Error(`platform_parent edge ${p.platform_parent} -> ${p.id}: unknown endpoint`);
   assertBoundary(p.platform_parent,p.id,'platform_parent',tenancyIndex,true);
   edge(p.platform_parent,p.id,'platform_parent','declared',`${base}.platform_parent`,'Declared platform parent');
  }
  if(typeof p.successor_candidate==='string')edge(p.id,p.successor_candidate,'successor_of','declared',`${base}.successor_candidate`,'Declared predecessor / successor candidate');
  for(const id of (p.consumed_by??[]) as string[])edge(p.id,id,'consumed_by','declared',`${base}.consumed_by`,'Declared consumer; runtime integration unverified');
  for(const dependency of (p.dependencies??[]) as unknown[]){
   const id=typeof dependency==='string'?dependency:(dependency as Raw)?.id;
   if(typeof id==='string'&&(registry.projects as Raw[]).some(x=>x.id===id))edge(p.id,id,'depends_on','declared',`${base}.dependencies`,'Declared dependency');
  }
  if(typeof p.canonical_repo==='string'){
   const parsed=repositoryId(p.canonical_repo);
   if(parsed)edge(p.id,parsed.id,'source_repository','declared',`${base}.canonical_repo`,'Declared source repository');
  }
 }

 // merge duplicates by id: one resource per identifier, products accumulated, strongest truth kept
 const byId=new Map<string,Resource>();
 for(const {resource,productId} of drafts){
  const existing=byId.get(resource.id);
  if(!existing){byId.set(resource.id,{...resource,productIds:[...new Set(resource.productIds.filter(Boolean))]});continue;}
  existing.productIds=[...new Set([...existing.productIds,...resource.productIds,productId].filter(Boolean))].sort();
  if(existing.truth!=='observed'&&resource.truth==='observed'){existing.truth='observed';existing.source=resource.source;existing.note=resource.note;}
 }
 const resources=[...byId.values()].map(r=>({...r,productIds:[...r.productIds].sort()})).sort((a,b)=>a.id.localeCompare(b.id));
 const seen=new Set<string>();
 const deduped=edges.filter(e=>{const key=`${e.type}|${e.from}|${e.to}`;if(seen.has(key))return false;seen.add(key);return true;})
  .sort((a,b)=>a.type.localeCompare(b.type)||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 return {resources,edges:deduped,entities:[...(entities?.entities??[])].sort((a,b)=>a.id.localeCompare(b.id)),ownership:ownershipOf(registry,entities),subjects,tenancies,shares:entities?.shares??[]};
}

// ---------- queries used by the interface
export const resourcesOf=(catalog:Catalog,productId:string):Resource[]=>catalog.resources.filter(r=>r.productIds.includes(productId));
export const entityOf=(catalog:Catalog,productId:string):OwnershipRecord|undefined=>catalog.ownership.find(e=>e.productId===productId);
export const nodeIds=(catalog:Catalog,registry:Raw):Set<string>=>new Set<string>([...(registry.projects as Raw[]).map(p=>p.id),...catalog.resources.map(r=>r.id),...catalog.subjects.map(s=>s.id)]);
// Every edge endpoint must be a product, declared subject or catalogued resource.
export function danglingEdges(catalog:Catalog,registry:Raw):TypedEdge[]{
 const ids=nodeIds(catalog,registry);
 return catalog.edges.filter(e=>!ids.has(e.from)||!ids.has(e.to));
}
