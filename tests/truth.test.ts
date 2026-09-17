// OG-DATA-001 (five-kind truth model) and OG-DATA-002 (observation store with freshness).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {truthKinds,truthStates,truthOfLegacy,validateObservation,loadObservationFile,looksSecret,
 readObservation,freshnessOf,evaluateDrift,indexObservations,adapters,observationRequired,
 downgrade,weakest,type Observation} from '../src/truth.ts';
import {normalize,applyObservations,driftFor,truthOfFact,type Raw} from '../src/model.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const lock=JSON.parse(readFileSync('data/registry.lock.json','utf8'));
const schema=JSON.parse(readFileSync('data/schema.json','utf8'));
const registry=snapshot.registry as Raw;
const projects=registry.projects.map((p:Raw)=>normalize(p,registry));
const NOW='2026-09-17T12:00:00Z';
const obs=(over:Partial<Observation>={}):Observation=>({projectId:'dayos',field:'repo',value:'github.com/yazilimlar/dayos',truth:'observed',
 source:{adapter:'local-git',resource:'~/Projects/dayos'},observedAt:'2026-09-17T11:00:00Z',collectedAt:'2026-09-17T11:00:00Z',
 expiresAt:'2026-09-18T11:00:00Z',status:'ok',...over});
const file=(records:unknown[])=>({schemaVersion:1,collector:'tests/truth.test.ts',collectedAt:'2026-09-17T11:00:00Z',observations:records});

// ---------- OG-DATA-001
test('all five truth kinds exist alongside first-class unknown and blocked',()=>{
 assert.deepEqual(truthKinds,['declared','observed','derived','approved','executed']);
 for(const s of ['declared','observed','derived','approved','executed','unknown','blocked'])assert.ok(truthStates.includes(s as any));
 assert.equal(truthStates.length,7);
});
test('v0.1 evidence values keep their meaning under the five-kind model',()=>{
 assert.equal(truthOfLegacy('observed'),'observed');      // registry-verified
 assert.equal(truthOfLegacy('inferred'),'declared');      // intended configuration
 assert.equal(truthOfLegacy('inferred',true),'derived');  // calculated value
 assert.equal(truthOfLegacy('unknown'),'unknown');
 assert.equal(truthOfLegacy('blocked'),'blocked');
});
test('registry facts carry a truth state without being upgraded',()=>{
 const p=projects.find((x:any)=>x.id==='agoraxai-web');
 assert.equal(truthOfFact(p.url),'declared');             // intended URL stays declared
 assert.equal(truthOfFact(p.repo),'unknown');             // absence stays absence
 assert.equal(truthOfFact(p.url,true),'derived');         // same fact, used as a calculation input
 assert.equal(truthOfFact(projects.find((x:any)=>x.id==='artemis-omni').repo),'observed'); // registry-verified
});
test('confidence is ordered, downgradable and takes the weakest input',()=>{
 assert.equal(downgrade('high'),'medium');
 assert.equal(downgrade('none'),'none');
 assert.equal(weakest(['high','low','medium']),'low');
 assert.equal(weakest([]),'none');
});

// ---------- OG-DATA-002 · validation and secret rejection
test('a well-formed observation validates and keeps its provenance',()=>{
 const r=validateObservation(obs(),0);
 assert.equal(r.ok,true);
 if(r.ok)assert.deepEqual(r.value.source,{adapter:'local-git',resource:'~/Projects/dayos'});
});
test('malformed observations are rejected with a value-free reason',()=>{
 const cases:[unknown,RegExp][]=[
  [null,/not an object/],
  [(()=>{const o:any={...obs()};delete o.projectId;return o;})(),/missing projectId/],
  [{...obs(),projectId:''},/projectId must be a non-empty string/],
  [{...obs(),extra:1},/unknown field extra/],
  [{...obs(),truth:'guessed'},/truth is not a truth state/],
  [{...obs(),truth:'approved'},/cannot assert approved or executed/],
  [{...obs(),source:{adapter:'wat',resource:'x'}},/unknown adapter/],
  [{...obs(),source:{adapter:'local-git'}},/source must be \{adapter, resource\}/],
  [{...obs(),status:'fine'},/unknown status/],
  [{...obs(),collectedAt:'yesterday'},/collectedAt must be an ISO timestamp/],
  [{...obs(),expiresAt:'soon'},/expiresAt must be an ISO timestamp or null/],
  [{...obs(),value:null},/status ok requires a value/],
  [{...obs(),truth:'declared'},/status ok requires observed or derived truth/],
 ];
 for(const [raw,re] of cases){const r=validateObservation(raw,3);assert.equal(r.ok,false,String(re));if(!r.ok){assert.match(r.error.reason,re);assert.equal(r.error.index,3);}}
});
test('secret-shaped values are rejected before persistence, at any depth',()=>{
 const token='gh'+'p_'+'A'.repeat(36);                       // built at runtime: never a literal in the repo
 const at=String.fromCharCode(64); // keep the credential shape out of the file itself
 const url='https://user:'+'hunter2'+at+'example.invalid/repo.git';
 assert.equal(looksSecret(token),true);
 assert.equal(looksSecret({a:[{b:url}]}),true);
 assert.equal(looksSecret('github.com/yazilimlar/dayos'),false);
 const r=validateObservation(obs({value:{head:token}}),0);
 assert.equal(r.ok,false);
 if(!r.ok){assert.match(r.error.reason,/secret-shaped value rejected before persistence/);assert.ok(!r.error.reason.includes(token));}
 assert.equal(loadObservationFile(file([obs({value:{head:token}}),obs()])).records.length,1);
});
test('a structurally wrong file throws; one bad record never poisons the rest',()=>{
 for(const [bad,re] of [[null,/not an object/],[{...file([]),schemaVersion:2},/schemaVersion must be 1/],
  [{...file([]),collector:''},/collector must be a non-empty string/],[{...file([]),observations:{}},/observations must be an array/]] as [unknown,RegExp][])
  assert.throws(()=>loadObservationFile(bad,'fixture'),re);
 const loaded=loadObservationFile(file([{nonsense:true},obs(),obs({projectId:'bidroomlive'})]));
 assert.equal(loaded.records.length,2);
 assert.deepEqual(loaded.rejected,[{index:0,reason:'missing projectId'}]);
 assert.deepEqual(loaded.records.map(r=>r.projectId),['bidroomlive','dayos']); // deterministic order
});

