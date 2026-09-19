import test from 'node:test';
import assert from 'node:assert/strict';
import {assertApprovedRemoteSet,APPROVED_ORIGIN_URLS} from '../scripts/audit-remotes.mjs';
test('ADR-0007 Decision §1: empty remote set passes',()=>{assert.doesNotThrow(()=>assertApprovedRemoteSet([],()=>{throw Error('must not be called')}));});
test('ADR-0007 Decision §1: exactly one origin at the approved HTTPS URL passes',()=>{assert.doesNotThrow(()=>assertApprovedRemoteSet(['origin'],name=>{assert.equal(name,'origin');return APPROVED_ORIGIN_URLS[0];}));});
test('ADR-0007 Decision §1 (amended): exactly one origin at the approved SSH URL passes',()=>{assert.doesNotThrow(()=>assertApprovedRemoteSet(['origin'],name=>{assert.equal(name,'origin');return APPROVED_ORIGIN_URLS[1];}));});
test('ADR-0007 Decision §1: origin at any other URL fails',()=>{assert.throws(()=>assertApprovedRemoteSet(['origin'],()=>'https://github.com/yazilimlar/wrong-repo.git'),/Remote set must be empty or exactly one/);});
test('ADR-0007 Decision §1: an additional remote fails even when origin is correct',()=>{assert.throws(()=>assertApprovedRemoteSet(['origin','upstream'],name=>name==='origin'?APPROVED_ORIGIN_URLS[0]:'https://example.com/upstream.git'),/Remote set must be empty or exactly one/);});
