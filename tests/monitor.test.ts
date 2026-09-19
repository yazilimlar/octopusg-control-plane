// OG-OBS-007 — read-only product monitor (DayOS first). Every state, including every failure path,
// and the guarantee that no row can read as health when the evidence does not say so.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monitorFor,monitorActions,collectionOf,connectionGate,hasMonitor,monitoredProducts,monitorStates,monitorStateMeaning,type MonitorReport,type MonitorRow} from '../src/monitor.ts';
import {hostedSource,buildCatalog,danglingEdges,checkoutId,repositoryId,resourcesOf} from '../src/resources.ts';
import {driftRows,worstStatus} from '../src/drift.ts';
import {driftFor,normalize,type Raw} from '../src/model.ts';
import {loadConnectors} from '../src/connections.ts';
import {looksSecret,type Observation} from '../src/truth.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const registry=snapshot.registry as Raw;
const connectors=loadConnectors(JSON.parse(readFileSync('config/connectors.json','utf8')),'config/connectors.json');
const projects=(registry.projects as Raw[]).map(p=>normalize(p,registry));
const dayos=projects.find(p=>p.id==='dayos')!;
const NOW='2026-09-19T12:00:00Z';
const LATER='2026-09-21T12:00:00Z';                       // past the 24 h expiry below
const PATH='~/Projects/artemis-omni';
const declaredSha=String(driftFor(dayos,registry).sourceSha.value);
const obs=(field:string,value:unknown,over:Partial<Observation>={}):Observation=>({projectId:'dayos',field,value,truth:'observed',
 source:{adapter:'local-git',resource:PATH},observedAt:'2026-09-19T11:00:00Z',collectedAt:'2026-09-19T11:00:00Z',
 expiresAt:'2026-09-20T11:00:00Z',status:'ok',...over});
const full=(over:{sha?:string;branch?:string}={}):Observation[]=>[
 obs('head_sha',over.sha??declaredSha),obs('branch',over.branch??dayos.raw.git_state.branch),
 obs('working_tree',{clean:true,staged:0,unstaged:0,untracked:0}),obs('remote_names',['origin'])];
const report=(observations:Observation[],now=NOW):MonitorReport=>monitorFor(dayos,registry,observations,connectors,now)!;
const rowOf=(r:MonitorReport,id:string):MonitorRow=>r.sections.flatMap(s=>s.rows).find(x=>x.id===id)!;
const allRows=(r:MonitorReport)=>r.sections.flatMap(s=>s.rows);

