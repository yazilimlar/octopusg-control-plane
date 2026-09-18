// OG-SEC-002 — trust zones, tiers and levels as data.
// OG-ACT-002 — action requests, the connection ceiling and the seven-field T3/T4 record.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPolicy,evaluate,tierIds,levels,type Policy,type TierId,type Level} from '../src/policy.ts';

const policy:Policy=loadPolicy(JSON.parse(readFileSync('config/policy.json','utf8')),'config/policy.json');
const approved={approvalRecorded:true,templated:true};
import {decide,loadActionRequests,missingFields,dossierFields,dossierLabels,dossierRequiredFor,decisionLine,type ActionRequest} from '../src/actions.ts';
import * as actionsModule from '../src/actions.ts';
import {loadConnectors} from '../src/connections.ts';
const connections=loadConnectors(JSON.parse(readFileSync('config/connectors.json','utf8')),'config/connectors.json');
const requests=loadActionRequests(JSON.parse(readFileSync('config/action-requests.json','utf8')),'config/action-requests.json');
const request=(id:string):ActionRequest=>requests.find(r=>r.id===id)!;


test('config/policy.json declares the four trust zones, levels 0-4 and tiers T0-T4',()=>{
 assert.deepEqual(policy.trustZones.map(z=>z.id),['personal','personal-later','employer','cloud']);
 assert.deepEqual(policy.levels.map(l=>l.level),[...levels]);
 assert.deepEqual(policy.tiers.map(t=>t.id),tierIds);
 const employer=policy.trustZones.find(z=>z.id==='employer')!;
 assert.equal(employer.localAccess,'none');
 assert.equal(employer.maxTier,'none');
 assert.equal(employer.enrolled,false);
 const personal=policy.trustZones.find(z=>z.id==='personal')!;
 assert.equal(personal.localAccess,'observe');
 assert.equal(personal.maxTier,'T2');   // no production or critical action from v0.2
});
test('level 4 never applies to T3 or T4',()=>{
 for(const id of ['T3','T4'] as TierId[])assert.equal(policy.tiers.find(t=>t.id===id)!.maxLevel,3);
 for(const id of ['T3','T4'])
  assert.throws(()=>loadPolicy({...policy,tiers:policy.tiers.map(t=>t.id===id?{...t,maxLevel:4}:t)},'fixture'),
   new RegExp(`level 4 must never apply to ${id}`));
});
test('every tier and level combination is decided, and only the documented ones are allowed',()=>{
 const expected:Record<TierId,Level[]>={T0:[1,2,3,4],T1:[2,3,4],T2:[3,4],T3:[3],T4:[3]};
 const grid:string[]=[];
 for(const tier of tierIds)for(const level of levels){
  const decision=evaluate(policy,{tier,level,...approved});
  assert.equal(typeof decision.reason,'string');
  assert.equal(decision.allowed,expected[tier].includes(level),`${tier} at level ${level}`);
  grid.push(`${tier}/${level}=${decision.allowed?'allow':'deny'}`);
 }
 assert.equal(grid.length,tierIds.length*levels.length);   // 25 combinations, none skipped
});
test('an unapproved, untemplated or failed-precondition request is refused',()=>{
 assert.equal(evaluate(policy,{tier:'T2',level:3}).allowed,false);                                  // no approval
 assert.match(evaluate(policy,{tier:'T2',level:3}).reason,/requires a recorded approval/);
 assert.equal(evaluate(policy,{tier:'T0',level:4,...approved,templated:false}).allowed,false);       // level 4 needs a template
 assert.equal(evaluate(policy,{tier:'T3',level:3,...approved,preconditionsMet:false}).allowed,false);
 assert.equal(evaluate(policy,{tier:'T0',level:1,...approved}).allowed,true);                        // observation is automatic
});
test('trust zones cap what may run at all',()=>{
 assert.equal(evaluate(policy,{tier:'T0',level:1,zone:'personal',...approved}).allowed,true);
 assert.equal(evaluate(policy,{tier:'T3',level:3,zone:'personal',...approved}).allowed,false);
 for(const zone of ['employer','personal-later','cloud'])
  for(const tier of tierIds){
   const d=evaluate(policy,{tier,level:3,zone,...approved});
   assert.equal(d.allowed,false,`${zone}/${tier}`);
   assert.match(d.reason,/permits no OctopusG action/);
  }
 assert.equal(evaluate(policy,{tier:'T0',level:1,zone:'nowhere',...approved}).allowed,false);
});
test('a malformed policy is rejected rather than silently narrowed',()=>{
 const cases:[unknown,RegExp][]=[
  [null,/not an object/],
  [{...policy,schemaVersion:2},/schemaVersion must be 1/],
  [{...policy,tiers:policy.tiers.slice(1)},/tiers T0-T4 must all be defined/],
  [{...policy,levels:policy.levels.slice(1)},/levels 0-4 must all be defined/],
  [{...policy,trustZones:[...policy.trustZones,policy.trustZones[0]]},/duplicate trust zone/],
  [{...policy,trustZones:policy.trustZones.map(z=>z.id==='employer'?{...z,localAccess:'actions'}:z)},/grants local access but no tier/],
  [{...policy,tiers:policy.tiers.map(t=>t.id==='T2'?{...t,maxLevel:1}:t)},/maxLevel is below minLevel/],
 ];
 for(const [raw,re] of cases)assert.throws(()=>loadPolicy(raw,'fixture'),re);
});

