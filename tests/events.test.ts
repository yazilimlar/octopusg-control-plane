// OG-EVT-001 — normalized envelope. OG-EVT-002 — simulated inbox from fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {loadEvents,dedupe,duplicatesOf,dedupeKey,kpiEligible,isSimulated,appendStatusChange,currentStatus,
 inboxEvents,filterEvents,emptyEventFilters,eventLine,bySeverityThenTime,severities,eventStatuses,eventTruths,
 v02EventTypes,statusChangeType,localEmitter,type OctoEvent} from '../src/events.ts';
import {rawFixtureEvents,fixtureFiles} from '../src/eventfixtures.ts';
import {loadConnectors} from '../src/connections.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const productIds=new Set<string>(snapshot.registry.projects.map((p:{id:string})=>p.id));
const connectorFile=loadConnectors(JSON.parse(readFileSync('config/connectors.json','utf8')));
const connectorEvents=new Map(connectorFile.connectors.map(c=>[c.id,c.events]));
const options={productIds,connectorEvents};
const events=loadEvents(rawFixtureEvents,'fixtures/events',options);
const clone=():any[]=>JSON.parse(JSON.stringify(rawFixtureEvents));

test('every fixture file is imported, and every event validates against docs/05',()=>{
 const onDisk=readdirSync('fixtures/events').filter(f=>f.endsWith('.json')).sort();
 assert.deepEqual([...fixtureFiles].sort(),onDisk,'the inbox renders every file in fixtures/events');
 assert.equal(events.length,onDisk.length);
 for(const e of events){
  assert.ok((v02EventTypes as readonly string[]).includes(e.type),`${e.id} uses a v0.2 type`);
  assert.ok((severities as readonly string[]).includes(e.severity));
  assert.ok((eventStatuses as readonly string[]).includes(e.status));
  assert.ok((eventTruths as readonly string[]).includes(e.truth));
  assert.ok(Date.parse(e.received_at)>=Date.parse(e.occurred_at));
  assert.ok(e.summary.length<=200);
 }
 // sortable ids: sorting by id gives the same order as the file order
 assert.deepEqual(events.map(e=>e.id),[...events].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>e.id));
});

test('a connector may only emit the event types its definition declares',()=>{
 for(const e of events){
  if(e.source.connector===localEmitter)continue;
  assert.ok(connectorEvents.get(e.source.connector)?.includes(e.type),`${e.source.connector} declares ${e.type}`);
 }
 const bad=clone();bad[0].type='deployment.failed';
 assert.throws(()=>loadEvents(bad,'x',options),/is not a documented event type/);
 const wrongConnector=clone();wrongConnector[0].source.connector='vercel';
 assert.throws(()=>loadEvents(wrongConnector,'x',options),/does not declare/);
 const unknown=clone();unknown[0].source.connector='stripe';
 assert.throws(()=>loadEvents(unknown,'x',options),/is not defined and is not control-plane/);
});

test('the envelope refuses malformed, impossible and out-of-registry records',()=>{
 const cases:[string,(e:any[])=>void,RegExp][]=[
  ['a duplicate id',e=>{e[1].id=e[0].id;},/duplicate event id/],
  ['an unknown field',e=>{e[0].body='hello';},/unknown field body/],
  ['a non-ISO timestamp',e=>{e[0].occurred_at='18 Sep 2026';},/ISO 8601/],
  ['reception before occurrence',e=>{e[0].received_at='2026-01-01T00:00:00.000Z';},/precedes occurred_at/],
  ['an unknown severity',e=>{e[0].severity='urgent';},/unknown severity/],
  ['an unknown status',e=>{e[0].status='done';},/unknown status/],
  ['a product the registry does not declare',e=>{e[0].subject.product_id='not-a-product';},/is not a registry product/],
  ['a summary carrying a body',e=>{e[0].summary='x'.repeat(201);},/summary must stay short/],
  ['an inline payload',e=>{e[0].payload_ref='{"from":"someone"}';},/must be a pointer/],
  ['a decision flag that is not boolean',e=>{e[0].requires_decision='yes';},/must be a boolean/],
 ];
 for(const [name,mutate,message] of cases){
  const bad=clone();mutate(bad);
  assert.throws(()=>loadEvents(bad,'x',options),message,name);
 }
});

test('no event may carry personal data, a credential or a machine identifier',()=>{
 for(const e of events){
  assert.doesNotMatch(JSON.stringify(e),/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,`${e.id} holds no address`);
  assert.doesNotMatch(JSON.stringify(e),/\/Users\/|\/home\/|C:\\\\Users/,`${e.id} holds no user path`);
 }
 const withAddress=clone();withAddress[0].summary='Inquiry from owner'+'@example.com';
 assert.throws(()=>loadEvents(withAddress,'x',options),/credential or an e-mail address/);
 const withPath=clone();withPath[0].source.resource='/Users/someone/Projects/app';
 assert.throws(()=>loadEvents(withPath,'x',options),/machine identifier or a path carrying a user name/);
 const withIp=clone();withIp[0].summary='Probe of 192.168.1.44 failed';
 assert.throws(()=>loadEvents(withIp,'x',options),/machine identifier/);
});