// ---------- the derived link from a product to the repository that hosts its branch
test('DayOS is the feature branch of the Artemis Omni repository, derived from two registry rows',()=>{
 const h=hostedSource(dayos.raw,registry)!;
 assert.equal(h.hostId,'artemis-omni');
 assert.equal(h.branch,'feature/dayos-next-integration-preview');
 assert.equal(h.path,PATH);
 assert.equal(h.remote,'git@github.com:yazilimlar/artemis-omni.git');
 assert.equal(h.branchSource,'projects[dayos].git_state.branch');
 assert.equal(h.pathSource,'projects[artemis-omni].current_local_paths[0].path');
 assert.equal(h.remoteSource,'projects[artemis-omni].canonical_repo');
});
test('nothing is linked unless exactly one other product checks out the branch',()=>{
 const withHost=(hosts:Raw[])=>({...registry,projects:[...(registry.projects as Raw[]).filter(p=>p.id!=='artemis-omni'),...hosts]});
 const omni=(registry.projects as Raw[]).find(p=>p.id==='artemis-omni')!;
 assert.equal(hostedSource(dayos.raw,withHost([])),null,'no host: not guessed');
 assert.equal(hostedSource(dayos.raw,withHost([omni,{...omni,id:'artemis-omni-copy'}])),null,'two hosts: ambiguous, not guessed');
 assert.equal(hostedSource({...dayos.raw,canonical_repo:'git@github.com:x/y.git'},registry),null,'a product that declares its own repository derives nothing');
 assert.equal(hostedSource({...dayos.raw,current_local_paths:[{path:'~/x'}]},registry),null);
 assert.equal(hostedSource({id:'x'},registry),null,'no branch declared: nothing to match');
 for(const p of registry.projects as Raw[])if(p.id!=='dayos')assert.ok(hostedSource(p,registry)===null||p.git_state?.branch,'only products with a declared branch can link');
});
test('the catalog attaches DayOS to the host repository and checkout as derived, never as ownership',()=>{
 const catalog=buildCatalog(registry,snapshot.sources,[]);
 const repo=repositoryId('git@github.com:yazilimlar/artemis-omni.git')!;
 const resources=resourcesOf(catalog,'dayos');
 assert.deepEqual(resources.map(r=>r.id).sort(),[repo.id,checkoutId(PATH)].sort());
 assert.ok(resources.every(r=>r.truth==='declared'),'declared until an observation covers the checkout');
 const link=catalog.edges.find(e=>e.type==='source_repository'&&e.from==='dayos')!;
 assert.equal(link.to,repo.id);
 assert.equal(link.truth,'derived');
 assert.equal(link.source,'projects[dayos].git_state.branch + projects[artemis-omni].current_local_paths[0].path');
 assert.equal(catalog.edges.some(e=>e.type==='platform_parent'&&(e.from==='dayos'||e.to==='dayos'||e.from===repo.id)),false,'a shared repository never implies ownership');
 assert.equal(danglingEdges(catalog,registry).length,0);
 assert.ok(catalog.edges.filter(e=>e.truth==='derived').every(e=>e.from==='dayos'||e.to.startsWith('checkout:')||e.from.startsWith('repository:')));
});
test('the checkout becomes observed only when an observation of that path is ok',()=>{
 const checkout=(o:Observation[])=>buildCatalog(registry,snapshot.sources,o).resources.find(r=>r.id===checkoutId(PATH))!;
 assert.equal(checkout([]).truth,'declared');
 assert.equal(checkout(full()).truth,'observed');
 assert.equal(checkout([obs('head_sha',null,{status:'error',truth:'unknown',reason:'x'})]).truth,'declared');
 assert.equal(checkout([obs('head_sha',declaredSha,{source:{adapter:'local-git',resource:'~/elsewhere'}})]).truth,'declared');
 // The host row's declared repository → checkout edge stands; the observation never rewrites an edge.
 const edges=buildCatalog(registry,snapshot.sources,full()).edges.filter(e=>e.type==='checked_out_at'&&e.to===checkoutId(PATH));
 assert.deepEqual(edges.map(e=>e.truth),['declared']);
 // With no repository to hang the checkout on, the link is direct and derived, never observed.
 const noRemote={...registry,projects:(registry.projects as Raw[]).map(p=>p.id==='artemis-omni'?{...p,canonical_repo:undefined}:p)};
 const direct=buildCatalog(noRemote,snapshot.sources,full()).edges.filter(e=>e.type==='checked_out_at'&&e.from==='dayos');
 assert.deepEqual(direct.map(e=>[e.truth,e.to]),[['derived',checkoutId(PATH)]]);
});
test('catalog generation stays deterministic with the hosted link',()=>{
 const a=buildCatalog(registry,snapshot.sources,full()),b=buildCatalog({...registry,projects:[...(registry.projects as Raw[])].reverse()},snapshot.sources,full());
 assert.deepEqual(a.resources.map(r=>r.id),b.resources.map(r=>r.id));
 assert.deepEqual(a.edges.map(e=>`${e.type}|${e.from}|${e.to}`),b.edges.map(e=>`${e.type}|${e.from}|${e.to}`));
});

// ---------- drift against the hosted source
test('drift compares DayOS with the hosted checkout, and is unchanged when no link is supplied',()=>{
 const h=hostedSource(dayos.raw,registry);
 const bare=driftRows(dayos,full(),NOW);
 assert.equal(bare.find(r=>r.field==='path')!.status,'unknown','v0.2 behaviour preserved without a link');
 assert.equal(bare.find(r=>r.field==='remote')!.status,'unknown');
 const linked=driftRows(dayos,full(),NOW,h);
 assert.deepEqual(linked.map(r=>[r.field,r.status]),[['path','match'],['branch','match'],['remote','match']]);
 assert.equal(linked.find(r=>r.field==='path')!.declaredSource,'projects[artemis-omni].current_local_paths[0].path');
 assert.equal(linked.find(r=>r.field==='remote')!.declaredSource,'projects[artemis-omni].canonical_repo');
 assert.equal(worstStatus(linked),'match');
 assert.equal(driftRows(dayos,full({branch:'main'}),NOW,h).find(r=>r.field==='branch')!.status,'differs');
 assert.equal(worstStatus(driftRows(dayos,full(),LATER,h)),'stale');
 assert.equal(worstStatus(driftRows(dayos,[],NOW,h)),'unknown');
});