// ---------- OG-ACT-002
test('every committed action request is a simulation, and the loader refuses one that is not',()=>{
 assert.ok(requests.length>=6);
 for(const r of requests)assert.equal(r.simulated,true);
 const raw=JSON.parse(readFileSync('config/action-requests.json','utf8'));
 const real={...raw,requests:raw.requests.map((r:any,i:number)=>i?r:{...r,simulated:false})};
 assert.throws(()=>loadActionRequests(real,'fixture'),/must say so/);
 const unknownField={...raw,requests:raw.requests.map((r:any,i:number)=>i?r:{...r,execute:'now'})};
 assert.throws(()=>loadActionRequests(unknownField,'fixture'),/unknown field execute/);
 const badDossier={...raw,requests:raw.requests.map((r:any,i:number)=>i?r:{...r,dossier:{shortcut:'skip the backup'}})};
 assert.throws(()=>loadActionRequests(badDossier,'fixture'),/unknown dossier field/);
});

test('the decision follows tier, level, zone, approval and preconditions, and always says why',()=>{
 const permitted=decide(policy,request('observe-control-plane'));
 assert.equal(permitted.allowed,true);
 assert.match(permitted.reason,/simulated evaluation/);
 // T1 Prepare needs level 2; at level 1 it is refused with the floor named
 const low=decide(policy,{...request('draft-migration-plan'),level:1});
 assert.equal(low.allowed,false);
 assert.match(low.reason,/needs level 2 or higher/);
 // the employer zone permits no OctopusG action at all, whatever the tier
 const employer=decide(policy,request('observe-from-company-laptop'));
 assert.equal(employer.allowed,false);
 assert.match(employer.reason,/permits no OctopusG action/);
 // T4 may never reach level 4, even templated and approved
 const critical=decide(policy,request('rotate-dns-record'));
 assert.equal(critical.allowed,false);
 assert.match(critical.reason,/level 4 is never available for T4/);
 for(const r of requests)assert.match(decisionLine(r,decide(policy,r,connections)),/would be (permitted|refused) — .+ \(simulated\)/);
 // No declared trust zone permits a production or critical action at all: the personal zone
 // caps at T2 and every other zone permits none. A zone is checked before tier, level or the
 // seven-field record, so naming one refuses a T3 outright.
 const zoned=decide(policy,{...request('run-database-migration'),zone:'personal'});
 assert.equal(zoned.allowed,false);
 assert.match(zoned.reason,/trust zone personal permits at most T2/);
 for(const zone of ['personal-later','employer','cloud'])
  assert.equal(decide(policy,{...request('observe-control-plane'),zone}).allowed,false,`${zone} permits nothing`);
});

