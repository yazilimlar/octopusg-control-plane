// OG-MAP-002 — typed relationship graph including resources.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCatalog,loadEntities,danglingEdges,nodeIds,edgeTypes,ownershipEdgeTypes,type Catalog} from '../src/resources.ts';
import {edgesFor,normalize,type Raw} from '../src/model.ts';
import {truthStates} from '../src/truth.ts';
import {selectGraph,layout,colourClass,colourValue,colourDimensions,edgeDash,edgeStyleLabel,edgeLegend} from '../src/graphview.ts';

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

// ---------- OG-MAP-003 / OG-MAP-004: generated layout, encodings and presets
test('lane positions are computed, never stored, and are stable',()=>{
 const portfolio=selectGraph(projects,catalog,'portfolio');
 const first=layout(portfolio.nodes),second=layout(portfolio.nodes);
 assert.deepEqual(first,second,'layout is deterministic');
 assert.equal(first.nodes.length,portfolio.nodes.length);
 for(const n of first.nodes){
  assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));
  assert.ok(n.x>0&&n.x<=first.width&&n.y>0&&n.y<=first.height);
 }
 // no coordinate exists in the data the layout was computed from
 assert.ok(!JSON.stringify(portfolio.nodes).match(/"x"|"y"/));
 assert.ok(!JSON.stringify(catalog).match(/"x"|"y"/));
 const byLane=new Map(first.lanes.map(l=>[l.lane,l.y]));
 assert.ok(byLane.get('AgoraXAI')! < byLane.get('Products')!,'lanes are ordered top to bottom');
 for(const n of first.nodes)assert.equal(n.y>=byLane.get(n.lane)!,true,'a node sits in its own lane');
 assert.equal(new Set(first.nodes.map(n=>`${n.x}|${n.y}`)).size,first.nodes.length,'no two nodes share a position');
});
test('exactly one colour dimension applies at a time, and the value is also text',()=>{
 const {nodes}=selectGraph(projects,catalog,'portfolio');
 const node=nodes.find(n=>n.id==='dayos')!;
 assert.deepEqual([...colourDimensions],['lifecycle','risk','truth']);
 assert.equal(colourValue(node,'lifecycle'),node.lifecycle);
 assert.equal(colourValue(node,'risk'),node.riskBand);
 assert.equal(colourValue(node,'truth'),node.truth);
 for(const dimension of colourDimensions){
  const classes=nodes.map(n=>colourClass(n,dimension));
  for(const c of classes)assert.match(c,new RegExp(`^c-${dimension}-[a-z0-9-]+$`));
  const others=colourDimensions.filter(d=>d!==dimension);
  for(const c of classes)for(const other of others)assert.ok(!c.startsWith(`c-${other}-`),'one dimension at a time');
 }
});
test('declared, observed and derived edges differ without relying on colour',()=>{
 assert.notEqual(edgeDash.declared,edgeDash.observed);
 assert.notEqual(edgeDash.declared,edgeDash.derived);
 assert.notEqual(edgeDash.observed,edgeDash.derived);
 assert.deepEqual([edgeStyleLabel.declared,edgeStyleLabel.observed,edgeStyleLabel.derived],['dashed','solid','dotted']);
 assert.deepEqual(edgeLegend(['declared','observed','declared']),['declared: dashed','observed: solid']);
});
test('presets filter the same graph: portfolio is products, repository adds repositories and checkouts',()=>{
 const portfolio=selectGraph(projects,catalog,'portfolio');
 const repository=selectGraph(projects,catalog,'repository');
 assert.equal(portfolio.nodes.length,projects.length);
 assert.ok(portfolio.nodes.every(n=>n.kind==='product'));
 assert.ok(portfolio.edges.every(e=>['platform_parent','consumed_by','depends_on','successor_of'].includes(e.type)));
 assert.ok(repository.nodes.length>portfolio.nodes.length);
 assert.deepEqual([...new Set(repository.nodes.map(n=>n.kind))].sort(),['checkout','product','repository']);
 assert.ok(repository.edges.some(e=>e.type==='source_repository')&&repository.edges.some(e=>e.type==='checked_out_at'));
 assert.ok(repository.edges.length>portfolio.edges.length);
 for(const e of [...portfolio.edges,...repository.edges])assert.ok(catalog.edges.includes(e),'presets filter, never invent');
 // the relationship filter keeps the v0.1 vocabulary
 assert.equal(selectGraph(projects,catalog,'portfolio','ownership').edges.length,
  catalog.edges.filter(e=>e.type==='platform_parent').length);
 assert.equal(selectGraph(projects,catalog,'portfolio','historical').edges.every(e=>e.type==='successor_of'),true);
 assert.equal(selectGraph(projects,catalog,'portfolio','resource').edges.length,0,'resource edges are absent from the portfolio preset');
});
