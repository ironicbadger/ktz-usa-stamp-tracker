import fs from 'node:fs';
import {Store} from '../web/store.mjs';
import {enrichPlace} from '../web/park-facts.mjs';
import {validatePlace} from '../src/content.mjs';
const args=process.argv.slice(2),index=args.indexOf('--data');
if(index<0||!args[index+1])throw Error('Usage: node scripts/enrich-park-facts.mjs --data /path/to/data [--apply]. Without --apply, only reports proposed changes.');
const store=new Store(args[index+1]),facts=JSON.parse(fs.readFileSync(new URL('../data/park-facts.json',import.meta.url),'utf8'));
try{
 const changes=[];let places=0;
 for(const original of store.list()){
  if(original.kind!=='Places')continue;places++;
  const source=facts.find(f=>f.title===original.data.title);if(!source)continue;
  const {record,fields}=enrichPlace(original,source);if(!fields.length)continue;
  validatePlace(record.data,record.key);changes.push({record,fields});
 }
 if(args.includes('--apply'))for(const {record,fields}of changes)store.save(record.key,record,{expectedRevision:record.revision,actor:'nps-enrichment',summary:'Filled missing NPS place details: '+fields.join(', ')});
 console.log(JSON.stringify({applied:args.includes('--apply'),places,changed:changes.length,fields:Object.fromEntries(['description','area','established'].map(f=>[f,changes.filter(c=>c.fields.includes(f)).length])),missing:facts.filter(f=>!f.description||f.area===undefined||!f.established).map(f=>({title:f.title,fields:['description','area','established'].filter(k=>!f[k])}))},null,2));
}finally{store.close()}
