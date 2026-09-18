// OG-UI-007 — the brand asset record must describe the files that are actually there.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadBrandManifest,brandAssets,brandAlt,tagline,productName,productLine,isLocalAsset,forbiddenClaims} from '../src/brand.ts';

const raw=JSON.parse(readFileSync('assets/brand/BRAND-ASSETS.json','utf8'));
const manifest=loadBrandManifest(raw,'assets/brand/BRAND-ASSETS.json');
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
// Minimal PNG reader: signature, then the IHDR width, height and colour type.
function png(path:string){
 const b=readFileSync(path);
 assert.deepEqual([...b.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],`${path} is a PNG`);
 assert.equal(b.subarray(12,16).toString('latin1'),'IHDR',`${path} starts with IHDR`);
 const chunks:string[]=[];
 for(let i=8;i+8<=b.length;){
  const length=b.readUInt32BE(i);const type=b.subarray(i+4,i+8).toString('latin1');
  chunks.push(type);i+=12+length;
  if(type==='IEND')break;
 }
 return {width:b.readUInt32BE(16),height:b.readUInt32BE(20),colourType:b[25]!,bytes:b.length,chunks};
}

test('every recorded asset exists and matches its hash, size and dimensions',()=>{
 for(const record of [manifest.master,...manifest.derivatives]){
  const actual=png(record.path);
  assert.equal(sha(record.path),record.sha256,`${record.path} hash`);
  assert.equal(statSync(record.path).size,record.bytes,`${record.path} byte size`);
  assert.equal(actual.width,record.width,`${record.path} width`);
  assert.equal(actual.height,record.height,`${record.path} height`);
  // colour type 6 is truecolour with alpha; 4 is greyscale with alpha
  assert.equal(record.transparency,actual.colourType===6||actual.colourType===4,`${record.path} transparency`);
 }
});

test('the master is preserved and never served; derivatives are optimized and metadata-free',()=>{
 assert.equal(manifest.master.path,'assets/brand/octopusg-logo-master.png');
 assert.equal(manifest.master.width,1254);
 assert.equal(manifest.master.height,1254);
 assert.ok(manifest.master.metadata.length>0,'the master keeps its own metadata');
 for(const d of manifest.derivatives){
  assert.ok(d.path.startsWith('public/brand/'),`${d.path} is served from public/brand/`);
  assert.ok(d.bytes<manifest.master.bytes,`${d.path} is smaller than the master`);
  // no ancillary metadata chunks survive in a served file
  const {chunks}=png(d.path);
  for(const unwanted of ['eXIf','tEXt','iTXt','zTXt','iCCP','tIME'])
   assert.ok(!chunks.includes(unwanted),`${d.path} must not carry ${unwanted}`);
 }
 // the master still carries what the owner's file carried
 assert.ok(png(manifest.master.path).chunks.some(c=>['eXIf','sRGB','iCCP','tEXt'].includes(c)),'the master was not re-encoded');
});

