// OG-SEC-002 — trust zones, tiers and levels as data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPolicy,evaluate,tierIds,levels,type Policy,type TierId,type Level} from '../src/policy.ts';

const policy:Policy=loadPolicy(JSON.parse(readFileSync('config/policy.json','utf8')),'config/policy.json');
const approved={approvalRecorded:true,templated:true};

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
