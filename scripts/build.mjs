import {build} from 'esbuild';
import {mkdir,copyFile,readdir,readFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
// Local observations (OG-DATA-002) reach the local bundle from the git-ignored overlay written by
// scripts/import-registry.mjs, never from the tracked snapshot. No overlay means no observations.
const empty={present:false,source:'work/observations/latest.json',collector:null,collectedAt:null,records:[],rejected:[]};
const overlay=await readFile('work/observations/snapshot-observations.json','utf8').then(JSON.parse,error=>{if(error.code==='ENOENT')return empty;throw error;});
await build({entryPoints:['src/main.ts'],bundle:true,outdir:'dist',format:'esm',minify:true,sourcemap:false,legalComments:'none',define:{__OCTOPUSG_LOCAL_OBSERVATIONS__:JSON.stringify(overlay)}});
await copyFile('public/index.html','dist/index.html');
await copyFile('public/favicon.svg','dist/favicon.svg');
// Brand assets (OG-UI-007). Copied verbatim from public/brand/; nothing is generated or fetched
// at build time, and the master in assets/brand/ is never served.
await mkdir('dist/brand',{recursive:true});
for(const file of await readdir('public/brand'))await copyFile(`public/brand/${file}`,`dist/brand/${file}`);
console.log('Built static application. No environment-file loader, remote integration, or deployment.');
