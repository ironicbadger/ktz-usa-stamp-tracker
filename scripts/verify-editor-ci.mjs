import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-book-editor-'));
const passwordFile=path.join(temp,'password');fs.writeFileSync(passwordFile,randomBytes(24).toString('hex'),{mode:0o600});
const env={...process.env,CI:'true',APP_PASSWORD_FILE:passwordFile,DATA_DIR:path.join(temp,'data'),HOST:'127.0.0.1',PORT:'8779',QA_WEB_URL:'http://127.0.0.1:8779'};
let server;
try{
 execFileSync(process.execPath,['web/import.mjs','--vault','.qa/vault','--data',env.DATA_DIR],{stdio:'inherit'});
 server=spawn(process.execPath,['web/server.mjs'],{env,stdio:'inherit'});
 let ready=false;
 for(let i=0;i<100;i++){try{ready=(await fetch(env.QA_WEB_URL+'/healthz')).ok;if(ready)break}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!ready)throw Error('Editor test server did not start');
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/verify-web-editor.mjs'],{env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Browser checks exited ${code}`)));});
}finally{if(server&&server.exitCode===null){await new Promise(resolve=>{server.once('exit',resolve);server.kill();});}fs.rmSync(temp,{recursive:true,force:true});}
