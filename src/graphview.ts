// Generated map: lane layout, presets and encodings (OG-MAP-003, OG-MAP-004).
// Pure functions. Positions are COMPUTED from lanes at render time and never stored in data,
// so no coordinate is ever mistaken for evidence. No clock, no randomness: the same graph
// always produces the same layout, in the same order.
import type {Project} from './model.ts';
import type {Catalog,TypedEdge,Resource,EdgeType} from './resources.ts';
import type {TruthState} from './truth.ts';

// ---------- lanes: one row per portfolio layer, then resource layers
export const lanes=['AgoraXAI','Platforms','Artemis','Products','Ventures','Labs and archive','Repositories','Checkouts'] as const;
export type Lane=typeof lanes[number];
const taxonomyLane:Record<string,Lane>={'AgoraXAI':'AgoraXAI','AgoraXAI Atlas':'Platforms','AgoraXAI Platforms':'Platforms','Artemis':'Artemis','Products':'Products','Ventures':'Ventures','Labs':'Labs and archive','Archive':'Labs and archive','Security artifacts':'Labs and archive'};
export const laneOfProject=(p:Project):Lane=>taxonomyLane[p.taxonomy]??'Labs and archive';
export const laneOfResource=(r:Resource):Lane=>r.kind==='repository'?'Repositories':'Checkouts';

export interface Node {id:string;label:string;lane:Lane;kind:'product'|Resource['kind'];truth:TruthState;lifecycle:string;riskBand:string;detail:string}
export interface PlacedNode extends Node {x:number;y:number}
export interface Layout {nodes:PlacedNode[];lanes:{lane:Lane;y:number;count:number}[];width:number;height:number}

// ---------- presets (OG-MAP-004): the same graph, filtered two ways
export const presets=['portfolio','repository'] as const;
export type Preset=typeof presets[number];
const productEdgeTypes:EdgeType[]=['platform_parent','consumed_by','depends_on','successor_of'];
const repositoryEdgeTypes:EdgeType[]=['source_repository','checked_out_at'];
export const presetEdgeTypes=(preset:Preset):EdgeType[]=>preset==='portfolio'?productEdgeTypes:[...productEdgeTypes,...repositoryEdgeTypes];

// ---------- relationship filter (the v0.1 vocabulary, mapped onto typed edges)
export const relationGroups:Record<string,EdgeType[]>={dependency:['consumed_by','depends_on'],ownership:['platform_parent'],historical:['successor_of'],resource:['source_repository','checked_out_at']};
export function selectGraph(projects:Project[],catalog:Catalog,preset:Preset,relation=''):{nodes:Node[];edges:TypedEdge[]}{
 const allowedTypes=new Set<EdgeType>(presetEdgeTypes(preset));
 const group=relation?relationGroups[relation]??[]:null;
 const edges=catalog.edges.filter(e=>allowedTypes.has(e.type)&&(!group||group.includes(e.type)));
 const productNodes:Node[]=projects.map(p=>({id:p.id,label:p.name,lane:laneOfProject(p),kind:'product',truth:p.evidence==='observed'?'observed':p.evidence==='inferred'?'declared':p.evidence,
  lifecycle:p.lifecycle,riskBand:p.riskBand,detail:p.taxonomy}));
 if(preset==='portfolio')return {nodes:productNodes,edges};
 const resourceNodes:Node[]=catalog.resources.filter(r=>r.kind==='repository'||r.kind==='checkout')
  .map(r=>({id:r.id,label:r.label,lane:laneOfResource(r),kind:r.kind,truth:r.truth,lifecycle:r.kind,riskBand:'—',detail:r.source}));
 return {nodes:[...productNodes,...resourceNodes],edges};
}

// ---------- layout: lane index → y, position within lane → x
export interface LayoutOptions {width?:number;laneHeight?:number;top?:number;nodeWidth?:number}
export function layout(nodes:Node[],options:LayoutOptions={}):Layout{
 const width=options.width??1000,laneHeight=options.laneHeight??118,top=options.top??70,nodeWidth=options.nodeWidth??216;
 const used=lanes.filter(lane=>nodes.some(n=>n.lane===lane));
 const placed:PlacedNode[]=[];
 const rows:{lane:Lane;y:number;count:number}[]=[];
 let y=top;
 for(const lane of used){
  const inLane=nodes.filter(n=>n.lane===lane);          // input order is the caller's stable order
  const perRow=Math.max(1,Math.min(inLane.length,Math.floor((width-40)/(nodeWidth+24))));
  const rowCount=Math.ceil(inLane.length/perRow);
  inLane.forEach((node,i)=>{
   const row=Math.floor(i/perRow),column=i%perRow,columns=Math.min(perRow,inLane.length-row*perRow);
   const step=width/(columns+1);
   placed.push({...node,x:Math.round(step*(column+1)),y:y+row*laneHeight});
  });
  rows.push({lane,y,count:inLane.length});
  y+=rowCount*laneHeight;
 }
 return {nodes:placed,lanes:rows,width,height:y+30};
}

// ---------- encodings: colour is never the only channel
export const colourDimensions=['lifecycle','risk','truth'] as const;
export type ColourDimension=typeof colourDimensions[number];
// The value shown as text under each node, so the same information is available without colour.
export function colourValue(node:Node,dimension:ColourDimension):string{
 return dimension==='lifecycle'?node.lifecycle:dimension==='risk'?node.riskBand:node.truth;
}
export const colourClass=(node:Node,dimension:ColourDimension):string=>
 `c-${dimension}-${colourValue(node,dimension).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'none'}`;
// Declared, observed and derived edges differ in dash pattern AND carry their truth as text,
// so they stay distinguishable in greyscale and to a screen reader.
export const edgeDash:Record<string,string>={declared:'7 5',observed:'',derived:'2 4',unknown:'1 6',blocked:'1 6',approved:'10 3',executed:''};
export const edgeStyleLabel:Record<string,string>={declared:'dashed',observed:'solid',derived:'dotted',unknown:'sparse dots',blocked:'sparse dots',approved:'long dashes',executed:'solid'};
export const edgeLegend=(truths:TruthState[]):string[]=>[...new Set(truths)].sort().map(t=>`${t}: ${edgeStyleLabel[t]??'solid'}`);
