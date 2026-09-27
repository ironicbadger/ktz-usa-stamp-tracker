import fs from 'node:fs';
import crypto from 'node:crypto';
import * as client from 'openid-client';

const failure=(message,status=401)=>Object.assign(Error(message),{status,code:'oidc_failed'});
const list=value=>String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
function secureURL(value,name){
 const url=new URL(value);
 if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw Error(`${name} must use HTTPS (HTTP is allowed only on localhost)`);
 return url;
}
export function oidcSettings(env=process.env){
 return {issuer:env.OIDC_ISSUER,clientId:env.OIDC_CLIENT_ID,clientSecret:env.OIDC_CLIENT_SECRET,clientSecretFile:env.OIDC_CLIENT_SECRET_FILE,authMethod:env.OIDC_CLIENT_AUTH_METHOD,allowedSubjects:list(env.OIDC_ALLOWED_SUBJECTS),provider:env.OIDC_PROVIDER||'oidc'};
}
export function createOIDC(settings,origin){
 const issuer=secureURL(settings.issuer,'OIDC_ISSUER');
 const appOrigin=secureURL(origin,'ORIGIN');
 if(appOrigin.origin!==origin)throw Error('ORIGIN must be an origin without a path');
 if(!settings.clientId)throw Error('OIDC_CLIENT_ID is required');
 if(!settings.allowedSubjects?.length)throw Error('OIDC_ALLOWED_SUBJECTS must list the users allowed to edit');
 if(!['oidc','tsidp'].includes(settings.provider||'oidc'))throw Error('OIDC_PROVIDER must be oidc or tsidp');
 const secret=settings.clientSecretFile?fs.readFileSync(settings.clientSecretFile,'utf8').trim():settings.clientSecret;
 const method=settings.authMethod||(secret?'client_secret_post':'none');
 if(!['none','client_secret_post','client_secret_basic'].includes(method))throw Error('Unsupported OIDC_CLIENT_AUTH_METHOD');
 if(method!=='none'&&!secret)throw Error('The selected OIDC client authentication method requires a client secret');
 const authentication=method==='none'?client.None():method==='client_secret_basic'?client.ClientSecretBasic(secret):client.ClientSecretPost(secret);
 const callback=origin+'/auth/oidc/callback',pending=new Map();let configuration;
 const config=()=>configuration||(configuration=client.discovery(issuer,settings.clientId,undefined,authentication,{timeout:10,execute:[client.enableNonRepudiationChecks,...(issuer.protocol==='http:'?[client.allowInsecureRequests]:[])]}).catch(()=>{configuration=undefined;throw failure('Unable to connect to the identity provider. Please try again.',503)}));
 const cookie=(value,age)=>`stamp_oidc=${value}; HttpOnly; SameSite=Lax; Path=/auth/oidc; Max-Age=${age}${appOrigin.protocol==='https:'?'; Secure':''}`;
 return {
  label:settings.provider==='tsidp'?'Sign in with Tailscale':'Sign in with OpenID Connect',
  async start(req){
   for(const [key,item]of pending)if(item.expires<Date.now())pending.delete(key);
   if(pending.size>=100)throw failure('Too many sign-in attempts. Please try again shortly.',429);
   const conf=await config(),state=client.randomState(),nonce=client.randomNonce(),verifier=client.randomPKCECodeVerifier(),binding=crypto.randomBytes(32).toString('base64url');
   // One browser transaction at a time; old tabs fail closed.
   const old=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('stamp_oidc='))?.slice(11);if(old)pending.delete(old);
   const requested=new URL(req.url,origin).searchParams.get('returnTo');
   const destination=requested&&/^\/edit\/(?:\?[^#]*)?$/.test(requested)?requested:'/edit/';
   pending.set(binding,{state,nonce,verifier,destination,expires:Date.now()+10*60*1000});
   return {cookie:cookie(binding,600),url:client.buildAuthorizationUrl(conf,{redirect_uri:callback,scope:'openid profile email',response_type:'code',state,nonce,code_challenge:await client.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256'}).href};
  },
  clearCookie:()=>cookie('',0),
  async finish(req){
   const binding=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('stamp_oidc='))?.slice(11),transaction=pending.get(binding);
   if(binding)pending.delete(binding);
   if(!transaction||transaction.expires<Date.now())throw failure('Sign-in expired or was not started in this browser. Please sign in again.');
   let tokens;
   try{tokens=await client.authorizationCodeGrant(await config(),new URL(req.url,origin),{pkceCodeVerifier:transaction.verifier,expectedState:transaction.state,expectedNonce:transaction.nonce,idTokenExpected:true})}catch{throw failure('The identity provider could not verify this sign-in. Please try again.')}
   const claims=tokens.claims();
   if(!claims||typeof claims.sub!=='string'||!settings.allowedSubjects.includes(claims.sub))throw failure('This identity is not allowed to edit this book.',403);
   return {destination:transaction.destination,identity:{subject:claims.sub,issuer:claims.iss,name:typeof claims.name==='string'?claims.name:claims.sub}};
  }
 };
}
