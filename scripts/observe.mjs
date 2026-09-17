// Owner-run local Git observer (OG-OBS-001). Read-only, local-only, no network.
//   npm run observe
// Reads config/observe.allowlist.json, runs the five permitted read-only Git commands against
// each explicitly listed repository, and writes work/observations/latest.json (git-ignored)
// through a temporary file and a rename. It never writes to an observed repository.
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {loadAllowlist,observeAll,writeObservations,gitCommands,OUTPUT_DIR,OUTPUT_FILE} from '../src/observe.ts';
import {loadDevices,canObserve} from '../src/devices.ts';
import {loadPolicy} from '../src/policy.ts';

const read=async(path)=>{
 const text=await readFile(path,'utf8').catch(error=>{throw new Error(`${path}: ${error.code==='ENOENT'?'missing':error.message}`);});
 try{return JSON.parse(text);}catch(error){throw new Error(`${path} is not valid JSON: ${error.message}`);}
};
const policy=loadPolicy(await read('config/policy.json'),'config/policy.json');
const devices=loadDevices(await read('config/devices.json'),policy,'config/devices.json');
const allowlist=loadAllowlist(await read('config/observe.allowlist.json'),'config/observe.allowlist.json');
const permitted=canObserve(devices,policy,allowlist.deviceId);
if(!permitted.ok)throw new Error(`config/observe.allowlist.json: ${permitted.reason}`);

const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
const {records,rejected}=observeAll(allowlist,homedir(),{now});
for(const r of rejected)console.log(`Rejected record #${r.index}: ${r.reason} (value not stored, not printed)`);
const file=writeObservations(process.cwd(),{schemaVersion:1,collector:'scripts/observe.mjs',collectedAt:now,observations:records});
const failed=records.filter(r=>r.status!=='ok').length;
console.log(`Observed ${allowlist.targets.length} allowlisted repositor${allowlist.targets.length===1?'y':'ies'} on ${permitted.reason}.`);
console.log(`Commands used (read-only, GIT_OPTIONAL_LOCKS=0): ${Object.values(gitCommands).map(a=>'git '+a.join(' ')).join(' · ')}.`);
console.log(`${records.length-failed} ok, ${failed} not ok, ${rejected.length} rejected → ${OUTPUT_DIR}/${OUTPUT_FILE} (git-ignored). Run npm run build to fold them into the app.`);
if(file!==`${process.cwd()}/${OUTPUT_DIR}/${OUTPUT_FILE}`)throw new Error('refused: output landed outside work/observations/');