// ---------- OG-DATA-002 · freshness, staleness, unknown handling
test('absent, error, blocked, unknown and expired observations each read distinctly',()=>{
 const missing=readObservation(undefined,'projects[dayos].repo',NOW);
 assert.equal(missing.freshness,'not-collected');
 assert.equal(missing.truth,'unknown');
 assert.equal(missing.state,'Not collected');
 assert.equal(missing.value,null);
 const error=readObservation(obs({status:'error',value:null,truth:'unknown',reason:'checkout unreadable'}),'s',NOW);
 assert.equal(error.state,'Error: checkout unreadable');
 assert.equal(error.truth,'unknown');
 assert.equal(readObservation(obs({status:'blocked',value:null,truth:'blocked',reason:'adapter disabled'}),'s',NOW).truth,'blocked');
 assert.equal(readObservation(obs({status:'unknown',value:null,truth:'unknown'}),'s',NOW).confidence,'none');
 const stale=readObservation(obs({expiresAt:'2026-09-17T06:00:00Z'}),'s',NOW);
 assert.equal(stale.freshness,'stale');
 assert.match(stale.state,/^Stale · expired/);
 assert.equal(stale.confidence,'medium');                    // downgraded from high
 const fresh=readObservation(obs(),'s',NOW);
 assert.equal(fresh.freshness,'fresh');
 assert.equal(fresh.confidence,'high');
 assert.equal(fresh.state,'Observed 2026-09-17T11:00:00Z');
 assert.equal(fresh.source,'local-git:~/Projects/dayos');
});
test('freshness depends only on the timestamps and the supplied now',()=>{
 assert.equal(freshnessOf(obs({expiresAt:null}),'2099-01-01T00:00:00Z'),'fresh'); // no expiry declared
 assert.equal(freshnessOf(obs(),'2026-09-19T00:00:00Z'),'stale');
 assert.equal(freshnessOf(obs(),NOW),'fresh');
});
test('the newest observation per project and field wins',()=>{
 const older=obs({value:'old',collectedAt:'2026-09-16T11:00:00Z'});
 const newer=obs({value:'new',collectedAt:'2026-09-17T11:00:00Z'});
 assert.equal(indexObservations([newer,older]).get('dayos|repo')?.value,'new');
 assert.equal(indexObservations([older,newer]).get('dayos|repo')?.value,'new');
});

// ---------- OG-DATA-002 · deterministic derivation and drift
test('drift evaluation is deterministic and never invents agreement',()=>{
 const declared={value:'abc123',source:'projects[dayos].git_state.head'};
 const match=evaluateDrift(declared,obs({field:'head_sha',value:'abc123'}),NOW);
 const again=evaluateDrift(declared,obs({field:'head_sha',value:'abc123'}),NOW);
 assert.deepEqual(match,again);
 assert.equal(match.status,'match');
 assert.equal(match.truth,'derived');
 assert.equal(match.confidence,'medium');
 assert.deepEqual(match.inputs,['projects[dayos].git_state.head','local-git:~/Projects/dayos']);
 assert.equal(evaluateDrift(declared,obs({field:'head_sha',value:'def456'}),NOW).status,'drift');
 assert.equal(evaluateDrift(declared,undefined,NOW).status,'unknown');
 assert.equal(evaluateDrift(declared,undefined,NOW).truth,'unknown');
 assert.equal(evaluateDrift(declared,obs({status:'error',value:null,truth:'unknown',reason:'x'}),NOW).status,'unknown');
 assert.equal(evaluateDrift({value:null,source:'s'},obs({value:'abc123'}),NOW).status,'unknown');
 const stale=evaluateDrift(declared,obs({field:'head_sha',value:'abc123',expiresAt:'2026-09-17T06:00:00Z'}),NOW);
 assert.equal(stale.status,'match');
 assert.equal(stale.confidence,'low');                        // agreement, but on stale evidence
 assert.match(stale.state,/stale/);
});

