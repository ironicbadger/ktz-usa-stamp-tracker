import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import YAML from 'yaml';
import {webcrypto} from 'node:crypto';
function setup({data,prompts=[],choices=[],photos=[],selected=[]}){
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('vault/Scripts/stamp_book.js','utf8'),{module,Date,JSON,Set,Error,URL,crypto:webcrypto});
 const hooks=[],created=[],notices=[];let current=structuredClone(data);
 const tp={config:{target_file:{path:'Places/Test.md'}},date:{now:()=> '2026-09-26'},obsidian:{parseYaml:YAML.parse,Notice:class{constructor(s){notices.push(s)}}},system:{prompt:async()=>prompts.shift(),suggester:async()=>choices.shift(),multi_suggester:async()=>selected},hooks:{on_all_templates_executed:fn=>hooks.push(fn)},app:{vault:{read:async()=>`---\n${YAML.stringify(current)}---\n`,getMarkdownFiles:()=>[],getFiles:()=>photos,getAbstractFileByPath:()=>null,create:async(name,text)=>created.push({name,text})},fileManager:{processFrontMatter:async(_,callback)=>callback(current)}}};
 return {run:action=>module.exports(tp,action),finish:async()=>{for(const hook of hooks)await hook()},get data(){return current},hooks,created,notices};
}
test('Templater stores date only on visit and creates an editable trip after prompts finish',async()=>{
 const env=setup({data:{title:'Test',visits:[]},prompts:['2026-09-25','Trip name','Notes'],choices:[':new']});
 await env.run('visit');assert.equal(env.data.visits.length,0);await env.finish();assert.equal(env.data.visits[0].date,'2026-09-25');assert.equal(env.data.visits[0].trip,'[[Trips/Trip name]]');assert.equal(env.created[0].name,'Trips/Trip name.md');
});
test('Templater cancellation does not mutate notes or create trips',async()=>{
 const env=setup({data:{title:'Test',visits:[]},prompts:['2026-09-25',null],choices:[':new']});await env.run('visit');await env.finish();assert.equal(env.data.visits.length,0);assert.equal(env.created.length,0);
});
test('Templater attaches multiple photos and a main stamp to the chosen visit without repeating date',async()=>{
 const photos=[{path:'Attachments/a.png'},{path:'Attachments/b.png'}];
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Main cancellation','Visitor center',''],choices:[0,'main',':text'],photos,selected:photos});await env.run('stamp');await env.finish();const stamp=env.data.visits[0].stamps[0];assert.equal(stamp.type,'main');assert.equal(stamp.photos.length,2);assert.equal(stamp.date,undefined);
});
test('Templater refuses to overwrite a concurrently edited visit',async()=>{
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Main cancellation','',''],choices:[0,'main',':text']});await env.run('stamp');env.data.visits[0].notes='Changed elsewhere';await env.finish();assert.equal(env.data.visits[0].stamps.length,0);assert.match(env.notices[0],/changed/);
});
const baseLocation=()=>({id:'desk',name:'Old desk',reports:[{id:'first',origin:'authored',availability:'available',access:'Desk',stamps:[],source:{url:'https://www.nps.gov/test/',checked:'2026-09-01'}}]});
test('location authoring works without visits for published sources',async()=>{
 const env=setup({data:{title:'Test',visits:[]},prompts:['Visitor centre','','At the desk','https://www.nps.gov/test/','2026-09-26',''],choices:[':new','available',':done','source']});
 await env.run('location');assert.equal(env.data.stamping_locations,undefined);await env.finish();const l=env.data.stamping_locations[0];assert.ok(l.id);assert.equal(l.reports[0].source.checked,'2026-09-26');assert.equal(l.reports[0].visit_id,undefined);
});
test('on-site report references a generated visit ID and does not prompt for a second date',async()=>{
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Desk','','Reception','Observed'],choices:[':new','available',':done','visit',0]});
 await env.run('location');await env.finish();const r=env.data.stamping_locations[0].reports[0];assert.equal(r.visit_id,env.data.visits[0].id);assert.equal(r.date,undefined);assert.equal(r.source,undefined);assert.equal(env.data.visits[0].date,'2026-09-25');
});
test('renaming retains aliases, reports and the original collected location text',async()=>{
 const data={title:'Test',visits:[{date:'2026-09-25',stamps:[{name:'Stamp',type:'main',location:'Old desk',location_id:'desk',photos:[]}]}],stamping_locations:[baseLocation()]};
 const env=setup({data,prompts:['New desk','','Moved upstairs','https://www.nps.gov/test/','2026-09-26','Moved'],choices:[0,'moved',':done','source']});
 await env.run('location');await env.finish();assert.deepEqual(env.data.visits,data.visits);assert.equal(env.data.stamping_locations[0].aliases[0],'Old desk');assert.equal(env.data.stamping_locations[0].reports.length,2);
});
test('cancelled or invalid location prompts never change visits or locations',async()=>{
 for(const prompts of [['Desk',null],['Desk','','Desk','https://example.com','2026-02-30']]){
  const data={title:'Test',visits:[]};const env=setup({data,prompts,choices:[':new','available',':done','source']});await env.run('location');await env.finish();assert.deepEqual(env.data,data);
 }
});
test('concurrent location or visit edits prevent the entire location draft from saving',async()=>{
 for(const field of ['visits','stamping_locations']){
  const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}],stamping_locations:[baseLocation()]},prompts:['New desk','','Desk',''],choices:[0,'available',':done','visit',0]});
  await env.run('location');if(field==='visits')env.data.visits[0].notes='Concurrent';else env.data.stamping_locations[0].name='Concurrent';await env.finish();assert.equal(env.data.visits[0].id,undefined);assert.equal(env.data.stamping_locations[0].reports.length,1);assert.match(env.notices[0],/changed/);
 }
});
test('Add stamp chooses a known location by name and keeps its snapshot',async()=>{
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}],stamping_locations:[baseLocation()]},prompts:['Collected stamp',''],choices:[0,'main',0]});await env.run('stamp');await env.finish();const s=env.data.visits[0].stamps[0];assert.equal(s.location_id,'desk');assert.equal(s.location,'Old desk');assert.equal(s.date,undefined);
});
test('new discovery and stamp save together, and photo cancellation saves neither',async()=>{
 const data={title:'Test',visits:[{date:'2026-09-25',stamps:[]}]};
 for(const cancelled of [false,true]){
  const env=setup({data,prompts:['Collected stamp','New desk','','At reception','',''],choices:[0,'main',':new','available',':done','visit'],photos:[{path:'Attachments/a.png'}],selected:cancelled?null:[]});
  await env.run('stamp');await env.finish();if(cancelled)assert.deepEqual(env.data,data);else{assert.equal(env.data.stamping_locations.length,1);assert.equal(env.data.visits[0].stamps[0].location_id,env.data.stamping_locations[0].id);assert.equal(env.data.stamping_locations[0].reports[0].visit_id,env.data.visits[0].id)}
 }
});
test('editing a legacy visit assigns stable identities and retains its old visit and stamp links',async()=>{
 const env=setup({data:{title:'Test',visits:[{date:'2025-01-01',stamps:[{name:'Old stamp',type:'main',photos:[]}]}]},prompts:['2026-09-26','Updated notes'],choices:[0,'']});await env.run('edit-visit');await env.finish();const v=env.data.visits[0];assert.ok(v.id);assert.ok(v.stamps[0].id);assert.equal(v.anchor_aliases[0],'visit-2025-01-01-1');assert.equal(v.stamps[0].anchor_aliases[0],'visit-2025-01-01-1-stamp-1');
});
test('location updates edit the available-stamp list without removing stamps from prior reports',async()=>{
 const location=baseLocation();location.reports[0].stamps=[{name:'Old cancellation',type:'main',availability:'available'}];
 const env=setup({data:{title:'Test',visits:[],stamping_locations:[location]},prompts:['Old desk','','Seasonal desk','New cancellation','https://www.nps.gov/test/','2026-09-26','Changed listing'],choices:[0,'seasonal',0,'remove',':add','sub','seasonal',':done','source']});await env.run('location');await env.finish();const reports=env.data.stamping_locations[0].reports;assert.equal(reports[0].stamps[0].name,'Old cancellation');assert.equal(reports[1].stamps.length,1);assert.equal(reports[1].stamps[0].name,'New cancellation');assert.equal(reports[1].stamps[0].type,'sub');assert.equal(reports[1].stamps[0].availability,'seasonal');
});

