import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/main.ts'],bundle:true,outdir:'dist',format:'esm',minify:true,sourcemap:false,legalComments:'none'});
await copyFile('public/index.html','dist/index.html');
await copyFile('public/favicon.svg','dist/favicon.svg');
console.log('Built static application. No environment-file loader, remote integration, or deployment.');
