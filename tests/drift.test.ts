// OG-OBS-002 — declared-versus-observed drift. Every state, including every failure path.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {driftRows,worstStatus,driftSummary,driftMeaning,driftStatuses,badgeText,hasObservation} from '../src/drift.ts';
import {normalize,type Raw} from '../src/model.ts';
import type {Observation} from '../src/truth.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const registry=snapshot.registry as Raw;
const projects=(registry.projects as Raw[]).map(p=>normalize(p,registry));
const control=projects.find(p=>p.id==='agoraxai-control-plane')!;
const NOW='2026-09-17T12:00:00Z';
const LATER='2026-09-19T12:00:00Z';
const obs=(over:Partial<Observation>={}):Observation=>({projectId:'agoraxai-control-plane',field:'head_sha',value:'6a4954fb',truth:'observed',
 source:{adapter:'local-git',resource:'~/Projects/agoraxai/control-plane'},observedAt:'2026-09-17T11:00:00Z',collectedAt:'2026-09-17T11:00:00Z',
 expiresAt:'2026-09-18T11:00:00Z',status:'ok',...over});
const row=(rows:ReturnType<typeof driftRows>,field:string)=>rows.find(r=>r.field===field)!;

test('with no observation every comparison is unknown, never a match',()=>{
 const rows=driftRows(control,[],NOW);
 assert.deepEqual(rows.map(r=>r.field),['path','branch','remote']);
 for(const r of rows){
  assert.equal(r.status,'unknown');
  assert.equal(r.observed,'not collected');
  assert.equal(r.freshness,'not-collected');
  assert.equal(r.truth,'unknown');
  assert.equal(r.confidence,'none');
  assert.match(r.note,/No observation has been collected/);
  assert.ok(r.declaredSource,'the declared side always cites its registry field');
 }
 assert.equal(worstStatus(rows),'unknown');
 assert.equal(driftSummary(rows),'unknown: Not enough evidence to compare');
 assert.equal(hasObservation(control,[]),false);
});
test('a matching fresh observation is the only way to reach match',()=>{
 const rows=driftRows(control,[obs(),obs({field:'branch',value:'main'})],NOW);
 assert.equal(row(rows,'path').status,'match');
 assert.equal(row(rows,'path').truth,'observed');
 assert.equal(row(rows,'path').freshness,'fresh');
 assert.equal(row(rows,'path').confidence,'high');
 assert.equal(row(rows,'path').observedAt,'2026-09-17T11:00:00Z');
 assert.match(row(rows,'path').note,/equals the observed value/);
 assert.equal(row(rows,'branch').status,'unknown','the control-plane row declares no branch to compare');
 assert.match(row(rows,'branch').note,/declares nothing to compare/);
 // a row that does declare a branch reports disagreement plainly
 const dayos=projects.find(p=>p.id==='dayos')!;
 const differs=driftRows(dayos,[obs({projectId:'dayos',field:'branch',value:'some-other-branch'})],NOW);
 assert.equal(row(differs,'branch').status,'differs');
 assert.match(row(differs,'branch').note,/Neither is assumed correct/);
 assert.equal(row(differs,'branch').observed,'some-other-branch');
 const agrees=driftRows(dayos,[obs({projectId:'dayos',field:'branch',value:dayos.raw.git_state.branch})],NOW);
 assert.equal(row(agrees,'branch').status,'match');
});
test('a stale observation is stale, never a match, even when the values agree',()=>{
 const rows=driftRows(control,[obs()],LATER);
 assert.equal(row(rows,'path').status,'stale');
 assert.equal(row(rows,'path').freshness,'stale');
 assert.equal(row(rows,'path').confidence,'medium');
 assert.match(row(rows,'path').note,/never reported as agreement/);
 assert.equal(worstStatus(rows),'stale');
 assert.equal(driftSummary(rows),'stale: Last observation has expired; agreement cannot be claimed');
});
test('error, blocked and unknown collector results are surfaced as unknown with their reason',()=>{
 for(const [over,re] of [[{status:'error' as const,value:null,truth:'unknown' as const,reason:'checkout unreadable'},/Error: checkout unreadable/],
  [{status:'blocked' as const,value:null,truth:'blocked' as const,reason:'adapter disabled'},/Blocked: adapter disabled/],
  [{status:'unknown' as const,value:null,truth:'unknown' as const},/Unknown:/]] as const){
  const rows=driftRows(control,[obs(over)],NOW);
  assert.equal(row(rows,'path').status,'unknown');
  assert.equal(row(rows,'path').observed,'not available');
  assert.match(row(rows,'path').note,re);
  assert.notEqual(row(rows,'path').status,'match');
 }
});
test('an observation of a different path, or a registry with nothing declared, stays unknown',()=>{
 const elsewhere=driftRows(control,[obs({source:{adapter:'local-git',resource:'~/elsewhere'}})],NOW);
 assert.equal(row(elsewhere,'path').status,'differs');
 const bare={...control,raw:{...control.raw,current_local_paths:undefined,intended_local_path:undefined,git_state:undefined}};
 const rows=driftRows(bare,[obs()],NOW);
 assert.equal(row(rows,'path').status,'unknown');
 assert.match(row(rows,'path').note,/declares nothing to compare/);
});
test('remote presence compares declared configuration with observed remote names',()=>{
 const none=driftRows(control,[obs({field:'remote_names',value:[]})],NOW);
 assert.equal(row(none,'remote').declared,'no');       // the registry records zero remotes
 assert.equal(row(none,'remote').observed,'no');
 assert.equal(row(none,'remote').status,'match');
 const appeared=driftRows(control,[obs({field:'remote_names',value:['origin']})],NOW);
 assert.equal(row(appeared,'remote').observed,'yes');
 assert.equal(row(appeared,'remote').status,'differs','a remote appearing where none is declared is drift');
 assert.ok(!JSON.stringify(appeared).includes('http'),'remote names only; no URL is ever compared or shown');
});
test('a project summary takes the weakest row and never rounds up',()=>{
 assert.deepEqual(driftStatuses,['match','differs','stale','unknown']);
 const all=(statuses:string[])=>statuses.map(s=>({status:s} as never));
 assert.equal(worstStatus(all(['match','differs'])),'differs');
 assert.equal(worstStatus(all(['match','stale'])),'stale');
 assert.equal(worstStatus(all(['match','unknown'])),'unknown');
 assert.equal(worstStatus(all(['match','match'])),'match');
 assert.equal(worstStatus([]),'unknown');
 for(const s of driftStatuses)assert.ok(driftMeaning[s].length>10,'every status explains itself in words');
});
test('every badge has a text equivalent naming truth, freshness, time and confidence',()=>{
 const rows=driftRows(control,[obs()],NOW);
 const text=badgeText(row(rows,'path'));
 assert.match(text,/observed, fresh, observed 2026-09-17T11:00:00Z, confidence high/);
 assert.match(badgeText(row(driftRows(control,[],NOW),'path')),/unknown, not collected, confidence none/);
});
