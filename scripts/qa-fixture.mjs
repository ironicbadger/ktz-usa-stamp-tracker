// Isolated demo content; never writes to vault/ or dist/.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {build,root} from './build.mjs';
const vault=path.join(root,'.qa/vault'),out=path.join(root,'.qa/dist');
fs.mkdirSync(vault,{recursive:true});
for(const dir of ['Places','Regions','Trips'])fs.cpSync(path.join(root,'vault',dir),path.join(vault,dir),{recursive:true});
fs.mkdirSync(path.join(vault,'Attachments'),{recursive:true});
fs.copyFileSync(path.join(root,'test/fixtures/assets/sample-stamp.png'),path.join(vault,'Attachments/sample-stamp.png'));
for(const [name,source] of [['wide','mockups/style-02-modern-docs-selected.png'],['tall','references/layout-before-mobile.png']])fs.copyFileSync(path.join(root,'docs/design',source),path.join(vault,'Attachments/qa-'+name+'.png'));
const write=(file,data,body='')=>fs.writeFileSync(path.join(vault,file),`---\n${YAML.stringify(data)}---\n${body}`);
const photo='[[Attachments/sample-stamp.png]]';
const stamp=(name,type,location,extra={})=>({name,type,location,location_id:location==='Visitor centre A'?'centre-a':location==='Visitor centre B'?'centre-b':'former',photos:[photo],notes:'Illustrative test impression.',...extra});
const report=(id,extra={})=>({id,origin:'authored',availability:'available',access:'At the information desk.',stamps:[{name:'Park cancellation',type:'main',availability:'available'}],source:{url:'https://www.nps.gov/yell/',checked:'2026-09-20'},...extra});
write('Places/Yellowstone National Park.md',{
 title:'Yellowstone National Park',park_code:'yell',states:['ID','MT','WY'],passport_region:'Rocky Mountain',
 visits:[{id:'sample-visit',date:'2026-09-25',trip:'[[Trips/Design QA trip]]',notes:'Test visit for layout review.',stamps:[stamp('Park cancellation · visitor centre A','main','Visitor centre A',{photos:[photo,photo]}),stamp('Park cancellation · visitor centre B','main','Visitor centre B'),stamp('Wildlife cancellation','sub','Visitor centre A'),stamp('Geyser cancellation','sub','Visitor centre B'),stamp('Anniversary cancellation','sub','Visitor centre A')]},{date:'2025-09-02',stamps:[stamp('Earlier park cancellation','main','Former desk',{photos:[]})]}],
 stamping_locations:[{id:'centre-a',name:'Visitor centre A',maps_url:'https://www.google.com/maps/search/?api=1&query=Yellowstone+National+Park',reports:[report('source-a',{origin:'imported',availability:'seasonal'}),report('onsite-a',{source:undefined,visit_id:'sample-visit',stamps:[{name:'Park cancellation',type:'main',availability:'available'},{name:'Wildlife cancellation',type:'sub',availability:'seasonal'}],notes:'An on-site test observation. Earlier imported claims remain in Other reports.'})]},{id:'centre-b',name:'Visitor centre B',reports:[report('source-b',{access:'Ask at the desk.'})]},{id:'former',name:'Former stamping desk',aliases:['Former desk'],reports:[report('old-desk'),report('closed-desk',{availability:'moved',notes:'Retained for previous collection records.',stamps:[]})]}]
},'**Design QA fixture — illustrative records, not your collection.**\n\nSee [[Trips/Design QA trip]].');
write('Trips/Design QA trip.md',{title:'Design QA trip'},'Isolated test trip. [[Places/Yellowstone National Park]]');
write('Places/QA long name.md',{title:'An exceptionally long place name for responsive testing across narrow screens and large text settings',states:['WY'],passport_region:'Western',visits:[{date:'2026-09-20',stamps:[{name:'Wide image geometry fixture',type:'main',photos:['[[Attachments/qa-wide.png]]']},{name:'Tall image geometry fixture',type:'main',photos:['[[Attachments/qa-tall.png]]']}]}],area:'A long author-supplied area with units for layout testing',established:'1900-01-01',map:photo},'Isolated fixture for optional metadata and a map attachment. The test image is not a real locator map.');
build({vault,out});
console.log('Isolated QA preview: node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767');
