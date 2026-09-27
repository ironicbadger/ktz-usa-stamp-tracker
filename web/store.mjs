import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

const json=value=>JSON.stringify(value);
const parse=value=>JSON.parse(value);
export class ConflictError extends Error {
 constructor(current){super('This page changed after you opened it. Review the latest revision before saving.');this.status=409;this.code='revision_conflict';this.current=current}
}
export function safeAssetPath(value){
 if(typeof value!=='string'||!value||value.includes('\\')||value.startsWith('/')||value.split('/').some(p=>!p||p==='.'||p==='..')||/[\x00-\x1f]/.test(value))throw Error('Invalid asset path');
 return value;
}
export class Store {
 constructor(options){
  this.dataDir=path.resolve(typeof options==='string'?options:options.dataDir);
  fs.mkdirSync(this.dataDir,{recursive:true});this.uploadsDir=path.join(this.dataDir,'uploads');fs.mkdirSync(this.uploadsDir,{recursive:true});
  this.db=new DatabaseSync(path.join(this.dataDir,'stamp-book.sqlite'));
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS nodes (key TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('Places','Trips','Regions')),data TEXT NOT NULL,body TEXT NOT NULL,prose TEXT,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS visits (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,date TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS impressions (node_key TEXT NOT NULL,visit_position INTEGER NOT NULL,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,visit_position,position),FOREIGN KEY(node_key,visit_position) REFERENCES visits(node_key,position) ON DELETE CASCADE);
   CREATE TABLE IF NOT EXISTS expected_stamps (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS locations (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS location_reports (node_key TEXT NOT NULL,location_position INTEGER NOT NULL,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,location_position,position),FOREIGN KEY(node_key,location_position) REFERENCES locations(node_key,position) ON DELETE CASCADE);
   CREATE TABLE IF NOT EXISTS revisions (node_key TEXT NOT NULL REFERENCES nodes(key),revision INTEGER NOT NULL,snapshot TEXT NOT NULL,actor TEXT NOT NULL,summary TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(node_key,revision));
   CREATE TRIGGER IF NOT EXISTS revisions_no_update BEFORE UPDATE ON revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
   CREATE TRIGGER IF NOT EXISTS revisions_no_delete BEFORE DELETE ON revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
   CREATE TABLE IF NOT EXISTS assets (path TEXT PRIMARY KEY,mime TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,original_name TEXT NOT NULL,created_at TEXT NOT NULL);
  `);
 }
 close(){this.db.close()}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result}catch(error){this.db.exec('ROLLBACK');throw error}}
 getMeta(key){const row=this.db.prepare('SELECT value FROM metadata WHERE key=?').get(key);return row?parse(row.value):undefined}
 setMeta(key,value){this.db.prepare('INSERT INTO metadata VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,json(value))}
 list(){return this.db.prepare('SELECT key FROM nodes ORDER BY key').all().map(row=>this.get(row.key))}
 get(key){
  const row=this.db.prepare('SELECT * FROM nodes WHERE key=?').get(key);if(!row)return null;
  const data=parse(row.data);
  if(Object.hasOwn(data,'visits'))data.visits=this.db.prepare('SELECT * FROM visits WHERE node_key=? ORDER BY position').all(key).map(v=>({...parse(v.data),stamps:this.db.prepare('SELECT data FROM impressions WHERE node_key=? AND visit_position=? ORDER BY position').all(key,v.position).map(s=>parse(s.data))}));
  if(Object.hasOwn(data,'stamps'))data.stamps=this.db.prepare('SELECT data FROM expected_stamps WHERE node_key=? ORDER BY position').all(key).map(s=>parse(s.data));
  if(Object.hasOwn(data,'stamping_locations'))data.stamping_locations=this.db.prepare('SELECT * FROM locations WHERE node_key=? ORDER BY position').all(key).map(l=>({...parse(l.data),reports:this.db.prepare('SELECT data FROM location_reports WHERE node_key=? AND location_position=? ORDER BY position').all(key,l.position).map(r=>parse(r.data))}));
  return {key:row.key,kind:row.kind,data,body:row.body,...(row.prose?{prose:parse(row.prose)}:{}),revision:row.revision,updatedAt:row.updated_at};
 }
 _write(record,{actor='editor',summary='Updated page'}={}){
  const {key,kind,body='',prose}=record;
  if(!['Places','Trips','Regions'].includes(kind)||typeof key!=='string'||!key.startsWith(kind+'/')||key.includes('..')||/[\x00-\x1f]/.test(key))throw Error('Invalid record key or kind');
  if(!record.data||typeof record.data!=='object'||Array.isArray(record.data)||typeof body!=='string')throw Error('Invalid record data');
  const data=structuredClone(record.data),visits=data.visits,stamps=data.stamps,locations=data.stamping_locations;
  for(const field of ['visits','stamps','stamping_locations'])if(Object.hasOwn(data,field)){if(!Array.isArray(data[field]))throw Error(`${field} must be an array`);data[field]=[]}
  const updatedAt=new Date().toISOString();
  this.db.prepare('INSERT INTO nodes VALUES (?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data,body=excluded.body,prose=excluded.prose,revision=excluded.revision,updated_at=excluded.updated_at').run(key,kind,json(data),body,prose?json(prose):null,record.revision,updatedAt);
  for(const table of ['visits','expected_stamps','locations'])this.db.prepare(`DELETE FROM ${table} WHERE node_key=?`).run(key);
  visits?.forEach((v,i)=>{const {stamps:impressions,...rest}=v;this.db.prepare('INSERT INTO visits VALUES (?,?,?,?,?)').run(key,i,v.id??null,v.date??null,json(rest));(impressions||[]).forEach((s,j)=>this.db.prepare('INSERT INTO impressions VALUES (?,?,?,?,?)').run(key,i,j,s.id??null,json(s)))});
  stamps?.forEach((s,i)=>this.db.prepare('INSERT INTO expected_stamps VALUES (?,?,?,?)').run(key,i,s.id??null,json(s)));
  locations?.forEach((l,i)=>{const {reports,...rest}=l;this.db.prepare('INSERT INTO locations VALUES (?,?,?,?)').run(key,i,l.id??null,json(rest));(reports||[]).forEach((r,j)=>this.db.prepare('INSERT INTO location_reports VALUES (?,?,?,?,?)').run(key,i,j,r.id??null,json(r)))});
  const result=this.get(key);
  this.db.prepare('INSERT INTO revisions VALUES (?,?,?,?,?,?)').run(key,result.revision,json(result),String(actor),String(summary),updatedAt);return result;
 }
 create(record,options={}){return this.transaction(()=>{if(this.get(record.key))throw new ConflictError(this.get(record.key));return this._write({...record,revision:1},options)})}
 save(key,changes,options={}){return this.transaction(()=>{const current=this.get(key);if(!current)throw Object.assign(Error('Page not found'),{status:404});if(!Number.isInteger(options.expectedRevision)||options.expectedRevision!==current.revision)throw new ConflictError(current);return this._write({...current,...changes,key,kind:current.kind,revision:current.revision+1},options)})}
 history(key){return this.db.prepare('SELECT revision,actor,summary,created_at AS createdAt FROM revisions WHERE node_key=? ORDER BY revision DESC').all(key)}
 revision(key,number){const row=this.db.prepare('SELECT snapshot FROM revisions WHERE node_key=? AND revision=?').get(key,number);return row?parse(row.snapshot):null}
 restore(key,number,options={}){const old=this.revision(key,number);if(!old)throw Object.assign(Error('Revision not found'),{status:404});return this.save(key,{data:old.data,body:old.body,prose:old.prose},{...options,summary:options.summary||`Restored revision ${number}`})}
 listAssets(){return this.db.prepare('SELECT path,mime,size,sha256,original_name AS originalName,created_at AS createdAt FROM assets ORDER BY path').all()}
 getAsset(assetPath){return this.listAssets().find(a=>a.path===assetPath)||null}
 registerAsset(asset){safeAssetPath(asset.path);const existing=this.getAsset(asset.path);if(existing){if(existing.sha256!==asset.sha256)throw Error('Asset path already exists with different content');return existing}this.db.prepare('INSERT INTO assets VALUES (?,?,?,?,?,?)').run(asset.path,asset.mime,asset.size,asset.sha256,asset.originalName||path.basename(asset.path),new Date().toISOString());return this.getAsset(asset.path)}
 backup(targetDir){
  const target=path.resolve(targetDir);if(fs.existsSync(target))throw Error('Backup destination already exists');if(target===this.dataDir||target.startsWith(this.dataDir+path.sep))throw Error('Backup must be outside the data directory');
  fs.mkdirSync(target,{recursive:true});try{this.db.exec(`VACUUM INTO '${path.join(target,'stamp-book.sqlite').replaceAll("'","''")}'`);fs.cpSync(this.uploadsDir,path.join(target,'uploads'),{recursive:true});fs.writeFileSync(path.join(target,'backup.json'),json({format:1,createdAt:new Date().toISOString(),database:'stamp-book.sqlite',uploads:'uploads'}));return target}catch(error){fs.rmSync(target,{recursive:true,force:true});throw error}
 }
}
