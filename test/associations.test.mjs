import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import {loadContent,regions} from '../src/content.mjs';
import {createSite} from '../src/site.mjs';
function fixture(t,body){
 const vault=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-associations-'));t.after(()=>fs.rmSync(vault,{recursive:true,force:true}));
 for(const dir of ['Places','Trips','Regions','Attachments'])fs.mkdirSync(path.join(vault,dir));
 const write=(file,data,body='')=>fs.writeFileSync(path.join(vault,file),'---\n'+YAML.stringify(data)+'---\n'+body);
 for(const title of regions)write('Regions/'+title+'.md',{title});
 write('Places/Yellowstone.md',{title:'Yellowstone',states:['WY','MT','ID'],passport_region:'Rocky Mountain',visits:[{date:'2025-06-19',notes:'A short visit.',stamps:[]}]},body);
 write('Trips/Summer.md',{title:'Summer'},'Trip notes.');
 return {vault,model:loadContent(vault)};
}
test('Associations is freeform Markdown below Visits, with ordinary inline external links and wiki backlinks',t=>{
 const body='A general place note.\n\n## Associations\n\nI read *A book* and wrote [my review](https://example.com/book-review). Music from [[Trips/Summer|the drive]] still reminds me of this place.\n\n## Practical notes\n\nBring water.';
 const {model}=fixture(t,body),p=model.places[0],html=createSite(model,[],'test').pages.get('/places/yellowstone/');
 assert.equal(p.body,body);assert.match(p.html,/general place note/);assert.match(p.html,/Bring water/);assert.doesNotMatch(p.html,/my review|Music from/);
 assert.match(p.associationsHtml,/<em>A book<\/em>/);assert.match(p.associationsHtml,/<a href="https:\/\/example.com\/book-review" target="_blank" rel="noopener noreferrer">my review<\/a>/);assert.match(p.associationsHtml,/href="\/trips\/summer\/"/);
 assert.equal(model.trips[0].backlinks[0].title,'Yellowstone');assert.ok(html.indexOf('id="visits"')<html.indexOf('id="associations"'));assert.ok(html.indexOf('id="associations"')<html.indexOf('id="stamping-locations"'));assert.equal((html.match(/id="associations"/g)||[]).length,1);
});
test('nested headings and cross-section reference links retain source-order IDs and definitions',t=>{
 const {model}=fixture(t,'## Overview\n\nPlace overview with [reading][book].\n\n## Associations\n\n### Overview\n\nMore [reading][book].\n\n## Weather\n\nVariable.\n\n[book]: https://example.com/book-review');
 const p=model.places[0];assert.match(p.html,/id="overview"/);assert.match(p.associationsHtml,/id="overview-1"/);assert.match(p.html,/id="weather"/);
 for(const html of [p.html,p.associationsHtml])assert.match(html,/href="https:\/\/example.com\/book-review"/);
});
test('only top-level H2 Associations sections move; fenced and quoted examples remain notes',t=>{
 const {model}=fixture(t,'```md\n## Associations\nFenced example.\n```\n\n> ## Associations\n> Quoted example.\n\n### Associations\nNot a top-level section.');
 const p=model.places[0];assert.equal(p.hasAssociations,false);assert.equal(p.associationsHtml,'');assert.match(p.html,/Fenced example/);assert.match(p.html,/Quoted example/);assert.match(p.html,/Not a top-level section/);
});
test('repeated sections merge without losing content or their legacy anchors',t=>{
 const {model}=fixture(t,'## Associations\n\nFirst book.\n\n## Other notes\n\nWeather.\n\n## Associations\n\nMusic from the drive.');
 const p=model.places[0],html=createSite(model,[],'test').pages.get('/places/yellowstone/');assert.match(p.associationsHtml,/First book/);assert.match(p.associationsHtml,/Music from/);assert.deepEqual(p.associationAliases,['associations-1']);assert.equal((html.match(/<h2>Associations<\/h2>/g)||[]).length,1);assert.match(html,/id="associations-1"/);
});
test('quoted or nested Associations headings cannot claim the relocated section anchor',t=>{
 const {model}=fixture(t,'> ## Associations\n> An example.\n\n### Associations\nA nested example.\n\n## Associations\n\nThe actual reading notes.');
 const p=model.places[0],html=createSite(model,[],'test').pages.get('/places/yellowstone/');
 assert.match(p.html,/id="associations-heading"/);assert.match(p.html,/id="associations-heading-1"/);
 assert.equal((html.match(/id="associations"/g)||[]).length,1);assert.match(p.associationsHtml,/actual reading notes/);
});
test('empty Associations keeps its authored anchor without an empty visible section',t=>{
 const {model}=fixture(t,'## Associations\n\n## Other notes\n\nOnly notes.');const html=createSite(model,[],'test').pages.get('/places/yellowstone/');assert.match(html,/<span id="associations">/);assert.doesNotMatch(html,/<h2>Associations<\/h2>/);
});
test('unsafe markup is sanitized and broken wikilinks still fail',t=>{
 const {model}=fixture(t,'## Associations\n\n<script>alert(1)</script>\n\n<a href="javascript:alert(1)">Unsafe link</a>');assert.doesNotMatch(model.places[0].associationsHtml,/script|javascript:/);
 assert.throws(()=>fixture(t,'## Associations\n\n[[Missing note]]'),/does not exist/);
});
