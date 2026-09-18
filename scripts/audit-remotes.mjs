// ADR-0007 Decision §1: the remote set must be either empty, or exactly one remote
// named `origin` whose URL is exactly the approved URL. Anything else fails.
export const APPROVED_ORIGIN_URL='https://github.com/yazilimlar/octopusg-control-plane.git';
export function assertApprovedRemoteSet(names,getUrl){
  if(names.length===0)return;
  if(names.length===1&&names[0]==='origin'&&getUrl('origin')===APPROVED_ORIGIN_URL)return;
  throw new Error(`Remote set must be empty or exactly one 'origin' at ${APPROVED_ORIGIN_URL}`);
}
