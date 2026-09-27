import test from 'node:test';import assert from 'node:assert/strict';
import {parseStampRows,syncStampField} from '../web/stamp-rows.mjs';
import {enrichPlace} from '../web/park-facts.mjs';
import {editorRecord} from '../web/render.mjs';
import fs from 'node:fs';
test('spreadsheet paste accepts optional dates and photos, rejects a bad batch before writes',()=>{
 assert.deepEqual(parseStampRows('Main cancellation\tMain\t2026-09-21\nAnniversary\tLimited edition'),[{name:'Main cancellation',type:'main',date:'2026-09-21',photos:[]},{name:'Anniversary',type:'limited',photos:[]}]);
 for(const value of ['Good\tmain\nBad\tlimited\t2026-02-30','Bad\twrong','Bad\tmain\t2026-99-99'])assert.throws(()=>parseStampRows(value),/Check row/);
});
test('editing one name or type synchronizes its existing identity, preserving visit-specific dates and legacy notes',()=>{
 const a={id:'a',cancellation_id:'known',name:'Old',type:'main',notes:'keep me',date:'2020-01-01'},b={id:'b',cancellation_id:'known',name:'Old',type:'main',date:'2026-01-01'},data={stamps:[{id:'known',name:'Old',type:'main'}],visits:[{stamps:[a,b]}]};
 syncStampField(data,a,'name','Renamed');syncStampField(data,a,'type','limited');assert.equal(b.name,'Renamed');assert.equal(data.stamps[0].type,'limited');assert.equal(a.notes,'keep me');assert.equal(b.date,'2026-01-01');
});
test('legacy names link only unambiguously in the editor without modifying stored records',()=>{
 const r={data:{stamps:[{name:'Main',id:'known-2'},{name:'Other'}],visits:[{date:'2026-01-01',stamps:[{name:'Main',type:'main'}]}]}};
 const edited=editorRecord(r);assert.equal(edited.data.visits[0].stamps[0].cancellation_id,'known-2');assert.equal(r.data.visits[0].stamps[0].cancellation_id,undefined);assert.notEqual(edited.data.stamps[1].id,'known-2');
});
test('NPS enrichment is repeatable and preserves authored facts, visits, notes and associations',()=>{
 const original={kind:'Places',data:{title:'Example',visits:[{notes:'Personal',stamps:[{name:'Main',photos:['photo']}]}]},body:''};
 const facts={title:'Example',description:'Brief description.',area:428.44,established:'1927-03-02',sources:{description:{url:'https://www.nps.gov/wrbr/'}}};
 const {record,fields}=enrichPlace(original,facts);assert.equal(record.data.area,'428.44 acres');assert.deepEqual(record.data.visits,original.data.visits);assert.equal(fields.length,3);assert.equal(enrichPlace(record,facts).fields.length,0);assert.equal(original.body,'');
 const authored={...original,body:'Existing personal prose',data:{...original.data,area:'1 acre',established:'2000-01-01'}};assert.equal(enrichPlace(authored,facts).record.body,authored.body);assert.equal(enrichPlace(authored,facts).record.data.area,'1 acre');
});
test('fact data covers every catalogue entry with traceable descriptions and valid dates',()=>{
 const catalogue=JSON.parse(fs.readFileSync('data/catalogue.json')),facts=JSON.parse(fs.readFileSync('data/park-facts.json'));
 assert.equal(facts.length,catalogue.length);assert.equal(new Set(facts.map(f=>f.title)).size,facts.length);
 for(const c of catalogue){const f=facts.find(f=>f.title===c.title);assert.ok(f?.description,c.title);assert.match(f.sources.description.url,/^https:\/\//);if(f.area!==undefined)assert.ok(Number.isFinite(f.area)&&f.area>=0);if(f.established)assert.equal(new Date(f.established+'T12:00:00Z').toISOString().slice(0,10),f.established)}
});

test('fact sources reject executable links',async()=>{
 const {validatePlace}=await import('../src/content.mjs');
 assert.throws(()=>validatePlace({title:'Test',states:['NC'],passport_region:'Southeast',visits:[],fact_sources:[{label:'Source',url:'javascript:alert(1)'}]},'Test'),/fact sources/);
});
