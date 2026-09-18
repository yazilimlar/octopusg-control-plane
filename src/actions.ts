// Action requests with tier and level policy (OG-ACT-002).
// Pure module: it decides whether an action *would* be permitted and says why. It cannot run
// anything — there is no execute function here or anywhere else in v0.2, and every request this
// build knows about is marked `simulated`. The policy itself lives in src/policy.ts (WP-03);
// this file adds the dossier a production or critical action must carry before anyone may
// approve it, and ties a request's level to the connection it would run through (WP-07).
// Source: docs/06-SECURITY-AND-APPROVALS.md#3-what-a-t3t4-action-request-must-contain,
// S2#database-and-configuration-changes, S1#action-authority-levels.
import {evaluate,tierIds,levels,type Policy,type TierId,type Level,type Decision} from './policy.ts';
import {levelNames,type ConnectorFile} from './connections.ts';

// docs/06 §3, in order. All seven are required before a T3 or T4 request may be approved.
export const dossierFields=['proposedChange','affectedObjects','backup','dryRun','rollback','ownerApproval','executionEvidence'] as const;
export type DossierField=typeof dossierFields[number];
export const dossierLabels:Record<DossierField,string>={
 proposedChange:'Proposed change (migration, diff, command)',
 affectedObjects:'Affected objects',
 backup:'Backup status and location',
 dryRun:'Dry-run or preview result',
 rollback:'Rollback procedure',
 ownerApproval:'Owner approval (who, when, note)',
 executionEvidence:'Execution evidence (output, before/after observation)',
};
export const dossierRequiredFor=(tier:TierId):boolean=>tier==='T3'||tier==='T4';

export interface ActionRequest {
 id:string;title:string;tier:TierId;level:Level;
 connectionId?:string;zone?:string;
 approvalRecorded?:boolean;preconditionsMet?:boolean;templated?:boolean;
 dossier?:Partial<Record<DossierField,string>>;
 simulated:true;
}
export interface ActionDecision {
 allowed:false|true;reason:string;
 policy:Decision;missing:DossierField[];ceiling:string|null;simulated:true;
}
const nonEmpty=(v:unknown):boolean=>typeof v==='string'&&v.trim().length>0;
export const missingFields=(request:ActionRequest):DossierField[]=>
 dossierRequiredFor(request.tier)?dossierFields.filter(f=>!nonEmpty(request.dossier?.[f])):[];

// The order matters: no failing path may fall through to "allowed".
export function decide(policy:Policy,request:ActionRequest,connections?:ConnectorFile):ActionDecision{
 const missing=missingFields(request);
 const base={missing,simulated:true as const};
 // 1. The connection's ceiling, when the action would run through one.
 let ceiling:string|null=null;
 if(request.connectionId){
  const connection=connections?.connections.find(c=>c.id===request.connectionId);
  if(!connection)return {...base,allowed:false,reason:`connection ${request.connectionId} is not registered`,policy:{allowed:false,reason:'no connection'},ceiling:null};
  const definition=connections!.connectors.find(d=>d.id===connection.connectorId)!;
  ceiling=`connector ${definition.id} ceiling ${definition.maxLevel} (${levelNames[definition.maxLevel]}), connection at level ${connection.level}`;
  if(request.level>definition.maxLevel)
   return {...base,allowed:false,reason:`level ${request.level} exceeds ${ceiling}`,policy:{allowed:false,reason:'above the connector ceiling'},ceiling};
  if(request.level>connection.level)
   return {...base,allowed:false,reason:`the connection is at level ${connection.level} (${levelNames[connection.level]}); raising it is a separate owner decision`,policy:{allowed:false,reason:'above the connection level'},ceiling};
 }
 // 2. The tier and level policy.
 const decision=evaluate(policy,{tier:request.tier,level:request.level,zone:request.zone,
  approvalRecorded:request.approvalRecorded,preconditionsMet:request.preconditionsMet,templated:request.templated});
 if(!decision.allowed)return {...base,allowed:false,reason:decision.reason,policy:decision,ceiling};
 // 3. The dossier. A T3/T4 request is not approvable until all seven fields are present —
 //    and a present field is owner-supplied text, never proof: an AI recommendation is never
 //    sufficient on its own (docs/06 §3).
 if(missing.length)return {...base,allowed:false,ceiling,policy:decision,
  reason:`${request.tier} needs all seven fields in docs/06 §3 before approval; missing: ${missing.map(f=>dossierLabels[f]).join(', ')}`};
 return {...base,allowed:true,ceiling,policy:decision,
  reason:`${decision.reason}${dossierRequiredFor(request.tier)?', and the seven-field record is complete':''}. This is a simulated evaluation: v0.2 executes nothing.`};
}

const requestKeys=['id','title','tier','level','connectionId','zone','approvalRecorded','preconditionsMet','templated','dossier','simulated'];
export function loadActionRequests(raw:unknown,label='action requests'):ActionRequest[]{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const f=raw as Record<string,any>;
 if(f.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(!Array.isArray(f.requests)||!f.requests.length)throw new Error(`${label}: requests must be a non-empty array`);
 const ids=new Set<string>();
 for(const [i,entry] of f.requests.entries()){
  const where=`${label}: requests[${i}]`;
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error(`${where} is not an object`);
  const r=entry as Record<string,any>;
  for(const k of Object.keys(r))if(!requestKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof r.id!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id))throw new Error(`${where}: id must be kebab-case`);
  if(ids.has(r.id))throw new Error(`${where}: duplicate request ${r.id}`);
  ids.add(r.id);
  if(typeof r.title!=='string'||!r.title)throw new Error(`${where}: title is required`);
  if(!tierIds.includes(r.tier))throw new Error(`${where}: unknown tier ${r.tier}`);
  if(!(levels as readonly number[]).includes(r.level))throw new Error(`${where}: level must be 0-4`);
  // The rule that keeps v0.2 honest: nothing here may claim to be real.
  if(r.simulated!==true)throw new Error(`${where}: every v0.2 action request is a simulation and must say so`);
  if(r.dossier!==undefined){
   if(typeof r.dossier!=='object'||Array.isArray(r.dossier))throw new Error(`${where}: dossier must be an object`);
   for(const k of Object.keys(r.dossier))if(!(dossierFields as readonly string[]).includes(k))throw new Error(`${where}: unknown dossier field ${k}`);
  }
 }
 return f.requests as ActionRequest[];
}
// Text equivalent, so no outcome is carried by colour alone.
export const decisionLine=(r:ActionRequest,d:ActionDecision):string=>
 `${r.tier} at level ${r.level} (${levelNames[r.level]}): ${d.allowed?'would be permitted':'would be refused'} — ${d.reason} (simulated)`;
