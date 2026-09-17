// OG-DEV-001 — declared device registry and trust zones.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadDevices,canObserve,deviceById,carriesIdentifier,forbiddenDeviceKeys,type DeviceRegistry} from '../src/devices.ts';
import {loadPolicy} from '../src/policy.ts';

const policy=loadPolicy(JSON.parse(readFileSync('config/policy.json','utf8')),'config/policy.json');
const devices:DeviceRegistry=loadDevices(JSON.parse(readFileSync('config/devices.json','utf8')),policy,'config/devices.json');
const clone=():DeviceRegistry=>JSON.parse(JSON.stringify(devices));

test('the three declared devices are the Mac, the personal Windows laptop and the company laptop',()=>{
 assert.deepEqual(devices.devices.map(d=>d.id),['personal-mac','personal-windows','company-laptop']);
 const mac=deviceById(devices,'personal-mac')!;
 assert.equal(mac.enrolled,true);
 assert.deepEqual(mac.capabilities,['read_git_status']);
 assert.ok(mac.prohibited.includes('read_secrets')&&mac.prohibited.includes('arbitrary_shell'));
 const windows=deviceById(devices,'personal-windows')!;
 assert.equal(windows.enrolled,false);
 assert.deepEqual(windows.capabilities,[]);
 const company=deviceById(devices,'company-laptop')!;
 assert.equal(company.ownership,'employer');
 assert.equal(company.accessModel,'BROWSER_ONLY / UNMANAGED / NO_LOCAL_ACCESS');
 assert.deepEqual(company.capabilities,[]);
});
test('a capability on an employer-owned device is rejected',()=>{
 const r=clone();
 r.devices[2].capabilities=['read_git_status'];
 assert.throws(()=>loadDevices(r,policy,'fixture'),/employer-owned device may hold no capability/);
 const e=clone();
 e.devices[2].enrolled=true;
 assert.throws(()=>loadDevices(e,policy,'fixture'),/employer-owned device may not be enrolled/);
 const n=clone();
 n.devices[1].capabilities=['read_git_status'];
 assert.throws(()=>loadDevices(n,policy,'fixture'),/not enrolled may hold no capability/);
});
test('no device record may carry a machine identifier',()=>{
 for(const key of ['serial','macAddress','hostname','username','ip']){
  assert.ok(forbiddenDeviceKeys.includes(key));
  const r=clone();(r.devices[0] as unknown as Record<string,unknown>)[key]='anything';
  assert.throws(()=>loadDevices(r,policy,'fixture'),/would identify the machine/);
 }
 const mac=clone();mac.devices[0].notes='seen at '+['00','1a','2b','3c','4d','5e'].join(':');
 assert.throws(()=>loadDevices(mac,policy,'fixture'),/looks like a machine identifier/);
 const ip=clone();ip.devices[0].notes='reachable on 192.168.1.42';
 assert.throws(()=>loadDevices(ip,policy,'fixture'),/looks like a machine identifier/);
 const home=clone();home.devices[0].notes='checkouts live under /Users/someone/Projects';
 assert.throws(()=>loadDevices(home,policy,'fixture'),/looks like a machine identifier/);
 assert.equal(carriesIdentifier({a:['harmless','alias only']}),false);
 assert.equal(carriesIdentifier(JSON.parse(readFileSync('config/devices.json','utf8'))),false);
});
test('a device must sit in a trust zone the policy defines, and may not claim more than the zone',()=>{
 const unknownZone=clone();unknownZone.devices[0].trustZone='somewhere';
 assert.throws(()=>loadDevices(unknownZone,policy,'fixture'),/is not defined in config\/policy\.json/);
 const notEnrolledZone=clone();
 notEnrolledZone.devices[1].enrolled=true;
 assert.throws(()=>loadDevices(notEnrolledZone,policy,'fixture'),/is not an enrolled zone/);
 assert.throws(()=>loadDevices({schemaVersion:1,devices:[]},policy,'fixture'),/devices must be a non-empty array/);
 const dup=clone();dup.devices.push(dup.devices[0]);
 assert.throws(()=>loadDevices(dup,policy,'fixture'),/duplicate id/);
});
test('only the enrolled personal device may run the observer',()=>{
 assert.equal(canObserve(devices,policy,'personal-mac').ok,true);
 const company=canObserve(devices,policy,'company-laptop');
 assert.equal(company.ok,false);
 assert.match(company.reason,/employer-owned; OctopusG never observes it/);
 assert.equal(canObserve(devices,policy,'personal-windows').ok,false);
 assert.equal(canObserve(devices,policy,'no-such-device').ok,false);
 const withoutCapability=clone();withoutCapability.devices[0].capabilities=[];
 assert.equal(canObserve(loadDevices(withoutCapability,policy,'fixture'),policy,'personal-mac').ok,false);
});