test('expected cancellations can be authored before any visit without creating impressions',async()=>{
 const env=setup({data:{title:'Test',visits:[],custom:{keep:true}},prompts:['Park cancellation','Geyser'],choices:[':new','main',':new','sub',':done']});
 await env.run('cancellations');assert.equal(env.data.stamps,undefined);await env.finish();
 assert.equal(env.data.stamps.length,2);assert.ok(env.data.stamps.every(s=>s.id));assert.notEqual(env.data.stamps[0].id,env.data.stamps[1].id);
 assert.deepEqual(env.data.stamps.map(s=>[s.name,s.type]),[['Park cancellation','main'],['Geyser','sub']]);assert.deepEqual(env.data.visits,[]);assert.equal(env.data.custom.keep,true);
});

test('renaming expected cancellation keeps unknown fields and links old impressions without rewriting them',async()=>{
 const data={title:'Test',stamps:[{name:'Original',custom:'preserved'}],visits:[{date:'2026-09-25',stamps:[{id:'impression',name:'Original',type:'main',photos:[],notes:'Keep',anchor_aliases:['old-link']}]}]};
 const env=setup({data,prompts:['Renamed'],choices:[0,'main',':done']});await env.run('cancellations');await env.finish();
 const expected=env.data.stamps[0],stamp=env.data.visits[0].stamps[0];assert.ok(expected.id);assert.equal(expected.name,'Renamed');assert.equal(expected.custom,'preserved');assert.equal(stamp.cancellation_id,expected.id);
 assert.equal(stamp.name,'Original');assert.equal(stamp.id,'impression');assert.equal(stamp.notes,'Keep');assert.deepEqual(stamp.anchor_aliases,['old-link']);
});

