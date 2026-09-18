// Safe open actions (OG-ACT-001).
// The three things OctopusG may do with a product's location, and nothing more: link to an
// HTTPS URL the registry recorded, link to a provider page the registry recorded, and show a
// local path as text with a Copy button. A web page cannot open a folder and must not try; the
// only thing that opens one is `npm run open -- <product-id>`, which the owner runs and which
// accepts a product id, never a path.
// Source: docs/08-UX-AND-SCREEN-MAP.md#4-safe-open-actions-v02, S2#mvp-boundary, S1#octopusg-v02-boundary.
import type {Project,Raw} from './model.ts';
import type {TruthState} from './truth.ts';

export type OpenKind='website'|'provider'|'folder';
export interface OpenAction {
 kind:OpenKind;label:string;
 href:string|null;      // a link only for website and provider; always null for folder
 text:string;           // what is shown, and what Copy copies for a folder
 truth:TruthState;source:string;note:string;
}
// Every link this application renders passes through here first.
// https only; no embedded credentials; no port; no query or fragment, so nothing about the
// owner's workspace can ride along in a URL.
export function safeHttpsUrl(raw:unknown):string|null{
 if(typeof raw!=='string'||!raw.trim())return null;
 let url:URL;
 try{url=new URL(raw.trim());}catch{return null;}
 if(url.protocol!=='https:')return null;
 if(url.username||url.password)return null;
 if(url.port)return null;
 if(url.search||url.hash)return null;
 if(!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(url.hostname))return null;
 // A bare address is not a registry-recorded site. Rejecting it keeps a link from ever
 // pointing at a host on the owner's own network.
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)||url.hostname.startsWith('['))return null;
 return url.toString();
}
// git@github.com:owner/repo.git and https://github.com/owner/repo(.git) → the repository page.
// A remote is a recorded fact; the browsable page is derived from it and labelled as derived.
export function repoPage(remote:unknown):string|null{
 if(typeof remote!=='string'||!remote.trim())return null;
 const ssh=/^[a-z0-9._-]+@([a-z0-9.-]+):([^\s]+?)(?:\.git)?$/i.exec(remote.trim());
 const https=/^https:\/\/([a-z0-9.-]+)\/([^\s?#]+?)(?:\.git)?$/i.exec(remote.trim());
 const match=ssh??https;
 if(!match)return null;
 return safeHttpsUrl(`https://${match[1]}/${match[2]}`);
}
const first=(value:unknown):string|undefined=>Array.isArray(value)?value[0] as string|undefined:undefined;

export function openActions(project:Project,registry:Raw):OpenAction[]{
 const raw=project.raw as Raw;
 const base=`projects[${project.id}]`;
 const out:OpenAction[]=[];
 // 1. Website — the URL the registry declares as intended. Declared intent, never liveness.
 const site=safeHttpsUrl(raw.intended_url);
 if(site)out.push({kind:'website',label:'Open website',href:site,text:site,truth:'declared',
  source:`${base}.intended_url`,note:'The URL the registry declares. Opening it is navigation in your browser, not a request from this application, and says nothing about whether it is live.'});
 // 2. Provider — the repository page derived from the recorded remote, and any alias the
 //    recorded production state serves.
 const repo=repoPage(raw.canonical_repo);
 if(repo)out.push({kind:'provider',label:'Open repository',href:repo,text:repo,truth:'derived',
  source:`${base}.canonical_repo`,note:'Derived from the remote the registry records. The application never contacts the host.'});
 const serving=(registry.production_state as Raw|undefined)?.serving_deployment as Raw|undefined;
 const aliases=(serving?.aliases as string[]|undefined)??[];
 const declaresHost=typeof raw.production_deployment==='string'||typeof raw.production_route==='string';
 if(declaresHost)for(const [i,alias] of aliases.entries()){
  const url=safeHttpsUrl(`https://${alias}`);
  if(url)out.push({kind:'provider',label:'Open serving alias',href:url,text:url,truth:'observed',
   source:`production_state.serving_deployment.aliases[${i}]`,note:'Recorded when the production state was captured. It is evidence of that moment, not of now.'});
 }
 // 3. Folder — text and a Copy button. Never a link: a web page cannot open a local folder,
 //    and file:// links are refused by the browser from an http origin anyway.
 const path=(first(raw.current_local_paths) as Raw|undefined)?.path??raw.intended_local_path;
 if(typeof path==='string'&&path)out.push({kind:'folder',label:'Copy folder path',href:null,text:path,
  truth:typeof (first(raw.current_local_paths) as Raw|undefined)?.path==='string'?'observed':'declared',
  source:typeof (first(raw.current_local_paths) as Raw|undefined)?.path==='string'?`${base}.current_local_paths[0].path`:`${base}.intended_local_path`,
  note:'Shown as text. To open it, run npm run open -- '+project.id+' on the enrolled device; it accepts a product id and opens only an allowlisted repository.'});
 return out;
}
// Attributes every outbound link carries. Kept as data so a test can assert them.
export const linkAttributes={rel:'noopener noreferrer',target:'_blank'} as const;
export const openSummary=(a:OpenAction):string=>
 `${a.label}: ${a.text} (${a.truth}${a.href?'' : ', not a link'})`;
export type {Raw};
