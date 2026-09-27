import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createApp} from '../web/server.mjs';
import {createOIDC} from '../web/oidc.mjs';
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`)));
const close=server=>new Promise(resolve=>server.close(resolve));
const pair=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),wrong=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...pair.publicKey.export({format:'jwk'}),kid:'test',alg:'RS256',use:'sig'};
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const sign=(claims,key=pair.privateKey)=>{const data=encode({alg:'RS256',kid:'test'})+'.'+encode(claims);return data+'.'+crypto.sign('RSA-SHA256',Buffer.from(data),key).toString('base64url')};
test('OIDC validates configuration without requiring an editor password',()=>{
 const settings={issuer:'https://idp.example',clientId:'book',allowedSubjects:['owner']};
 assert.throws(()=>createOIDC({...settings,allowedSubjects:[]},'https://book.example'),/OIDC_ALLOWED_SUBJECTS/);
 assert.throws(()=>createOIDC({...settings,issuer:'http://idp.example'},'https://book.example'),/HTTPS/);
 assert.throws(()=>createOIDC(settings,'http://book.example'),/HTTPS/);
 assert.throws(()=>createOIDC({...settings,authMethod:'client_secret_basic'},'https://book.example'),/secret/);
 assert.ok(createOIDC({...settings,provider:'tsidp'},'https://book.example'));
});
test('real OIDC discovery, signed tokens, PKCE, allowlist and browser session boundaries',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-oidc-')),codes=new Map();let issuer,override={},badSignature=false,exchanges=0;
 const provider=http.createServer(async(req,res)=>{
  const url=new URL(req.url,issuer);res.setHeader('Content-Type','application/json');
  if(url.pathname==='/.well-known/openid-configuration')return res.end(JSON.stringify({issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks',response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['client_secret_post'],code_challenge_methods_supported:['S256']}));
  if(url.pathname==='/jwks')return res.end(JSON.stringify({keys:[jwk]}));
  if(url.pathname==='/authorize'){
   const code=crypto.randomUUID();codes.set(code,Object.fromEntries(url.searchParams));
   const destination=new URL(url.searchParams.get('redirect_uri'));destination.searchParams.set('code',code);destination.searchParams.set('state',url.searchParams.get('state'));
   res.writeHead(302,{Location:destination.href});return res.end();
  }
  if(url.pathname==='/token'){
   let body='';for await(const chunk of req)body+=chunk;const params=new URLSearchParams(body),auth=codes.get(params.get('code'));codes.delete(params.get('code'));exchanges++;
   if(!auth||params.get('client_id')!=='book'||params.get('client_secret')!=='oidc-client-secret'||params.get('redirect_uri')!==auth.redirect_uri||crypto.createHash('sha256').update(params.get('code_verifier')||'').digest('base64url')!==auth.code_challenge){res.statusCode=400;return res.end(JSON.stringify({error:'invalid_grant'}))}
   const now=Math.floor(Date.now()/1000);return res.end(JSON.stringify({access_token:'test-access',token_type:'Bearer',expires_in:300,id_token:sign({iss:issuer,sub:'1234',aud:'book',iat:now,exp:now+300,nonce:auth.nonce,...override},badSignature?wrong.privateKey:pair.privateKey)}));
  }
  res.statusCode=404;res.end('{}');
 });issuer=await listen(provider);
 const reserve=http.createServer();const base=await listen(reserve);await close(reserve);
 const app=createApp({dataDir:temp,origin:base,authMode:'oidc',passwordFile:'/does/not/exist',oidc:{issuer,clientId:'book',clientSecret:'oidc-client-secret',allowedSubjects:['1234'],provider:'tsidp'}});
 await new Promise(resolve=>app.server.listen(Number(new URL(base).port),'127.0.0.1',resolve));
 t.after(async()=>{await app.close();await close(provider);fs.rmSync(temp,{recursive:true,force:true})});
 const request=(route,options={})=>fetch(base+route,{redirect:'manual',...options});
 async function begin(returnTo='/edit/?key=Places%2FExample'){
  const start=await request('/auth/oidc/login?returnTo='+encodeURIComponent(returnTo));assert.equal(start.status,302);
  const auth=new URL(start.headers.get('location'));assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.ok(auth.searchParams.get('nonce'));assert.match(start.headers.get('set-cookie'),/SameSite=Lax/);
  const authorization=await fetch(auth,{redirect:'manual'});
  return {cookie:start.headers.get('set-cookie').split(';')[0],callback:authorization.headers.get('location').slice(base.length)};
 }
 await t.test('password endpoint disabled and UI advertises Tailscale',async()=>{
  assert.equal((await request('/api/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{"password":"whatever"}'})).status,403);
  const session=await(await request('/api/session')).json();assert.equal(session.authMode,'oidc');assert.equal(session.loginLabel,'Sign in with Tailscale');assert.equal(session.authenticated,false);
 });
 await t.test('allowed subject gets session, protected writes still require CSRF, logout invalidates',async()=>{
  const flow=await begin(),response=await request(flow.callback,{headers:{Cookie:flow.cookie}});assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/edit/?key=Places%2FExample');
  const sessionCookie=response.headers.getSetCookie().find(x=>x.startsWith('stamp_session=')).split(';')[0];assert.ok(sessionCookie);
  const session=await(await request('/api/session',{headers:{Cookie:sessionCookie}})).json();assert.equal(session.authenticated,true);
  assert.equal((await request('/api/logout',{method:'POST',headers:{Cookie:sessionCookie,Origin:base}})).status,403);
  assert.equal((await request('/api/logout',{method:'POST',headers:{Cookie:sessionCookie,Origin:base,'X-CSRF-Token':session.csrf}})).status,200);
  assert.equal((await(await request('/api/session',{headers:{Cookie:sessionCookie}})).json()).authenticated,false);
  assert.match((await request(flow.callback,{headers:{Cookie:flow.cookie}})).headers.get('location'),/authError=failed/);
 });
 await t.test('callback without browser cookie or with altered state is rejected before token exchange',async()=>{
  for(const kind of ['cookie','state']){const flow=await begin(),before=exchanges;const route=kind==='state'?flow.callback.replace(/state=[^&]+/,'state=attacker'):flow.callback;const response=await request(route,{headers:kind==='cookie'?{}:{Cookie:flow.cookie}});assert.match(response.headers.get('location'),/authError=failed/);assert.equal(exchanges,before)}
 });
 for(const [name,claims,signature,error]of [['wrong audience',{aud:'other'},false,'failed'],['wrong issuer',{iss:'https://other.example'},false,'failed'],['wrong nonce',{nonce:'other'},false,'failed'],['expired token',{exp:1},false,'failed'],['wrong signature',{},true,'failed'],['non-allowlisted subject',{sub:'9999'},false,'denied']])await t.test(name,async()=>{
  override=claims;badSignature=signature;const flow=await begin(),response=await request(flow.callback,{headers:{Cookie:flow.cookie}});assert.equal(response.headers.get('location'),'/edit/?authError='+error);assert.ok(!response.headers.getSetCookie().some(x=>x.startsWith('stamp_session=')));
 });
 override={};badSignature=false;
 if(process.env.OIDC_BROWSER_TEST)await t.test('browser offers only Tailscale login and completes the OIDC redirect',async()=>{
  const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true});
  try{const page=await browser.newPage();await page.goto(base+'/edit/');await page.getByRole('link',{name:'Sign in with Tailscale'}).waitFor();assert.equal(await page.getByLabel('Editor password').count(),0);await page.getByRole('link',{name:'Sign in with Tailscale'}).click();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();assert.equal(await page.evaluate(()=>fetch('/api/session').then(r=>r.json()).then(x=>x.authenticated)),true);await page.screenshot({path:'.qa/oidc-signed-in.png'});await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('link',{name:'Sign in with Tailscale'}).waitFor();await page.screenshot({path:'.qa/oidc-login.png'});}finally{await browser.close()}
 });
 await t.test('external return URL cannot become an open redirect',async()=>{const flow=await begin('https://attacker.example'),response=await request(flow.callback,{headers:{Cookie:flow.cookie}});assert.equal(response.headers.get('location'),'/edit/')});
});
