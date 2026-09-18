// Connector definitions, connection records and the level ceiling (OG-CONN-002, OG-CONN-003).
// Pure module: it defines and validates, it never connects. There is no client, no credential
// field, no authorization flow and no network call anywhere in this file or in anything it
// imports. v0.2 keeps every connection at Level 0 (Registered) — listed only.
// Source: docs/04-CONNECTOR-CONTRACT.md, docs/08-UX-AND-SCREEN-MAP.md#2-card-anatomy-connection-center,
// S2#connection-center, S2#integration-levels, S2#disconnecting-safely.
import {resourceKinds,type ResourceKind} from './resources.ts';
import {levels,type Level} from './policy.ts';
export type {Level};

export const authKinds=['none','oauth','token','webhook-secret','local'] as const;
export type AuthKind=typeof authKinds[number];
export interface ScopeGrant {level:Level;scopes:string[];why:string}
export interface ConnectorDefinition {
 id:string;provider:string;auth:AuthKind;
 resources:ResourceKind[];observations:string[];events:string[];actions:string[];
 maxLevel:Level;scopes:ScopeGrant[];docs:string;adapter?:string;notes?:string;
}
// docs/04 §3. The order is the lifecycle; a state may never be invented outside it.
export const lifecycleStates=['REGISTERED','AUTHORIZING','CONNECTED','DEGRADED','PAUSED','REVOKING','DISCONNECTED'] as const;
export type LifecycleState=typeof lifecycleStates[number];
export const levelNames:Record<Level,string>={0:'Registered',1:'Observed',2:'Assisted',3:'Approved execution',4:'Controlled automation'};
// What the owner may eventually do to a connection. In v0.2 every one of them is disabled and
// carries the reason, so the screen can never be mistaken for a control panel.
export const ownerActions=['test','reconnect','pause','revoke'] as const;
export type OwnerAction=typeof ownerActions[number];

export interface Connection {
 id:string;connectorId:string;accountLabel:string;productIds:string[];
 level:Level;state:LifecycleState;grantedScopes:string[];
 lastSuccessfulSync:string|null;webhookHealth:string;credentialStatus:string;dataFreshness:string;
 approvedActions:string[];note?:string;
}
export interface ConnectorFile {schemaVersion:1;connectors:ConnectorDefinition[];connections:Connection[]}

const definitionKeys=['id','provider','auth','resources','observations','events','actions','maxLevel','scopes','docs','adapter','notes'];
const connectionKeys=['id','connectorId','accountLabel','productIds','level','state','grantedScopes','lastSuccessfulSync','webhookHealth','credentialStatus','dataFreshness','approvedActions','note'];
// A credential must never be described by value. These are the shapes a connector file must not
// contain, checked before anything is rendered or persisted — the same rule the observer uses.
export const secretShapes:RegExp[]=[
 /gh[pousr]_[A-Za-z0-9]{20,}/,/sk_(?:live|test)_[A-Za-z0-9]{12,}/,/AKIA[A-Z0-9]{16}/,
 /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 /https?:\/\/[^\s/:]+:[^\s/@]+@/,/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
];
export const carriesSecret=(value:unknown):boolean=>
 typeof value==='string'?secretShapes.some(re=>re.test(value))
 :Array.isArray(value)?value.some(carriesSecret)
 :!!value&&typeof value==='object'?Object.values(value as Record<string,unknown>).some(carriesSecret):false;

const isLevel=(v:unknown):v is Level=>(levels as readonly number[]).includes(v as number);
const stringList=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');

