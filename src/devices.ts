// Declared device registry and trust zones (OG-DEV-001).
// Devices are DECLARED data, not measured: nothing here is collected from the machine. The
// record deliberately holds no persistent device identifier — no serial number, MAC address,
// hostname, username or IP address — only an alias the owner chose.
// Source: docs/06-SECURITY-AND-APPROVALS.md#1-trust-zones, docs/07-DEVICE-AGENT-SPEC.md,
// S2#multi-device-control, S2#work-laptop-trust-zone.
import type {Policy} from './policy.ts';

export type Ownership='personal'|'employer';
export interface Device {
 id:string;alias:string;ownership:Ownership;trustZone:string;enrolled:boolean;
 capabilities:string[];prohibited:string[];accessModel:string;notes?:string;
}
export interface DeviceRegistry {schemaVersion:1;devices:Device[]}
const deviceKeys=['id','alias','ownership','trustZone','enrolled','capabilities','prohibited','accessModel','notes'];

// Field names that must never appear in a device record, and value shapes that would identify a
// machine even under an innocent field name.
export const forbiddenDeviceKeys=['serial','serialNumber','uuid','mac','macAddress','hostname','host','user','username','owner','ip','ipAddress','ipv4','ipv6','udid','imei','model','deviceId'];
export const identifierShapes:RegExp[]=[
 /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,                                  // MAC address
 /\b(?:\d{1,3}\.){3}\d{1,3}\b/,                                          // IPv4 address
 /\b(?:[0-9a-f]{4}:){3,7}[0-9a-f]{1,4}\b/i,                              // IPv6 address
 /\b[A-Z0-9]{10,12}\b/,                                                  // Apple-style serial
 /\/Users\/[^/\s]+/,/\/home\/[^/\s]+/,/C:\\Users\\[^\\\s]+/i,            // a path carrying a username
];
export const carriesIdentifier=(value:unknown):boolean=>
 typeof value==='string'?identifierShapes.some(re=>re.test(value))
 :Array.isArray(value)?value.some(carriesIdentifier)
 :!!value&&typeof value==='object'?Object.values(value as Record<string,unknown>).some(carriesIdentifier):false;

export function loadDevices(raw:unknown,policy?:Policy,label='devices'):DeviceRegistry{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const r=raw as Record<string,unknown>;
 if(r.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(!Array.isArray(r.devices)||!r.devices.length)throw new Error(`${label}: devices must be a non-empty array`);
 const ids=new Set<string>();
 for(const [i,raw] of r.devices.entries()){
  const where=`${label}: devices[${i}]`;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${where} is not an object`);
  const d=raw as Record<string,any>;
  for(const k of Object.keys(d)){
   if(forbiddenDeviceKeys.includes(k))throw new Error(`${where}: field ${k} would identify the machine; devices carry an alias only`);
   if(!deviceKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  }
  if(typeof d.id!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id))throw new Error(`${where}: id must be kebab-case`);
  if(ids.has(d.id))throw new Error(`${where}: duplicate id ${d.id}`);
  ids.add(d.id);
  if(typeof d.alias!=='string'||!d.alias)throw new Error(`${where}: alias must be a non-empty string`);
  if(d.ownership!=='personal'&&d.ownership!=='employer')throw new Error(`${where}: ownership must be personal or employer`);
  if(typeof d.trustZone!=='string'||!d.trustZone)throw new Error(`${where}: trustZone must be a string`);
  if(typeof d.enrolled!=='boolean')throw new Error(`${where}: enrolled must be a boolean`);
  for(const k of ['capabilities','prohibited'])if(!Array.isArray(d[k])||d[k].some((x:unknown)=>typeof x!=='string'))throw new Error(`${where}: ${k} must be a list of strings`);
  if(typeof d.accessModel!=='string'||!d.accessModel)throw new Error(`${where}: accessModel must be a string`);
  if(carriesIdentifier(d))throw new Error(`${where}: a value looks like a machine identifier (serial, MAC, IP or a path containing a user name)`);
  // The rule the employer trust zone exists to enforce.
  if(d.ownership==='employer'){
   if(d.capabilities.length)throw new Error(`${where}: an employer-owned device may hold no capability`);
   if(d.enrolled)throw new Error(`${where}: an employer-owned device may not be enrolled`);
  }
  if(!d.enrolled&&d.capabilities.length)throw new Error(`${where}: a device that is not enrolled may hold no capability`);
  if(policy){
   const zone=policy.trustZones.find(z=>z.id===d.trustZone);
   if(!zone)throw new Error(`${where}: trustZone ${d.trustZone} is not defined in config/policy.json`);
   if(zone.localAccess==='none'&&d.capabilities.length)throw new Error(`${where}: trust zone ${zone.id} permits no local access`);
   if(d.enrolled&&!zone.enrolled)throw new Error(`${where}: trust zone ${zone.id} is not an enrolled zone`);
  }
 }
 return r as unknown as DeviceRegistry;
}
export const deviceById=(registry:DeviceRegistry,id:string):Device|undefined=>registry.devices.find(d=>d.id===id);
// The observer may only run for a device that is enrolled in a zone with local access.
export function canObserve(registry:DeviceRegistry,policy:Policy,id:string):{ok:boolean;reason:string}{
 const device=deviceById(registry,id);
 if(!device)return {ok:false,reason:`device ${id} is not declared in config/devices.json`};
 if(device.ownership==='employer')return {ok:false,reason:`device ${device.id} is employer-owned; OctopusG never observes it`};
 if(!device.enrolled)return {ok:false,reason:`device ${device.id} is not enrolled`};
 const zone=policy.trustZones.find(z=>z.id===device.trustZone);
 if(!zone||zone.localAccess==='none')return {ok:false,reason:`trust zone ${device.trustZone} permits no local observation`};
 if(!device.capabilities.includes('read_git_status'))return {ok:false,reason:`device ${device.id} does not declare read_git_status`};
 return {ok:true,reason:`${device.alias} may run read-only Git observation`};
}
