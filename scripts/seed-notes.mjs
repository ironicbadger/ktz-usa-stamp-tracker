// Initial seeding only: never overwrite an existing authored note.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {regions} from '../src/content.mjs';
const catalogue=JSON.parse(fs.readFileSync('data/catalogue.json'));
const statesByRegion=[['CT','ME','MA','NH','NY','RI','VT'],['DE','MD','NJ','PA','VA','WV'],['DC'],['AL','FL','GA','KY','MS','NC','SC','TN','PR','VI'],['IL','IN','IA','KS','MI','MN','MO','NE','OH','WI'],['AR','LA','NM','OK','TX'],['CO','MT','ND','SD','UT','WY'],['AZ','CA','HI','NV','AS','GU','MP','UM'],['AK','ID','OR','WA']];
const overrides={yell:'Rocky Mountain',glca:'Rocky Mountain',grsm:'Southeast',deva:'Western',gate:'North Atlantic',elis:'North Atlantic',stli:'North Atlantic',choh:'National Capital',gwmp:'National Capital',arho:'National Capital',camo:'National Capital',clba:'National Capital',fowa:'National Capital',gree:'National Capital',pisc:'National Capital',prwi:'National Capital',wotr:'National Capital',nace:'National Capital',naca:'National Capital'};
const safe=s=>s.replace(/[<>:"/\\|?*]/g,'-').replace(/\.$/,'');
const titles=new Map();
for(const p of catalogue)titles.set(p.title,(titles.get(p.title)||0)+1);
let created=0;
for(const p of catalogue){
 const region=overrides[p.code]||regions[statesByRegion.findIndex(states=>states.includes(p.states[0]))];
 if(!region)throw Error('Unmapped region: '+p.title);
 const name=safe(p.title)+(titles.get(p.title)>1?` (${p.code.toUpperCase()})`:'');
 const file=path.join('vault/Places',name+'.md');
 if(fs.existsSync(file))continue;
 const data={title:p.title,park_code:p.code,states:p.states,passport_region:region,visits:[]};
 fs.writeFileSync(file,'---\n'+YAML.stringify(data,{lineWidth:0})+'---\n');created++;
}
for(const region of regions){const file=`vault/Regions/${safe(region)}.md`;if(!fs.existsSync(file))fs.writeFileSync(file,'---\n'+YAML.stringify({title:region,map:null})+'---\n')}
console.log(`Seeded ${created} blank places; existing notes preserved.`);
