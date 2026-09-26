import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import YAML from 'yaml';
function setup({data,prompts=[],choices=[],photos=[],selected=[]}){
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('vault/Scripts/stamp_book.js','utf8'),{module,Date,JSON,Set,Error});
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
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Main cancellation','Visitor center',''],choices:[0,'main'],photos,selected:photos});await env.run('stamp');await env.finish();const stamp=env.data.visits[0].stamps[0];assert.equal(stamp.type,'main');assert.equal(stamp.photos.length,2);assert.equal(stamp.date,undefined);
});
test('Templater refuses to overwrite a concurrently edited visit',async()=>{
 const env=setup({data:{title:'Test',visits:[{date:'2026-09-25',stamps:[]}]},prompts:['Main cancellation','',''],choices:[0,'main']});await env.run('stamp');env.data.visits[0].notes='Changed elsewhere';await env.finish();assert.equal(env.data.visits[0].stamps.length,0);assert.match(env.notices[0],/changed/);
});
