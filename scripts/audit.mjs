import {readdir,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {assertApprovedRemoteSet} from './audit-remotes.mjs';
const files=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules','work'].includes(item.name))continue;const path=dir+'/'+item.name;if(/^\.env(?:\.|$)|\.(?:pem|key)$/.test(item.name))throw Error('Forbidden secret-bearing filename: '+path);if(item.isDirectory())await walk(path);else files.push(path);}}
await walk('.');
const patterns=[/gh[pousr]_[A-Za-z0-9]{30,}/g,/sk_(?:live|test)_[A-Za-z0-9]{20,}/g,/AKIA[A-Z0-9]{16}/g,/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,/https?:\/\/[^\s/:]+:[^\s/@]+@/g,/\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{20,}/gi];
let matches=0;
for(const file of files){const content=await readFile(file,'utf8');let count=0;for(const re of patterns)count+=[...content.matchAll(re)].length;if(count){console.log(`Secret-shaped content: ${file} (${count} matches; values suppressed)`);matches+=count;}}
assert.equal(matches,0,'Secret-shaped content must be reviewed');
const app=await readFile('dist/main.js','utf8');assert.ok(!/\bfetch\s*\(|XMLHttpRequest|new WebSocket|sendBeacon\s*\(/.test(app),'No browser network client allowed');
const server=await readFile('scripts/serve.mjs','utf8');assert.ok(server.includes("'127.0.0.1'"));assert.ok(server.includes("connect-src 'none'"));assert.ok(server.includes('Read-only static server'));
const remoteNames=execFileSync('git',['remote'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assertApprovedRemoteSet(remoteNames,name=>execFileSync('git',['remote','get-url',name],{encoding:'utf8'}).trim());
console.log(`PASS local audit: ${files.length} files scanned; 0 credential-pattern matches; no .env/key files; no browser network clients; loopback server; CSP blocks connections; remote set is ${remoteNames.length===0?'empty':'the one approved origin'}.`);
console.log('Pattern scan is scoped to this deliverable and is not a proof that every conceivable secret format is absent. No external repositories or environment files were scanned.');
