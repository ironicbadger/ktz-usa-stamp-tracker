import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {checkDatabase} from './migrations.mjs';
import {appVersion} from './version.mjs';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sync=file=>{const fd=fs.openSync(file,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
function assetFile(root,name){
 if(typeof name!=='string'||!name||name.includes('\\')||path.isAbsolute(name)||name.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid backup asset path');
 let file=root;
 for(const part of name.split('/')){file=path.join(file,part);if(fs.lstatSync(file).isSymbolicLink())throw Error('Backup assets must not be symlinks');}
 return file;
}
export function verifyBackup(from){
 const manifest=JSON.parse(fs.readFileSync(path.join(from,'backup.json'),'utf8'));
 if(![1,2].includes(manifest.format))throw Error('Unsupported backup format');
 const filename=path.join(from,'stamp-book.sqlite');
 if(manifest.format===2&&digest(fs.readFileSync(filename))!==manifest.databaseSha256)throw Error('Backup database checksum mismatch');
 const db=new DatabaseSync(filename,{readOnly:true});
 try{
  checkDatabase(db);
  for(const asset of db.prepare('SELECT path,size,sha256 FROM assets').all()){
   const bytes=fs.readFileSync(assetFile(path.join(from,'uploads'),asset.path));
   if(bytes.length!==asset.size||digest(bytes)!==asset.sha256)throw Error(`Backup asset failed checksum: ${asset.path}`);
  }
 }finally{db.close()}
 if(!fs.statSync(path.join(from,'uploads')).isDirectory())throw Error('Backup uploads are missing');
 return manifest;
}
export function createBackup(db,dataDir,target,{kind='manual'}={}){
 target=path.resolve(target);
 if(fs.existsSync(target))throw Error('Backup destination already exists');
 checkDatabase(db);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 const staging=fs.mkdtempSync(path.join(path.dirname(target),'.incomplete-'));
 try{
  const filename=path.join(staging,'stamp-book.sqlite');
  // SQLite includes committed WAL contents; never copy a live SQLite file.
  db.exec(`VACUUM INTO '${filename.replaceAll("'","''")}'`);
  const snapshot=new DatabaseSync(filename,{readOnly:true});
  let assets,version;
  try{assets=snapshot.prepare('SELECT path FROM assets').all();version=snapshot.prepare('PRAGMA user_version').get().user_version}finally{snapshot.close()}
  const uploads=path.join(staging,'uploads');fs.mkdirSync(uploads);
  for(const {path:name} of assets){
   const source=assetFile(path.join(dataDir,'uploads'),name),dest=path.join(uploads,name);
   fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest,fs.constants.COPYFILE_EXCL);sync(dest);
  }
  fs.writeFileSync(path.join(staging,'backup.json'),JSON.stringify({format:2,kind,createdAt:new Date().toISOString(),appVersion,schemaVersion:version,database:'stamp-book.sqlite',databaseSha256:digest(fs.readFileSync(filename)),uploads:'uploads'},null,2));
  verifyBackup(staging);
  sync(filename);sync(path.join(staging,'backup.json'));
  // Flush all nested directories before making the complete backup visible.
  const flush=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true}))if(e.isDirectory())flush(path.join(dir,e.name));sync(dir)};
  flush(staging);fs.renameSync(staging,target);sync(path.dirname(target));
  return target;
 }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw Error(`Backup failed; database was not migrated: ${error.message}`,{cause:error})}
}
export function startupBackup(db,dataDir){
 const name=`startup-${new Date().toISOString().replaceAll(':','-')}-${crypto.randomBytes(6).toString('hex')}`;
 return createBackup(db,dataDir,path.join(dataDir,'backups',name),{kind:'startup'});
}
export function pruneStartupBackups(root,keep=7){
 // Only prune verified, completed, startup backups, and only after migration succeeds.
 const entries=fs.readdirSync(root).filter(name=>/^startup-\d{4}-.*-[0-9a-f]{12}$/.test(name)).sort().reverse();
 const valid=[];
 for(const name of entries){const dir=path.join(root,name);if(fs.lstatSync(dir).isSymbolicLink())continue;try{if(verifyBackup(dir).kind==='startup')valid.push(dir)}catch{/* Preserve damaged backups for investigation. */}}
 for(const dir of valid.slice(keep))fs.rmSync(dir,{recursive:true});
 sync(root);
}