// ---------- the monitor: every state
test('no observation: nothing is called observed, current or healthy',()=>{
 const r=report([]);
 assert.equal(r.collection.state,'not-collected');
 assert.equal(r.collection.observedAt,null);
 assert.equal(r.drift,'unknown');
 assert.match(r.verdict,/No observation collected/);
 for(const id of ['branch','head','working_tree','remote'])assert.ok(['declared','not-collected'].includes(rowOf(r,id).state),`${id} is not observed`);
 assert.equal(rowOf(r,'working_tree').state,'not-collected');
 assert.equal(rowOf(r,'working_tree').value,'not collected');
 assert.equal(rowOf(r,'head').truth,'declared');
 assert.match(rowOf(r,'head').note,/timestamped snapshot, not the current HEAD/);
 assert.equal(allRows(r).some(x=>x.state==='observed'),false);
});
test('a fresh observation that agrees is observed and matches, with its timestamp and provenance',()=>{
 const r=report(full());
 assert.equal(r.collection.state,'fresh');
 assert.equal(r.collection.observedAt,'2026-09-19T11:00:00Z');
 assert.equal(r.collection.expiresAt,'2026-09-20T11:00:00Z');
 assert.equal(r.collection.source,`local-git:${PATH}`);
 const head=rowOf(r,'head');
 assert.equal(head.state,'observed');assert.equal(head.truth,'observed');assert.equal(head.drift,'match');
 assert.equal(head.value,declaredSha.slice(0,12));
 assert.equal(head.source,`local-git:${PATH}`);
 assert.equal(rowOf(r,'branch').drift,'match');
 assert.equal(rowOf(r,'working_tree').value,'clean');
 assert.equal(rowOf(r,'working_tree').state,'observed');
 assert.equal(r.drift,'match');
 assert.match(r.verdict,/source-control evidence only, not application health/);
});
test('a different HEAD is reported as differs, not as an error and not as agreement',()=>{
 const r=report(full({sha:'a'.repeat(40)}));
 const head=rowOf(r,'head');
 assert.equal(head.state,'observed');assert.equal(head.drift,'differs');
 assert.equal(head.declared,declaredSha.slice(0,12));
 assert.equal(head.value,'aaaaaaaaaaaa');
 assert.equal(r.drift,'differs');
});
test('a dirty working tree is described by counts only',()=>{
 const r=report([...full().filter(o=>o.field!=='working_tree'),obs('working_tree',{clean:false,staged:1,unstaged:2,untracked:3})]);
 assert.equal(rowOf(r,'working_tree').value,'not clean · 1 staged · 2 unstaged · 3 untracked');
});
test('an expired observation is stale and can never be agreement',()=>{
 const r=report(full(),LATER);
 assert.equal(r.collection.state,'stale');
 assert.match(r.collection.detail,/Stale/);
 for(const id of ['head','branch','working_tree','remote'])assert.equal(rowOf(r,id).state,'stale',id);
 assert.equal(rowOf(r,'head').drift,'stale');
 assert.equal(r.drift,'stale');
 assert.match(r.verdict,/expired, so agreement cannot be claimed/);
});
test('a collector error is shown as an error with its reason, and nothing reads as current',()=>{
 const failed=[obs('head_sha',null,{status:'error',truth:'unknown',reason:'git head failed (exit 128)'}),
  obs('branch',null,{status:'error',truth:'unknown',reason:'git branch failed (exit 128)'}),
  obs('working_tree',null,{status:'error',truth:'unknown',reason:'git status failed (exit 128)'}),
  obs('remote_names',null,{status:'error',truth:'unknown',reason:'git remote failed (exit 128)'})];
 const r=report(failed);
 assert.equal(r.collection.state,'error');
 assert.match(r.collection.detail,/exit 128/);
 for(const id of ['head','branch','working_tree','remote'])assert.equal(rowOf(r,id).state,'error',id);
 assert.equal(rowOf(r,'head').drift,'unknown');
 assert.match(r.verdict,/could not read the checkout/);
});
test('a checkout the observer cannot resolve is an error or unknown on every row, never a guess',()=>{
 const missing=[obs('repository',null,{status:'unknown',truth:'unknown',reason:'path does not exist'})];
 const r=report(missing);
 assert.equal(r.collection.state,'unknown');
 assert.match(r.collection.detail,/path does not exist/);
 assert.equal(rowOf(r,'working_tree').state,'unknown');
 assert.equal(rowOf(r,'checkout').state,'unknown');
 const escaped=report([obs('repository',null,{status:'error',truth:'unknown',reason:'path resolves elsewhere (symlink escape); list the real path instead'})]);
 assert.equal(escaped.collection.state,'error');
 assert.equal(rowOf(escaped,'working_tree').state,'error');
 assert.equal(rowOf(escaped,'checkout').state,'error');
 assert.equal(escaped.drift,'unknown');
});
test('blocked and unknown observation statuses keep those states',()=>{
 const blocked=report([obs('working_tree',null,{status:'blocked',truth:'blocked',reason:'device not enrolled'}),...full().filter(o=>o.field!=='working_tree')]);
 assert.equal(rowOf(blocked,'working_tree').state,'blocked');
 assert.match(rowOf(blocked,'working_tree').value,/not available/);
 const unknown=report([obs('working_tree',null,{status:'unknown',truth:'unknown',reason:'collector returned no value'}),...full().filter(o=>o.field!=='working_tree')]);
 assert.equal(rowOf(unknown,'working_tree').state,'unknown');
});

