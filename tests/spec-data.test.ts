// OG-UI-004 / OG-UI-005 — the data the devices and requirements views are built from.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseDocument} from 'yaml';
import {loadDevices,canObserve} from '../src/devices.ts';
import {loadPolicy,evaluate,tierIds,levels} from '../src/policy.ts';

const data=JSON.parse(readFileSync('data/requirements.json','utf8'));
const ledger=parseDocument(readFileSync('docs/requirements/REQUIREMENTS.yaml','utf8')).toJS();
const policy=loadPolicy(JSON.parse(readFileSync('config/policy.json','utf8')),'config/policy.json');
const devices=loadDevices(JSON.parse(readFileSync('config/devices.json','utf8')),policy,'config/devices.json');
const raw=readFileSync('data/requirements.json','utf8');

test('the generated ledger projection matches REQUIREMENTS.yaml exactly',()=>{
 assert.equal(data.schemaVersion,1);
 assert.equal(data.requirements.length,ledger.requirements.length);
 assert.equal(data.capabilities.length,ledger.capabilities.length);
 const byId=new Map(ledger.requirements.map((r:any)=>[r.id,r]));
 for(const r of data.requirements){
  const source=byId.get(r.id) as any;
  assert.ok(source,`${r.id} is not in the ledger`);
  for(const field of ['title','plane','milestone','priority','status','risk'])assert.equal(r[field],source[field],`${r.id}.${field}`);
  assert.deepEqual(r.dependencies,source.dependencies??[]);
  assert.deepEqual(r.acceptance,source.acceptance);
  assert.deepEqual(r.tests,source.tests);
  assert.equal(r.workPackage,source.work_package??null);
 }
});
test('every view field the owner asked for is present and non-empty',()=>{
 for(const r of data.requirements){
  for(const field of ['id','title','plane','status','milestone'])assert.ok(r[field],`${r.id} is missing ${field}`);
  assert.ok(Array.isArray(r.dependencies)&&Array.isArray(r.acceptance)&&r.acceptance.length,`${r.id} needs acceptance criteria`);
  for(const d of r.dependencies)assert.ok(data.requirements.some((x:any)=>x.id===d),`${r.id} depends on unknown ${d}`);
 }
});
test('traceability runs capability → requirement → evidence, and unknown says unknown',()=>{
 const ids=new Set(data.requirements.map((r:any)=>r.id));
 for(const c of data.capabilities){
  assert.ok(c.requirements.length,`${c.id} has no requirement`);
  for(const id of c.requirements)assert.ok(ids.has(id),`${c.id} cites unknown ${id}`);
 }
 const verified=data.requirements.filter((r:any)=>r.status==='VERIFIED'&&r.milestone!=='v0.1');
 for(const r of verified)assert.ok(r.evidence.length,`${r.id} is VERIFIED and must cite an evidence file`);
 const observer=data.requirements.find((r:any)=>r.id==='OG-OBS-001');
 assert.ok(observer.evidence.includes('WP-03.md'));
 const future=data.requirements.find((r:any)=>r.id==='OG-CONN-010');
 assert.deepEqual(future.evidence,[],'a requirement with no evidence yet reports none, not a guess');
});
test('the projection carries no machine path, host name or secret shape',()=>{
 for(const pattern of [/\/Users\//,/\/home\/[a-z]/,/C:\\Users/i,/gh[pousr]_[A-Za-z0-9]{30,}/,/-----BEGIN/,/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i])
  assert.ok(!pattern.test(raw),`data/requirements.json must not contain ${pattern}`);
 // the only address-shaped strings allowed are the documented loopback ones
 for(const [address] of raw.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g))
  assert.ok(address==='127.0.0.1'||address==='0.0.0.0',`unexpected address ${address}`);
 assert.ok(raw.includes('~/Projects')===false||!/\/Users|\/home\//.test(raw),'only tilde-relative paths may appear');
});
test('the devices view data stays declared, safe and employer-free',()=>{
 assert.equal(devices.devices.length,3);
 const company=devices.devices.find(d=>d.ownership==='employer')!;
 assert.deepEqual(company.capabilities,[]);
 assert.equal(company.enrolled,false);
 assert.equal(canObserve(devices,policy,company.id).ok,false);
 assert.equal(canObserve(devices,policy,'personal-mac').ok,true);
 assert.equal(canObserve(devices,policy,'personal-windows').ok,false);
 // the records themselves, not the file's explanatory comment
 const serialized=JSON.stringify(devices.devices);
 for(const pattern of [/\/Users\//,/hostname/i,/serial/i,/\b(?:\d{1,3}\.){3}\d{1,3}\b/,/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i])
  assert.ok(!pattern.test(serialized),`device records must not contain ${pattern}`);
 for(const d of devices.devices)assert.ok(!('hostname' in d)&&!('serial' in d)&&!('ip' in d));
});
test('the tier grid the view renders is the policy, including the level-4 ceiling',()=>{
 for(const tier of tierIds)for(const level of levels){
  const decision=evaluate(policy,{tier,level,approvalRecorded:true,templated:true,preconditionsMet:true});
  assert.equal(typeof decision.allowed,'boolean');
  if((tier==='T3'||tier==='T4')&&level===4)assert.equal(decision.allowed,false,'level 4 never applies to T3/T4');
 }
});
