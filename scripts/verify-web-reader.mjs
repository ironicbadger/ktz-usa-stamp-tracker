// Reuse approved static-reader assertions against an isolated SQLite import.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createApp} from '../web/server.mjs';
import {importVault} from '../web/import.mjs';
const dataDir=path.resolve('.qa/reader-regression-data');
fs.rmSync(dataDir,{recursive:true,force:true});
const imported=importVault({vault:path.resolve('.qa/vault'),dataDir});
const app=createApp({dataDir,password:'reader-regression-local-only'});
await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(8773,'127.0.0.1',resolve)});
let exitCode=1;
try{
 const child=spawn(process.execPath,['scripts/verify-browser.mjs'],{env:{...process.env,QA_URL:'http://127.0.0.1:8773',QA_REAL_URL:process.env.QA_REAL_URL||'http://127.0.0.1:8766',QA_CHROME:'1'},stdio:'inherit'});
 exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1))});
 const report=fs.existsSync('.qa/browser-results.json')?JSON.parse(fs.readFileSync('.qa/browser-results.json','utf8')):{};
 fs.writeFileSync('.qa/web-reader-results.json',JSON.stringify({passed:exitCode===0,source:'SQLite HTTP app on isolated port 8773',imported,...report},null,2));
}finally{await app.close()}
process.exitCode=exitCode;
