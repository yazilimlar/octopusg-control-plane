// Provider-neutral credential references (OG-SEC-003, OG-SEC-004).
// This module never reads, stores or returns a credential value. A provider owns any
// future secret access behind an opaque callback boundary.

export const credentialProviderIds=['macos-keychain'] as const;
export type CredentialProviderId=typeof credentialProviderIds[number];

export interface CredentialRef {
 provider:CredentialProviderId;
 itemLabel:string;
}

// An opaque handle deliberately exposes no credential material to callers.
export interface CredentialHandle {readonly __credentialHandle:unique symbol}

export interface CredentialProvider {
 readonly id:CredentialProviderId;
 withCredential<T>(ref:CredentialRef,use:(handle:CredentialHandle)=>Promise<T>):Promise<T>;
 revoke(ref:CredentialRef):Promise<void>;
}

const secretPatterns=[
 /gh[pousr]_[A-Za-z0-9]{20,}/,/sk_(?:live|test)_[A-Za-z0-9]{12,}/,/AKIA[A-Z0-9]{16}/,
 /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 /https?:\/\/[^\s/:]+:[^\s/@]+@/,
 /\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{20,}/i,
 /\b(?:password|passwd|token|secret|api[_-]?key)\s*[:=]\s*[^\s]{16,}/i,
];
const looksSecret=(value:string):boolean=>secretPatterns.some(pattern=>pattern.test(value));

export function validateCredentialRef(raw:unknown,label='credentialRef'):CredentialRef{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: must be an object`);
 const value=raw as Record<string,unknown>;
 const keys=Object.keys(value);
 if(keys.some(key=>!['provider','itemLabel'].includes(key)))throw new Error(`${label}: unknown field`);
 if(keys.length!==2)throw new Error(`${label}: provider and itemLabel are required`);
 if(!(credentialProviderIds as readonly string[]).includes(value.provider as string))throw new Error(`${label}: unsupported provider`);
 if(typeof value.itemLabel!=='string'||!value.itemLabel.trim()||value.itemLabel.length>200)throw new Error(`${label}: itemLabel must be a bounded non-empty label`);
 if(looksSecret(value.itemLabel))throw new Error(`${label}: itemLabel looks like secret material`);
 return Object.freeze({provider:value.provider as CredentialProviderId,itemLabel:value.itemLabel});
}

// The first supported backing-store provider is represented without invoking the
// operating-system keychain. A real owner-run adapter can be injected later.
export function macOSKeychainProvider(resolve?: (ref:CredentialRef,use:(handle:CredentialHandle)=>Promise<unknown>)=>Promise<unknown>):CredentialProvider{
 const unavailable=async<T>(_ref:CredentialRef,_use:(handle:CredentialHandle)=>Promise<T>):Promise<T>=>{
  throw new Error('macOS Keychain provider is unavailable in this build');
 };
 return {
  id:'macos-keychain',
  withCredential:<T>(ref:CredentialRef,use:(handle:CredentialHandle)=>Promise<T>)=>
   (resolve?resolve(ref,use):unavailable(ref,use)) as Promise<T>,
  revoke:async(_ref:CredentialRef)=>{throw new Error('macOS Keychain provider is unavailable in this build');},
 };
}
