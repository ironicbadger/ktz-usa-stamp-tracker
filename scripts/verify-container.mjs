// Exercise the production image, including a real edit across a container restart.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const docker=process.env.DOCKER||'docker', image=process.env.TEST_IMAGE||'stamp-book:ci';
const name=`stamp-book-ci-${process.pid}`, volume=`${name}-data`, temp=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-book-ci-'));
const password=randomBytes(24).toString('hex');fs.writeFileSync(path.join(temp,'password'),password,{mode:0o644});
const run=(args)=>execFileSync(docker,args,{encoding:'utf8'}).trim();
let base,cookie,csrf;
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'/healthz')).ok)return}catch{}await new Promise(r=>setTimeout(r,200));}throw Error('Container did not become healthy');}
async function api(route,method='GET',body){const response=await fetch(base+route,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method!=='GET'?{Origin:base,'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();assert.ok(response.ok,JSON.stringify(data));return {response,data};}
async function login(){const result=await api('/api/login','POST',{password});cookie=result.response.headers.get('set-cookie').split(';')[0];csrf=result.data.csrf;}
try{
 run(['volume','create',volume]);
 run(['run','--rm','-v',`${volume}:/data`,image,'npm','run','web:import','--','--vault','vault','--data','/data']);
 run(['run','-d','--name',name,'-p','127.0.0.1::8770','-v',`${volume}:/data`,'-v',`${temp}/password:/run/secrets/password:ro`,'-e','APP_PASSWORD_FILE=/run/secrets/password',image]);
 base='http://'+run(['port',name,'8770/tcp']);await ready();
 assert.equal(run(['exec',name,'id','-u']),'1000');
 await login();const {data:catalogue}=await api('/api/catalogue');
 const entry=catalogue.records.find(r=>r.title==='Yellowstone National Park');assert.ok(entry);
 const route='/api/records?key='+encodeURIComponent(entry.key),{data:before}=await api(route);
 const marker='CI container persistence verified',record=structuredClone(before.record);
 record.prose={about:{json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:marker}]}]}}};
 const {data:saved}=await api(route,'PUT',{record,expectedRevision:before.record.revision,summary:'Container CI'});
 run(['restart',name]);base='http://'+run(['port',name,'8770/tcp']);await ready();await login();
 const {data:after}=await api(route);assert.equal(after.record.revision,saved.record.revision);assert.ok(after.record.body.includes(marker));
 assert.ok((await(await fetch(base+saved.url)).text()).includes(marker));
 assert.equal((await fetch(base+'/states/georgia/')).status,200);
 assert.equal((await fetch(base+'/edit/')).status,200);
 console.log('PASS: non-root image, catalogue import, login, edit, persistent restart, reader and state pages');
}catch(error){try{console.error(run(['logs',name]));}catch{}throw error;}
finally{try{run(['rm','-f',name]);}catch{}try{run(['volume','rm',volume]);}catch{}fs.rmSync(temp,{recursive:true,force:true});}