export function loadConnectors(raw:unknown,label='connectors'):ConnectorFile{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const f=raw as Record<string,unknown>;
 if(f.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(!Array.isArray(f.connectors)||!f.connectors.length)throw new Error(`${label}: connectors must be a non-empty array`);
 if(!Array.isArray(f.connections))throw new Error(`${label}: connections must be an array`);
 if(carriesSecret(f))throw new Error(`${label}: a value looks like a credential, token, key or address; connector records never hold one`);
 const ids=new Set<string>();
 for(const [i,entry] of f.connectors.entries()){
  const where=`${label}: connectors[${i}]`;
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error(`${where} is not an object`);
  const d=entry as Record<string,any>;
  for(const k of Object.keys(d))if(!definitionKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof d.id!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id))throw new Error(`${where}: id must be kebab-case`);
  if(ids.has(d.id))throw new Error(`${where}: duplicate connector ${d.id}`);
  ids.add(d.id);
  if(typeof d.provider!=='string'||!d.provider)throw new Error(`${where}: provider must be a non-empty string`);
  if(!(authKinds as readonly string[]).includes(d.auth))throw new Error(`${where}: auth must be one of ${authKinds.join(', ')}`);
  if(!Array.isArray(d.resources)||d.resources.some((r:unknown)=>!(resourceKinds as readonly string[]).includes(r as string)))
   throw new Error(`${where}: resources must be documented resource kinds`);
  for(const k of ['observations','events','actions'])if(!stringList(d[k]))throw new Error(`${where}: ${k} must be a list of strings`);
  if(!isLevel(d.maxLevel))throw new Error(`${where}: maxLevel must be 0-4`);
  if(typeof d.docs!=='string'||!d.docs)throw new Error(`${where}: docs must reference the provider documentation`);
  // An action is only meaningful from level 3; a definition that names one below its own
  // ceiling would promise something the level can never deliver.
  if(d.actions.length&&d.maxLevel<3)throw new Error(`${where}: actions require maxLevel 3 or higher`);
  if(!Array.isArray(d.scopes))throw new Error(`${where}: scopes must be an array`);
  const seen=new Set<number>();
  for(const [j,g] of d.scopes.entries()){
   const at=`${where}: scopes[${j}]`;
   if(!g||typeof g!=='object')throw new Error(`${at} is not an object`);
   if(!isLevel(g.level))throw new Error(`${at}: level must be 0-4`);
   if(g.level===0)throw new Error(`${at}: level 0 is Registered and needs no scope`);
   if(g.level>d.maxLevel)throw new Error(`${at}: level ${g.level} exceeds the connector ceiling ${d.maxLevel}`);
   if(seen.has(g.level))throw new Error(`${at}: duplicate level ${g.level}`);
   seen.add(g.level);
   if(!stringList(g.scopes)||!g.scopes.length)throw new Error(`${at}: scopes must be a non-empty list of strings`);
   if(typeof g.why!=='string'||!g.why)throw new Error(`${at}: why must say what the scope is for`);
  }
 }
 const connectionIds=new Set<string>();
 for(const [i,entry] of f.connections.entries()){
  const where=`${label}: connections[${i}]`;
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error(`${where} is not an object`);
  const c=entry as Record<string,any>;
  for(const k of Object.keys(c))if(!connectionKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof c.id!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id))throw new Error(`${where}: id must be kebab-case`);
  if(connectionIds.has(c.id))throw new Error(`${where}: duplicate connection ${c.id}`);
  connectionIds.add(c.id);
  const definition=(f.connectors as ConnectorDefinition[]).find(d=>d.id===c.connectorId);
  if(!definition)throw new Error(`${where}: connectorId ${c.connectorId} is not defined`);
  if(typeof c.accountLabel!=='string'||!c.accountLabel)throw new Error(`${where}: accountLabel must be a non-empty label`);
  if(!stringList(c.productIds))throw new Error(`${where}: productIds must be a list of strings`);
  if(!isLevel(c.level))throw new Error(`${where}: level must be 0-4`);
  // The rule this whole file exists to keep.
  if(c.level>definition.maxLevel)throw new Error(`${where}: level ${c.level} exceeds connector ${definition.id} ceiling ${definition.maxLevel}`);
  if(!(lifecycleStates as readonly string[]).includes(c.state))throw new Error(`${where}: unknown lifecycle state ${c.state}`);
  if(c.level===0&&c.state!=='REGISTERED')throw new Error(`${where}: level 0 is Registered; ${c.state} implies an authorization that has not happened`);
  if(c.level>0&&c.state==='REGISTERED')throw new Error(`${where}: a Registered connection is level 0`);
  if(!stringList(c.grantedScopes))throw new Error(`${where}: grantedScopes must be a list of strings`);
  if(c.level===0&&c.grantedScopes.length)throw new Error(`${where}: a level 0 connection has no granted scope`);
  for(const s of c.grantedScopes)
   if(!definition.scopes.some(g=>g.scopes.includes(s)))throw new Error(`${where}: scope ${s} is not declared by connector ${definition.id}`);
  if(c.lastSuccessfulSync!==null&&typeof c.lastSuccessfulSync!=='string')throw new Error(`${where}: lastSuccessfulSync is a timestamp or null`);
  if(c.level===0&&c.lastSuccessfulSync!==null)throw new Error(`${where}: a level 0 connection has never synced`);
  for(const k of ['webhookHealth','credentialStatus','dataFreshness'])
   if(typeof c[k]!=='string'||!c[k])throw new Error(`${where}: ${k} must state the position in words`);
  if(!stringList(c.approvedActions))throw new Error(`${where}: approvedActions must be a list of strings`);
  if(c.approvedActions.length&&c.level<3)throw new Error(`${where}: an approved action needs level 3`);
  for(const a of c.approvedActions)
   if(!definition.actions.includes(a))throw new Error(`${where}: action ${a} is not declared by connector ${definition.id}`);
 }
 return f as unknown as ConnectorFile;
}

