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
// Every type here comes from docs/02-DOMAIN-MODEL.md §3. Ownership is `platform_parent` and
// nothing else: a shared repository or a shared host never implies ownership.
export const edgeTypes=['platform_parent','consumed_by','depends_on','successor_of','source_repository','checked_out_at','deployed_on','serves'] as const;
export type EdgeType=typeof edgeTypes[number];
export const ownershipEdgeTypes:EdgeType[]=['platform_parent'];
export interface TypedEdge {from:string;to:string;type:EdgeType;truth:TruthState;source:string;label:string}
export interface Catalog {resources:Resource[];edges:TypedEdge[];entities:LegalEntity[];ownership:OwnershipRecord[]}

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

// ---------- legal entities (OG-REG-005, OD-05)
// A legal entity is declared data about EXISTENCE. Nothing about ownership follows from it:
// an entity owns a product only where the owner declares that exact relationship, and every
// product without such a declaration reports `undeclared` with truth `unknown`. No entity is
// ever defaulted, inherited from a platform parent, or inferred from a name.
export interface LegalEntity {id:string;label:string;truth:TruthState;source:string;confirmedOn?:string;note?:string}
export interface OwnershipRecord {productId:string;entityId:string|null;entity:string;truth:TruthState;source:string}
export const UNDECLARED='undeclared';
export const entityIdPattern=/^legal_entity:[a-z0-9]+(-[a-z0-9]+)*$/;
const entityKeys=['id','label','truth','source','confirmedOn','note'];
export interface EntityFile {schemaVersion:1;entities:LegalEntity[];ownership:{productId:string;entityId:string;source:string}[]}
export function loadEntities(raw:unknown,label='entities'):EntityFile{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const f=raw as Record<string,any>;
 if(f.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(!Array.isArray(f.entities))throw new Error(`${label}: entities must be an array`);
 if(!Array.isArray(f.ownership))throw new Error(`${label}: ownership must be an array (empty until the owner declares a relationship)`);
 const ids=new Set<string>();
 for(const [i,e] of f.entities.entries()){
  const where=`${label}: entities[${i}]`;
  if(!e||typeof e!=='object'||Array.isArray(e))throw new Error(`${where} is not an object`);
  for(const k of Object.keys(e))if(!entityKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof e.id!=='string'||!entityIdPattern.test(e.id))throw new Error(`${where}: id must look like legal_entity:<kebab-case>`);
  if(ids.has(e.id))throw new Error(`${where}: duplicate id ${e.id}`);
  ids.add(e.id);
  if(typeof e.label!=='string'||!e.label)throw new Error(`${where}: label must be a non-empty string`);
  if(e.truth!=='declared')throw new Error(`${where}: a legal entity is declared data; truth must be "declared"`);
  if(typeof e.source!=='string'||!e.source)throw new Error(`${where}: source must say where the declaration came from`);
 }
 for(const [i,o] of f.ownership.entries()){
  const where=`${label}: ownership[${i}]`;
  if(!o||typeof o!=='object')throw new Error(`${where} is not an object`);
  if(!ids.has(o.entityId))throw new Error(`${where}: entityId is not a declared entity`);
  if(typeof o.productId!=='string'||!o.productId)throw new Error(`${where}: productId must be a non-empty string`);
  if(typeof o.source!=='string'||!o.source)throw new Error(`${where}: an ownership relationship needs an explicit owner declaration as its source`);
 }
 return f as EntityFile;
}
export function ownershipOf(registry:Raw,entities?:EntityFile):OwnershipRecord[]{
 const declared=new Map((entities?.ownership??[]).map(o=>[o.productId,o]));
 const byId=new Map((entities?.entities??[]).map(e=>[e.id,e]));
 return (registry.projects as Raw[]).map(p=>{
  const record=declared.get(p.id);
  return record
   ?{productId:p.id,entityId:record.entityId,entity:byId.get(record.entityId)?.label??record.entityId,truth:'declared' as TruthState,source:record.source}
   :{productId:p.id,entityId:null,entity:UNDECLARED,truth:'unknown' as TruthState,source:`projects[${p.id}]`};
 });
}

// ---------- catalog
type Draft={resource:Resource;productId:string};
export function buildCatalog(registry:Raw,sources:{name:string}[]=[],observations:Observation[]=[],entities?:EntityFile):Catalog{
 const drafts:Draft[]=[];
 const edges:TypedEdge[]=[];
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
  if(typeof p.platform_parent==='string')edge(p.platform_parent,p.id,'platform_parent','declared',`${base}.platform_parent`,'Declared platform parent');
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
 return {resources,edges:deduped,entities:[...(entities?.entities??[])].sort((a,b)=>a.id.localeCompare(b.id)),ownership:ownershipOf(registry,entities)};
}

// ---------- queries used by the interface
export const resourcesOf=(catalog:Catalog,productId:string):Resource[]=>catalog.resources.filter(r=>r.productIds.includes(productId));
export const entityOf=(catalog:Catalog,productId:string):OwnershipRecord|undefined=>catalog.ownership.find(e=>e.productId===productId);
export const nodeIds=(catalog:Catalog,registry:Raw):Set<string>=>new Set<string>([...(registry.projects as Raw[]).map(p=>p.id),...catalog.resources.map(r=>r.id)]);
// Every edge endpoint must be a product or a catalogued resource; nothing dangles.
export function danglingEdges(catalog:Catalog,registry:Raw):TypedEdge[]{
 const ids=nodeIds(catalog,registry);
 return catalog.edges.filter(e=>!ids.has(e.from)||!ids.has(e.to));
}