test('a request through a connection can never exceed the connector ceiling',()=>{
 // T2 at level 1 through a connector whose ceiling is 1: the tier floor refuses it first,
 // and raising the level to the tier floor then meets the ceiling instead. Neither path allows it.
 const viaConnection=decide(policy,request('restart-preview-build'),connections);
 assert.equal(viaConnection.allowed,false);
 assert.match(viaConnection.ceiling!,/connector vercel ceiling 1 \(Observed\), connection at level 0/);
 const raised=decide(policy,{...request('restart-preview-build'),level:3},connections);
 assert.equal(raised.allowed,false);
 assert.match(raised.reason,/exceeds connector vercel ceiling 1/);
 // even inside the ceiling, a connection sitting at level 0 is not a connection at level 1
 const atCeiling=decide(policy,{...request('observe-control-plane'),connectionId:'mac-status-local',level:1},connections);
 assert.equal(atCeiling.allowed,false);
 assert.match(atCeiling.reason,/connection is at level 0 \(Registered\)/);
 const unknown=decide(policy,{...request('observe-control-plane'),connectionId:'stripe-owner'},connections);
 assert.equal(unknown.allowed,false);
 assert.match(unknown.reason,/is not registered/);
});

test('a T3 or T4 request needs all seven docs/06 §3 fields before it can be approved',()=>{
 assert.deepEqual([...dossierFields],['proposedChange','affectedObjects','backup','dryRun','rollback','ownerApproval','executionEvidence']);
 assert.equal(dossierFields.length,7);
 for(const f of dossierFields)assert.ok(dossierLabels[f].length>5);
 assert.equal(dossierRequiredFor('T3'),true);
 assert.equal(dossierRequiredFor('T4'),true);
 for(const t of ['T0','T1','T2'] as const)assert.equal(dossierRequiredFor(t),false);

 const incomplete=request('promote-deployment');
 assert.deepEqual(missingFields(incomplete),['dryRun','rollback','ownerApproval','executionEvidence']);
 const refused=decide(policy,incomplete);
 assert.equal(refused.allowed,false);
 assert.match(refused.reason,/needs all seven fields in docs\/06 §3/);
 for(const f of ['Dry-run','Rollback','Owner approval','Execution evidence'])assert.match(refused.reason,new RegExp(f));
 assert.equal(refused.policy.allowed,true,'the tier and level were fine; the record was not');

 const complete=request('run-database-migration');
 assert.deepEqual(missingFields(complete),[]);
 const allowed=decide(policy,complete);
 assert.equal(allowed.allowed,true);
 assert.match(allowed.reason,/seven-field record is complete/);
 // a blank field is a missing field
 const blanked={...complete,dossier:{...complete.dossier,rollback:'   '}};
 assert.deepEqual(missingFields(blanked),['rollback']);
 assert.equal(decide(policy,blanked).allowed,false);
 // and a complete record still cannot bypass an unrecorded approval
 const unapproved={...complete,approvalRecorded:false};
 assert.equal(decide(policy,unapproved).allowed,false);
 assert.match(decide(policy,unapproved).reason,/requires a recorded approval/);
 // nor a failed precondition
 assert.equal(decide(policy,{...complete,preconditionsMet:false}).allowed,false);
});

test('no failing path falls through to allowed, and nothing in v0.2 can execute',()=>{
 for(const r of requests){
  const d=decide(policy,r,connections);
  assert.equal(d.simulated,true);
  if(d.allowed)assert.equal(d.policy.allowed,true,`${r.id} cannot be allowed while the policy refuses it`);
  if(d.allowed)assert.deepEqual(d.missing,[],`${r.id} cannot be allowed with a missing field`);
 }
 const source=readFileSync('src/actions.ts','utf8');
 for(const forbidden of [/\bexecFile/,/child_process/,/\bfetch\s*\(/,/\bexec\s*\(/])
  assert.doesNotMatch(source,forbidden,'the action module cannot run anything');
 assert.equal(typeof (actionsModule as Record<string,unknown>).execute,'undefined','no execute function is exported');
});
