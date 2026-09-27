import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import crypto from 'node:crypto';
import {Store,safeAssetPath} from './store.mjs';
import {options} from './import.mjs';
export function restoreBackup({from,dataDir}){
 from=path.resolve(from);dataDir=path.resolve(dataDir);
 if(fs.existsSync(dataDir)&&fs.readdirSync(dataDir).length)throw Error('Restore destination must be absent or empty. Stop the app and restore to a fresh directory.');
 const manifest=JSON.parse(fs.readFileSync(path.join(from,'backup.json'),'utf8'));
 if(manifest.format!==1)throw Error('Unsupported backup format');
 const db=new DatabaseSync(path.join(from,'stamp-book.sqlite'),{readOnly:true});try{
  if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup failed SQLite integrity check');
  for(const asset of db.prepare('SELECT path,size,sha256 FROM assets').all()){
   const file=path.join(from,'uploads',safeAssetPath(asset.path));
   const bytes=fs.readFileSync(file);
   if(bytes.length!==asset.size||crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error(`Backup asset failed checksum: ${asset.path}`);
  }
 }finally{db.close()}
 if(!fs.statSync(path.join(from,'uploads')).isDirectory())throw Error('Backup uploads are missing');
 fs.mkdirSync(dataDir,{recursive:true});fs.copyFileSync(path.join(from,'stamp-book.sqlite'),path.join(dataDir,'stamp-book.sqlite'));fs.cpSync(path.join(from,'uploads'),path.join(dataDir,'uploads'),{recursive:true});return dataDir;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [command,...rest]=process.argv.slice(2),args=options(rest),dataDir=args.data||process.env.DATA_DIR||'data';if(command==='backup'){if(!args.out)throw Error('Use backup --data DATA --out NEW_BACKUP_DIRECTORY');if(!fs.existsSync(path.join(dataDir,'stamp-book.sqlite')))throw Error('Database does not exist; nothing to back up');const store=new Store({dataDir});try{console.log(store.backup(args.out))}finally{store.close()}}else if(command==='restore'){if(!args.from)throw Error('Use restore --from BACKUP --data EMPTY_DATA_DIRECTORY');console.log(restoreBackup({from:args.from,dataDir}))}else throw Error('Expected backup or restore')}catch(error){console.error(error.message);process.exitCode=1}
}
