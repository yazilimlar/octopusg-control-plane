// OG-REG-004 (typed resource catalog) and OG-REG-005 (declared legal-entity records, OD-05).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCatalog,loadEntities,resourcesOf,entityOf,repositoryId,checkoutId,domainId,deploymentId,
 documentId,resourceKinds,entityIdPattern,UNDECLARED,type Catalog} from '../src/resources.ts';
import type {Observation} from '../src/truth.ts';
import type {Raw} from '../src/model.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const registry=snapshot.registry as Raw;
const entityFile=loadEntities(JSON.parse(readFileSync('config/entities.json','utf8')),'config/entities.json');
const catalog:Catalog=buildCatalog(registry,snapshot.sources,[],entityFile);
const observation=(over:Partial<Observation>={}):Observation=>({projectId:'agoraxai-control-plane',field:'head_sha',
 value:'6a4954fbb5b81bac67c26ee96b0b38231c057845',truth:'observed',source:{adapter:'local-git',resource:'~/Projects/agoraxai/control-plane'},
 observedAt:'2026-09-17T11:00:00Z',collectedAt:'2026-09-17T11:00:00Z',expiresAt:'2026-09-18T11:00:00Z',status:'ok',...over});

test('resource identifiers follow <kind>:<key> and are unique',()=>{
 for(const r of catalog.resources){
  assert.ok(resourceKinds.includes(r.kind),`${r.id} has an unknown kind`);
  assert.equal(r.id.split(':')[0],r.kind,`${r.id} must start with its kind`);
  assert.ok(r.id.length>r.kind.length+1,`${r.id} needs a key`);
  assert.ok(r.label&&r.source,`${r.id} needs a label and a source`);
  assert.ok(r.productIds.length&&r.productIds.every(id=>registry.projects.some((p:Raw)=>p.id===id)),`${r.id} must belong to registry rows`);
 }
 assert.equal(new Set(catalog.resources.map(r=>r.id)).size,catalog.resources.length,'no duplicate resource id');
 assert.equal(repositoryId('git@github.com:yazilimlar/artemis-omni.git')?.id,'repository:github.com:yazilimlar/artemis-omni');
 assert.equal(repositoryId('https://github.com/yazilimlar/artemis-omni')?.id,'repository:github.com:yazilimlar/artemis-omni');
 assert.equal(repositoryId('not a remote'),null,'an unparseable remote yields no resource, never a guess');
 assert.equal(checkoutId('~/Projects/x'),'checkout:undeclared:~/Projects/x');
 assert.equal(domainId('atlas.agoraxai.com'),'domain:atlas.agoraxai.com');
 assert.equal(deploymentId('vercel','dpl_1'),'deployment:vercel:dpl_1');
 assert.equal(documentId('PROJECT_REGISTRY_v1.6.yaml'),'document:PROJECT_REGISTRY_v1.6.yaml');
});
test('all five kinds are derived from registry fields, with the field as the source',()=>{
 const kinds=new Set(catalog.resources.map(r=>r.kind));
 for(const kind of resourceKinds)assert.ok(kinds.has(kind),`${kind} resources must be derived`);
 const repo=catalog.resources.find(r=>r.id==='repository:github.com:yazilimlar/artemis-omni')!;
 assert.match(repo.source,/^projects\[[a-z-]+\]\.canonical_repo$/);
 assert.ok(repo.productIds.length>1&&/never implies ownership/.test(repo.note??''),'a shared repository is flagged, not turned into ownership');
 const checkout=catalog.resources.find(r=>r.id===checkoutId('~/Projects/agoraxai/control-plane'))!;
 assert.equal(checkout.truth,'declared');
 assert.match(checkout.source,/^projects\[agoraxai-control-plane\]\.current_local_paths\[\d+\]\.path$/);
 const domain=catalog.resources.find(r=>r.id==='domain:atlas.agoraxai.com')!;
 assert.equal(domain.truth,'declared');
 assert.match(domain.note!,/not a live verification/);
 const deployment=catalog.resources.find(r=>r.kind==='deployment')!;
 assert.equal(deployment.source,'production_state.serving_deployment');
 assert.deepEqual(catalog.resources.filter(r=>r.kind==='document').map(r=>r.label),[...snapshot.sources.map((s:Raw)=>s.name)].sort(),
  'every ingested source document is catalogued, in the catalog\'s deterministic id order');
});
test('nothing is fetched and nothing is guessed: missing values simply have no resource',()=>{
 const withoutUrls={...registry,projects:(registry.projects as Raw[]).map(p=>{const {intended_url,canonical_repo,...rest}=p;return rest;}),production_state:{}};
 const bare=buildCatalog(withoutUrls,[],[]);
 assert.equal(bare.resources.filter(r=>r.kind==='repository').length,0);
 assert.equal(bare.resources.filter(r=>r.kind==='deployment').length,0);
 assert.ok(bare.resources.every(r=>r.kind==='checkout'),'only declared paths remain');
 assert.equal(bare.edges.filter(e=>e.type==='source_repository'||e.type==='serves').length,0);
});
test('an observation upgrades exactly the checkout it covers, and nothing else',()=>{
 const observed=buildCatalog(registry,snapshot.sources,[observation()],entityFile);
 const target=observed.resources.find(r=>r.id===checkoutId('~/Projects/agoraxai/control-plane'))!;
 assert.equal(target.truth,'observed');
 assert.equal(target.source,'local-git:~/Projects/agoraxai/control-plane');
 const others=observed.resources.filter(r=>r.kind==='checkout'&&r.id!==target.id);
 assert.ok(others.every(r=>r.truth==='declared'),'unobserved checkouts stay declared');
 const mismatched=buildCatalog(registry,snapshot.sources,[observation({source:{adapter:'local-git',resource:'~/elsewhere'}})],entityFile);
 assert.equal(mismatched.resources.find(r=>r.id===checkoutId('~/Projects/agoraxai/control-plane'))!.truth,'declared',
  'an observation of another path never upgrades this one');
 const failed=buildCatalog(registry,snapshot.sources,[observation({status:'error',value:null,truth:'unknown',reason:'unreadable'})],entityFile);
 assert.equal(failed.resources.find(r=>r.id===checkoutId('~/Projects/agoraxai/control-plane'))!.truth,'declared',
  'a failed observation never promotes unknown data to observed');
});
test('legal entities are declared existence only — ownership is never inferred (OD-05)',()=>{
 assert.deepEqual(catalog.entities.map(e=>e.id),['legal_entity:great-order-llc']);
 const entity=catalog.entities[0];
 assert.match(entity.id,entityIdPattern);
 assert.equal(entity.label,'Great Order LLC');
 assert.equal(entity.truth,'declared');
 assert.equal(entity.source,'owner-confirmed');
 assert.equal(catalog.ownership.length,(registry.projects as Raw[]).length);
 for(const record of catalog.ownership){
  assert.equal(record.entity,UNDECLARED,`${record.productId} must show undeclared, never a default`);
  assert.equal(record.entityId,null);
  assert.equal(record.truth,'unknown');
 }
 assert.equal(entityOf(catalog,'agoraxai-web')?.entity,UNDECLARED);
 // no edge may connect a legal entity to anything
 assert.equal(catalog.edges.filter(e=>e.from.startsWith('legal_entity:')||e.to.startsWith('legal_entity:')).length,0);
 assert.equal(catalog.resources.filter(r=>r.id.startsWith('legal_entity:')).length,0,'an entity is not a resource');
 // a declared relationship is honoured only when the owner declares it explicitly
 const declared=buildCatalog(registry,snapshot.sources,[],loadEntities({...entityFile,
  ownership:[{productId:'agoraxai-web',entityId:'legal_entity:great-order-llc',source:'owner-confirmed 2026-09-17'}]},'fixture'));
 assert.equal(entityOf(declared,'agoraxai-web')?.entity,'Great Order LLC');
 assert.equal(entityOf(declared,'agoraxai-web')?.truth,'declared');
 assert.equal(entityOf(declared,'artemis-omni')?.entity,UNDECLARED,'a declaration never spreads to another product');
});
test('the entity file is fail-closed',()=>{
 const cases:[unknown,RegExp][]=[
  [null,/not an object/],
  [{...entityFile,schemaVersion:2},/schemaVersion must be 1/],
  [{...entityFile,ownership:undefined},/ownership must be an array/],
  [{...entityFile,entities:[{...entityFile.entities[0],id:'great-order-llc'}]},/legal_entity:<kebab-case>/],
  [{...entityFile,entities:[{...entityFile.entities[0],truth:'observed'}]},/truth must be "declared"/],
  [{...entityFile,entities:[{...entityFile.entities[0],source:''}]},/source must say where the declaration came from/],
  [{...entityFile,entities:[...entityFile.entities,entityFile.entities[0]]},/duplicate id/],
  [{...entityFile,ownership:[{productId:'agoraxai-web',entityId:'legal_entity:unknown-llc',source:'x'}]},/entityId is not a declared entity/],
  [{...entityFile,ownership:[{productId:'agoraxai-web',entityId:'legal_entity:great-order-llc',source:''}]},/needs an explicit owner declaration/],
 ];
 for(const [raw,re] of cases)assert.throws(()=>loadEntities(raw,'fixture'),re);
});
test('each product lists its own resources',()=>{
 const control=resourcesOf(catalog,'agoraxai-control-plane');
 assert.ok(control.some(r=>r.kind==='checkout'&&r.label==='~/Projects/agoraxai/control-plane'));
 assert.ok(control.some(r=>r.kind==='document'));
 assert.ok(resourcesOf(catalog,'agoraxai-atlas').some(r=>r.id==='domain:atlas.agoraxai.com'));
 for(const r of resourcesOf(catalog,'dayos'))assert.ok(r.productIds.includes('dayos'));
});