test('every asset the interface references is recorded and served locally',()=>{
 const recorded=new Set(manifest.derivatives.map(d=>'/'+d.path.replace(/^public\//,'')));
 for(const [name,path] of Object.entries(brandAssets)){
  assert.ok(isLocalAsset(path),`${name} must be a local path, not a URL`);
  assert.ok(recorded.has(path),`${name} (${path}) must be a recorded derivative`);
  assert.doesNotMatch(path,/^https?:|^\/\//,'no asset is fetched from anywhere');
 }
 assert.equal(Object.keys(brandAssets).length,manifest.derivatives.length,'only the minimum derivatives exist');
});

test('the tagline is the owner-approved wording and is absent from compact contexts',()=>{
 assert.equal(tagline,'Architect-Engineer of Complex Systems');
 assert.equal(manifest.tagline,tagline);
 assert.equal(productName,'OctopusG');
 assert.equal(productLine,'AgoraXAI Portfolio Operating System');
 // the lockup announces the tagline; the compact symbol and favicon are decorative
 assert.equal(brandAlt.logo,`${productName} — ${tagline}`);
 assert.equal(brandAlt.symbol,'');
 assert.equal(brandAlt.favicon,'');
});

test('provenance records what the owner said and claims nothing more',()=>{
 const p=manifest.provenance as Record<string,unknown>;
 assert.equal(p.supplied_by,'owner');
 assert.match(String(p.origin),/ChatGPT image-generation/);
 assert.match(String(p.classification),/proprietary project brand asset/i);
 assert.deepEqual(p.not_claimed,['third-party authorship','third-party licensing','copyright registration','legal exclusivity']);
 assert.equal(p.source,'S6#owner-brand-decisions');
 assert.match(String(p.decision_record),/^docs\/decisions\/ADR-\d{4}-/);
 // the record is honest about what it does not know
 assert.match(String(p.original_attachment_filename),/not recoverable/);
 // and a licence claim is refused if one is ever added
 const withLicence={...raw,provenance:{...raw.provenance,licence:'MIT'}};
 assert.throws(()=>loadBrandManifest(withLicence,'fixture'),/must not claim third-party licensing/);
 assert.ok(forbiddenClaims.length>=4);
});

test('the validator refuses a record that drifts from the rules',()=>{
 const clone=()=>JSON.parse(JSON.stringify(raw));
 const cases:[string,(m:any)=>void,RegExp][]=[
  ['a changed tagline',m=>{m.tagline='Complex systems, architected';},/tagline must match/],
  ['a served master',m=>{m.master.path='public/brand/master.png';},/master lives outside/],
  ['a derivative outside public/brand',m=>{m.derivatives[0].path='src/logo.png';},/belongs in public\/brand/],
  ['metadata left in a served file',m=>{m.derivatives[0].metadata=['exif'];},/must carry no metadata/],
  ['a derivative bigger than the master',m=>{m.derivatives[0].bytes=m.master.bytes+1;},/not optimized/],
  ['a missing provenance field',m=>{delete m.provenance.origin;},/provenance is missing origin/],
  ['a non-owner asset',m=>{m.provenance.supplied_by='vendor';},/only an owner-supplied asset/],
  ['a short derivation',m=>{m.derivatives[0].derivation='crop';},/derivation must say/],
  ['an unknown field',m=>{m.derivatives[0].licence='MIT';},/unknown field licence/],
  ['a bad hash',m=>{m.derivatives[0].sha256='nope';},/64 hex characters/],
 ];
 for(const [name,mutate,message] of cases){
  const bad=clone();mutate(bad);
  assert.throws(()=>loadBrandManifest(bad,'fixture'),message,name);
 }
});

test('branding changes nothing semantic and nothing stored',()=>{
 const css=readFileSync('src/style.css','utf8');
 const main=readFileSync('src/main.ts','utf8');
 // the storage key and the schema codename are untouched (OD-08)
 assert.ok(main.includes("'agoraxai.octopus.workflow.v1'"),'the localStorage key is unchanged');
 assert.equal(JSON.parse(readFileSync('data/schema.json','utf8')).properties.classification.properties.codename.const,'Octopus','the schema codename constant is unchanged');
 assert.equal(JSON.parse(readFileSync('data/snapshot.json','utf8')).classification.codename,'Octopus','the snapshot still classifies as Octopus');
 // semantic colour classes still exist and were not folded into brand colours
 for(const selector of ['.c-risk-high','.c-truth-observed','.badge.blocked','.badge.observed'])
  assert.ok(css.includes(selector),`${selector} must survive the brand change`);
 // the brand module holds no colour at all, so it cannot leak into an encoding
 assert.doesNotMatch(readFileSync('src/brand.ts','utf8'),/#[0-9a-f]{3,8}\b/i,'the brand module defines no colour');
});
