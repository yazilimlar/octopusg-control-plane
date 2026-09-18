// OG-ACT-001 — safe open actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeHttpsUrl,repoPage,openActions,linkAttributes,openSummary} from '../src/open.ts';
import {normalize,type Raw} from '../src/model.ts';

const snapshot=JSON.parse(readFileSync('data/snapshot.json','utf8'));
const registry=snapshot.registry as Raw;
const projects=(registry.projects as Raw[]).map(p=>normalize(p,registry));
const actionsFor=(id:string)=>openActions(projects.find(p=>p.id===id)!,registry);

test('only https, credential-free, query-free URLs are ever linkable',()=>{
 assert.equal(safeHttpsUrl('https://agoraxai.com'),'https://agoraxai.com/');
 for(const bad of [
  'http://agoraxai.com',                       // not https
  'file:///Users/someone/Projects',            // not a web URL
  'javascript:alert(1)',                       // not a web URL
  'https'+'://user:secret@agoraxai.com',       // credentials in the URL
  'https://agoraxai.com:8443',                 // non-default port
  'https://agoraxai.com/?path=/Users/someone', // a query could carry workspace data
  'https://agoraxai.com/#/Users/someone',      // so could a fragment
  'https://localhost','https://10.0.0.5','',null,undefined,42,
 ])assert.equal(safeHttpsUrl(bad as unknown),null,`${String(bad)} must not be linkable`);
});

test('a repository page is derived from the recorded remote, never invented',()=>{
 assert.equal(repoPage('git@github.com:yazilimlar/artemis-omni.git'),'https://github.com/yazilimlar/artemis-omni');
 assert.equal(repoPage('https://github.com/yazilimlar/artemis-omni'),'https://github.com/yazilimlar/artemis-omni');
 for(const bad of ['','not a remote',null,undefined,'ssh://evil','git@github.com:'])assert.equal(repoPage(bad as unknown),null);
 // a product with no recorded remote gets no repository link at all
 assert.equal(actionsFor('agoraxai-web').filter(a=>a.label==='Open repository').length,0);
});

test('every action carries its truth kind and its source path',()=>{
 let seen=0;
 for(const project of projects)for(const action of openActions(project,registry)){
  seen++;
  assert.ok(['declared','observed','derived'].includes(action.truth),`${project.id} ${action.label} truth`);
  assert.ok(action.source.length>0&&action.note.length>20);
  assert.match(openSummary(action),/\((declared|observed|derived)(, not a link)?\)/);
 }
 assert.ok(seen>0);
});

test('website links come from the registry and claim nothing about liveness',()=>{
 const site=actionsFor('agoraxai-web').find(a=>a.kind==='website')!;
 assert.equal(site.href,'https://agoraxai.com/');
 assert.equal(site.truth,'declared');
 assert.match(site.source,/intended_url$/);
 assert.match(site.note,/says nothing about whether it is live/);
 // a product that declares no URL gets no website action
 assert.equal(actionsFor('artemis-omni').filter(a=>a.kind==='website').length,0);
});

test('a folder is never a link: it is text plus a copy, and it names the owner-run command',()=>{
 const folders=projects.flatMap(p=>openActions(p,registry)).filter(a=>a.kind==='folder');
 assert.ok(folders.length>0);
 for(const f of folders){
  assert.equal(f.href,null,'a folder action is never linkable');
  assert.doesNotMatch(f.text,/^https?:|^file:/,'a path is not a URL');
  assert.match(f.note,/npm run open -- /);
 }
 assert.deepEqual(linkAttributes,{rel:'noopener noreferrer',target:'_blank'});
});

test('the opener takes a product id and only opens an allowlisted repository',()=>{
 const script=readFileSync('scripts/open.mjs','utf8');
 // it is driven by the allowlist, gated by the same device rule as observation, and resolved
 // canonically so a symlink cannot redirect it
 for(const required of ['config/observe.allowlist.json','canObserve','resolveTarget','execFileSync'])
  assert.ok(script.includes(required),`scripts/open.mjs must use ${required}`);
 // it never takes a path, never uses a shell, and never writes
 assert.match(script,/npm run open -- <product-id>/);
 assert.doesNotMatch(script,/shell\s*:\s*true|\bexec\(|execSync\(/,'no shell');
 assert.doesNotMatch(script,/writeFile|appendFile|\brm\(|\bunlink\(/,'the opener writes nothing');
 // the opener binaries are a fixed table, not built from input
 assert.match(script,/export const openers=\{darwin:'\/usr\/bin\/open',linux:'\/usr\/bin\/xdg-open',win32:'explorer\.exe'\}/);
 const pkg=JSON.parse(readFileSync('package.json','utf8'));
 assert.equal(pkg.scripts.open,'node scripts/open.mjs');
});

test('no open action introduces a network client into the application',()=>{
 const source=readFileSync('src/open.ts','utf8');
 for(const forbidden of [/\bfetch\s*\(/,/XMLHttpRequest/,/new WebSocket/,/sendBeacon/,/from ['"]node:https?['"]/])
  assert.doesNotMatch(source,forbidden);
});
