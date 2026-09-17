// OG-OBS-001 — owner-run local Git observer. Every test runs against throw-away repositories
// created in the system temp directory; nothing outside them is read or written.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync,readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {loadAllowlist,resolveTarget,runGit,observeTarget,observeAll,writeObservations,summarizeStatus,
 remoteNames,gitCommands,gitHardening,gitEnv,forbiddenGitVerbs,OUTPUT_DIR,OUTPUT_FILE,
 type Allowlist,type Target} from '../src/observe.ts';
import {validateObservation,readObservation,evaluateDrift,type Observation} from '../src/truth.ts';

const NOW='2026-09-17T12:00:00Z';
const clock={now:NOW};
const roots:string[]=[];
const scratch=(name:string)=>{const d=mkdtempSync(join(tmpdir(),`octopusg-${name}-`));roots.push(d);return d;};
const git=(dir:string,args:string[])=>execFileSync('git',['-c','user.name=fixture','-c','user.email=fixture@example.invalid','-C',dir,...args],
 {encoding:'utf8',env:{PATH:process.env.PATH??'/usr/bin:/bin',HOME:dir,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0'}});
function fixtureRepo(name:string,{dirty=false,remote=false}={}):string{
 const dir=scratch(name);
 git(dir,['init','-q','-b','main']);
 writeFileSync(join(dir,'kept.txt'),'tracked content\n');
 git(dir,['add','kept.txt']);
 git(dir,['commit','-q','-m','fixture commit']);
 if(remote)git(dir,['remote','add','origin','https://example.invalid/private-secret-name.git']);
 if(dirty){writeFileSync(join(dir,'kept.txt'),'edited\n');writeFileSync(join(dir,'confidential-filename.txt'),'untracked\n');}
 return dir;
}
// A content+metadata fingerprint of every path, so "unchanged" means byte-for-byte and ref-for-ref.
function fingerprint(dir:string):string[]{
 const out:string[]=[];
 const walk=(current:string)=>{
  for(const entry of readdirSync(current,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   const path=join(current,entry.name);
   if(entry.isDirectory()){walk(path);continue;}
   const stat=statSync(path);
   out.push(`${relative(dir,path)} ${stat.size} ${stat.mtimeMs} ${createHash('sha256').update(readFileSync(path)).digest('hex')}`);
  }
 };
 walk(dir);
 return out;
}
const target=(dir:string,productId='fixture'):Target=>({productId,path:dir});
const allowlist=(targets:Target[]):Allowlist=>({schemaVersion:1,deviceId:'personal-mac',defaultTtlHours:24,timeoutMs:5000,targets});
const field=(records:Observation[],name:string)=>records.find(r=>r.field===name)!;
test.after(()=>{for(const d of roots)rmSync(d,{recursive:true,force:true});});

// ---------- positive observation
test('an explicitly allowed clean repository yields head, branch, clean tree and remote names',()=>{
 const dir=fixtureRepo('clean',{remote:true});
 const records=observeTarget(target(dir),'/nonexistent',clock,24);
 assert.deepEqual(records.map(r=>r.field),['head_sha','branch','working_tree','remote_names']);
 for(const r of records){
  assert.equal(r.status,'ok');
  assert.equal(r.truth,'observed');
  assert.equal(r.source.adapter,'local-git');
  assert.equal(r.source.resource,dir);            // the declared path, verbatim
  assert.equal(r.observedAt,NOW);
  assert.equal(r.expiresAt,'2026-09-18T12:00:00Z');
  assert.equal(validateObservation(r,0).ok,true); // every record passes the WP-02 store
 }
 assert.match(String(field(records,'head_sha').value),/^[0-9a-f]{40}$/);
 assert.equal(field(records,'branch').value,'main');
 assert.deepEqual(field(records,'working_tree').value,{clean:true,staged:0,unstaged:0,untracked:0});
 assert.deepEqual(field(records,'remote_names').value,['origin']);
});
test('a dirty repository is counted, never itemised, and no remote URL is ever stored',()=>{
 const dir=fixtureRepo('dirty',{dirty:true,remote:true});
 const records=observeTarget(target(dir),'/nonexistent',clock,24);
 assert.deepEqual(field(records,'working_tree').value,{clean:false,staged:0,unstaged:1,untracked:1});
 const serialized=JSON.stringify(records);
 assert.ok(!serialized.includes('confidential-filename.txt'),'untracked filenames must not be stored');
 assert.ok(!serialized.includes('kept.txt'),'tracked filenames must not be stored');
 assert.ok(!serialized.includes('tracked content')&&!serialized.includes('edited'),'file contents must not be stored');
 assert.ok(!serialized.includes('example.invalid')&&!serialized.includes('private-secret-name'),'remote URLs must not be stored');
 assert.deepEqual(summarizeStatus(' M a\n?? b\nA  c\nMM d\n'),{clean:false,staged:2,unstaged:2,untracked:1});
 assert.deepEqual(remoteNames('upstream\norigin\n'),['origin','upstream']);
});
test('the observed repository is byte-for-byte and ref-for-ref unchanged, including .git/index',()=>{
 const dir=fixtureRepo('unchanged',{dirty:true,remote:true});
 const before=fingerprint(dir),refsBefore=git(dir,['show-ref']);
 observeTarget(target(dir),'/nonexistent',clock,24);
 observeTarget(target(dir),'/nonexistent',clock,24);   // twice: a second run must not settle anything either
 assert.deepEqual(fingerprint(dir),before);
 assert.equal(git(dir,['show-ref']),refsBefore);
 assert.equal(git(dir,['status','--porcelain=v1']).split('\n').filter(Boolean).length,2);
});

// ---------- allowlist rejections
test('only listed paths are read, and unsafe entries never reach the observer',()=>{
 const listed=fixtureRepo('listed'),unlisted=fixtureRepo('unlisted');
 const before=fingerprint(unlisted);
 const {records}=observeAll(allowlist([target(listed,'listed')]),'/nonexistent',clock);
 assert.deepEqual([...new Set(records.map(r=>r.projectId))],['listed']);
 assert.ok(!JSON.stringify(records).includes(unlisted),'an unlisted repository is never named');
 assert.deepEqual(fingerprint(unlisted),before,'an unlisted repository is never touched');
 const cases:[unknown,RegExp][]=[
  [{...allowlist([]),targets:[{productId:'x',path:'~/Projects/../../etc'}]},/path may not contain \.\./],
  [{...allowlist([]),targets:[{productId:'x',path:'~/Projects/*/repo'}]},/globs are not allowed/],
  [{...allowlist([]),targets:[{productId:'x',path:'relative/path'}]},/must be absolute or start with ~\//],
  [{...allowlist([]),targets:[{productId:'x',path:'/a'},{productId:'y',path:'/a'}]},/duplicate path/],
  [{...allowlist([]),targets:[{productId:'x',path:'/a',extra:1}]},/unknown field extra/],
  [{...allowlist([]),targets:[{path:'/a'}]},/productId must be a non-empty string/],
  [{...allowlist([]),deviceId:''},/deviceId must name a device/],
  [{...allowlist([]),timeoutMs:120000},/timeoutMs must be between/],
  [{...allowlist([]),defaultTtlHours:0},/defaultTtlHours must be between/],
  [{...allowlist([]),schemaVersion:2},/schemaVersion must be 1/],
  [null,/not an object/],
 ];
 for(const [raw,re] of cases)assert.throws(()=>loadAllowlist(raw,'fixture'),re);
});
test('symlink escape, missing paths, non-repositories and subdirectories are refused',()=>{
 const real=fixtureRepo('real'),parent=scratch('links');
 const link=join(parent,'link-to-repo');
 symlinkSync(real,link);
 const escaped=resolveTarget({productId:'x',path:link},'/nonexistent');
 assert.equal(escaped.ok,false);
 if(!escaped.ok)assert.match(escaped.reason,/symlink escape/);
 const missing=observeTarget({productId:'x',path:join(parent,'does-not-exist')},'/nonexistent',clock,24);
 assert.equal(missing[0].status,'unknown');
 assert.match(missing[0].reason!,/path does not exist/);
 const plain=scratch('plain');
 const notRepo=observeTarget(target(plain),'/nonexistent',clock,24);
 assert.match(notRepo[0].reason!,/no \.git entry at this path/);
 mkdirSync(join(real,'nested'));
 const nested=observeTarget({productId:'x',path:join(real,'nested')},'/nonexistent',clock,24);
 assert.match(nested[0].reason!,/no \.git entry at this path/);   // a subdirectory of a repository is not a target
 // and if a .git entry pointed at another repository, the root check refuses it too
 const fakeBin=scratch('fakegit');
 const fakeGit=join(fakeBin,'git');
 writeFileSync(fakeGit,'#!/bin/sh\necho /somewhere/else\n',{mode:0o755});
 const elsewhere=observeTarget(target(real),'/nonexistent',clock,24,{gitBin:fakeGit});
 assert.match(elsewhere[0].reason!,/list the repository root/);
 for(const r of [...missing,...notRepo,...nested,...elsewhere]){
  assert.equal(r.value,null);
  assert.equal(r.truth,'unknown');
  assert.equal(validateObservation(r,0).ok,true);
 }
});
test('a Git command that overruns its timeout is reported, not waited on',()=>{
 const bin=scratch('slow');
 const slowGit=join(bin,'git');
 writeFileSync(slowGit,'#!/bin/sh\nsleep 10\n',{mode:0o755});
 const dir=fixtureRepo('timeout');
 const started=Date.now();
 const result=runGit('head',dir,{gitBin:slowGit,timeoutMs:300});
 assert.equal(result.ok,false);
 if(!result.ok)assert.match(result.reason,/exceeded the 300 ms timeout/);
 assert.ok(Date.now()-started<9000,'the timeout must cut the command short');
 const records=observeTarget(target(dir),'/nonexistent',clock,24,{gitBin:slowGit,timeoutMs:300});
 assert.equal(records[0].status,'error');
 assert.equal(records[0].value,null);
});

// ---------- the command surface itself
test('the permitted command set is read-only, local and free of network verbs',()=>{
 const all=Object.values(gitCommands).flat() as string[];
 for(const verb of forbiddenGitVerbs)assert.ok(!all.includes(verb),`${verb} must never be a permitted command`);
 assert.deepEqual(Object.keys(gitCommands),['root','head','branch','status','remotes']);
 assert.deepEqual(gitCommands.remotes,['remote']);          // names only: `remote -v` would print URLs
 assert.deepEqual(gitCommands.status,['status','--porcelain=v1']);
 assert.ok(!all.some(a=>/https?:|git@|--all|-v$/.test(a)));
 const env=gitEnv('/home/fixture','/usr/bin');
 assert.equal(env.GIT_OPTIONAL_LOCKS,'0');                  // never rewrite .git/index
 assert.equal(env.GIT_TERMINAL_PROMPT,'0');
 assert.equal(env.GIT_ALLOW_PROTOCOL,'');
 assert.deepEqual(Object.keys(env).sort(),['GIT_ALLOW_PROTOCOL','GIT_CONFIG_NOSYSTEM','GIT_OPTIONAL_LOCKS','GIT_TERMINAL_PROMPT','HOME','PATH']);
 assert.ok(gitHardening.includes('core.hooksPath=/dev/null'),'repository hooks must not run');
 assert.ok(gitHardening.includes('core.fsmonitor=false'));
});

// ---------- output: ignored directory, atomic, nothing else written
test('a run writes only work/observations/latest.json, atomically',()=>{
 const repoRoot=scratch('output');
 mkdirSync(join(repoRoot,'src'));
 writeFileSync(join(repoRoot,'src/keep.ts'),'export const x=1;\n');
 const before=fingerprint(repoRoot);
 const dir=fixtureRepo('outputsource');
 const {records,rejected}=observeAll(allowlist([target(dir)]),'/nonexistent',clock);
 assert.deepEqual(rejected,[]);
 const file=writeObservations(repoRoot,{schemaVersion:1,collector:'tests/observe.test.ts',collectedAt:NOW,observations:records});
 assert.equal(file,join(repoRoot,OUTPUT_DIR,OUTPUT_FILE));
 const after=fingerprint(repoRoot);
 const added=after.filter(line=>!before.includes(line)).map(line=>line.split(' ')[0]);
 assert.deepEqual(added,[join(OUTPUT_DIR,OUTPUT_FILE)],'nothing outside the ignored observations file is written');
 assert.deepEqual(readdirSync(join(repoRoot,OUTPUT_DIR)),[OUTPUT_FILE],'no temporary file is left behind');
 assert.equal(statSync(file).mode&0o777,0o600);
 assert.equal(JSON.parse(readFileSync(file,'utf8')).observations.length,records.length);
 writeObservations(repoRoot,{schemaVersion:1,collector:'again',collectedAt:NOW,observations:[]});
 assert.equal(JSON.parse(readFileSync(file,'utf8')).collector,'again','the rename replaces the file in one step');
 assert.throws(()=>writeObservations(repoRoot,{},'../escape.json'),/may only be written inside work\/observations/);
 assert.ok(existsSync(file));
});
test('an observed HEAD flows into the WP-02 truth model and its drift derivation',()=>{
 const dir=fixtureRepo('drift');
 const records=observeAll(allowlist([target(dir,'dayos')]),'/nonexistent',clock).records;
 const head=field(records,'head_sha');
 assert.equal(readObservation(head,'projects[dayos]',NOW).freshness,'fresh');
 assert.equal(readObservation(head,'projects[dayos]',NOW).confidence,'high');
 const match=evaluateDrift({value:String(head.value),source:'projects[dayos].git_state.head'},head,NOW);
 assert.equal(match.status,'match');
 assert.equal(match.truth,'derived');
 assert.equal(evaluateDrift({value:'0'.repeat(40),source:'projects[dayos].git_state.head'},head,NOW).status,'drift');
 // a day later the same record is stale, and staleness is never hidden
 assert.equal(readObservation(head,'projects[dayos]',NOW.replace('-17T','-19T')).freshness,'stale');
 assert.match(evaluateDrift({value:String(head.value),source:'s'},head,NOW.replace('-17T','-19T')).state,/stale/);
});
test('the shipped allowlist lists only an explicitly marked example and no user name',()=>{
 const raw=readFileSync('config/observe.allowlist.json','utf8');
 const shipped=loadAllowlist(JSON.parse(raw),'config/observe.allowlist.json');
 assert.equal(shipped.deviceId,'personal-mac');
 assert.equal(shipped.targets.length,1);
 assert.equal(shipped.targets[0].path,'~/Projects/agoraxai/control-plane');
 assert.match(shipped.targets[0].note!,/EXAMPLE/);
 assert.ok(!/\/Users\/|\/home\/|C:\\Users/.test(raw),'no machine-specific path may be committed');
});
