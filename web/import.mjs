import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadContent,parseNote,walk} from '../src/content.mjs';
import {Store,safeAssetPath} from './store.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const mime=file=>({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.svg':'image/svg+xml'})[path.extname(file).toLowerCase()]||'application/octet-stream';
export function importVault({vault,dataDir}){
 vault=path.resolve(vault);dataDir=path.resolve(dataDir);
 if(!fs.existsSync(vault))throw Error('Vault directory does not exist');
 // Validation resolves links, dates, attachments, IDs and reports before any write.
 const model=loadContent(vault);
 const notes=['Places','Trips','Regions'].flatMap(kind=>walk(path.join(vault,kind)).filter(f=>f.endsWith('.md')).map(file=>({key:path.relative(vault,file).replaceAll(path.sep,'/').slice(0,-3),kind,...parseNote(fs.readFileSync(file,'utf8'),file)})));
 for(const n of model.nodes||[])if(!notes.some(r=>r.key===n.key))notes.push({key:n.key,kind:n.kind,data:{title:n.title},body:''});
 const assets=walk(path.join(vault,'Attachments')).filter(f=>!path.basename(f).startsWith('.')).map(file=>{
  if(fs.lstatSync(file).isSymbolicLink())throw Error('Import does not follow asset symlinks');
  const assetPath=safeAssetPath(path.relative(path.join(vault,'Attachments'),file).replaceAll(path.sep,'/'));
  const bytes=fs.readFileSync(file);return {file,path:assetPath,size:bytes.length,sha256:hash(bytes),mime:mime(file),originalName:path.basename(file)};
 });
 const fingerprint=hash(JSON.stringify({notes:notes.sort((a,b)=>a.key.localeCompare(b.key)),assets:assets.map(({file,...a})=>a).sort((a,b)=>a.path.localeCompare(b.path))}));
 const store=new Store({dataDir});
 try{
  if(store.getMeta('import')?.fingerprint===fingerprint)return {imported:false,idempotent:true,count:store.list().length,assets:store.listAssets().length};
  if(store.list().length||store.listAssets().length)throw Error('Database is not empty. Import will not overwrite existing content or edits.');
  // Stage file copies before the transaction, then register only successfully copied assets.
  const copied=[];
  try{
   for(const a of assets){const dest=path.join(store.uploadsDir,a.path);if(fs.existsSync(dest))throw Error(`Upload destination already exists: ${a.path}`);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(a.file,dest,fs.constants.COPYFILE_EXCL);copied.push(dest)}
   store.transaction(()=>{for(const n of notes)store._write({...n,revision:1},{actor:'import',summary:'Imported existing catalogue'});for(const a of assets)store.registerAsset(a);store.setMeta('import',{fingerprint,importedAt:new Date().toISOString(),count:notes.length})});
  }catch(error){for(const file of copied)fs.rmSync(file,{force:true});throw error}
  return {imported:true,count:notes.length,assets:assets.length,fingerprint};
 }finally{store.close()}
}
export function options(args){const out={};for(let i=0;i<args.length;i++){if(!args[i].startsWith('--')||!args[i+1]||args[i+1].startsWith('--'))throw Error('Expected --option value');out[args[i].slice(2)]=args[++i]}return out}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=options(process.argv.slice(2));console.log(JSON.stringify(importVault({vault:args.vault||'vault',dataDir:args.data||process.env.DATA_DIR||'data'}),null,2))}catch(error){console.error(error.message);process.exitCode=1}
}
