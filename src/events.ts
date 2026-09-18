// Normalized event envelope and the rules an inbox must obey (OG-EVT-001, OG-EVT-002).
// Pure module: it validates and filters records that already exist on disk. Nothing here
// receives, fetches or emits an event. v0.2 has no real event source, so everything the inbox
// shows is a fixture marked `simulated`, and a simulated event never reaches a KPI.
// Source: docs/05-EVENT-MODEL.md, S1#core-capabilities-discussed, S2#build-versus-buy.
import {carriesSecret} from './connections.ts';
import {carriesIdentifier} from './devices.ts';

export const severities=['info','notice','warning','critical'] as const;
export type Severity=typeof severities[number];
export const eventTruths=['observed','derived','simulated'] as const;
export type EventTruth=typeof eventTruths[number];
export const eventStatuses=['new','acknowledged','actioned','dismissed'] as const;
export type EventStatus=typeof eventStatuses[number];
// The types docs/05 §4 assigns to v0.2, plus the record a status change appends.
export const v02EventTypes=['observation.stale','observation.changed','drift.detected','connection.state_changed'] as const;
export const statusChangeType='event.status_changed';
// Emitted by the control plane itself rather than by a provider connector.
export const localEmitter='control-plane';

export interface OctoEvent {
 id:string;type:string;occurred_at:string;received_at:string;
 source:{connector:string;account?:string;resource?:string;provider_event_id?:string};
 subject:{product_id?:string;resource_id?:string};
 summary:string;severity:Severity;truth:EventTruth;
 correlation_id?:string;requires_decision:boolean;status:EventStatus;payload_ref?:string;
}
const eventKeys=['id','type','occurred_at','received_at','source','subject','summary','severity','truth','correlation_id','requires_decision','status','payload_ref'];
const sourceKeys=['connector','account','resource','provider_event_id'];
const subjectKeys=['product_id','resource_id'];
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface LoadOptions {
 productIds?:Set<string>;                    // subjects must name a product the registry declares
 connectorEvents?:Map<string,string[]>;      // a connector may only emit the types it declares
 allowedTypes?:readonly string[];            // documented types for this milestone
}
export function loadEvents(raw:unknown,label='events',options:LoadOptions={}):OctoEvent[]{
 if(!Array.isArray(raw))throw new Error(`${label}: events must be an array`);
 const allowed=options.allowedTypes??[...v02EventTypes,statusChangeType];
 const ids=new Set<string>();
 const out:OctoEvent[]=[];
 for(const [i,entry] of raw.entries()){
  const where=`${label}[${i}]`;
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error(`${where} is not an object`);
  const e=entry as Record<string,any>;
  for(const k of Object.keys(e))if(!eventKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof e.id!=='string'||!/^[a-z0-9][a-z0-9-]*$/.test(e.id))throw new Error(`${where}: id must be a sortable lower-case identifier`);
  if(ids.has(e.id))throw new Error(`${where}: duplicate event id ${e.id}`);
  ids.add(e.id);
  if(typeof e.type!=='string'||!/^[a-z][a-z_]*(\.[a-z][a-z_]*)+$/.test(e.type))throw new Error(`${where}: type must look like family.name`);
  if(!allowed.includes(e.type))throw new Error(`${where}: ${e.type} is not a documented event type for this milestone`);
  for(const k of ['occurred_at','received_at'])if(typeof e[k]!=='string'||!iso.test(e[k]))throw new Error(`${where}: ${k} must be an ISO 8601 UTC timestamp`);
  // OctopusG cannot receive an event before the provider produced it.
  if(Date.parse(e.received_at)<Date.parse(e.occurred_at))throw new Error(`${where}: received_at precedes occurred_at`);
  if(!e.source||typeof e.source!=='object'||Array.isArray(e.source))throw new Error(`${where}: source must be an object`);
  for(const k of Object.keys(e.source))if(!sourceKeys.includes(k))throw new Error(`${where}: unknown source field ${k}`);
  if(typeof e.source.connector!=='string'||!e.source.connector)throw new Error(`${where}: source.connector is required`);
  if(options.connectorEvents&&e.source.connector!==localEmitter){
   const declared=options.connectorEvents.get(e.source.connector);
   if(!declared)throw new Error(`${where}: connector ${e.source.connector} is not defined and is not ${localEmitter}`);
   if(e.type!==statusChangeType&&!declared.includes(e.type))throw new Error(`${where}: connector ${e.source.connector} does not declare ${e.type}`);
  }
  if(!e.subject||typeof e.subject!=='object'||Array.isArray(e.subject))throw new Error(`${where}: subject must be an object`);
  for(const k of Object.keys(e.subject))if(!subjectKeys.includes(k))throw new Error(`${where}: unknown subject field ${k}`);
  if(options.productIds&&e.subject.product_id!==undefined&&!options.productIds.has(e.subject.product_id))
   throw new Error(`${where}: subject.product_id ${e.subject.product_id} is not a registry product`);
  if(typeof e.summary!=='string'||!e.summary)throw new Error(`${where}: summary is required`);
  if(e.summary.length>200)throw new Error(`${where}: summary must stay short; a body belongs behind payload_ref`);
  if(!(severities as readonly string[]).includes(e.severity))throw new Error(`${where}: unknown severity ${e.severity}`);
  if(!(eventTruths as readonly string[]).includes(e.truth))throw new Error(`${where}: unknown truth ${e.truth}`);
  if(!(eventStatuses as readonly string[]).includes(e.status))throw new Error(`${where}: unknown status ${e.status}`);
  if(typeof e.requires_decision!=='boolean')throw new Error(`${where}: requires_decision must be a boolean`);
  if(e.correlation_id!==undefined&&(typeof e.correlation_id!=='string'||!e.correlation_id))throw new Error(`${where}: correlation_id must be a non-empty string`);
  if(e.payload_ref!==undefined){
   if(typeof e.payload_ref!=='string'||!/^(?:fixtures\/|redacted:)[\w./-]+$/.test(e.payload_ref))
    throw new Error(`${where}: payload_ref must be a pointer, never inline content`);
  }
  // No personal data, no credential, no machine identifier — checked before the record exists.
  if(carriesSecret(e))throw new Error(`${where}: a value looks like a credential or an e-mail address; v0.2 events carry neither`);
  if(carriesIdentifier(e))throw new Error(`${where}: a value looks like a machine identifier or a path carrying a user name`);
  out.push(e as OctoEvent);
 }
 return out;
}

