import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadContent,walk} from '../src/content.mjs';
import {createSite} from '../src/site.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function build({vault=path.join(root,'vault'),out=path.join(root,'dist')}={}) {
 const model=loadContent(vault);
 const catalogue=JSON.parse(fs.readFileSync(path.join(root,'data/catalogue.json')));
 const versionHash=createHash('sha256');
 for(const name of fs.readdirSync(path.join(root,'static')).filter(name=>name.endsWith('.css')).sort())versionHash.update(fs.readFileSync(path.join(root,'static',name)));
 const version=versionHash.update(fs.readFileSync(path.join(root,'static/app.js'))).digest('hex').slice(0,12);
 const {pages,search}=createSite(model,catalogue,version);
 // Validate the complete model before replacing the last successful output.
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 for(const [url,html] of pages){const target=path.join(out,url.endsWith('.html')?url:url+'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html)}
 fs.cpSync(path.join(root,'static'),out,{recursive:true});
 for(const file of model.assets){const relative=path.relative(path.join(vault,'Attachments'),file);if(!/\.(png|jpe?g|webp|gif|avif)$/i.test(file))continue;const target=path.join(out,'attachments',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target)}
 fs.writeFileSync(path.join(out,'search.json'),JSON.stringify(search));
 console.log(`Built ${pages.size} pages from ${model.places.length} places and ${model.trips.length} trips.`);
 return {model,pages,out};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),value=key=>args.includes(key)?path.resolve(args[args.indexOf(key)+1]):undefined;
 build({vault:value('--vault'),out:value('--out')});
}
