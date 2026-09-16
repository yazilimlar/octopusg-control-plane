export const stages=['PROPOSED','EVIDENCE','REVIEWED','OWNER_APPROVED','EXECUTING','VERIFIED','COMPLETED','ROLLED_BACK'] as const;
export type Stage=typeof stages[number];
export interface Entry {id:string;title:string;stage:Stage;note:string;updatedAt:string;demo:true}
export interface ActionLog {id:string;itemId:string;from:Stage;to:Stage;note:string;at:string;demo:true}
export interface Workspace {version:1;entries:Entry[];log:ActionLog[]}
export function nextStages(stage:Stage):Stage[]{if(stage==='COMPLETED'||stage==='ROLLED_BACK')return [];if(stage==='EXECUTING')return ['VERIFIED','ROLLED_BACK'];if(stage==='VERIFIED')return ['COMPLETED','ROLLED_BACK'];return [stages[stages.indexOf(stage)+1]];}
export function transition(work:Workspace,id:string,to:Stage,note:string):Workspace{
 const item=work.entries.find(e=>e.id===id);if(!item)throw Error('Unknown proposal');
 if(!nextStages(item.stage).includes(to))throw Error('Invalid transition');
 if(note.trim().length<8)throw Error('Add a meaningful evidence / decision note (at least 8 characters).');
 const at=new Date().toISOString();return {version:1,entries:work.entries.map(e=>e.id===id?{...e,stage:to,note:note.trim(),updatedAt:at}:e),log:[...work.log,{id:crypto.randomUUID(),itemId:id,from:item.stage,to,note:note.trim(),at,demo:true}]};
}
export function validWorkspace(value:unknown):value is Workspace{
 if(!value||typeof value!=='object')return false;const w=value as Workspace;
 return w.version===1&&Array.isArray(w.entries)&&Array.isArray(w.log)&&w.entries.every(e=>e&&typeof e.id==='string'&&typeof e.title==='string'&&stages.includes(e.stage)&&e.demo===true&&typeof e.note==='string'&&typeof e.updatedAt==='string')&&new Set(w.entries.map(e=>e.id)).size===w.entries.length&&w.log.every(l=>l&&typeof l.id==='string'&&typeof l.itemId==='string'&&stages.includes(l.from)&&nextStages(l.from).includes(l.to)&&typeof l.note==='string'&&typeof l.at==='string'&&l.demo===true);
}