// ---------- deployment and backend are declared or blocked, never live
test('deployment rows are registry readings or blocked; nothing claims a live state',()=>{
 const r=report(full());
 const production=rowOf(r,'production_status');
 assert.match(production.value,/dayos-next.*404/i);
 assert.equal(production.state,'declared');assert.equal(production.source,'projects[dayos].production_status');
 assert.match(production.note,/not proof of an outage/);
 const serving=rowOf(r,'serving_deployment');
 assert.equal(serving.state,'declared');assert.match(serving.value,/dd623e07da24/);
 const compare=rowOf(r,'source_vs_serving');
 assert.equal(compare.value,'Different SHAs');assert.equal(compare.state,'derived');assert.equal(compare.truth,'derived');
 assert.match(compare.note,/no ancestry is inferred/);
 const live=rowOf(r,'live_deployment');
 assert.equal(live.state,'blocked');assert.equal(live.truth,'blocked');assert.equal(live.value,'not collected');
 assert.match(live.note,/level 0/);
});
test('the Supabase backend is a declared inventory plus a blocked live state',()=>{
 const r=report(full());
 const inv=rowOf(r,'migrations');
 assert.match(inv.value,/^5 migration files · 8 tables · 15 RLS policies · schema dayos$/);
 assert.equal(inv.state,'declared');assert.equal(inv.source,'projects[dayos].supabase');
 const live=rowOf(r,'live_backend');
 assert.equal(live.state,'blocked');assert.equal(live.value,'not collected');
 assert.match(live.note,/OG-CONN-015/);assert.match(live.note,/OG-SEC-003/);
 assert.match(live.note,/No supabase connection covers dayos/);
});
test('connectionGate reads the connection records: level 0 is blocked, level 1 with no collector is not collected',()=>{
 assert.equal(connectionGate(connectors,'vercel',['artemis-omni']).state,'blocked');
 assert.match(connectionGate(connectors,'vercel',['artemis-omni']).reason,/vercel-owner is at level 0 \(Registered\)/);
 assert.equal(connectionGate(connectors,'supabase',['dayos']).state,'blocked');
 const raised=JSON.parse(JSON.stringify(connectors));raised.connections.find((c:any)=>c.id==='vercel-owner').level=1;
 assert.equal(connectionGate(raised,'vercel',['artemis-omni']).state,'not-collected');
});
test('collection state is derived from the observation alone, with no clock of its own',()=>{
 assert.equal(collectionOf('dayos',[],NOW).state,'not-collected');
 assert.equal(collectionOf('dayos',full(),NOW).state,'fresh');
 assert.equal(collectionOf('dayos',full(),LATER).state,'stale');
 assert.equal(JSON.stringify(report(full())),JSON.stringify(report(full())),'same input, same report');
});

