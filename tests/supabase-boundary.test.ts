import test from 'node:test';
import assert from 'node:assert/strict';
import {dayosSupabaseG3Draft,dayosSupabaseMetadataFields,dayosSupabaseProhibitedSurfaces,resolveDayosProjectIdentity,validateDayosSupabaseDesign} from '../src/supabase-boundary.ts';

test('DayOS Supabase design is metadata-only, Level 1 and not authorized',()=>{
 assert.equal(validateDayosSupabaseDesign(),true);
 assert.equal(dayosSupabaseG3Draft.status,'not-authorized');
 assert.deepEqual(dayosSupabaseMetadataFields,['project_identity','schema_name','migration_inventory','migration_state','provenance','authorization_state']);
 assert.ok(dayosSupabaseProhibitedSurfaces.includes('object_counts'));
});

test('project identity remains blocked until canonical configuration exists and cross-validates',()=>{
 assert.equal(resolveDayosProjectIdentity({registryProductId:'dayos'}).status,'blocked');
 assert.equal(resolveDayosProjectIdentity({registryProductId:'dayos',configuredProductId:'other',configuredProjectRef:'abcdefgh'}).status,'blocked');
 assert.equal(resolveDayosProjectIdentity({registryProductId:'dayos',configuredProductId:'dayos',configuredProjectRef:'abcdefgh1234',configuredProjectRefStatus:'stale'}).status,'blocked');
 assert.equal(resolveDayosProjectIdentity({registryProductId:'dayos',configuredProductId:'dayos',configuredProjectRef:'not valid',configuredProjectRefStatus:'current'}).status,'blocked');
 const resolved=resolveDayosProjectIdentity({registryProductId:'dayos',configuredProductId:'dayos',configuredProjectRef:'abcdefgh1234',configuredProjectRefStatus:'current'});
 assert.deepEqual(resolved,{status:'resolved',source:'canonical-config',productId:'dayos',projectRef:'abcdefgh1234'});
});
