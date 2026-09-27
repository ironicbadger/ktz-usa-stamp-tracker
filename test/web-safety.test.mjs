import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Store} from '../web/store.mjs';
import {migrate,migrations} from '../web/migrations.mjs';
import {verifyBackup} from '../web/snapshots.mjs';
import {restoreBackup} from '../web/backup.mjs';
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-safety-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir};
const record={key:'Places/Family',kind:'Places',body:'Original memory',data:{title:'Family',visits:[],custom:{neverLose:true}}};
const backups=dir=>fs.readdirSync(path.join(dir,'backups')).filter(n=>n.startsWith('startup-')).sort();
test('keeps seven complete startup revisions; all restore including photos and history',t=>{
 const base=temp(t),dir=path.join(base,'live');let store=new Store(dir);store.create(record);
 fs.writeFileSync(path.join(store.uploadsDir,'photo.webp'),'family photograph');store.registerAsset({path:'photo.webp',mime:'image/webp',size:17,sha256:crypto.createHash('sha256').update('family photograph').digest('hex')});store.close();
 for(let i=0;i<10;i++){store=new Store(dir);const current=store.get(record.key);store.save(record.key,{body:'Memory '+i},{expectedRevision:current.revision});store.close()}
 const snapshots=backups(dir);assert.equal(snapshots.length,7);
 for(const [i,name]of snapshots.entries()){
  const from=path.join(dir,'backups',name),to=path.join(base,'restored-'+i);assert.equal(verifyBackup(from).format,2);restoreBackup({from,dataDir:to});
  const restored=new Store(to);assert.equal(restored.get(record.key).body,'Memory '+(i+2));assert.equal(restored.history(record.key).length,i+4);assert.deepEqual(restored.get(record.key).data.custom,{neverLose:true});assert.equal(fs.readFileSync(path.join(to,'uploads/photo.webp'),'utf8'),'family photograph');restored.close();
 }
});
test('backs up the legacy schema and committed WAL before migration without losing edits',t=>{
 const dir=temp(t);let store=new Store(dir);store.create(record);store.save(record.key,{body:'Wife added this'},{expectedRevision:1});
 store.db.exec('DROP TABLE schema_migrations; ALTER TABLE revisions DROP COLUMN actor_name; PRAGMA user_version=0');
 const upgraded=new Store(dir);assert.equal(upgraded.get(record.key).body,'Wife added this');assert.equal(upgraded.history(record.key).length,2);
 const from=path.join(dir,'backups',backups(dir)[0]);assert.equal(verifyBackup(from).schemaVersion,0);
 const old=new DatabaseSync(path.join(from,'stamp-book.sqlite'),{readOnly:true});assert.equal(old.prepare('SELECT body FROM nodes').get().body,'Wife added this');old.close();upgraded.close();store.close();
});
test('failed migrations roll back schema and data; modified history and downgrades refuse',t=>{
 const dir=temp(t),store=new Store(dir);store.create(record);
 assert.throws(()=>migrate(store.db,[...migrations,{version:3,name:'broken',sql:'ALTER TABLE nodes ADD COLUMN extra TEXT; UPDATE nodes SET body=\'lost\'; SELECT * FROM nonexistent;'}]));
 assert.equal(store.db.prepare('PRAGMA user_version').get().user_version,2);assert.equal(store.get(record.key).body,record.body);assert.ok(!store.db.prepare('PRAGMA table_info(nodes)').all().some(c=>c.name==='extra'));
 assert.throws(()=>migrate(store.db,[{...migrations[0],sql:migrations[0].sql+'\n-- changed'},...migrations.slice(1)]),/modified/);
 store.db.exec('PRAGMA user_version=99');assert.throws(()=>migrate(store.db),/newer/);store.close();
 assert.throws(()=>new Store(dir),/newer/);
});
test('backup failure prevents migration and preserves earlier snapshots',t=>{
 const dir=temp(t);let store=new Store(dir);store.create(record);store.close();store=new Store(dir);store.close();
 const prior=backups(dir);fs.renameSync(path.join(dir,'backups'),path.join(dir,'saved-backups'));fs.writeFileSync(path.join(dir,'backups'),'not a directory');
 assert.throws(()=>new Store(dir));
 assert.deepEqual(fs.readdirSync(path.join(dir,'saved-backups')),prior);
 const db=new DatabaseSync(path.join(dir,'stamp-book.sqlite'),{readOnly:true});assert.equal(db.prepare('SELECT body FROM nodes').get().body,record.body);db.close();
});
test('corrupt photo or database backups cannot be restored and existing data cannot be overwritten',t=>{
 const base=temp(t),dir=path.join(base,'live'),store=new Store(dir);store.create(record);store.backup(path.join(base,'backup'));store.close();
 assert.throws(()=>restoreBackup({from:path.join(base,'backup'),dataDir:dir}),/absent or empty/);
 fs.appendFileSync(path.join(base,'backup','stamp-book.sqlite'),'damage');
 assert.throws(()=>restoreBackup({from:path.join(base,'backup'),dataDir:path.join(base,'restore')}),/checksum/);
 assert.equal(fs.existsSync(path.join(base,'restore')),false);
});

test('truncated existing database and missing registered photos fail closed',t=>{
 const dir=temp(t);fs.writeFileSync(path.join(dir,'stamp-book.sqlite'),'');assert.throws(()=>new Store(dir),/empty/);
 fs.unlinkSync(path.join(dir,'stamp-book.sqlite'));const store=new Store(dir);store.create(record);store.registerAsset({path:'missing.webp',mime:'image/webp',size:1,sha256:'bad'});store.close();assert.throws(()=>new Store(dir),/Backup failed/);
});

test('author attribution preserves stable identity and friendly display name',t=>{
 const dir=temp(t),store=new Store(dir);store.create(record,{actor:'issuer#alex',actorName:'Alex'});store.save(record.key,{body:'Cat added a memory'},{expectedRevision:1,actor:'issuer#cat',actorName:'Cat'});store.close();
 const reopened=new Store(dir);const history=reopened.history(record.key);assert.equal(history[0].actor,'issuer#cat');assert.equal(history[0].actorName,'Cat');assert.equal(history[1].actorName,'Alex');reopened.close();
});
