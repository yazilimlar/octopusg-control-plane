// Owner-run local Git observer (OG-OBS-001). Read-only, local-only, no network.
// Spec: docs/07-DEVICE-AGENT-SPEC.md#1-v02--local-git-observer. Records are validated by the
// WP-02 store (src/truth.ts) before they are written, and written only into ignored
// work/observations/ through a temporary file and a rename.
import {execFileSync} from 'node:child_process';
import {realpathSync,statSync,mkdirSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {isAbsolute,join,normalize,resolve,sep} from 'node:path';
import {validateObservation,type Observation,type Rejection} from './truth.ts';

// ---------- the only Git commands this tool may ever run
// Fixed argument vectors: nothing is interpolated except the repository path, and no command
// contacts a network, writes to the repository, reads file contents or reads a remote URL.
export const gitCommands={
 root:['rev-parse','--show-toplevel'],        // repository root validation
 head:['rev-parse','HEAD'],                   // current HEAD SHA
 branch:['rev-parse','--abbrev-ref','HEAD'],  // current branch name
 status:['status','--porcelain=v1'],          // concise dirty/clean state; counts only are kept
 remotes:['remote'],                          // configured remote NAMES only; never URLs
} as const;
export type GitCommand=keyof typeof gitCommands;
// -c flags keep the observation inert: no hooks, no filesystem monitor, no optional index
// rewrite, no credential or terminal prompt.
export const gitHardening=['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c','gc.auto=0'];
export const forbiddenGitVerbs=['fetch','pull','push','clone','checkout','switch','add','commit','reset','clean','merge','rebase','submodule','ls-remote','archive','stash','worktree'];
export const gitEnv=(home:string,path:string|undefined):Record<string,string>=>({
 PATH:path??'/usr/bin:/bin',HOME:home,
 GIT_OPTIONAL_LOCKS:'0',      // observation must not rewrite .git/index
 GIT_TERMINAL_PROMPT:'0',     // never wait for input
 GIT_CONFIG_NOSYSTEM:'1',     // ignore system-wide Git configuration
 GIT_ALLOW_PROTOCOL:'',       // no protocol is permitted at all
});
export const DEFAULT_TIMEOUT_MS=5000;
export const OUTPUT_DIR='work/observations';
export const OUTPUT_FILE='latest.json';

// ---------- configuration (explicit allowlist; no discovery, no globbing)
export interface Target {productId:string;path:string;note?:string}
export interface Allowlist {schemaVersion:1;deviceId:string;defaultTtlHours:number;timeoutMs:number;targets:Target[]}
const targetKeys=['productId','path','note'];
export function loadAllowlist(raw:unknown,label='allowlist'):Allowlist{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const a=raw as Record<string,unknown>;
 if(a.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(typeof a.deviceId!=='string'||!a.deviceId)throw new Error(`${label}: deviceId must name a device in config/devices.json`);
 const ttl=a.defaultTtlHours??24,timeout=a.timeoutMs??DEFAULT_TIMEOUT_MS;
 if(typeof ttl!=='number'||!(ttl>0&&ttl<=168))throw new Error(`${label}: defaultTtlHours must be between 0 and 168`);
 if(typeof timeout!=='number'||!(timeout>0&&timeout<=60000))throw new Error(`${label}: timeoutMs must be between 0 and 60000`);
 if(!Array.isArray(a.targets))throw new Error(`${label}: targets must be an array`);
 const seen=new Set<string>(),targets:Target[]=[];
 a.targets.forEach((t,i)=>{
  const where=`${label}: targets[${i}]`;
  if(!t||typeof t!=='object'||Array.isArray(t))throw new Error(`${where} is not an object`);
  const o=t as Record<string,unknown>;
  for(const k of Object.keys(o))if(!targetKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
  if(typeof o.productId!=='string'||!o.productId)throw new Error(`${where}: productId must be a non-empty string`);
  if(typeof o.path!=='string'||!o.path)throw new Error(`${where}: path must be a non-empty string`);
  if(/[*?\[\]{}]/.test(o.path))throw new Error(`${where}: globs are not allowed; list each repository explicitly`);
  if(!(o.path.startsWith('~/')||isAbsolute(o.path)))throw new Error(`${where}: path must be absolute or start with ~/`);
  if(o.path.split(/[\\/]+/).includes('..'))throw new Error(`${where}: path may not contain ..`);
  if('note' in o&&typeof o.note!=='string')throw new Error(`${where}: note must be a string`);
  const key=normalize(o.path);
  if(seen.has(key))throw new Error(`${where}: duplicate path`);
  seen.add(key);
  targets.push({productId:o.productId,path:o.path,...(typeof o.note==='string'&&o.note?{note:o.note}:{})});
 });
 return {schemaVersion:1,deviceId:a.deviceId,defaultTtlHours:ttl,timeoutMs:timeout,targets};
}

// ---------- platform canonical aliases
// Some operating systems expose a fixed, documented alias in front of real directories: on
// macOS /var, /tmp and /etc are symlinks to /private/var, /private/tmp and /private/etc. A path
// under one of those prefixes canonicalises to a different string without anything having been
// redirected. That is the ONLY difference tolerated below: the alias table is a closed list of
// whole-prefix rewrites, so a symlink anywhere else in the path — including one the owner listed
// themselves — still fails the comparison and is refused.
export const platformAliases:Record<string,[string,string][]>={
 darwin:[['/var','/private/var'],['/tmp','/private/tmp'],['/etc','/private/etc']],
};
export const aliasesFor=(platform:string=process.platform):[string,string][]=>platformAliases[platform]??[];
export function applyAliases(path:string,aliases:[string,string][]):string{
 for(const [from,to] of aliases)if(path===from||path.startsWith(from+sep))return to+path.slice(from.length);
 return path;
}

// ---------- canonical resolution: the declared path must BE the repository, not a route to it
export type Resolution={ok:true;dir:string}|{ok:false;status:'missing'|'not_a_repo'|'error';reason:string};
export interface ResolveOptions {aliases?:[string,string][]}
export function resolveTarget(target:Target,home:string,options:ResolveOptions={}):Resolution{
 const declared=resolve(target.path.startsWith('~/')?join(home,target.path.slice(2)):target.path);
 let canonical:string;
 try{canonical=realpathSync(declared);}
 catch{return {ok:false,status:'missing',reason:'path does not exist'};}
 // Equal outright, or equal after rewriting one documented platform prefix. Nothing else.
 if(canonical!==declared&&canonical!==applyAliases(declared,options.aliases??aliasesFor()))
  return {ok:false,status:'error',reason:'path resolves elsewhere (symlink escape); list the real path instead'};
 let dir=false;
 try{dir=statSync(canonical).isDirectory();}catch{return {ok:false,status:'error',reason:'path is not readable'};}
 if(!dir)return {ok:false,status:'not_a_repo',reason:'path is not a directory'};
 try{if(!statSync(join(canonical,'.git')).isDirectory()&&!statSync(join(canonical,'.git')).isFile())return {ok:false,status:'not_a_repo',reason:'no .git entry at this path'};}
 catch{return {ok:false,status:'not_a_repo',reason:'no .git entry at this path'};}
 return {ok:true,dir:canonical};
}

// ---------- running one permitted command
export interface RunOptions extends ResolveOptions {gitBin?:string;timeoutMs?:number;home?:string;path?:string}
export type RunResult={ok:true;stdout:string}|{ok:false;reason:string};
export function runGit(command:GitCommand,dir:string,options:RunOptions={}):RunResult{
 const args=[...gitHardening,'-C',dir,...gitCommands[command]];
 if(args.some(a=>forbiddenGitVerbs.includes(a)))return {ok:false,reason:'refused: command is not read-only'};
 try{
  const stdout=execFileSync(options.gitBin??'git',args,{
   encoding:'utf8',timeout:options.timeoutMs??DEFAULT_TIMEOUT_MS,maxBuffer:1024*1024,
   env:gitEnv(options.home??'/nonexistent',options.path),stdio:['ignore','pipe','pipe'],windowsHide:true,
  });
  return {ok:true,stdout};
 }catch(e){
  const err=e as {signal?:string;code?:string|number;status?:number};
  if(err.signal==='SIGTERM'||err.code==='ETIMEDOUT')return {ok:false,reason:`git ${command} exceeded the ${options.timeoutMs??DEFAULT_TIMEOUT_MS} ms timeout`};
  return {ok:false,reason:`git ${command} failed (exit ${err.status??err.code??'unknown'})`};
 }
}

// ---------- porcelain → counts only. Filenames never leave this function.
export interface WorkingTree {clean:boolean;staged:number;unstaged:number;untracked:number}
export function summarizeStatus(porcelain:string):WorkingTree {
 let staged=0,unstaged=0,untracked=0;
 for(const line of porcelain.split('\n')){
  if(!line.trim())continue;
  const code=line.slice(0,2);
  if(code==='??'){untracked++;continue;}
  if(code[0]!==' '&&code[0]!=='?')staged++;
  if(code[1]!==' '&&code[1]!=='?')unstaged++;
 }
 return {clean:staged+unstaged+untracked===0,staged,unstaged,untracked};
}
export const remoteNames=(stdout:string):string[]=>stdout.split('\n').map(l=>l.trim()).filter(Boolean).sort();

// ---------- one target → observation records (WP-02 envelope)
export interface Clock {now:string}
const record=(t:Target,field:string,value:unknown,clock:Clock,ttlHours:number,extra:Partial<Observation>={}):Observation=>({
 projectId:t.productId,field,value,truth:'observed',
 source:{adapter:'local-git',resource:t.path},   // the DECLARED path, never the expanded one
 observedAt:clock.now,collectedAt:clock.now,
 expiresAt:new Date(Date.parse(clock.now)+ttlHours*3600_000).toISOString().replace(/\.\d+Z$/,'Z'),
 status:'ok',...extra,
});
export function observeTarget(target:Target,home:string,clock:Clock,ttlHours:number,options:RunOptions={}):Observation[]{
 const fail=(status:'error'|'unknown',reason:string)=>[record(target,'repository',null,clock,ttlHours,{truth:status==='error'?'unknown':'unknown',status,reason})];
 const resolved=resolveTarget(target,home,options);
 if(!resolved.ok)return fail(resolved.status==='missing'||resolved.status==='not_a_repo'?'unknown':'error',resolved.reason);
 const root=runGit('root',resolved.dir,options);
 if(!root.ok)return fail('error',root.reason);
 if(resolve(root.stdout.trim())!==resolved.dir)return fail('unknown','path is inside another repository; list the repository root');
 const out:Observation[]=[];
 const head=runGit('head',resolved.dir,options);
 if(!head.ok)return fail('error',head.reason);
 out.push(record(target,'head_sha',head.stdout.trim(),clock,ttlHours));
 const branch=runGit('branch',resolved.dir,options);
 out.push(branch.ok?record(target,'branch',branch.stdout.trim(),clock,ttlHours):record(target,'branch',null,clock,ttlHours,{truth:'unknown',status:'error',reason:branch.reason}));
 const status=runGit('status',resolved.dir,options);
 out.push(status.ok?record(target,'working_tree',summarizeStatus(status.stdout),clock,ttlHours):record(target,'working_tree',null,clock,ttlHours,{truth:'unknown',status:'error',reason:status.reason}));
 const remotes=runGit('remotes',resolved.dir,options);
 out.push(remotes.ok?record(target,'remote_names',remoteNames(remotes.stdout),clock,ttlHours):record(target,'remote_names',null,clock,ttlHours,{truth:'unknown',status:'error',reason:remotes.reason}));
 return out;
}

// ---------- a whole run: validate every record, then write atomically into ignored work/
export interface RunReport {file:string;records:Observation[];rejected:Rejection[];targets:number}
export function observeAll(allowlist:Allowlist,home:string,clock:Clock,options:RunOptions={}):{records:Observation[];rejected:Rejection[]}{
 const records:Observation[]=[],rejected:Rejection[]=[];
 allowlist.targets.flatMap(t=>observeTarget(t,home,clock,allowlist.defaultTtlHours,{timeoutMs:allowlist.timeoutMs,...options}))
  .forEach((o,i)=>{const v=validateObservation(o,i);v.ok?records.push(v.value):rejected.push(v.error);});
 return {records,rejected};
}
// Atomic: a temporary file in the same ignored directory, then a rename. A half-written file is
// never visible to the build, and nothing outside work/observations/ is ever touched.
export function writeObservations(repoRoot:string,payload:unknown,fileName=OUTPUT_FILE):string{
 const dir=join(repoRoot,OUTPUT_DIR);
 const target=join(dir,fileName);
 if(!target.startsWith(join(repoRoot,OUTPUT_DIR)+sep))throw new Error('refused: observations may only be written inside work/observations/');
 mkdirSync(dir,{recursive:true});
 const tmp=join(dir,`.${fileName}.tmp-${process.pid}`);
 try{writeFileSync(tmp,JSON.stringify(payload,null,2)+'\n',{mode:0o600});renameSync(tmp,target);}
 finally{rmSync(tmp,{force:true});}
 return target;
}
