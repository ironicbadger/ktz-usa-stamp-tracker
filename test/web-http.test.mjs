import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import sharp from 'sharp';
import {createApp} from '../web/server.mjs';
import {importVault} from '../web/import.mjs';
import {regions} from '../src/content.mjs';
const password='test-editor-password-123';
const key='Places/Example Park';
const doc=text=>({json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]}});
async function fixture(t){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-http-')),vault=path.join(temp,'vault'),dataDir=path.join(temp,'data');
 for(const kind of ['Regions','Places','Trips'])fs.mkdirSync(path.join(vault,kind),{recursive:true});
 const write=(name,data,body='')=>fs.writeFileSync(path.join(vault,name+'.md'),`---\n${YAML.stringify(data)}---\n${body}`);
 for(const region of regions)write('Regions/'+region,{title:region});
 write(key,{title:'Example Park',passport_region:'Southeast',states:['GA'],visits:[],stamps:[{id:'primary',name:'Park',type:'main'}]},'Original introduction.');
 write('Trips/Example Trip',{title:'Example Trip'},'Trip notes.');
 importVault({vault,dataDir});
 let app,base,cookie='',csrf='';
 const start=async()=>{app=createApp({dataDir,password});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.server.address().port}`};
 await start();t.after(async()=>{await app.close();fs.rmSync(temp,{recursive:true,force:true})});
 const request=(route,{method='GET',body,headers={},auth=true,origin=true}={})=>fetch(base+route,{method,headers:{...(origin?{Origin:base}:{}),...(auth&&cookie?{Cookie:cookie,'X-CSRF-Token':csrf}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const login=async()=>{const res=await request('/api/login',{method:'POST',body:{password},auth:false});assert.equal(res.status,200);cookie=res.headers.get('set-cookie').split(';')[0];csrf=(await res.json()).csrf;return res};
 return {request,login,get app(){return app},get base(){return base},get cookie(){return cookie},get csrf(){return csrf},restart:async()=>{await app.close();cookie='';csrf='';await start()}};
}
const recordRoute='/api/records?key='+encodeURIComponent(key);
test('HTTP authentication, cookie, origin and CSRF boundaries protect records',async t=>{
 const f=await fixture(t);
 assert.equal((await f.request('/places/example-park/',{auth:false})).status,200);
 assert.equal((await f.request('/api/catalogue',{auth:false})).status,401);
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{},auth:false})).status,401);
 assert.equal((await f.request('/api/login',{method:'POST',body:{password},auth:false,origin:false})).status,403);
 assert.equal((await f.request('/api/login',{method:'POST',body:{password},auth:false,headers:{Origin:'https://attacker.example'}})).status,403);
 assert.equal((await f.request('/api/login',{method:'POST',body:{password:'wrong'},auth:false})).status,401);
 const login=await f.login();assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await f.request('/api/catalogue')).status,200);
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{},headers:{'X-CSRF-Token':''}})).status,403);
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{},headers:{Origin:'https://attacker.example'}})).status,403);
 assert.equal((await f.request('/api/logout',{method:'POST',body:{}})).status,200);
 assert.equal((await f.request('/api/catalogue')).status,401);
});
test('rich-text save, preview, restart, conflict and restore run through real HTTP',async t=>{
 const f=await fixture(t);await f.login();const original=(await (await f.request(recordRoute)).json()).record;
 const candidate={...original,prose:{about:doc('Saved browser prose'),associations:doc('A book on the journey')}};
 const preview=await f.request('/api/preview',{method:'POST',body:{record:candidate}});assert.equal(preview.status,200);assert.match((await preview.json()).html,/Saved browser prose/);assert.equal(f.app.store.get(key).revision,1);
 const saved=await f.request(recordRoute,{method:'PUT',body:{record:candidate,expectedRevision:1,summary:'Browser edit'}});assert.equal(saved.status,200);assert.equal((await saved.json()).record.revision,2);
 const page=await (await f.request('/places/example-park/')).text();assert.match(page,/Saved browser prose/);assert.match(page,/A book on the journey/);
 await f.restart();assert.equal((await f.request('/api/catalogue')).status,401);assert.match(await (await f.request('/places/example-park/')).text(),/Saved browser prose/);await f.login();
 const conflict=await f.request(recordRoute,{method:'PUT',body:{record:{...candidate,body:'Stale'},expectedRevision:1}});assert.equal(conflict.status,409);assert.equal((await conflict.json()).current.revision,2);
 const history=await (await f.request('/api/history?key='+encodeURIComponent(key))).json();assert.equal(history.revisions.length,2);assert.equal(history.revisions[0].summary,'Browser edit');
 assert.equal((await f.request('/api/restore?key='+encodeURIComponent(key),{method:'POST',body:{revision:1,expectedRevision:1}})).status,409);
 const restored=await f.request('/api/restore?key='+encodeURIComponent(key),{method:'POST',body:{revision:1,expectedRevision:2}});assert.equal(restored.status,200);assert.equal((await restored.json()).record.revision,3);assert.match(await (await f.request('/places/example-park/')).text(),/Original introduction/);
 const historical=await (await f.request('/api/revision?key='+encodeURIComponent(key)+'&revision=2')).json();assert.match(historical.html,/Saved browser prose/);
});
test('validation and rich document sanitization reject bad edits without saving',async t=>{
 const f=await fixture(t);await f.login();const record=(await (await f.request(recordRoute)).json()).record;
 const bad={...record,data:{...record.data,visits:[{date:'2025-02-30',notes:'Invalid',stamps:[]}]}};
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{record:bad,expectedRevision:1}})).status,400);assert.equal(f.app.store.get(key).revision,1);
 const forged={...record,prose:{about:{...doc('<script>alert(1)</script>'),html:'<img src=x onerror=alert(1)><script>forged()</script>'}}};
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{record:forged,expectedRevision:1}})).status,200);
 const html=await (await f.request('/places/example-park/')).text();assert.doesNotMatch(html,/<script>alert|onerror=|forged\(\)/);assert.match(html,/&lt;script&gt;alert/);
 const unsafe={...record,prose:{about:{json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'bad link',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]}}}};
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{record:unsafe,expectedRevision:2}})).status,400);assert.equal(f.app.store.get(key).revision,2);
});
test('uploads reject malformed files and decode photos into registered WebP',async t=>{
 const f=await fixture(t);await f.login();const send=(bytes,type)=>fetch(f.base+'/api/uploads?filename=photo.png',{method:'POST',headers:{Origin:f.base,Cookie:f.cookie,'X-CSRF-Token':f.csrf,'Content-Type':type},body:bytes});
 assert.equal((await send('<svg onload="alert(1)"></svg>','image/svg+xml')).status,415);
 assert.equal((await send('not a PNG','image/png')).status,422);assert.equal(f.app.store.listAssets().length,0);
 const bytes=await sharp({create:{width:8,height:6,channels:3,background:'#123456'}}).png().toBuffer();const uploaded=await send(bytes,'image/png');assert.equal(uploaded.status,201);const asset=await uploaded.json();assert.match(asset.ref,/^\[\[Attachments\/[a-f0-9-]+\.webp\]\]$/);
 const publicImage=await f.request(asset.url,{auth:false});assert.equal(publicImage.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await publicImage.arrayBuffer())).metadata()).format,'webp');assert.equal(f.app.store.listAssets().length,1);
 const record=(await (await f.request(recordRoute)).json()).record;record.data.visits=[{id:'visit-photo',date:'2026-01-01',stamps:[{id:'impression-photo',name:'Park',type:'main',cancellation_id:'primary',photos:[asset.ref]}]}];
 assert.equal((await f.request(recordRoute,{method:'PUT',body:{record,expectedRevision:1}})).status,200);assert.ok((await (await f.request('/places/example-park/')).text()).includes(asset.url));
});
test('browser API creates new places and trips while enforcing canonical URLs',async t=>{
 const f=await fixture(t);await f.login();
 const place={key:'Places/New Park',kind:'Places',data:{title:'New Park',passport_region:'Southeast',states:['GA'],visits:[],stamps:[]},body:'',prose:{about:doc('New place')}};
 assert.equal((await f.request('/api/records',{method:'POST',body:{record:place}})).status,201);assert.equal((await f.request('/places/new-park/',{auth:false})).status,200);
 assert.equal((await f.request('/api/records',{method:'POST',body:{record:place}})).status,409);
 const trip={key:'Trips/New Trip',kind:'Trips',data:{title:'New Trip'},body:'',prose:{about:doc('Journey notes')}};
 assert.equal((await f.request('/api/records',{method:'POST',body:{record:trip}})).status,201);assert.equal((await f.request('/trips/new-trip/',{auth:false})).status,200);
 assert.equal((await f.request('/api/records',{method:'POST',body:{record:{...place,key:'Places/../Escape'}}})).status,400);
 const duplicate={...place,key:'Places/New--Park'};assert.equal((await f.request('/api/records',{method:'POST',body:{record:duplicate}})).status,400);
});
test('login failures are rate limited and authenticated APIs reject malformed JSON',async t=>{
 const f=await fixture(t);await f.login();
 const badJSON=await fetch(f.base+recordRoute,{method:'PUT',headers:{Origin:f.base,Cookie:f.cookie,'X-CSRF-Token':f.csrf,'Content-Type':'application/json'},body:'{broken'});assert.equal(badJSON.status,400);assert.equal(f.app.store.get(key).revision,1);
 for(let i=0;i<8;i++)assert.equal((await f.request('/api/login',{method:'POST',body:{password:'wrong'},auth:false})).status,401);
 assert.equal((await f.request('/api/login',{method:'POST',body:{password},auth:false})).status,429);
 assert.equal((await f.request('/api/catalogue')).status,200);
});
test('rich internal links retain backlinks after editing imported wiki prose',async t=>{
 const f=await fixture(t);await f.login();
 const tripKey='Trips/Example Trip',route='/api/records?key='+encodeURIComponent(tripKey),record=(await (await f.request(route)).json()).record;
 record.prose={about:{json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Example Park',marks:[{type:'link',attrs:{href:'/places/example-park/'}}]}]}]}}};
 const saved=await f.request(route,{method:'PUT',body:{record,expectedRevision:1}});assert.equal(saved.status,200);
 const page=await (await f.request('/places/example-park/')).text();assert.match(page,/href="\/trips\/example-trip\/"[^>]*>Example Trip<\/a>/);
});
test('oversized JSON and images receive HTTP 413 without resetting the connection',async t=>{
 const f=await fixture(t);await f.login();
 const json=await f.request('/api/preview',{method:'POST',body:{padding:'x'.repeat(2*1024*1024)}});assert.equal(json.status,413);assert.match((await json.json()).error,/too large/i);
 const image=await fetch(f.base+'/api/uploads?filename=large.png',{method:'POST',headers:{Origin:f.base,Cookie:f.cookie,'X-CSRF-Token':f.csrf,'Content-Type':'image/png'},body:Buffer.alloc(12*1024*1024+1)});assert.equal(image.status,413);assert.match((await image.json()).error,/too large/i);
 async function* chunks(){for(let i=0;i<33;i++)yield Buffer.alloc(64*1024,120)}
 const chunked=await fetch(f.base+'/api/preview',{method:'POST',duplex:'half',headers:{Origin:f.base,Cookie:f.cookie,'X-CSRF-Token':f.csrf,'Content-Type':'application/json'},body:chunks()});assert.equal(chunked.status,413);assert.match((await chunked.json()).error,/too large/i);
 assert.equal(f.app.store.listAssets().length,0);assert.equal(f.app.store.get(key).revision,1);
});