// docs/05 §3: duplicate provider deliveries de-duplicate on (connector, provider_event_id).
// An event without a provider id has no provider identity, so it is never merged with another.
export const dedupeKey=(e:OctoEvent):string|null=>
 e.source.provider_event_id?`${e.source.connector}|${e.source.provider_event_id}`:null;
export function dedupe(events:OctoEvent[]):OctoEvent[]{
 const seen=new Set<string>();const out:OctoEvent[]=[];
 for(const e of events){
  const key=dedupeKey(e);
  if(key!==null){if(seen.has(key))continue;seen.add(key);}
  out.push(e);
 }
 return out;
}
export const duplicatesOf=(events:OctoEvent[]):OctoEvent[]=>{
 const seen=new Set<string>();
 return events.filter(e=>{const k=dedupeKey(e);if(k===null)return false;if(seen.has(k))return true;seen.add(k);return false;});
};

// A simulated event is never evidence. It is excluded from anything counted, exactly as the
// v0.1 approval simulation is excluded.
export const isSimulated=(e:OctoEvent):boolean=>e.truth==='simulated';
export const kpiEligible=(events:OctoEvent[]):OctoEvent[]=>events.filter(e=>!isSimulated(e));

// Append-only: a status change is a new record, never an edit of the original.
export function appendStatusChange(log:OctoEvent[],eventId:string,status:EventStatus,at:string,note='owner action in the local simulation'):OctoEvent[]{
 const original=log.find(e=>e.id===eventId);
 if(!original)throw new Error(`append: ${eventId} is not in the log`);
 const record:OctoEvent={
  id:`${eventId}-${status}-${log.filter(e=>e.correlation_id===eventId).length+1}`,
  type:statusChangeType,occurred_at:at,received_at:at,
  source:{connector:localEmitter},subject:{...original.subject},
  summary:`${original.id} marked ${status}: ${note}`,
  severity:'info',truth:'simulated',correlation_id:eventId,requires_decision:false,status,
 };
 return [...log,record];
}
export const currentStatus=(log:OctoEvent[],eventId:string):EventStatus=>{
 const changes=log.filter(e=>e.type===statusChangeType&&e.correlation_id===eventId);
 return changes.length?changes[changes.length-1]!.status:(log.find(e=>e.id===eventId)?.status??'new');
};
// The inbox shows the original events; status records are the audit behind them.
export const inboxEvents=(log:OctoEvent[]):OctoEvent[]=>log.filter(e=>e.type!==statusChangeType);

export interface EventFilters {product:string;connector:string;severity:string;requiresDecision:string;status:string}
export const emptyEventFilters:EventFilters={product:'',connector:'',severity:'',requiresDecision:'',status:''};
export function filterEvents(events:OctoEvent[],log:OctoEvent[],f:EventFilters):OctoEvent[]{
 return events.filter(e=>
  (!f.product||e.subject.product_id===f.product)
  &&(!f.connector||e.source.connector===f.connector)
  &&(!f.severity||e.severity===f.severity)
  &&(!f.requiresDecision||String(e.requires_decision)===f.requiresDecision)
  &&(!f.status||currentStatus(log,e.id)===f.status));
}
export const bySeverityThenTime=(a:OctoEvent,b:OctoEvent):number=>
 severities.indexOf(b.severity)-severities.indexOf(a.severity)||b.occurred_at.localeCompare(a.occurred_at);
// Text equivalent of the row, so nothing is carried by colour alone.
export const eventLine=(e:OctoEvent,status:EventStatus):string=>
 `${e.severity}${isSimulated(e)?', simulated':''}, ${e.type}, ${e.source.connector}, ${status}${e.requires_decision?', requires a decision':''}, occurred ${e.occurred_at}`;
