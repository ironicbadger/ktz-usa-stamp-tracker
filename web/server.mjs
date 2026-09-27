import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {Store,safeAssetPath} from './store.mjs';
import {renderCollection,recordURL,editorRecord,renderedRecord,root,blankPage} from './render.mjs';
import {normalizeRichRecord} from './rich-text.mjs';
import {regions,stateNames} from '../src/content.mjs';
import {editorShell} from './editor-shell.mjs';

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const problem=(message,status=400,code='invalid_request')=>Object.assign(Error(message),{status,code});
function safeEqual(a,b){const left=Buffer.from(String(a||'')),right=Buffer.from(String(b||''));return left.length===right.length&&crypto.timingSafeEqual(left,right)}
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw problem('Request is too large',413);chunks.push(chunk)}return Buffer.concat(chunks)}
async function jsonBody(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw problem('Send JSON content',415);try{return JSON.parse((await body(req,2*1024*1024)).toString('utf8'))}catch(error){if(error.status)throw error;throw problem('Invalid JSON')}}
function checkRecord(input){
 if(!input||typeof input!=='object'||!['Places','Trips','Regions'].includes(input.kind))throw problem('Choose a valid page type');
 if(typeof input.key!=='string'||input.key.length>250||!input.key.startsWith(input.kind+'/')||input.key.slice(input.kind.length+1).includes('/')||input.key.includes('..')||/[\\\x00-\x1f]/.test(input.key))throw problem('Invalid page identity');
 if(!input.data||typeof input.data.title!=='string'||!input.data.title.trim()||input.data.title.length>250)throw problem('A page title of up to 250 characters is required');
 return normalizeRichRecord({...input,body:input.body||''});
}
export function createApp({dataDir=process.env.DATA_DIR||path.join(root,'.web-data'),password=process.env.APP_PASSWORD,passwordFile=process.env.APP_PASSWORD_FILE,origin=process.env.ORIGIN}={}){
 if(passwordFile)password=fs.readFileSync(passwordFile,'utf8').trim();
 if(typeof password!=='string'||password.length<12)throw Error('Set APP_PASSWORD or APP_PASSWORD_FILE to an editor password of at least 12 characters.');
 const salt=crypto.randomBytes(16),passwordHash=crypto.scryptSync(password,salt,64);password=undefined;
 if(origin){const url=new URL(origin);if(!['http:','https:'].includes(url.protocol)||url.origin!==origin)throw Error('ORIGIN must be a full HTTP(S) origin without a path');}
 const store=new Store({dataDir}),sessions=new Map(),attempts=new Map();let cached;
 const getCollection=()=>cached||(cached=renderCollection(store));
 const invalidated=()=>{cached=undefined};
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie'});res.end(JSON.stringify(value))};
 function expectedOrigin(req){return origin||`${req.socket.encrypted?'https':'http'}://${req.headers.host}`}
 function checkOrigin(req){if(req.headers.origin!==expectedOrigin(req))throw problem('This request must come from the app itself',403,'origin_rejected')}
 function session(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('stamp_session='))?.slice(14);const session=token?sessions.get(token):null;if(!session||session.expires<Date.now()){if(token)sessions.delete(token);return null}return {...session,token}}
 function authenticated(req){const user=session(req);if(!user)throw problem('Sign in to edit the collection',401,'unauthorized');return user}
 function mutation(req){checkOrigin(req);const user=authenticated(req);if(!safeEqual(req.headers['x-csrf-token'],user.csrf))throw problem('Your editing session changed. Reload and try again.',403,'csrf_rejected');return user}
 function cookie(req,token,maxAge){return `stamp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${expectedOrigin(req).startsWith('https:')?'; Secure':''}`}
 function sendFile(res,file,type,cache='public, max-age=3600'){
  const stat=fs.statSync(file);if(!stat.isFile())throw problem('Not found',404);
  res.writeHead(200,{'Content-Type':type||mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':cache});fs.createReadStream(file).pipe(res);
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  try{
   const url=new URL(req.url,'http://localhost');const route=url.pathname;
   if(route==='/healthz'&&req.method==='GET')return json(res,200,{ok:true,storage:'sqlite'});
   if(route==='/api/session'&&req.method==='GET'){const user=session(req);return json(res,200,{authenticated:!!user,...(user?{csrf:user.csrf}:{})})}
   if(route==='/api/login'&&req.method==='POST'){
    checkOrigin(req);const ip=req.socket.remoteAddress||'unknown';const prior=attempts.get(ip);if(prior&&prior.until>Date.now()&&prior.count>=8)throw problem('Too many sign-in attempts. Try again in 15 minutes.',429,'rate_limited');
    const input=await jsonBody(req);if(typeof input.password!=='string'||input.password.length>1000)throw problem('Invalid password',401);
    const hash=crypto.scryptSync(input.password,salt,64);
    if(!crypto.timingSafeEqual(hash,passwordHash)){if(attempts.size>1000)attempts.clear();const active=prior&&prior.until>Date.now()?prior:{count:0,until:Date.now()+15*60*1000};attempts.set(ip,{...active,count:active.count+1});throw problem('Incorrect editor password',401,'unauthorized')}
    attempts.delete(ip);for(const [key,value]of sessions)if(value.expires<Date.now())sessions.delete(key);
    if(sessions.size>=100)throw problem('Too many active editing sessions',429);
    const token=crypto.randomBytes(32).toString('base64url'),csrf=crypto.randomBytes(32).toString('base64url');sessions.set(token,{csrf,expires:Date.now()+12*3600*1000});res.setHeader('Set-Cookie',cookie(req,token,12*3600));return json(res,200,{authenticated:true,csrf});
   }
   if(route==='/api/logout'&&req.method==='POST'){const user=mutation(req);sessions.delete(user.token);res.setHeader('Set-Cookie',cookie(req,'',0));return json(res,200,{authenticated:false})}
   if(route.startsWith('/api/')){
    if(req.method==='GET')authenticated(req);else mutation(req);
    const key=url.searchParams.get('key');
    if(route==='/api/catalogue'&&req.method==='GET')return json(res,200,{records:store.list().map(r=>({key:r.key,kind:r.kind,title:r.data.title,url:recordURL(r),revision:r.revision})),regions,states:stateNames});
    if(route==='/api/records'&&req.method==='GET'){
     const record=store.get(key);if(!record)throw problem('Page not found',404);
     return json(res,200,{record:editorRecord(record),rendered:renderedRecord(getCollection(),key),url:recordURL(record)});
    }
    if(route==='/api/records'&&['PUT','POST'].includes(req.method)){
     const input=await jsonBody(req),candidate=checkRecord(input.record);
     if(req.method==='PUT'&&candidate.key!==key)throw problem('Page identity cannot change');
     const prior=store.get(candidate.key);if(req.method==='PUT'&&!prior)throw problem('Page not found',404);if(prior&&prior.kind!==candidate.kind)throw problem('Page type cannot change');
     renderCollection(store,candidate);
     const summary=String(input.summary||'Updated page').trim().slice(0,500);
     const saved=req.method==='POST'?store.create(candidate,{summary}):store.save(key,candidate,{expectedRevision:input.expectedRevision,summary});invalidated();
     return json(res,req.method==='POST'?201:200,{record:editorRecord(saved),url:recordURL(saved),rendered:renderedRecord(getCollection(),saved.key)});
    }
    if(route==='/api/preview'&&req.method==='POST'){
     const input=await jsonBody(req),candidate=checkRecord(input.record),collection=renderCollection(store,candidate);
     return json(res,200,{html:collection.pages.get(recordURL(candidate))});
    }
    if(route==='/api/history'&&req.method==='GET')return json(res,200,{revisions:store.history(key)});
    if(route==='/api/revision'&&req.method==='GET'){
     const record=store.revision(key,Number(url.searchParams.get('revision')));if(!record)throw problem('Revision not found',404);
     return json(res,200,{record,html:renderCollection(store,record).pages.get(recordURL(record))});
    }
    if(route==='/api/restore'&&req.method==='POST'){
     const input=await jsonBody(req),old=store.revision(key,input.revision);if(!old)throw problem('Revision not found',404);renderCollection(store,old);
     const record=store.restore(key,input.revision,{expectedRevision:input.expectedRevision,summary:String(input.summary||`Restored revision ${input.revision}`).slice(0,500)});invalidated();
     return json(res,200,{record:editorRecord(record),url:recordURL(record),rendered:renderedRecord(getCollection(),key)});
    }
    if(route==='/api/uploads'&&req.method==='POST'){
     if(!/^image\/(jpeg|png|webp|gif|avif)(?:;|$)/i.test(req.headers['content-type']||''))throw problem('Choose a JPEG, PNG, WebP, GIF or AVIF image',415);
     const bytes=await body(req,12*1024*1024);let output;
     try{output=await sharp(bytes,{limitInputPixels:60000000,failOn:'error'}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer()}catch{throw problem('This image could not be read, or is too large',422)}
     const assetPath=crypto.randomUUID()+'.webp',file=path.join(store.uploadsDir,assetPath);fs.writeFileSync(file,output,{flag:'wx',mode:0o600});
     try{store.registerAsset({path:assetPath,mime:'image/webp',size:output.length,sha256:crypto.createHash('sha256').update(output).digest('hex'),originalName:String(url.searchParams.get('filename')||'photo').slice(0,250)})}catch(error){fs.rmSync(file,{force:true});throw error}
     invalidated();return json(res,201,{ref:`[[Attachments/${assetPath}]]`,url:'/attachments/'+assetPath});
    }
    throw problem('API route not found',404);
   }
   if(!['GET','HEAD'].includes(req.method))throw problem('Method not allowed',405);
   if(route==='/edit/'||route==='/edit'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(editorShell({key:url.searchParams.get('key')||''}));
   }
   if(route.startsWith('/attachments/')){
    let assetPath;try{assetPath=safeAssetPath(decodeURIComponent(route.slice(13)))}catch{throw problem('Not found',404)}
    const asset=store.getAsset(assetPath);if(!asset)throw problem('Not found',404);
    return sendFile(res,path.join(store.uploadsDir,assetPath),asset.mime);
   }
   if(route==='/search.json')return json(res,200,getCollection().search);
   const special={'/manifest.webmanifest':'manifest.webmanifest','/sw.js':'sw.js'};
   if(route.startsWith('/web/')||special[route]){
    const name=special[route]||route.slice(5);if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw problem('Not found',404);
    const file=path.join(root,'web-dist',name);if(!fs.existsSync(file))throw problem('Not found',404);
    if(route==='/sw.js')res.setHeader('Service-Worker-Allowed','/');return sendFile(res,file,undefined,route==='/sw.js'||name.startsWith('editor.')?'no-cache':'public, max-age=300');
   }
   const relative=decodeURIComponent(route).replace(/^\//,'');
   if(relative&&!relative.split('/').some(p=>p==='..'||p.startsWith('.'))&&!relative.includes('\\')){
    const file=path.join(root,'static',relative);if(fs.existsSync(file)&&fs.statSync(file).isFile())return sendFile(res,file);
   }
   if(!store.list().length){res.writeHead(503,{'Content-Type':'text/html; charset=utf-8'});return res.end(blankPage('Import the initial catalogue before opening the collection.'))}
   const collection=getCollection(),html=collection.pages.get(route)||collection.pages.get(route+'/');
   res.writeHead(html?200:404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(html||collection.pages.get('/404.html'));
  }catch(error){
   if(res.headersSent){res.destroy();return}
   const status=error.status||400;const response={error:error.message||'The request could not be completed',code:error.code||'invalid_request'};
   if(error.current)response.current=editorRecord(error.current);
   json(res,status,response);
  }
 });
 server.requestTimeout=30000;server.headersTimeout=15000;
 return {server,store,invalidate:invalidated,close:()=>new Promise(resolve=>server.close(()=>{store.close();resolve()}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createApp();const port=Number(process.env.PORT||8770),host=process.env.HOST||'0.0.0.0';
 app.server.listen(port,host,()=>console.log(`The Stamp Book web app listening on ${host}:${port}`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
}
