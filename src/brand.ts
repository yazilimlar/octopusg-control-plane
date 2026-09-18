// Brand assets and the approved tagline (OG-UI-007).
// Pure module: it holds the paths the interface serves, the accessible text that goes with each,
// and the validator for the asset record. It fetches nothing — every file is served from the
// same loopback origin as the application, and the record in assets/brand/BRAND-ASSETS.json is
// checked against the real files by tests/brand.test.ts.
// Source: docs/sources/S6-2026-09-18-owner-brand-decisions.md#owner-brand-decisions,
// docs/decisions/ADR-0006-brand-asset-and-tagline.md.

export const productName='OctopusG';
export const productLine='AgoraXAI Portfolio Operating System';
// The owner-approved tagline. Shown where it stays legible; never in a compact header or a
// favicon (S6 #owner-brand-decisions, point 3).
export const tagline='Architect-Engineer of Complex Systems';

// Served paths, relative to the application root. All local; none is an absolute URL.
export const brandAssets={
 logo:'/brand/octopusg-logo.png',
 symbol:'/brand/octopusg-symbol.png',
 favicon:'/brand/favicon.png',
} as const;
export type BrandAssetName=keyof typeof brandAssets;
// What a screen reader is told. The symbol is decorative wherever the real word "OctopusG" sits
// beside it, so it takes an empty alt; the lockup carries the full name and the tagline.
export const brandAlt:Record<BrandAssetName,string>={
 logo:`${productName} — ${tagline}`,
 symbol:'',
 favicon:'',
};
export const isLocalAsset=(path:string):boolean=>/^\/[a-z0-9][a-z0-9/_.-]*\.(?:png|svg)$/i.test(path)&&!/^\/\//.test(path);

export interface BrandAssetRecord {
 path:string;role:string;format:string;width:number;height:number;bytes:number;
 sha256:string;transparency:boolean;metadata:string[];derivation:string;use:string;
}
export interface BrandManifest {
 schemaVersion:1;requirement:string;tagline:string;
 provenance:Record<string,unknown>;master:BrandAssetRecord;derivatives:BrandAssetRecord[];
}
const recordKeys=['path','role','format','width','height','bytes','sha256','transparency','metadata','derivation','use'];
// Claims OctopusG must never make about an owner-supplied asset.
export const forbiddenClaims=[/\bMIT\b|\bApache\b|\bGPL\b|\bCC[ -]BY\b/i,/copyright\s+©/i,/registered trademark|®/i,/all rights reserved/i];

function assetRecord(raw:unknown,where:string):BrandAssetRecord{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${where} is not an object`);
 const r=raw as Record<string,any>;
 for(const k of Object.keys(r))if(!recordKeys.includes(k))throw new Error(`${where}: unknown field ${k}`);
 for(const k of recordKeys)if(r[k]===undefined)throw new Error(`${where}: missing ${k}`);
 if(typeof r.sha256!=='string'||!/^[0-9a-f]{64}$/.test(r.sha256))throw new Error(`${where}: sha256 must be 64 hex characters`);
 if(!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<1||r.height<1)throw new Error(`${where}: dimensions must be positive integers`);
 if(!Number.isInteger(r.bytes)||r.bytes<1)throw new Error(`${where}: bytes must be a positive integer`);
 if(r.format!=='PNG')throw new Error(`${where}: only PNG is recorded today`);
 if(typeof r.transparency!=='boolean')throw new Error(`${where}: transparency must be a boolean`);
 if(!Array.isArray(r.metadata)||r.metadata.some((m:unknown)=>typeof m!=='string'))throw new Error(`${where}: metadata must be a list of strings`);
 if(typeof r.derivation!=='string'||r.derivation.length<20)throw new Error(`${where}: derivation must say how the file was produced`);
 if(typeof r.use!=='string'||!r.use)throw new Error(`${where}: use must say where the file appears`);
 return r as BrandAssetRecord;
}
export function loadBrandManifest(raw:unknown,label='brand assets'):BrandManifest{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: not an object`);
 const m=raw as Record<string,any>;
 if(m.schemaVersion!==1)throw new Error(`${label}: schemaVersion must be 1`);
 if(m.requirement!=='OG-UI-007')throw new Error(`${label}: the record belongs to OG-UI-007`);
 if(m.tagline!==tagline)throw new Error(`${label}: tagline must match the owner-approved wording`);
 if(!m.provenance||typeof m.provenance!=='object')throw new Error(`${label}: provenance is required`);
 for(const k of ['supplied_by','authorization','origin','classification','not_claimed','original_attachment_filename','recorded_on','decision_record','source'])
  if(m.provenance[k]===undefined)throw new Error(`${label}: provenance is missing ${k}`);
 if(m.provenance.supplied_by!=='owner')throw new Error(`${label}: only an owner-supplied asset may be recorded here`);
 // The record may describe the asset; it may never claim a licence, a registration or exclusivity.
 const text=JSON.stringify(m.provenance);
 for(const claim of forbiddenClaims)
  if(claim.test(text.replace(/"not_claimed":\[[^\]]*\]/,'')))throw new Error(`${label}: provenance must not claim third-party licensing, registration or exclusivity`);
 assetRecord(m.master,`${label}: master`);
 if(!m.master.path.startsWith('assets/'))throw new Error(`${label}: the master lives outside the served directory`);
 if(!Array.isArray(m.derivatives)||!m.derivatives.length)throw new Error(`${label}: derivatives must be a non-empty array`);
 const paths=new Set<string>();
 for(const [i,d] of m.derivatives.entries()){
  const where=`${label}: derivatives[${i}]`;
  assetRecord(d,where);
  if(!d.path.startsWith('public/brand/'))throw new Error(`${where}: a served derivative belongs in public/brand/`);
  if(paths.has(d.path))throw new Error(`${where}: duplicate path`);
  paths.add(d.path);
  // A served file carries no metadata; the master keeps its own.
  if(d.metadata.length)throw new Error(`${where}: a served derivative must carry no metadata (${d.metadata.join(', ')})`);
  if(d.bytes>=m.master.bytes)throw new Error(`${where}: a derivative that is not smaller than the master is not optimized`);
 }
 return m as unknown as BrandManifest;
}
