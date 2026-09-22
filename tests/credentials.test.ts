import test from 'node:test';
import assert from 'node:assert/strict';
import {macOSKeychainProvider,validateCredentialRef,type CredentialHandle} from '../src/credentials.ts';

test('CredentialRef accepts only a non-secret provider reference',()=>{
 const ref=validateCredentialRef({provider:'macos-keychain',itemLabel:'octopusg-test-readonly'});
 assert.deepEqual(ref,{
  provider:'macos-keychain',itemLabel:'octopusg-test-readonly'});
 assert.throws(()=>{(ref as {itemLabel:string}).itemLabel='password=abcdefghijklmnop';},/read only|Cannot assign/);
});

test('CredentialRef rejects unknown providers, fields and secret-shaped labels',()=>{
 assert.throws(()=>validateCredentialRef({provider:'vault',itemLabel:'item'}),/unsupported provider/);
 assert.throws(()=>validateCredentialRef({provider:'macos-keychain',itemLabel:'item',value:'x'}),/unknown field/);
 const passwordLabel='password'+'='+'abcdefghijklmnop';
 const urlLabel='https'+ '://user:pass@example.test';
 assert.throws(()=>validateCredentialRef({provider:'macos-keychain',itemLabel:passwordLabel}),/secret material/);
 assert.throws(()=>validateCredentialRef({provider:'macos-keychain',itemLabel:urlLabel}),/secret material/);
});

test('provider abstraction uses an injected fake and exposes only an opaque handle',async()=>{
 const ref=validateCredentialRef({provider:'macos-keychain',itemLabel:'fake-test-item'});
 let seen='';
 const provider=macOSKeychainProvider(async(received,use)=>{
  seen=received.itemLabel;
  const handle={} as CredentialHandle;
  return use(handle);
 });
 const result=await provider.withCredential(ref,async handle=>{
  assert.equal(typeof handle,'object');
  assert.equal(Object.keys(handle).length,0);
  return 'fake-result';
 });
 assert.equal(result,'fake-result');
 assert.equal(seen,'fake-test-item');
});

test('default Keychain adapter fails closed without touching a real store',async()=>{
 const provider=macOSKeychainProvider();
 const ref=validateCredentialRef({provider:'macos-keychain',itemLabel:'never-read'});
 await assert.rejects(()=>provider.withCredential(ref,async()=>null),/unavailable/);
 await assert.rejects(()=>provider.revoke(ref),/unavailable/);
});