test('duplicate provider deliveries de-duplicate on (connector, provider_event_id)',()=>{
 const duplicates=duplicatesOf(events);
 assert.equal(duplicates.length,1,'the fixtures contain exactly one duplicate delivery');
 assert.equal(duplicates[0]!.id,'evt-20260918-007');
 const unique=dedupe(events);
 assert.equal(unique.length,events.length-1);
 assert.equal(unique.filter(e=>dedupeKey(e)==='mac-status|local-0001').length,1,'the first delivery is kept');
 assert.equal(unique[0]!.id,'evt-20260918-001');
 // an event with no provider id has no provider identity and is never merged away
 const noProviderId=events.filter(e=>dedupeKey(e)===null);
 assert.ok(noProviderId.length>=2);
 assert.equal(dedupe(noProviderId).length,noProviderId.length);
 // de-duplication is per connector, not global
 const sameIdOtherConnector:OctoEvent[]=[events[0]!,{...events[0]!,id:'evt-other',source:{...events[0]!.source,connector:'github'}}];
 assert.equal(dedupe(sameIdOtherConnector).length,2);
});

test('every fixture is simulated, visibly, and never feeds a KPI',()=>{
 assert.ok(events.every(isSimulated),'v0.2 has no real event source');
 assert.deepEqual(kpiEligible(events),[],'nothing simulated is countable');
 assert.equal(kpiEligible(dedupe(events)).length,0);
 for(const e of events)assert.match(eventLine(e,e.status),/, simulated,/,'the row says so in words');
 // an observed event would count; the exclusion is about truth, not about fixtures
 const observed:OctoEvent={...events[0]!,id:'evt-observed',truth:'observed'};
 assert.equal(kpiEligible([...events,observed]).length,1);
});

test('status changes are appended as new records; the original is never edited',()=>{
 const before=JSON.stringify(events);
 const log=appendStatusChange(events,'evt-20260918-003','acknowledged','2026-09-18T08:00:00.000Z');
 assert.equal(JSON.stringify(events),before,'the input log is untouched');
 assert.equal(log.length,events.length+1);
 assert.equal(log[log.length-1]!.type,statusChangeType);
 assert.equal(log[log.length-1]!.correlation_id,'evt-20260918-003');
 assert.equal(log.find(e=>e.id==='evt-20260918-003')!.status,'new','the original record still reads new');
 assert.equal(currentStatus(log,'evt-20260918-003'),'acknowledged','the fold reports the latest');
 const twice=appendStatusChange(log,'evt-20260918-003','actioned','2026-09-18T08:05:00.000Z');
 assert.equal(currentStatus(twice,'evt-20260918-003'),'actioned');
 assert.equal(twice.filter(e=>e.correlation_id==='evt-20260918-003').length,2,'both changes are kept');
 assert.equal(inboxEvents(twice).length,events.length,'status records are audit, not inbox rows');
 assert.throws(()=>appendStatusChange(events,'evt-missing','actioned','2026-09-18T08:00:00.000Z'),/not in the log/);
 // the appended record is itself a valid envelope
 assert.doesNotThrow(()=>loadEvents(twice,'log',{productIds,connectorEvents}));
});

test('the inbox filters by product, connector, severity, requires-decision and status',()=>{
 const rows=inboxEvents(dedupe(events));
 const f=(over:Partial<typeof emptyEventFilters>)=>filterEvents(rows,events,{...emptyEventFilters,...over});
 assert.equal(f({}).length,rows.length);
 assert.ok(f({product:'dayos'}).every(e=>e.subject.product_id==='dayos'));
 assert.equal(f({product:'dayos'}).length,1);
 assert.ok(f({connector:'mac-status'}).every(e=>e.source.connector==='mac-status'));
 assert.equal(f({severity:'critical'}).length,1);
 assert.equal(f({requiresDecision:'true'}).length,2);
 assert.ok(f({requiresDecision:'false'}).every(e=>!e.requires_decision));
 assert.equal(f({status:'dismissed'}).length,1);
 // filters intersect rather than union
 assert.equal(f({connector:'mac-status',severity:'critical'}).length,0);
 // the status filter reads the fold, so an appended change moves the row
 const log=appendStatusChange(events,'evt-20260918-004','actioned','2026-09-18T09:00:00.000Z');
 assert.equal(filterEvents(rows,log,{...emptyEventFilters,status:'actioned'}).length,1);
 assert.equal(filterEvents(rows,log,{...emptyEventFilters,status:'new'}).length,
  filterEvents(rows,events,{...emptyEventFilters,status:'new'}).length-1);
});

test('ordering is deterministic: severity first, then most recent',()=>{
 const sorted=[...inboxEvents(dedupe(events))].sort(bySeverityThenTime);
 assert.equal(sorted[0]!.severity,'critical');
 const ranks=sorted.map(e=>severities.indexOf(e.severity));
 assert.deepEqual(ranks,[...ranks].sort((a,b)=>b-a),'severity descends');
 assert.deepEqual(sorted.map(e=>e.id),[...inboxEvents(dedupe(events))].sort(bySeverityThenTime).map(e=>e.id),'stable');
});
