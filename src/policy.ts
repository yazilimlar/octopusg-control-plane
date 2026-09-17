// Trust zones, action tiers and connection levels as data (OG-SEC-002).
// Pure module: it decides nothing by itself and executes nothing. It answers one question —
// "would this action be permitted?" — so the answer can be tested exhaustively and shown in the
// UI. Every approval in v0.2 is still a simulation.
// Source: docs/06-SECURITY-AND-APPROVALS.md, S2#integration-levels, S2#work-laptop-trust-zone.

export type TierId='T0'|'T1'|'T2'|'T3'|'T4';
export const tierIds:TierId[]=['T0','T1','T2','T3','T4'];
export const levels=[0,1,2,3,4] as const;
export type Level=typeof levels[number];
export interface Tier {id:TierId;name:string;examples:string;minLevel:Level;maxLevel:Level;approval:string}
export interface TrustZone {id:string;label:string;enrolled:boolean;localAccess:'observe'|'actions'|'none';maxTier:TierId|'none';notes:string}
export interface LevelDefinition {level:Level;name:string;meaning:string}
export interface Policy {schemaVersion:1;trustZones:TrustZone[];levels:LevelDefinition[];tiers:Tier[]}

const localAccess=['observe','actions','none'];
export function loadPolicy(raw:unknown,label='policy'):Policy{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const p=raw as Record<string,any>;
 if(p.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 for(const key of ['trustZones','levels','tiers'])if(!Array.isArray(p[key]))throw new Error(`${label}: ${key} must be an array`);
 const zoneIds=new Set<string>();
 for(const z of p.trustZones as TrustZone[]){
  if(typeof z.id!=='string'||!z.id)throw new Error(`${label}: trust zone needs an id`);
  if(zoneIds.has(z.id))throw new Error(`${label}: duplicate trust zone ${z.id}`);
  zoneIds.add(z.id);
  if(!localAccess.includes(z.localAccess))throw new Error(`${label}: ${z.id} has an unknown localAccess`);
  if(z.maxTier!=='none'&&!tierIds.includes(z.maxTier as TierId))throw new Error(`${label}: ${z.id} has an unknown maxTier`);
  if(z.localAccess!=='none'&&z.maxTier==='none')throw new Error(`${label}: ${z.id} grants local access but no tier`);
 }
 const seenLevels=new Set<number>();
 for(const l of p.levels as LevelDefinition[]){
  if(!(levels as readonly number[]).includes(l.level))throw new Error(`${label}: unknown level ${l.level}`);
  if(seenLevels.has(l.level))throw new Error(`${label}: duplicate level ${l.level}`);
  seenLevels.add(l.level);
 }
 if(seenLevels.size!==levels.length)throw new Error(`${label}: levels 0-4 must all be defined`);
 const seenTiers=new Set<string>();
 for(const t of p.tiers as Tier[]){
  if(!tierIds.includes(t.id))throw new Error(`${label}: unknown tier ${t.id}`);
  if(seenTiers.has(t.id))throw new Error(`${label}: duplicate tier ${t.id}`);
  seenTiers.add(t.id);
  if(!(levels as readonly number[]).includes(t.minLevel)||!(levels as readonly number[]).includes(t.maxLevel))throw new Error(`${label}: ${t.id} has an out-of-range level`);
  if(t.maxLevel<t.minLevel)throw new Error(`${label}: ${t.id} maxLevel is below minLevel`);
  // The rule that must never be softened by configuration: controlled automation (level 4)
  // is only ever available to T0–T2 actions with a fixed template.
  if((t.id==='T3'||t.id==='T4')&&t.maxLevel>3)throw new Error(`${label}: level 4 must never apply to ${t.id}`);
 }
 if(seenTiers.size!==tierIds.length)throw new Error(`${label}: tiers T0-T4 must all be defined`);
 return p as Policy;
}

export interface Request {tier:TierId;level:Level;zone?:string;approvalRecorded?:boolean;preconditionsMet?:boolean;templated?:boolean}
export interface Decision {allowed:boolean;reason:string}
// An action runs only if the level clears the tier's floor, does not exceed its ceiling, the
// zone permits that tier at all, the required approval is recorded and preconditions pass.
export function evaluate(policy:Policy,request:Request):Decision{
 const tier=policy.tiers.find(t=>t.id===request.tier);
 if(!tier)return {allowed:false,reason:`unknown tier ${request.tier}`};
 if(!(levels as readonly number[]).includes(request.level))return {allowed:false,reason:`unknown level ${request.level}`};
 if(request.zone!==undefined){
  const zone=policy.trustZones.find(z=>z.id===request.zone);
  if(!zone)return {allowed:false,reason:`unknown trust zone ${request.zone}`};
  if(zone.localAccess==='none'||zone.maxTier==='none')return {allowed:false,reason:`trust zone ${zone.id} permits no OctopusG action`};
  if(tierIds.indexOf(request.tier)>tierIds.indexOf(zone.maxTier))return {allowed:false,reason:`trust zone ${zone.id} permits at most ${zone.maxTier}`};
 }
 if(request.level<tier.minLevel)return {allowed:false,reason:`${tier.id} needs level ${tier.minLevel} or higher`};
 if(request.level>tier.maxLevel)return {allowed:false,reason:`level ${request.level} is never available for ${tier.id}`};
 if(request.level===4&&!request.templated)return {allowed:false,reason:'level 4 requires a named action with a fixed template'};
 if(tier.approval!=='automatic'&&!request.approvalRecorded)return {allowed:false,reason:`${tier.id} requires a recorded approval (${tier.approval})`};
 if(request.preconditionsMet===false)return {allowed:false,reason:'preconditions have not passed'};
 return {allowed:true,reason:`${tier.id} permitted at level ${request.level}`};
}
