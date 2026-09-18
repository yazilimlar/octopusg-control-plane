import {build} from 'esbuild';
import {mkdir,copyFile,readdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/main.ts'],bundle:true,outdir:'dist',format:'esm',minify:true,sourcemap:false,legalComments:'none'});
await copyFile('public/index.html','dist/index.html');
await copyFile('public/favicon.svg','dist/favicon.svg');
// Brand assets (OG-UI-007). Copied verbatim from public/brand/; nothing is generated or fetched
// at build time, and the master in assets/brand/ is never served.
await mkdir('dist/brand',{recursive:true});
for(const file of await readdir('public/brand'))await copyFile(`public/brand/${file}`,`dist/brand/${file}`);
console.log('Built static application. No environment-file loader, remote integration, or deployment.');