export interface LevelDecision {allowed:boolean;reason:string}
// Raising a level is an owner decision that v0.2 cannot make. This function exists so the
// ceiling is a tested rule rather than a sentence in a document.
export function canRaiseLevel(definition:ConnectorDefinition,from:Level,to:Level,ownerAuthorized=false):LevelDecision{
 if(!isLevel(to))return {allowed:false,reason:`level ${to} is not a defined level`};
 if(to<=from)return {allowed:false,reason:'raising a level means moving up'};
 if(to>definition.maxLevel)return {allowed:false,reason:`connector ${definition.id} may never exceed level ${definition.maxLevel} (${levelNames[definition.maxLevel]})`};
 if(!definition.scopes.some(g=>g.level===to))return {allowed:false,reason:`connector ${definition.id} declares no scopes for level ${to}`};
 if(!ownerAuthorized)return {allowed:false,reason:'raising a level requires an owner authorization recorded at the gate'};
 return {allowed:true,reason:`level ${to} (${levelNames[to]}) is within connector ${definition.id}'s ceiling once the owner has authorized it`};
}
// Why each owner action is unavailable in v0.2. Every card shows the control and this reason;
// none of them is ever enabled by this build.
export const ownerActionReason:Record<OwnerAction,string>={
 test:'Testing a connection would call the provider. No connection is authorized and the application holds no client.',
 reconnect:'Reconnecting requires an owner authorization flow, which v0.2 does not implement.',
 pause:'Nothing is running to pause: every connection is Registered (level 0).',
 revoke:'There is no credential to revoke. Revocation arrives with the first real connection.',
};
export const connectorById=(file:ConnectorFile,id:string):ConnectorDefinition|undefined=>file.connectors.find(c=>c.id===id);
export const connectionsOf=(file:ConnectorFile,connectorId:string):Connection[]=>file.connections.filter(c=>c.connectorId===connectorId);
// One sentence per connector for a screen reader and for greyscale.
export const connectorSummary=(d:ConnectorDefinition,cs:Connection[]):string=>
 `${d.provider}: ${cs.length?cs.map(c=>`${c.accountLabel} at level ${c.level} (${levelNames[c.level]}), ${c.state.toLowerCase()}`).join('; '):'no connection registered'}. Ceiling level ${d.maxLevel} (${levelNames[d.maxLevel]}).`;
