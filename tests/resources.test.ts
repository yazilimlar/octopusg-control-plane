// OG-REG-004 (typed resource catalog) and OG-REG-005 (declared legal-entity records, OD-05).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {buildCatalog,loadEntities,resourcesOf,entityOf,repositoryId,checkoutId,domainId,deploymentId,
 documentId,resourceKinds,entityIdPattern,UNDECLARED,type Catalog,tenancyOf,internalRollup,percentageLabel,attributeShare,type ScopedShare,type EntityFile} from '../src/resources.ts';
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
 assert.equal(entity.source,'S9#owner-declarations');
 assert.equal(catalog.ownership.length,(registry.projects as Raw[]).length);
 for(const record of catalog.ownership){
  assert.equal(record.entity,UNDECLARED,`${record.productId} must show undeclared, never a default`);
  assert.equal(record.entityId,null);
  assert.equal(record.truth,'unknown');
 }
 assert.equal(entityOf(catalog,'agoraxai-web')?.entity,UNDECLARED);
 // S9 explicitly declares business ownership, never asset ownership.
 assert.ok(catalog.edges.some(e=>e.from===entity.id&&e.to==='organization:agoraxai'&&e.type==='owns'));
 assert.equal(catalog.resources.filter(r=>r.id.startsWith('legal_entity:')).length,0,'an entity is not a resource');
 // a declared relationship is honoured only when the owner declares it explicitly
 const declared=buildCatalog(registry,snapshot.sources,[],loadEntities({...entityFile,
  products:[...entityFile.products,{id:'agoraxai-web',tenancy:'internal',source:'fixture'}],
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

// WP-15 acceptance (OG-REG-007/008): adversarial fixtures are separate from declarations.
const G='legal_entity:great-order-llc', A='organization:agoraxai', R='organization:artemis';
const C='client:pinar-evleri', P='person:george', K='party:georges-cousins';
const freshEntities=():EntityFile=>structuredClone(entityFile);
const relation=(from:string,to:string,type:string)=>({from,to,type,truth:'declared',source:'fixture',label:'Explicit test declaration'});

test('S9 encodes only declared business ownership/control, independent client and service/funding directions',()=>{
 const pairs=(type:string)=>catalog.edges.filter(e=>e.type===type).map(e=>`${e.from} -> ${e.to}`).sort();
 assert.deepEqual(pairs('owns'),[`${P} -> ${G}`,`${G} -> ${A}`,`${G} -> ${R}`,`${K} -> ${C}`].sort());
 assert.deepEqual(pairs('controls'),[`${P} -> ${G}`,`${G} -> ${A}`,`${G} -> ${R}`].sort());
 assert.deepEqual(pairs('provides_services_to'),[`${R} -> ${A}`,`${A} -> ${G}`,`${R} -> ${C}`].sort());
 assert.deepEqual(pairs('client_of'),[`${G} -> ${A}`,`${C} -> ${R}`].sort());
 assert.deepEqual(pairs('funds'),[`${G} -> ${A}`]);
 assert.deepEqual(pairs('pays_for_services'),[],'draft Artemis payment was explicitly superseded');
 for(const e of entityFile.relationships)assert.equal(e.source,'S9#owner-declarations');
 assert.equal(entityFile.ownership.length,0,'no product owner inferred from a business owner');
 assert.equal(entityOf(catalog,'agoraxai-control-plane')?.entity,UNDECLARED);
 assert.ok(!catalog.edges.some(e=>e.type==='owns'&&catalog.resources.some(r=>r.id===e.to)));
 assert.ok(!catalog.subjects.some(s=>/prime|vendor|partner/.test(s.id)),'no individually undeclared counterparty invented');
 assert.match(catalog.subjects.find(s=>s.id===G)!.note!,/Prime Industrial.*role.*undeclared/);
 assert.match(catalog.subjects.find(s=>s.id===G)!.note!,/Pricing is not nonprofit or tax-exempt status/);
 assert.match(catalog.edges.find(e=>e.type==='funds')!.label,/Owner-described donations.*accounting and tax treatment undeclared.*no deductibility/);
 assert.match(catalog.subjects.find(s=>s.id===A)!.note!,/trademarks.*IP ownership remain undeclared/);
 assert.equal(entityFile.shares[0].percentage,UNDECLARED);
 assert.equal(entityFile.shares.some(s=>s.holderId!==P),false,'no unspecified partner equity declaration');
});

test('every entity/product has a tenancy; absence stays undeclared with no ownership inference',()=>{
 for(const id of [G,A,R,P,'agoraxai-control-plane'])assert.equal(tenancyOf(catalog,id),'internal');
 for(const id of [C,K,'pinarevleri'])assert.equal(tenancyOf(catalog,id),C);
 assert.equal(tenancyOf(catalog,'agoraxai-web'),UNDECLARED);
 assert.equal(tenancyOf(catalog,'missing'),UNDECLARED);
 assert.equal(catalog.tenancies.length,registry.projects.length+catalog.subjects.length);
 const loaded=loadEntities({schemaVersion:1,entities:[{id:G,label:'Great Order LLC',truth:'declared',source:'fixture'}],ownership:[]});
 assert.equal(loaded.entities[0].tenancy,UNDECLARED);
 const noDeclarations=buildCatalog(registry,[],[],loaded);
 assert.ok(noDeclarations.tenancies.every(t=>t.tenancy===UNDECLARED));
 assert.deepEqual(loaded.shares,[],'no synthesized 0 or 100 percent');
});

test('load rejects cross-tenancy ownership/control in both directions and names both endpoints and tenancies',()=>{
 for(const type of ['owns','controls'])for(const [from,to] of [[G,C],[C,G],[A,C],[C,A],[R,C],[C,R]]){
  const data=freshEntities();data.relationships.push(relation(from,to,type) as any);
  assert.throws(()=>loadEntities(data),err=>{
   const message=String(err);return message.includes(from)&&message.includes(to)&&message.includes('internal')&&message.includes(C);
  });
  assert.throws(()=>buildCatalog(registry,[],[],data),/same declared tenancy/,'catalog cannot bypass load validation');
 }
 const old=freshEntities();old.ownership.push({entityId:G,productId:'pinarevleri',source:'fixture'});
 assert.throws(()=>loadEntities(old),/owns edge.*internal.*pinarevleri.*client:pinar-evleri/);
});

test('explicit service/client/payment/funding edges may cross tenants without ownership or access edges',()=>{
 for(const type of ['provides_services_to','pays_for_services','client_of','funds']){
  const data=freshEntities();data.relationships.push(relation(G,C,type) as any,relation(C,G,type) as any);
  const loaded=loadEntities(data);const result=buildCatalog(registry,[],[],loaded);
  assert.deepEqual(result.edges.filter(e=>e.type==='owns'),catalog.edges.filter(e=>e.type==='owns'));
  assert.deepEqual(result.ownership,catalog.ownership);
  assert.ok(result.edges.some(e=>e.from===G&&e.to===C&&e.type===type));
  assert.ok(!result.edges.some(e=>/access|permission/.test(e.type)));
 }
});

test('legacy platform_parent cannot bypass a client or unknown boundary',()=>{
 for(const [from,to] of [['agoraxai-control-plane','pinarevleri'],['pinarevleri','agoraxai-control-plane'],['agoraxai-control-plane','agoraxai-web'],['agoraxai-web','pinarevleri']]){
  const changed={...registry,projects:registry.projects.map((p:Raw)=>p.id===to?{...p,platform_parent:from}:p)};
  assert.throws(()=>buildCatalog(changed,[],[],entityFile),err=>String(err).includes(from)&&String(err).includes(to)&&String(err).includes('platform_parent'));
 }
 assert.ok(buildCatalog(registry,[],[],entityFile).edges.some(e=>e.type==='platform_parent'),'legacy unknown-to-unknown declaration preserved');
});

test('future independent organizations cannot own or control another tenant',()=>{
 const data=freshEntities();data.subjects.push({id:'organization:other',label:'Other',truth:'declared',source:'fixture',tenancy:'organization:other'});
 data.relationships.push(relation(A,'organization:other','owns') as any);
 assert.throws(()=>loadEntities(data),/internal.*organization:other/);
 data.relationships.pop();data.relationships.push(relation(A,'organization:other','provides_services_to') as any);
 assert.ok(loadEntities(data));
});

test('unknown tenancy and invalid configuration fail closed without mutating input',()=>{
 for(const t of [undefined,'undeclared']){
  const data=freshEntities();(data.subjects.find(s=>s.id===A) as any).tenancy=t;
  assert.throws(()=>loadEntities(data),/internal.*undeclared/);
 }
 const invalid=[
  (f:any)=>{f.subjects[0].tenancy='client:';},
  (f:any)=>{f.products.push({...f.products[0]});},
  (f:any)=>{f.relationships.push(relation(G,'organization:absent','funds'));},
  (f:any)=>{f.relationships[0].source='';},
  (f:any)=>{f.relationships[0].truth='observed';},
  (f:any)=>{f.relationships[0].type='access';},
  (f:any)=>{f.relationships.push({...f.relationships[0]});},
  (f:any)=>{f.extraOwnership=[];},
  (f:any)=>{f.shares[0].extra=100;},
 ];
 for(const mutate of invalid){const data=freshEntities();mutate(data);assert.throws(()=>loadEntities(data));}
 const missing=freshEntities();missing.products.push({id:'not-in-registry',tenancy:'internal',source:'fixture'});
 assert.throws(()=>buildCatalog(registry,[],[],missing),/Unknown registry product/);
 const data=freshEntities(),before=structuredClone(data);loadEntities(data);assert.deepEqual(data,before);
});

test('internal roll-ups refuse clients, other organizations and unknown rows with reasons and no subtotal',()=>{
 const blocked=internalRollup(catalog,[{id:G,value:10},{id:'pinarevleri',value:20},{id:'agoraxai-web',value:30}]);
 assert.equal(blocked.ok,false);
 if(!blocked.ok){assert.ok(blocked.reasons.some(r=>r.includes('pinarevleri')&&r.includes(C)));assert.ok(blocked.reasons.some(r=>r.includes('agoraxai-web')&&r.includes('undeclared')));}
 assert.equal('value' in blocked,false);
 assert.deepEqual(internalRollup(catalog,[{id:G,value:10},{id:A,value:20}]),{ok:true,value:30});
 assert.equal(internalRollup(catalog,[{id:G,value:NaN}]).ok,false);
 assert.equal(internalRollup(catalog,[{id:G,value:1},{id:G,value:1}]).ok,false);
});

const share=(over:Partial<ScopedShare>={}):ScopedShare=>({scopeType:'entity',scopeId:G,holderId:P,interest:'economic',percentage:UNDECLARED,source:'fixture',...over});
test('scoped entity, project and product shares preserve unknown percentages and block attribution',()=>{
 for(const scopeType of ['entity','project','product'] as const){
  const data=freshEntities();data.shares=[share({scopeType,scopeId:scopeType==='entity'?G:'agoraxai-control-plane'})];
  const loaded=loadEntities(data).shares[0];
  assert.equal(percentageLabel(loaded),'undeclared');
  const result=attributeShare(loaded,1000);assert.equal(result.ok,false);
  if(!result.ok)assert.match(result.reason,/percentage is undeclared; attribution blocked/);
  assert.equal('value' in result,false,'unknown never defaults to 0 or 100');
 }
 const blank=freshEntities();delete (blank.shares[0] as any).percentage;
 assert.throws(()=>loadEntities(blank),/percentage must be undeclared/);
});

test('declared percentages are finite, within range and sum at most 100 per scope',()=>{
 const data=freshEntities();data.shares=[share({percentage:60}),share({holderId:A,percentage:40})];
 assert.equal(loadEntities(data).shares.length,2);
 assert.equal(percentageLabel(data.shares[0]),'60%');
 assert.deepEqual(attributeShare(data.shares[0],200),{ok:true,value:120,truth:'derived'});
 data.shares[1].percentage=41;assert.throws(()=>loadEntities(data),/exceed 100.*great-order-llc/);
 data.shares[1].percentage=UNDECLARED;assert.equal(loadEntities(data).shares[1].percentage,UNDECLARED);
 for(const n of [-1,101,NaN,Infinity,'50',null]){data.shares=[share({percentage:n as any})];assert.throws(()=>loadEntities(data),/percentage/);}
 data.shares=[share({percentage:100}),share({scopeType:'product',scopeId:'agoraxai-control-plane',percentage:100})];
 assert.equal(loadEntities(data).shares.length,2,'different scopes do not accumulate');
 assert.deepEqual(attributeShare(share({percentage:0}),10),{ok:true,value:0,truth:'derived'});
});

test('shares cannot invent holders or scopes, duplicate totals, or turn contractual interests into equity',()=>{
 for(const patch of [{holderId:'person:missing'},{scopeId:'missing'},{scopeId:P},{scopeType:'bad'},{interest:'ownership'},{source:''}]){
  const data=freshEntities();data.shares=[share(patch as any)];assert.throws(()=>loadEntities(data));
 }
 const duplicate=freshEntities();duplicate.shares=[share(),share()];assert.throws(()=>loadEntities(duplicate),/duplicate share/);
 const cross=freshEntities();cross.shares=[share({scopeId:C,interest:'equity'})];
 assert.throws(()=>loadEntities(cross),/equity share.*internal.*client:pinar-evleri/);
 for(const interest of ['contractual','economic'] as const){
  cross.shares=[share({scopeId:C,interest})];
  assert.deepEqual(buildCatalog(registry,[],[],loadEntities(cross)).edges,catalog.edges.filter(e=>!e.source.startsWith('sources[')),'a scoped economic interest generates no ownership edge');
 }
});

test('snapshot check mode is read-only on success and mismatch, and pinned tampering still fails (OG-REG-007)',()=>{
 const dir=mkdtempSync(join(tmpdir(),'octopusg-wp15-'));
 const importer=resolve('scripts/import-registry.mjs');
 const run=(mode:string)=>execFileSync(process.execPath,[importer],{cwd:dir,env:{...process.env,OCTOPUSG_SNAPSHOT_MODE:mode},stdio:'pipe'});
 try{
  mkdirSync(join(dir,'data'));
  const lock=JSON.parse(readFileSync('data/registry.lock.json','utf8'));
  for(const name of ['registry.lock.json',lock.filename,'GATE_2D_REPORT.md','GATE_3_APPROVAL_CHECKLIST.md'])copyFileSync(`data/${name}`,join(dir,'data',name));
  run('write');const path=join(dir,'data/snapshot.json');
  const original=readFileSync(path),before=statSync(path).mtimeMs;
  assert.match(String(run('check')),/Snapshot check PASS/);
  assert.deepEqual(readFileSync(path),original);assert.equal(statSync(path).mtimeMs,before);
  const changed=Buffer.concat([original,Buffer.from(' ')]);writeFileSync(path,changed);const modified=statSync(path).mtimeMs;
  assert.throws(()=>run('check'),/differs from validated inputs/);
  assert.deepEqual(readFileSync(path),changed);assert.equal(statSync(path).mtimeMs,modified);
  assert.throws(()=>run('invalid'),/Invalid OCTOPUSG_SNAPSHOT_MODE/);
  writeFileSync(join(dir,'data',lock.filename),'tampered');
  assert.throws(()=>run('check'),/SHA-256.*does not match/);
  assert.deepEqual(readFileSync(path),changed);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('explicit product ownership agrees with the legacy legal-owner query and rejects ambiguous declarations',()=>{
 const data=freshEntities();data.relationships.push(relation(G,'agoraxai-control-plane','owns') as any);
 assert.equal(entityOf(buildCatalog(registry,[],[],data),'agoraxai-control-plane')?.entityId,G);
 assert.equal(entityOf(buildCatalog(registry,[],[],data),'agoraxai-web')?.entity,UNDECLARED);
 data.ownership.push({entityId:G,productId:'agoraxai-control-plane',source:'fixture'});
 assert.throws(()=>loadEntities(data),/duplicate ownership/);
});
