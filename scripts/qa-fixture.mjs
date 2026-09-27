// Isolated demo content; never writes to vault/ or dist/.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {build,root} from './build.mjs';
const vault=path.join(root,'.qa/vault'),out=path.join(root,'.qa/dist');
fs.rmSync(vault,{recursive:true,force:true});
fs.mkdirSync(vault,{recursive:true});
for(const dir of ['Places','Regions','Trips'])fs.cpSync(path.join(root,'vault',dir),path.join(vault,dir),{recursive:true});
fs.mkdirSync(path.join(vault,'Attachments'),{recursive:true});
fs.copyFileSync(path.join(root,'test/fixtures/assets/sample-stamp.png'),path.join(vault,'Attachments/sample-stamp.png'));
fs.copyFileSync(path.join(root,'test/fixtures/assets/moores-creek-sample.png'),path.join(vault,'Attachments/moores-creek-sample.png'));
for(const [name,source] of [['wide','mockups/style-02-modern-docs-selected.png'],['tall','references/layout-before-mobile.png']])fs.copyFileSync(path.join(root,'docs/design',source),path.join(vault,'Attachments/qa-'+name+'.png'));
const write=(file,data,body='')=>fs.writeFileSync(path.join(vault,file),`---\n${YAML.stringify(data)}---\n${body}`);
fs.cpSync(path.join(root,'test/fixtures/assets/yellowstone'),path.join(vault,'Attachments/yellowstone'),{recursive:true});
const photo='[[Attachments/sample-stamp.png]]';
const picture=name=>`[[Attachments/yellowstone/${name}.png]]`;
const stamp=(id,name,type,location,asset)=>({id,cancellation_id:id,name,type,location,location_id:location.startsWith('Old Faithful')?'centre-a':'centre-b',photos:[picture(asset)],notes:'Fictional sample impression for the design preview.'});
const firstStamps=[
 stamp('geyser-main','Yellowstone · geyser design','main','Old Faithful Visitor Education Center','yellowstone-main'),
 stamp('old-faithful-sub','Old Faithful','sub','Old Faithful Visitor Education Center','old-faithful'),
 stamp('prismatic-sub','Grand Prismatic Spring','sub','Old Faithful Visitor Education Center','grand-prismatic')
];
const secondStamps=[
 stamp('bison-main','Yellowstone · bison design','main','Canyon Visitor Education Center','yellowstone-bison'),
 stamp('canyon-sub','Grand Canyon of the Yellowstone','sub','Canyon Visitor Education Center','yellowstone-canyon'),
 stamp('mammoth-sub','Mammoth Hot Springs','sub','Canyon Visitor Education Center','mammoth')
];
const expected=items=>items.map(({id,name,type})=>({id,name,type}));
const listing=items=>items.map(s=>({name:s.name,type:s.type,availability:'unknown'}));
const report=(id,visit,items,access)=>({id,origin:'authored',availability:'unknown',visit_id:visit,access,stamps:listing(items),notes:'Fictional sample report; availability is not verified.'});
write('Places/Yellowstone National Park.md',{
 title:'Yellowstone National Park',park_code:'yell',states:['WY','MT','ID'],passport_region:'Rocky Mountain',design_preview:true,
 area:'Approx. 2.22 million acres',established:'1872-03-01',stamps:expected([firstStamps[0],secondStamps[0],...firstStamps.slice(1),...secondStamps.slice(1)]),
 visits:[
 {id:'sample-visit',date:'2019-06-19',trip:'[[Trips/Design QA trip]]',notes:'Geysers, boardwalks and an evening return to Old Faithful. We collected three cancellations, then waited for the crowds to thin and the steam to catch the last light. [More from this day](https://blog.ktz.me/the-yellowstone-geyser-basins/).',stamps:firstStamps},
 {id:'canyon-visit',date:'2019-06-21',trip:'[[Trips/Design QA trip]]',notes:'Canyon colours and a northern loop through Mammoth. Lower Falls was the highlight; wildlife stops and a brief flurry kept changing the afternoon’s plans. Three more impressions in the book.',stamps:secondStamps}
 ],
 stamping_locations:[
 {id:'centre-a',name:'Old Faithful Visitor Education Center',maps_url:'https://www.google.com/maps/search/?api=1&query=Old+Faithful+Visitor+Education+Center',reports:[{id:'earlier-sample',origin:'imported',availability:'unknown',access:'An earlier sample listing, retained to demonstrate report history.',stamps:listing(firstStamps),source:{url:'https://www.nps.gov/yell/planyourvisit/visitorcenters.htm',checked:'2019-06-18'},notes:'Illustrative import only; this source is general visitor-center information.'},report('onsite-a','sample-visit',firstStamps,'Sample note: ask at the visitor information desk. Confirm current availability with staff.')]},
 {id:'centre-b',name:'Canyon Visitor Education Center',maps_url:'https://www.google.com/maps/search/?api=1&query=Canyon+Visitor+Education+Center',reports:[report('onsite-b','canyon-visit',secondStamps,'Sample note: ask at the Canyon Village information desk.')]}
 ]
},'The geyser basins and the canyon reward a little extra time. Leave room in the day for wildlife stops and a change in the weather.');
write('Places/Moores Creek National Battlefield.md',{
 title:'Moores Creek National Battlefield',park_code:'mocr',states:['NC'],passport_region:'Southeast',design_preview:true,
 stamps:[{id:'moores-creek',name:'Moores Creek National Battlefield',type:'main'}],
 visits:[{id:'bridge-walk',date:'2025-04-12',notes:'A quiet afternoon walking the short trail to the bridge. The wayside exhibits helped put the battle and the people who fought here into context.',stamps:[{id:'moores-impression',cancellation_id:'moores-creek',name:'Moores Creek National Battlefield',type:'main',photos:['[[Attachments/moores-creek-sample.png]]'],notes:'Fictional impression with generated sample artwork, not an authentic park cancellation.'}]}],
 stamping_locations:[{id:'visitor-centre',name:'Visitor center',reports:[{id:'sample-listing',origin:'authored',visit_id:'bridge-walk',availability:'unknown',access:'Sample listing only; confirm current availability with the park.',stamps:[{name:'Moores Creek National Battlefield',type:'main',availability:'unknown'}]}]}]
},'An easy stop for a short walk. Allow time to read the exhibits along the trail.');
write('Trips/Design QA trip.md',{title:'USA road trip 2019 · sample'},'A fictional two-stop Yellowstone chapter for the design preview. [[Places/Yellowstone National Park]]');
const qaPlace=(title,extra={})=>({title,states:['WY'],passport_region:'Western',design_preview:true,visits:[],...extra});
for(let count=1;count<=10;count++){
 const stamps=Array.from({length:count},(_,i)=>({id:count===1?'details':`expected-${i+1}`,name:`Cancellation ${i+1}`,type:i===0?'main':'sub'}));
 const impressions=stamps.filter((_,i)=>i%2===0).map((s,i)=>({...s,id:`impression-${i+1}`,cancellation_id:s.id,photos:i===0?[photo]:[]}));
 write(`Places/QA cancellation count ${count}.md`,qaPlace(`QA cancellation count ${count}`,{stamps,visits:[{id:'geometry-visit',date:'2026-09-20',notes:'Square slot geometry with both collected and uncollected expected cancellations.',stamps:impressions}]}));
}
const overflow=Array.from({length:11},(_,i)=>({id:`overflow-${i+1}`,name:`Expected cancellation ${i+1}`,type:i===0?'main':'sub'}));
write('Places/QA cancellation overflow.md',qaPlace('QA cancellation overflow',{stamps:overflow,visits:[{id:'overflow-visit',date:'2026-09-20',notes:'All eleven records remain available; the sidebar shows one primary cancellation and nine others.',stamps:overflow.map((s,i)=>({...s,id:`overflow-impression-${i+1}`,cancellation_id:s.id,photos:[]}))}]}));
write('Places/QA repeated impression.md',qaPlace('QA repeated impression',{stamps:[{id:'repeat',name:'One cancellation, two visits',type:'main'}],visits:[
 {id:'first',date:'2025-05-01',notes:'First impression.',stamps:[{id:'first-impression',cancellation_id:'repeat',name:'One cancellation, two visits',type:'main',photos:[photo]}]},
 {id:'second',date:'2026-05-01',notes:'Second impression of the same cancellation.',stamps:[{id:'second-impression',cancellation_id:'repeat',name:'One cancellation, two visits',type:'main',photos:[]}]}
]}));
// The first YAML entry remains primary even when it is uncollected or has no
// photograph, and even when a later entry happens to have type: main.
const primaryExpected=[{id:'primary',name:'First listed cancellation',type:'sub'},{id:'secondary',name:'Second listed cancellation',type:'main'}];
write('Places/QA primary uncollected.md',qaPlace('QA primary uncollected',{stamps:primaryExpected,visits:[
 {id:'secondary-only',date:'2026-09-20',notes:'Only the second listed cancellation was collected. It must stay in the secondary grid.',stamps:[{id:'secondary-only-impression',cancellation_id:'secondary',name:'Second listed cancellation',type:'main',photos:[photo]}]}
]}));
write('Places/QA primary photo needed.md',qaPlace('QA primary photo needed',{stamps:primaryExpected,visits:[
 {id:'primary-visit',date:'2026-09-19',notes:'The primary cancellation was collected without a photograph.',stamps:[{id:'primary-no-photo',cancellation_id:'primary',name:'First listed cancellation',type:'sub',photos:[]}]},
 {id:'secondary-visit',date:'2026-09-20',notes:'The later secondary photo must not replace the primary cancellation or its date.',stamps:[{id:'secondary-photo',cancellation_id:'secondary',name:'Second listed cancellation',type:'main',photos:[photo]}]}
]}));
write('Places/QA empty album.md',qaPlace('QA empty album',{stamps:[]}));
write('Places/QA legacy album.md',qaPlace('QA legacy album',{visits:[{id:'legacy-visit',date:'2026-09-20',notes:'A legacy visit without an expected-stamps list remains visible.',stamps:[{id:'legacy-main',name:'Legacy main stamp',type:'main',photos:[photo]},{id:'legacy-sub',name:'Legacy substamp',type:'sub',photos:[]}]}]}));
write('Places/QA long name.md',qaPlace('An exceptionally long place name for responsive testing across narrow screens and large text settings',{
 stamps:[{id:'wide',name:'A long expected cancellation name that must remain readable at narrow widths',type:'main'},{id:'tall',name:'A second long name for the tallest possible image attachment',type:'sub'}],
 visits:[{id:'image-geometry',date:'2026-09-20',notes:'Test assets below are deliberately wide and tall, rather than real stamp photographs.',stamps:[{id:'wide-image',cancellation_id:'wide',name:'Wide image geometry fixture',type:'main',photos:['[[Attachments/qa-wide.png]]']},{id:'tall-image',cancellation_id:'tall',name:'Tall image geometry fixture',type:'sub',photos:['[[Attachments/qa-tall.png]]']}]}],
 area:'A long author-supplied area with units for layout testing',established:'1900-01-01',map:photo
}),'Isolated fixture for optional metadata and a map attachment. The test image is not a real locator map.');
build({vault,out});
console.log('Isolated QA preview: node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767');
