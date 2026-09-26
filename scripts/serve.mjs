import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {build,root} from './build.mjs';
const args=process.argv.slice(2),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const host=value('--host','127.0.0.1'),port=Number(value('--port','8766')),watch=args.includes('--watch');
const dist=path.join(root,'dist');
if(watch||!fs.existsSync(dist))build();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif'};
http.createServer((req,res)=>{
 let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 let file=path.resolve(dist,'.'+requested);
 if(!file.startsWith(dist+path.sep)&&file!==dist){res.writeHead(403);res.end();return}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 let status=200;if(!fs.existsSync(file)||!fs.statSync(file).isFile()){file=path.join(dist,'404.html');status=404}
 res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(port,host,()=>console.log(`Preview: http://${host}:${port}/ ${watch?'(watching vault, src and static)':''}`));
if(watch){let timer;for(const dir of ['vault','src','static','data'])fs.watch(path.join(root,dir),{recursive:true},(_,file)=>{if(!file||file.includes('.obsidian')||file.includes('/.'))return;clearTimeout(timer);timer=setTimeout(()=>{const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit'});if(result.status!==0)console.error('Build failed; previous preview retained.')},250)})}
