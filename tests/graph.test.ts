// OG-MAP-002 — typed relationship graph including resources.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCatalog,loadEntities,danglingEdges,nodeIds,edgeTypes,ownershipEdgeTypes,type Catalog} from '../src/resources.ts';
import {edgesFor,normalize,type Raw} from '../src/model.ts';
import {truthStates} from '../src/truth.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const registry=snapshot.registry as Raw;
const entityFile=loadEntities(JSON.parse(readFileSync('config/entities.json','utf8')),'config/entities.json');
const build=():Catalog=>buildCatalog(registry,snapshot.sources,[],entityFile);
const catalog=build();
const projects=(registry.projects as Raw[]).map(p=>normalize(p,registry));

test('every edge has a documented type, a truth kind, a source and endpoints that exist',()=>{
 assert.ok(catalog.edges.length>0);
 const ids=nodeIds(catalog,registry);
 for(const e of catalog.edges){
  assert.ok((edgeTypes as readonly string[]).includes(e.type),`${e.type} is not a documented edge type`);
  assert.ok(truthStates.includes(e.truth),`${e.type} edge has an unknown truth kind`);
  assert.ok(e.source&&e.label,`${e.type} edge needs a source and a label`);
  assert.ok(ids.has(e.from),`${e.from} is not a node`);
  assert.ok(ids.has(e.to),`${e.to} is not a node`);
 }
 assert.deepEqual(danglingEdges(catalog,registry),[]);
});
test('nodes are products and derived resources, and there are no duplicate edges',()=>{
 const ids=nodeIds(catalog,registry);
 assert.equal(ids.size,(registry.projects as Raw[]).length+catalog.resources.length);
 const keys=catalog.edges.map(e=>`${e.type}|${e.from}|${e.to}`);
 assert.equal(new Set(keys).size,keys.length,'no duplicate edge');
 assert.ok(catalog.edges.some(e=>catalog.resources.some(r=>r.id===e.to)),'resources take part in the graph');
});
test('ownership comes only from declared platform_parent, and Artemis never owns AgoraXAI Atlas',()=>{
 assert.deepEqual(ownershipEdgeTypes,['platform_parent']);
 for(const e of catalog.edges.filter(e=>ownershipEdgeTypes.includes(e.type))){
  assert.equal(e.truth,'declared');
  assert.match(e.source,/\.platform_parent$/);
  assert.equal(registry.projects.find((p:Raw)=>p.id===e.to)?.platform_parent,e.from);
 }
 const artemisIds=projects.filter(p=>p.taxonomy==='Artemis').map(p=>p.id);
 const atlasIds=projects.filter(p=>p.taxonomy==='AgoraXAI Atlas').map(p=>p.id);
 assert.ok(artemisIds.length&&atlasIds.length);
 for(const e of catalog.edges.filter(e=>ownershipEdgeTypes.includes(e.type)))
  assert.ok(!(artemisIds.includes(e.from)&&atlasIds.includes(e.to)),'Artemis must never own an Atlas row');
 // sharing a repository or a production host is not ownership
 for(const e of catalog.edges.filter(e=>e.type==='source_repository'||e.type==='deployed_on'||e.type==='serves'))
  assert.ok(!ownershipEdgeTypes.includes(e.type));
 assert.equal(catalog.edges.filter(e=>e.type==='platform_parent').length,
  (registry.projects as Raw[]).filter(p=>typeof p.platform_parent==='string').length);
});
test('the v0.1 declared graph is preserved inside the typed graph',()=>{
 const v01=edgesFor(projects);
 assert.equal(v01.length,8);   // unchanged v0.1 contract
 const typed=new Map(catalog.edges.map(e=>[`${e.from}|${e.to}`,e]));
 for(const e of v01){
  const match=typed.get(`${e.from}|${e.to}`);
  assert.ok(match,`${e.from} → ${e.to} is missing from the typed graph`);
  assert.equal(match!.type,e.kind==='ownership'?'platform_parent':e.kind==='historical'?'successor_of':'consumed_by');
 }
});
test('unknown stays unknown: no edge or resource is promoted without evidence',()=>{
 for(const e of catalog.edges)assert.ok(e.truth==='declared'||e.truth==='observed',`${e.type} edge may only be declared or observed`);
 for(const e of catalog.edges.filter(e=>e.truth==='observed'))
  assert.match(e.source,/^production_state\.|^local-git:/,'only recorded measurements may claim observed');
 const noProduction=buildCatalog({...registry,production_state:{}},snapshot.sources,[],entityFile);
 assert.equal(noProduction.edges.filter(e=>e.truth==='observed').length,0);
});
test('generation is deterministic: same input, same graph, same order',()=>{
 const a=build(),b=build();
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 const shuffled={...registry,projects:[...(registry.projects as Raw[])].reverse()};
 const c=buildCatalog(shuffled,snapshot.sources,[],entityFile);
 assert.deepEqual(c.resources.map(r=>r.id),a.resources.map(r=>r.id),'resource order does not depend on row order');
 assert.deepEqual(c.edges.map(e=>`${e.type}|${e.from}|${e.to}`),a.edges.map(e=>`${e.type}|${e.from}|${e.to}`));
 assert.deepEqual([...a.resources].sort((x,y)=>x.id.localeCompare(y.id)).map(r=>r.id),a.resources.map(r=>r.id),'resources are sorted by id');
});
