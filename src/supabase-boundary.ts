// Design-only DayOS Supabase boundary (WP-18, OG-CONN-015).
// This module validates configuration and authorization shape only. It never connects,
// resolves a provider, reads credentials, or discovers a live project.

export const dayosSupabaseSchema='dayos' as const;
export const dayosSupabaseScope='metadata:read' as const;
export const dayosSupabaseMaxLevel=1 as const;
export const dayosSupabaseMetadataFields=['project_identity','schema_name','migration_inventory','migration_state','provenance','authorization_state'] as const;
export const dayosSupabaseProhibitedSurfaces=['rows','query_results','function_bodies','sql_text','credentials','connection_strings','writes','migrations','object_counts'] as const;

export interface ProjectIdentityResolution {
 status:'blocked'|'resolved';
 source:'canonical-config';
 productId:'dayos';
 projectRef?:string;
 reason?:string;
}

export interface ProjectIdentityInput {
 configuredProductId?:unknown;
 configuredProjectRef?:unknown;
 configuredProjectRefStatus?:unknown;
 registryProductId?:unknown;
}

// The project ref is intentionally absent until an authoritative configured source exists.
// Cross-validation requires the configured product and registry product to both identify DayOS.
export function resolveDayosProjectIdentity(input:ProjectIdentityInput):ProjectIdentityResolution{
 const blocked=(reason:string):ProjectIdentityResolution=>({status:'blocked',source:'canonical-config',productId:'dayos',reason});
 if(input.registryProductId!=='dayos')return blocked('registry product identity is not dayos');
 if(input.configuredProductId!=='dayos')return blocked('authoritative connector configuration is absent or not dayos');
 if(input.configuredProjectRefStatus!=='current')return blocked('authoritative Supabase project reference is stale, ambiguous or unverified');
 if(typeof input.configuredProjectRef!=='string'||!/^[-a-z0-9]{8,64}$/.test(input.configuredProjectRef))return blocked('authoritative Supabase project reference is absent or invalid');
 return {status:'resolved',source:'canonical-config',productId:'dayos',projectRef:input.configuredProjectRef};
}

export interface G3AuthorizationDraft {
 status:'not-authorized';
 projectIdentitySource:'canonical-config';
 scopes:readonly [typeof dayosSupabaseScope];
 maxLevel:typeof dayosSupabaseMaxLevel;
 resourceAllowlist:readonly [typeof dayosSupabaseSchema];
}

export const dayosSupabaseG3Draft:G3AuthorizationDraft=Object.freeze({
 status:'not-authorized',projectIdentitySource:'canonical-config',scopes:[dayosSupabaseScope] as const,
 maxLevel:dayosSupabaseMaxLevel,resourceAllowlist:[dayosSupabaseSchema] as const,
});

export function validateDayosSupabaseDesign():true{
 if(dayosSupabaseMaxLevel!==1||dayosSupabaseScope!=='metadata:read')throw new Error('DayOS Supabase design must remain Level 1 metadata:read');
 if(dayosSupabaseMetadataFields.includes('object_counts' as never))throw new Error('object counts are outside the initial allowlist');
 if(dayosSupabaseG3Draft.status!=='not-authorized')throw new Error('G3 must remain ungranted in the design package');
 return true;
}
