import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {verifyBackup,createBackup} from './snapshots.mjs';
import {options} from './import.mjs';
export function restoreBackup({from,dataDir}){
 from=path.resolve(from);dataDir=path.resolve(dataDir);
 if(fs.existsSync(dataDir)&&fs.readdirSync(dataDir).length)throw Error('Restore destination must be absent or empty. Stop the app and restore to a fresh directory.');
 verifyBackup(from);
 const parent=path.dirname(dataDir);fs.mkdirSync(parent,{recursive:true});
 const staging=fs.mkdtempSync(path.join(parent,'.restore-'));
 try{
  fs.copyFileSync(path.join(from,'stamp-book.sqlite'),path.join(staging,'stamp-book.sqlite'));
  fs.cpSync(path.join(from,'uploads'),path.join(staging,'uploads'),{recursive:true});
  fs.copyFileSync(path.join(from,'backup.json'),path.join(staging,'backup.json'));
  verifyBackup(staging);
  fs.unlinkSync(path.join(staging,'backup.json'));
  const flush=file=>{if(fs.statSync(file).isDirectory())for(const child of fs.readdirSync(file))flush(path.join(file,child));const fd=fs.openSync(file,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
  flush(staging);
  // rename only replaces an empty directory, never a populated live database.
  fs.renameSync(staging,dataDir);const fd=fs.openSync(parent,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)};
  return dataDir;
 }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error}

}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [command,...rest]=process.argv.slice(2),args=options(rest),dataDir=args.data||process.env.DATA_DIR||'data';if(command==='backup'){if(!args.out)throw Error('Use backup --data DATA --out NEW_BACKUP_DIRECTORY');if(!fs.existsSync(path.join(dataDir,'stamp-book.sqlite')))throw Error('Database does not exist; nothing to back up');const db=new DatabaseSync(path.join(dataDir,'stamp-book.sqlite'),{readOnly:true});try{console.log(createBackup(db,dataDir,args.out))}finally{db.close()}}else if(command==='restore'){if(!args.from)throw Error('Use restore --from BACKUP --data EMPTY_DATA_DIRECTORY');console.log(restoreBackup({from:args.from,dataDir}))}else throw Error('Expected backup or restore')}catch(error){console.error(error.message);process.exitCode=1}
}
