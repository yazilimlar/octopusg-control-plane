import http from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.argv[2]||4317);
const files={'/':['dist/index.html','text/html; charset=utf-8'],'/index.html':['dist/index.html','text/html; charset=utf-8'],'/main.js':['dist/main.js','text/javascript'],'/main.css':['dist/main.css','text/css'],'/favicon.svg':['dist/favicon.svg','image/svg+xml'],'/brand/favicon.png':['dist/brand/favicon.png','image/png'],'/brand/octopusg-symbol.png':['dist/brand/octopusg-symbol.png','image/png'],'/brand/octopusg-logo.png':['dist/brand/octopusg-logo.png','image/png']};
const csp="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
http.createServer(async(req,res)=>{
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host||'')){res.writeHead(403);return res.end('Loopback host required');}
  res.setHeader('Content-Security-Policy',csp);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Read-only static server');}
  const file=files[(req.url||'').split('?')[0]];
  if(!file){res.writeHead(404);return res.end('Not found');}
  try{const content=await readFile(file[0]);res.setHeader('Content-Type',file[1]);res.writeHead(200);res.end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(500);res.end('Run npm run build first');}
}).listen(port,'127.0.0.1',()=>console.log(`Octopus local preview: http://127.0.0.1:${port}`));
