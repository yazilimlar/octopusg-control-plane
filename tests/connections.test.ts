// OG-CONN-002 — connector contract, definitions and the level ceiling.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadConnectors,canRaiseLevel,connectorAuthorizationPrecondition,connectorById,connectionsOf,connectorSummary,carriesSecret,
 lifecycleStates,levelNames,ownerActions,ownerActionReason,authKinds,type ConnectorFile,type Level} from '../src/connections.ts';
import {connectors as adapters} from '../src/connectors.ts';
import {resourceKinds} from '../src/resources.ts';

const raw=JSON.parse(readFileSync('config/connectors.json','utf8'));
const file=loadConnectors(raw,'config/connectors.json');
const clone=():any=>JSON.parse(JSON.stringify(raw));

test('every definition declares the fields docs/04 requires, with documented kinds',()=>{
 assert.ok(file.connectors.length>0);
 for(const d of file.connectors){
  assert.match(d.id,/^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok((authKinds as readonly string[]).includes(d.auth),`${d.id} auth`);
  for(const r of d.resources)assert.ok((resourceKinds as readonly string[]).includes(r),`${d.id} resource ${r}`);
  assert.ok(Array.isArray(d.observations)&&Array.isArray(d.events)&&Array.isArray(d.actions));
  assert.ok(d.docs.length>0,`${d.id} names its documentation`);
  assert.ok(d.maxLevel>=0&&d.maxLevel<=4);
  // scopes are declared per level, below the ceiling, and each says why
  for(const g of d.scopes){
   assert.ok(g.level>=1&&g.level<=d.maxLevel,`${d.id} scope level within ceiling`);
   assert.ok(g.scopes.length&&g.why.length,`${d.id} level ${g.level} states scopes and why`);
  }
 }
});

test('a connection can never exceed its connector maxLevel',()=>{
 for(const d of file.connectors){
  for(const c of connectionsOf(file,d.id))assert.ok(c.level<=d.maxLevel,`${c.id} within ceiling`);
  // the validator refuses a file that tries it
  const above=(d.maxLevel+1) as Level;
  if(above<=4){
   const bad=clone();
   const target=bad.connections.find((c:any)=>c.connectorId===d.id);
   if(target){target.level=above;target.state='CONNECTED';
    assert.throws(()=>loadConnectors(bad),/exceeds connector .* ceiling/,`${d.id} ceiling enforced on load`);}
  }
  // and the pure decision refuses it even with an owner authorization present
  assert.equal(canRaiseLevel(d,0,above,true).allowed,false);
  assert.match(canRaiseLevel(d,0,above,true).reason,/may never exceed level/);
  assert.equal(canRaiseLevel(d,0,4,true).allowed,false,'level 4 is never reachable in v0.2');
 }
});

test('raising a level needs a declared scope set and a recorded owner authorization',()=>{
 const github=connectorById(file,'github')!;
 assert.equal(github.maxLevel,1);
 const withoutOwner=canRaiseLevel(github,0,1,false);
 assert.equal(withoutOwner.allowed,false);
 assert.match(withoutOwner.reason,/owner authorization/);
 const withOwner=canRaiseLevel(github,0,1,true);
 assert.equal(withOwner.allowed,true,'level 1 is inside the ceiling once the owner authorizes it');
 assert.equal(canRaiseLevel(github,1,1,true).allowed,false,'raising means moving up');
 // a connector that declares no scopes for a level cannot reach it even below its ceiling
 const noScopes={...github,maxLevel:3 as Level,scopes:[]};
 assert.equal(canRaiseLevel(noScopes,0,2,true).allowed,false);
 assert.match(canRaiseLevel(noScopes,0,2,true).reason,/declares no scopes/);
});

test('connector authorization fails closed on unresolved secret exposure',()=>{
 assert.equal(connectorAuthorizationPrecondition(true).allowed,false);
 assert.match(connectorAuthorizationPrecondition(true).reason,/unresolved plaintext-secret exposure/);
 assert.equal(connectorAuthorizationPrecondition(true,true).allowed,true,'only an explicit owner exception can override the precondition');
 assert.equal(connectorAuthorizationPrecondition(false).allowed,true);
});

test('every connection in this build is Registered at level 0, with no credential and no sync',()=>{
 assert.ok(file.connections.length>0);
 for(const c of file.connections){
  assert.equal(c.level,0,`${c.id} is level 0`);
  assert.equal(c.state,'REGISTERED');
  assert.deepEqual(c.grantedScopes,[]);
  assert.equal(c.lastSuccessfulSync,null);
  assert.deepEqual(c.approvedActions,[]);
  assert.match(c.credentialStatus,/no credential/);
 }
 assert.deepEqual(levelNames[0],'Registered');
 // the lifecycle is the documented one, in order
 assert.deepEqual([...lifecycleStates],['REGISTERED','AUTHORIZING','CONNECTED','DEGRADED','PAUSED','REVOKING','DISCONNECTED']);
});

test('the validator refuses states, scopes and actions that would imply an authorization',()=>{
 const cases:[string,(f:any)=>void,RegExp][]=[
  ['a connected level 0',f=>{f.connections[0].state='CONNECTED';},/level 0 is Registered/],
  ['a granted scope at level 0',f=>{f.connections[0].grantedScopes=['repo:read'];},/level 0 connection has no granted scope/],
  ['a sync that never happened',f=>{f.connections[0].lastSuccessfulSync='2026-09-17T00:00:00.000Z';},/never synced/],
  ['an undeclared scope',f=>{f.connections[0].level=1;f.connections[0].state='CONNECTED';f.connections[0].grantedScopes=['admin:write'];},/not declared by connector/],
  ['an approved action without level 3',f=>{f.connections[0].approvedActions=['deploy'];},/needs level 3/],
  ['an action on a read-only connector',f=>{f.connectors[0].actions=['deploy'];},/actions require maxLevel 3/],
  ['a scope above the ceiling',f=>{f.connectors[0].scopes.push({level:3,scopes:['x'],why:'y'});},/exceeds the connector ceiling/],
  ['a scope for Registered',f=>{f.connectors[0].scopes.push({level:0,scopes:['x'],why:'y'});},/level 0 is Registered and needs no scope/],
  ['an unknown lifecycle state',f=>{f.connections[0].state='ENABLED';},/unknown lifecycle state/],
  ['an undefined connector',f=>{f.connections[0].connectorId='stripe';},/is not defined/],
  ['an unknown resource kind',f=>{f.connectors[0].resources=['database'];},/documented resource kinds/],
  ['a duplicate connector',f=>{f.connectors.push({...f.connectors[0]});},/duplicate connector/],
 ];
 for(const [name,mutate,message] of cases){
  const bad=clone();mutate(bad);
  assert.throws(()=>loadConnectors(bad),message,name);
 }
});

test('a connector record never carries a credential, token, key or address',()=>{
 assert.equal(carriesSecret(raw),false,'the committed file is clean');
 const probe=['ghp_'+'a'.repeat(30),'sk_live_'+'b'.repeat(20),'https'+'://user:pass@example.com','owner'+'@example.com','-----BEGIN '+'PRIVATE KEY-----'];
 for(const value of probe)
  assert.equal(carriesSecret({note:value}),true,`${value.slice(0,12)} is refused`);
 const bad=clone();bad.connections[0].note='token ghp_'+'a'.repeat(30);
 assert.throws(()=>loadConnectors(bad),/looks like a credential/);
});

test('a connection may carry only a validated non-secret credential reference',()=>{
 const good=clone();
 good.connections[0].credentialRef={provider:'macos-keychain',itemLabel:'owner-readonly-test'};
 assert.doesNotThrow(()=>loadConnectors(good));
 const bad=clone();
 bad.connections[0].credentialRef={provider:'macos-keychain',itemLabel:'password'+'='+'abcdefghijklmnop'};
 assert.throws(()=>loadConnectors(bad),/secret material/);
});

test('the five v0.1 stubs are expressed as definitions and still return blocked',async()=>{
 const adapterIds=adapters.map(a=>a.id).sort();
 assert.equal(adapterIds.length,5);
 assert.deepEqual(file.connectors.map(d=>d.id).sort(),adapterIds,'one definition per v0.1 adapter');
 for(const d of file.connectors)assert.equal(d.adapter,d.id,`${d.id} names the adapter it describes`);
 const original=globalThis.fetch;
 globalThis.fetch=()=>{throw Error('Network must never be called');};
 try{
  for(const a of adapters){
   assert.equal(a.enabled,false);
   const output=await a.collect({projectIds:['agoraxai-control-plane']});
   assert.equal(output[0].status,'blocked');
   assert.equal(output[0].value,null);
  }
 }finally{globalThis.fetch=original;}
});

test('every owner action is listed with the reason it is unavailable',()=>{
 assert.deepEqual([...ownerActions],['test','reconnect','pause','revoke']);
 for(const a of ownerActions){
  assert.ok(ownerActionReason[a].length>20,`${a} explains itself`);
  assert.doesNotMatch(ownerActionReason[a],/click|enable it|coming soon/i);
 }
});

test('the card summary states level and ceiling in words, and nothing is fetched to build it',()=>{
 for(const d of file.connectors){
  const summary=connectorSummary(d,connectionsOf(file,d.id));
  assert.match(summary,/level 0 \(Registered\)|no connection registered/);
  assert.match(summary,/Ceiling level \d \(/);
 }
 // the module imports no client: proven by the file's own text, which the audit also scans
 const source=readFileSync('src/connections.ts','utf8');
 for(const forbidden of [/\bfetch\s*\(/,/XMLHttpRequest/,/new WebSocket/,/require\(['"]https?['"]\)/,/from ['"]node:https?['"]/])
  assert.doesNotMatch(source,forbidden,'the connector module contains no network client');
});