// ---------- provenance, wording and safety
test('every row names its provenance and one of the eight states, and no row claims health',()=>{
 for(const observations of [[],full(),full({sha:'b'.repeat(40)})])
  for(const now of [NOW,LATER]){
   const r=report(observations,now);
   const rows=allRows(r);
   assert.ok(rows.length>=12);
   for(const x of rows){
    assert.ok(x.label&&x.value&&x.note,`${x.id} is fully described`);
    assert.ok(x.source&&x.source.length>3,`${x.id} cites its source`);
    assert.ok((monitorStates as string[]).includes(x.state),`${x.id} state`);
    assert.ok(monitorStateMeaning[x.state].length>10);
    assert.doesNotMatch(`${x.value} ${x.state}`,/\b(healthy|ok|up|live|running|passing)\b/i,`${x.id} must not read as health`);
   }
   assert.doesNotMatch(r.verdict,/\bis healthy\b|\ball systems\b|\bno problems\b/i);
  }
});
test('there are eight distinct states and each has a meaning the reader can quote',()=>{
 assert.deepEqual([...monitorStates].sort(),['blocked','declared','derived','error','not-collected','observed','stale','unknown']);
 assert.equal(new Set(Object.values(monitorStateMeaning)).size,8);
});
test('open actions follow the existing policy: a derived repository link, a copy-only folder, no website',()=>{
 const r=report(full());
 const permitted=monitorActions(r,{allowlisted:true,reason:''});
 assert.deepEqual(permitted.map(a=>a.kind),['provider','folder']);
 const link=permitted[0];
 assert.equal(link.href,'https://github.com/yazilimlar/artemis-omni');
 assert.equal(link.truth,'derived');assert.equal(link.source,'projects[artemis-omni].canonical_repo');
 const folder=permitted[1];
 assert.equal(folder.href,null,'a folder is never a link');
 assert.equal(folder.text,PATH);assert.equal(folder.enabled,true);
 assert.match(folder.note,/npm run open -- dayos/);
 assert.equal(permitted.some(a=>a.kind==='website'),false,'the registry declares no DayOS URL, so none is offered');
 const refused=monitorActions(r,{allowlisted:false,reason:'personal-mac is not enrolled.'});
 assert.equal(refused[1].enabled,false);assert.match(refused[1].note,/not enrolled/);
 assert.equal(refused[1].href,null);
});
test('a product with no monitor, or no established source, gets none and invents nothing',()=>{
 assert.deepEqual([...monitoredProducts],['dayos']);
 assert.equal(hasMonitor('dayos'),true);assert.equal(hasMonitor('bidroomlive'),false);
 const other=projects.find(p=>p.id==='bidroomlive')!;
 assert.equal(monitorFor(other,registry,[],connectors,NOW),null);
 const orphan=monitorFor(dayos,{...registry,projects:(registry.projects as Raw[]).filter(p=>p.id!=='artemis-omni')},[],connectors,NOW)!;
 assert.equal(orphan.hosted,null);
 assert.equal(rowOf(orphan,'repository').state,'unknown');assert.equal(rowOf(orphan,'checkout').state,'unknown');
 assert.deepEqual(monitorActions(orphan,{allowlisted:true,reason:''}),[]);
});
test('the report holds no secret-shaped value and no machine-specific path',()=>{
 const text=JSON.stringify([report([]),report(full()),report(full(),LATER)]);
 assert.equal(looksSecret(JSON.parse(text)),false);
 assert.ok(!/\/Users\/|\/home\/|C:\\\\Users/.test(text));
 assert.ok(!/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|SUPABASE_|service_role|postgres:\/\//i.test(text));
});
test('the monitor module is pure: no network, no filesystem, no process, no clock',()=>{
 const source=readFileSync('src/monitor.ts','utf8').replace(/\/\/.*$/gm,'');
 for(const banned of ['fetch(','XMLHttpRequest','WebSocket','node:fs','node:child_process','process.','Date.now','new Date(','writeFile','localStorage','import(']){
  assert.ok(!source.includes(banned),`monitor.ts must not contain ${banned}`);
 }
});
