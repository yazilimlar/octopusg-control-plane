// ADR-0007 Decision §1 (amended): the remote set must be either empty, or exactly one
// remote named `origin` whose URL is exactly one of the two approved forms of the same
// repository — HTTPS or SSH. Anything else fails. HTTPS is the default and preferred form;
// SSH is approved because HTTPS pushes proved unreliable on the owner's network (confirmed
// empty `git ls-remote` after repeated HTTPS push attempts; SSH then succeeded, verified by
// `git ls-remote` showing matching branch and v0.2.0 tag SHAs).
export const APPROVED_ORIGIN_URLS=[
  'https://github.com/yazilimlar/octopusg-control-plane.git',
  'git@github.com:yazilimlar/octopusg-control-plane.git',
];
export function assertApprovedRemoteSet(names,getUrl){
  if(names.length===0)return;
  if(names.length===1&&names[0]==='origin'&&APPROVED_ORIGIN_URLS.includes(getUrl('origin')))return;
  throw new Error(`Remote set must be empty or exactly one 'origin' at one of ${APPROVED_ORIGIN_URLS.join(' or ')}`);
}
