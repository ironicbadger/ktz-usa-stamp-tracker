import fs from 'node:fs';
import path from 'node:path';
import {Parser} from 'htmlparser2';
import {walk} from '../src/content.mjs';
const root=path.resolve('dist'),pages=new Map();let checked=0;
for(const file of walk(root).filter(f=>f.endsWith('.html'))){const ids=new Set(),links=[];let h1=0;
 const parser=new Parser({onopentag(tag,attrs){if(attrs.id){if(ids.has(attrs.id))throw Error(`${file}: duplicate id ${attrs.id}`);ids.add(attrs.id)}if(tag==='h1')h1++;if(tag==='a'&&attrs.href)links.push(attrs.href);if(tag==='img'){if(!('alt'in attrs))throw Error(`${file}: image missing alt`);links.push(attrs.src)}if(tag==='script'&&attrs.src)links.push(attrs.src);if(tag==='link'&&attrs.href)links.push(attrs.href)}});parser.write(fs.readFileSync(file,'utf8'));parser.end();if(h1!==1)throw Error(`${file}: expected one h1`);pages.set(file,{ids,links});}
function checkLink(link,source){const url=new URL(link,'https://example.test/'+path.relative(root,source).replaceAll(path.sep,'/'));if(url.origin!=='https://example.test')return;let target=path.join(root,decodeURIComponent(url.pathname));if(!target.startsWith(root+path.sep))throw Error('Path escapes output');if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');if(!fs.existsSync(target))throw Error(`${source}: missing ${link}`);if(url.hash&&pages.has(target)&&!pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1))))throw Error(`${source}: missing anchor ${link}`);checked++}
for(const [file,{links}]of pages)for(const link of links)checkLink(link,file);
for(const item of JSON.parse(fs.readFileSync(path.join(root,'search.json'))))checkLink(item.url,path.join(root,'index.html'));
if(walk(root).some(f=>f.includes('.obsidian')||f.endsWith('.md')))throw Error('Private vault/config files leaked into output');
if(checked<pages.size)throw Error('Link checker did not cover the generated pages');
console.log(`Checked ${pages.size} HTML pages and ${checked} local links/assets/search targets.`);