// ---------- integration with the v0.1 read model
test('with no observations the read model is exactly the v0.1 one',()=>{
 assert.equal(applyObservations(projects,[],NOW),projects);
 const dayos=projects.find((p:any)=>p.id==='dayos');
 assert.deepEqual(driftFor(dayos,registry),driftFor(dayos,registry,[],NOW));
 assert.equal(driftFor(dayos,registry,[],NOW).derived,undefined);
 assert.equal(snapshot.observations.present,false);
 assert.deepEqual(snapshot.observations.records,[]);
 assert.deepEqual(snapshot.observations.rejected,[]);
});
test('an observation replaces only its own field and keeps the declared value visible',()=>{
 const merged=applyObservations(projects,[obs({projectId:'dayos',field:'repo',value:'~/Projects/dayos (observed)'})],NOW);
 const before=projects.find((p:any)=>p.id==='dayos'),after=merged.find((p:any)=>p.id==='dayos')!;
 assert.equal(after.repo.value,'~/Projects/dayos (observed)');
 assert.equal(after.repo.truth,'observed');
 assert.equal(after.repo.freshness,'fresh');
 assert.equal(after.repo.source,'local-git:~/Projects/dayos');
 assert.match(after.repo.note!,/^Declared: /);
 assert.deepEqual(after.path,before.path);                    // untouched field
 assert.deepEqual(merged.find((p:any)=>p.id==='bidroomlive'),projects.find((p:any)=>p.id==='bidroomlive'));
 assert.equal(after.risk,before.risk);                        // v0.1 scoring is unchanged
});
test('an observed HEAD turns the recorded drift row into a derived comparison',()=>{
 const dayos=projects.find((p:any)=>p.id==='dayos');
 const declaredSha=driftFor(dayos,registry).sourceSha.value;
 const d=driftFor(dayos,registry,[obs({field:'head_sha',value:declaredSha})],NOW);
 assert.equal(d.status,'Different SHAs');                     // v0.1 registry comparison preserved
 assert.equal(d.derived?.status,'match');
 assert.equal(d.observedSha?.truth,'observed');
});

// ---------- the store the build writes, and the schema that documents it
test('data/schema.json and the validator agree on the observation contract',()=>{
 assert.deepEqual(schema.$defs.observation.required,[...observationRequired]);
 assert.deepEqual(schema.$defs.truthState.enum,truthStates);
 assert.deepEqual(schema.$defs.observation.properties.source.properties.adapter.enum,[...adapters]);
 assert.deepEqual(schema.$defs.evidenceKind.enum,['observed','inferred','unknown','blocked']); // v0.1 kinds untouched
 assert.ok(schema.required.includes('observations'));
});
test('the build reads work/observations/latest.json when present, deterministically',()=>{
 const dir=mkdtempSync(join(tmpdir(),'octopusg-obs-'));
 try{
  mkdirSync(join(dir,'data'));mkdirSync(join(dir,'work/observations'),{recursive:true});
  for(const f of [lock.filename,'GATE_2D_REPORT.md','GATE_3_APPROVAL_CHECKLIST.md','registry.lock.json'])copyFileSync(join('data',f),join(dir,'data',f));
  const run=()=>{execFileSync(process.execPath,[resolve('scripts/import-registry.mjs')],{cwd:dir,stdio:'pipe'});return readFileSync(join(dir,'data/snapshot.json'),'utf8');};
  const absent=JSON.parse(run());
  assert.equal(absent.observations.present,false);
  assert.deepEqual(absent.observations.records,[]);
  const token='gh'+'p_'+'B'.repeat(36);
  writeFileSync(join(dir,'work/observations/latest.json'),JSON.stringify(file([obs(),obs({value:token}),{junk:true}])));
  const first=run(),second=run();
  assert.equal(first,second);                                 // same input, byte-identical output
  const withFile=JSON.parse(first);
  assert.equal(withFile.observations.present,true);
  assert.equal(withFile.observations.collector,'tests/truth.test.ts');
  assert.equal(withFile.observations.records.length,1);
  assert.equal(withFile.observations.rejected.length,2);
  assert.ok(!first.includes(token));                          // the secret never reaches the snapshot
  writeFileSync(join(dir,'work/observations/latest.json'),'{not json');
  assert.throws(run,/work\/observations\/latest\.json is not valid JSON/);
  writeFileSync(join(dir,'work/observations/latest.json'),JSON.stringify({...file([]),schemaVersion:9}));
  assert.throws(run,/work\/observations\/latest\.json: schemaVersion must be 1/);
  writeFileSync(join(dir,'work/observations/latest.json'),JSON.stringify(file([obs({value:'uses fetch( at runtime'})])));
  assert.throws(run,/literal browser network API identifier/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