test('Add stamp selects an expected cancellation and repeats do not duplicate its expected entry',async()=>{
 const data={title:'Test',stamps:[{name:'Park',custom:'preserved'}],visits:[{date:'2026-09-25',stamps:[{name:'Park',type:'main',photos:[]}]}]};
 const env=setup({data,prompts:['New impression notes'],choices:[0,0,':none']});await env.run('stamp');await env.finish();
 assert.equal(env.data.stamps.length,1);assert.equal(env.data.stamps[0].custom,'preserved');assert.equal(env.data.visits[0].stamps.length,2);
 assert.ok(env.data.visits[0].stamps.every(s=>s.cancellation_id===env.data.stamps[0].id));assert.equal(env.data.visits[0].stamps[1].name,'Park');assert.equal(env.data.visits[0].stamps[1].notes,'New impression notes');
});

test('Add stamp saves a newly discovered expected entry and its impression together',async()=>{
 const env=setup({data:{title:'Test',stamps:[{id:'park',name:'Park',custom:'kept'}],visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Geyser',''],choices:[0,':new','sub',':none']});await env.run('stamp');await env.finish();
 assert.equal(env.data.stamps.length,2);assert.equal(env.data.stamps[0].custom,'kept');assert.equal(env.data.stamps[1].name,'Geyser');assert.equal(env.data.visits[0].stamps[0].cancellation_id,env.data.stamps[1].id);
});

test('cancelled expected-list edits and concurrent list edits never partially save',async()=>{
 const data={title:'Test',visits:[],stamps:[{id:'park',name:'Park'}]};
 const cancelled=setup({data,prompts:['Geyser'],choices:[':new','sub',null]});await cancelled.run('cancellations');await cancelled.finish();assert.deepEqual(cancelled.data,data);
 const concurrent=setup({data,prompts:['Geyser'],choices:[':new','sub',':done']});await concurrent.run('cancellations');concurrent.data.stamps[0].name='Changed elsewhere';await concurrent.finish();assert.equal(concurrent.data.stamps.length,1);assert.match(concurrent.notices[0],/changed/);
});

test('Add stamp cancellation leaves both expected list and collected impressions untouched',async()=>{
 const data={title:'Test',visits:[{date:'2026-09-25',stamps:[]}]};
 const env=setup({data,prompts:['Park',''],choices:[0,'main',':none'],photos:[{path:'Attachments/a.png'}],selected:null});await env.run('stamp');await env.finish();assert.deepEqual(env.data,data);
});
