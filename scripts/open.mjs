// Owner-run folder opener (OG-ACT-001). Local-only, no network, no shell.
//   npm run open -- <product-id>
// It accepts a PRODUCT ID, never a path. The path comes from
// config/observe.allowlist.json — the same explicit allowlist the observer uses — is resolved
// canonically (so a symlink cannot redirect it), must still be a Git repository, and is handed
// to the platform's own opener as a single argument with no shell involved. Nothing is written,
// read from, or reported about the repository.
import {readFile} from 'node:fs/promises';
import {homedir, platform} from 'node:os';
import {execFileSync} from 'node:child_process';
import {loadAllowlist,resolveTarget} from '../src/observe.ts';
import {loadDevices,canObserve} from '../src/devices.ts';
import {loadPolicy} from '../src/policy.ts';

// One opener per platform, chosen by name — never assembled from input.
export const openers={darwin:'/usr/bin/open',linux:'/usr/bin/xdg-open',win32:'explorer.exe'};

const read=async(path)=>{
 const text=await readFile(path,'utf8').catch(error=>{throw new Error(`${path}: ${error.code==='ENOENT'?'missing':error.message}`);});
 try{return JSON.parse(text);}catch(error){throw new Error(`${path} is not valid JSON: ${error.message}`);}
};
const args=process.argv.slice(2);
if(args.length!==1||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args[0]))
 throw new Error('usage: npm run open -- <product-id>   (a product id from the allowlist; a path is never accepted)');
const [productId]=args;

const policy=loadPolicy(await read('config/policy.json'),'config/policy.json');
const devices=loadDevices(await read('config/devices.json'),policy,'config/devices.json');
const allowlist=loadAllowlist(await read('config/observe.allowlist.json'),'config/observe.allowlist.json');
// The same device gate as observation: an employer-owned or unenrolled device opens nothing.
const permitted=canObserve(devices,policy,allowlist.deviceId);
if(!permitted.ok)throw new Error(`refused: ${permitted.reason}`);

const target=allowlist.targets.find(t=>t.productId===productId);
if(!target)throw new Error(`refused: ${productId} is not in config/observe.allowlist.json. Add it there first; OctopusG never opens a path that is not listed.`);
const resolved=resolveTarget(target,homedir());
if(!resolved.ok)throw new Error(`refused: ${resolved.reason}`);

const opener=openers[platform()];
if(!opener)throw new Error(`refused: no known folder opener for ${platform()}`);
execFileSync(opener,[resolved.dir],{stdio:'ignore',timeout:5000});
console.log(`Opened the allowlisted repository for ${productId} in your file manager.`);
console.log('Nothing was read from it, written to it, or recorded. Path not printed.');
