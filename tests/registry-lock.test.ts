// OG-REG-002 (single registry lock) and OG-REG-003 (registry v1.6 ingested).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const lock=JSON.parse(readFileSync('data/registry.lock.json','utf8'));
const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const sha=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const importer=resolve('scripts/import-registry.mjs');
const inputs=[lock.filename,'GATE_2D_REPORT.md','GATE_3_APPROVAL_CHECKLIST.md'];

// Runs the real importer in a throw-away directory so fault injection never touches data/.
function importIn(mutate:(dir:string)=>void){
 const dir=mkdtempSync(join(tmpdir(),'octopusg-lock-'));
 try{
  mkdirSync(join(dir,'data'));
  for(const f of [...inputs,'registry.lock.json'])copyFileSync(join('data',f),join(dir,'data',f));
  mutate(dir);
  try{execFileSync(process.execPath,[importer],{cwd:dir,env:{...process.env,OCTOPUSG_SNAPSHOT_MODE:'write'},stdio:'pipe'});return {ok:true,message:''};}
  catch(e:any){return {ok:false,message:String(e.stderr)};}
 }finally{rmSync(dir,{recursive:true,force:true});}
}
const editLock=(dir:string,patch:object)=>writeFileSync(join(dir,'data/registry.lock.json'),JSON.stringify({...lock,...patch}));

test('lock declares filename, version, sha256 and row count in valid form',()=>{
 assert.match(lock.filename,/^PROJECT_REGISTRY_v[0-9][0-9A-Za-z.-]*\.yaml$/);
 assert.equal(typeof lock.registry_version,'string');
 assert.match(lock.sha256,/^[a-f0-9]{64}$/);
 assert.ok(Number.isInteger(lock.project_row_count)&&lock.project_row_count>0);
});
test('pinned registry bytes match the lock and the snapshot was built from it',()=>{
 assert.equal(sha('data/'+lock.filename),lock.sha256);
 assert.deepEqual(snapshot.sources[0],{name:lock.filename,sha256:lock.sha256});
 assert.equal(snapshot.registry.registry_version,lock.registry_version);
 assert.equal(snapshot.registry.project_row_count,lock.project_row_count);
 assert.equal(snapshot.registry.projects.length,lock.project_row_count);
});
test('registry v1.6 is present byte-identical to the Gate 3B record; v1.5.1 stays as history',()=>{
 assert.equal(sha('data/PROJECT_REGISTRY_v1.6.yaml'),'494bd33e056350c15524a87fe73e9adc02bb6e8bfcd79ea4e801ec58f5b43286');
 assert.equal(sha('data/PROJECT_REGISTRY_v1.5.1.yaml'),'67e7980339a98f3291ba648fba97611c2d07cf2d4dbe33767508afff612d0071');
 for(const h of lock.history??[])assert.equal(sha('data/'+h.filename),h.sha256);
});
test('importer succeeds on an untouched copy',()=>{assert.deepEqual(importIn(()=>{}),{ok:true,message:''});});
test('a tampered registry fails the build and names the file',()=>{
 const r=importIn(dir=>writeFileSync(join(dir,'data',lock.filename),readFileSync(join('data',lock.filename),'utf8')+'\n# tampered\n'));
 assert.equal(r.ok,false);assert.match(r.message,new RegExp(`data/${lock.filename.replaceAll('.','\\.')} SHA-256 [a-f0-9]{64} does not match`));
});
test('a wrong expected hash in the lock fails the build and names the file',()=>{
 const r=importIn(dir=>editLock(dir,{sha256:'0'.repeat(64)}));
 assert.equal(r.ok,false);assert.match(r.message,new RegExp(`data/${lock.filename.replaceAll('.','\\.')} SHA-256`));
});
test('a row-count or version mismatch fails the build and names the file',()=>{
 for(const patch of [{project_row_count:lock.project_row_count+1},{registry_version:'0.0'}]){
  const r=importIn(dir=>editLock(dir,patch));
  assert.equal(r.ok,false);assert.match(r.message,new RegExp(`data/${lock.filename.replaceAll('.','\\.')}: expected registry`));
 }
});
test('a missing pinned file or a path-like filename is rejected',()=>{
 const missing=importIn(dir=>editLock(dir,{filename:'PROJECT_REGISTRY_v9.9.yaml'}));
 assert.equal(missing.ok,false);assert.match(missing.message,/data\/PROJECT_REGISTRY_v9\.9\.yaml is missing/);
 const traversal=importIn(dir=>editLock(dir,{filename:'../PROJECT_REGISTRY_v1.6.yaml'}));
 assert.equal(traversal.ok,false);assert.match(traversal.message,/registry\.lock\.json: filename must be/);
});
