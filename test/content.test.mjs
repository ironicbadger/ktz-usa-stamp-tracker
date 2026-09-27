import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import {loadContent,regions,validatePlace,parseNote} from '../src/content.mjs';
import {createSite} from '../src/site.mjs';
function fixture(t,patch={}){
 const vault=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-test-'));t.after(()=>fs.rmSync(vault,{recursive:true,force:true}));
 for(const dir of ['Places','Trips','Regions','Attachments'])fs.mkdirSync(path.join(vault,dir));
 function write(name,data,body=''){fs.writeFileSync(path.join(vault,name),'---\n'+YAML.stringify(data)+'---\n'+body)}
 for(const title of regions)write('Regions/'+title+'.md',{title});
 const data={title:'Yellowstone',states:['WY','MT','ID'],passport_region:'Rocky Mountain',visits:[{date:'2025-08-10',trip:'[[Trips/Summer]]',notes:'First visit.',stamps:[{name:'Main one',type:'main',photos:[]},{name:'Main two',type:'main',photos:[]},{name:'Junior Ranger',type:'sub',photos:[]}]}],...patch};
 write('Places/Yellowstone.md',data,'See [[Trips/Summer|our trip]].');
 return {vault,data,write};
}
test('multiple states and main stamps share one page and one album slot; trips auto-populate',t=>{
 const f=fixture(t);const model=loadContent(f.vault),site=createSite(model,[],'test');
 assert.equal(model.places.length,1);assert.equal(model.trips.length,1);
 const page=site.pages.get('/places/yellowstone/');assert.equal((page.match(/aria-current="page"/g)||[]).length,3);
 const album=site.pages.get('/regions/rocky-mountain/');assert.equal((album.match(/class="album-slot"/g)||[]).length,1);assert.match(album,/2 main impressions/);assert.match(album,/Collected · No photo/);
 const trip=site.pages.get('/trips/summer/');assert.match(trip,/3 stamps/);assert.match(trip,/Junior Ranger/);assert.equal(model.trips[0].backlinks[0].title,'Yellowstone');
});
test('repeat dates and repeated main stamps retain separate visits and generated anchors',t=>{
 const f=fixture(t);f.data.visits.push({...f.data.visits[0],stamps:[{name:'Main one',type:'main',photos:[]}]});f.write('Places/Yellowstone.md',f.data);
 const m=loadContent(f.vault);assert.equal(m.places[0].data.visits.length,2);assert.notEqual(m.places[0].data.visits[0].anchor,m.places[0].data.visits[1].anchor);
});
test('authored trip body, wiki backlinks and nested photo paths render',t=>{
 const f=fixture(t);fs.mkdirSync(path.join(f.vault,'Attachments/2025'));fs.writeFileSync(path.join(f.vault,'Attachments/2025/stamp photo.png'),'test');
 f.data.visits[0].stamps[0].photos=['[[Attachments/2025/stamp photo.png]]'];f.write('Places/Yellowstone.md',f.data);
 f.write('Trips/Summer.md',{title:'Summer'},'Custom introduction. [[Places/Yellowstone]]');
 const m=loadContent(f.vault);assert.match(m.trips[0].html,/Custom introduction/);assert.equal(m.places[0].backlinks[0].title,'Summer');assert.equal(m.places[0].data.visits[0].stamps[0].images[0],'/attachments/2025/stamp%20photo.png');
});
test('invalid dates, missing photos, malformed stamps and duplicate YAML keys fail clearly',t=>{
 const f=fixture(t);f.data.visits[0].date='2025-02-30';assert.throws(()=>validatePlace(f.data,'Example'),/real YYYY-MM-DD/);
 f.data.visits[0].date='2025-02-20';f.data.visits[0].stamps[0].type='primary';assert.throws(()=>validatePlace(f.data,'Example'),/main or sub/);
 assert.throws(()=>parseNote('---\ntitle: A\ntitle: B\n---\n'),/unique/);
 f.data.visits[0].stamps[0].type='main';f.data.visits[0].stamps[0].photos=['[[missing.png]]'];f.write('Places/Yellowstone.md',f.data);assert.throws(()=>loadContent(f.vault),/attachment.*does not exist/);
});
test('broken wikilinks fail and script HTML is not published',t=>{
 const f=fixture(t);f.write('Places/Yellowstone.md',f.data,'[[Missing place]]');assert.throws(()=>loadContent(f.vault),/does not exist/);
 f.write('Places/Yellowstone.md',f.data,'<script>alert(1)</script><a href="javascript:alert(1)">unsafe</a>');const m=loadContent(f.vault);assert.doesNotMatch(m.places[0].html,/script|javascript:/);
});
test('trip grouping excludes visits assigned to other trips',t=>{
 const f=fixture(t);f.data.visits.push({date:'2026-01-01',trip:'[[Trips/Winter]]',stamps:[{name:'Winter stamp',type:'sub',photos:[]}]});f.write('Places/Yellowstone.md',f.data);
 const site=createSite(loadContent(f.vault),[],'test');assert.match(site.pages.get('/trips/winter/'),/Winter stamp/);assert.doesNotMatch(site.pages.get('/trips/summer/'),/Winter stamp/);
});
test('location rendering inherits dates, preserves history, links impressions and indexes location names',t=>{
 const f=fixture(t);f.data.visits[0].id='observation';f.data.visits[0].stamps[0].location='Original desk';f.data.visits[0].stamps[0].location_id='desk';
 f.data.stamping_locations=[{id:'desk',name:'Renamed desk',aliases:['Original desk'],reports:[{id:'published',origin:'imported',availability:'available',access:'Downstairs',stamps:[],source:{url:'https://www.nps.gov/test/',checked:'2020-01-01'}},{id:'onsite',origin:'authored',availability:'moved',access:'Upstairs',stamps:[{name:'Seasonal cancellation',type:'sub',availability:'seasonal'}],visit_id:'observation'}]}];
 f.write('Places/Yellowstone.md',f.data);let model=loadContent(f.vault),site=createSite(model,[],'test'),html=site.pages.get('/places/yellowstone/');
 assert.match(html,/Renamed desk/);assert.match(html,/Original desk/);assert.match(html,/Other reports \(1\)/);assert.match(html,/Observed on a visit/);assert.match(html,/August 10, 2025/);assert.match(html,/id="visit-observation"/);assert.match(html,/id="visit-2025-08-10-1"/);assert.match(html,/href="#location-desk"/);assert.ok(site.search.some(e=>e.kind==='Stamping location'&&e.text.includes('Seasonal cancellation')));
 f.data.visits[0].date='2026-09-26';f.write('Places/Yellowstone.md',f.data);model=loadContent(f.vault);assert.equal(model.places[0].locations[0].current.visit.date,'2026-09-26');
});
test('sidebar keeps a primary square and up to nine additional cancellations while preserving every impression',t=>{
 const f=fixture(t);for(let i=0;i<8;i++)f.data.visits.push({date:`2026-09-${20+i}`,stamps:[{name:`Cancellation ${i}`,type:'main',photos:[]}]});
 f.data.visits.push({date:'2026-09-28',stamps:[{name:'Main one',type:'main',photos:[]}]});f.write('Places/Yellowstone.md',f.data);
 const html=createSite(loadContent(f.vault),[],'test').pages.get('/places/yellowstone/');const rail=html.split('<aside class="place-rail">')[1].split('</aside>')[0];
 assert.match(rail,/Junior Ranger/);assert.equal((rail.match(/class="cancellation-slot/g)||[]).length,10);assert.match(rail,/data-count="9"/);assert.match(rail,/data-total="11"/);assert.match(rail,/class="primary-cancellation"/);assert.match(rail,/View all 11 cancellations/);
 assert.match(html,/<details class="collection-details" id="cancellation-details">/);assert.equal((html.match(/<article class="cancellation-record"/g)||[]).length,11);assert.equal((html.match(/<article class="stamp"/g)||[]).length,12);
 for(const [,anchor] of rail.matchAll(/href="#(cancellation-[^"]+)"/g))assert.ok(html.includes(`id="${anchor}"`));
});
test('blank places have a single collection empty state and omit unsupported facts',t=>{
 const f=fixture(t,{visits:[]});f.write('Places/Yellowstone.md',f.data);const html=createSite(loadContent(f.vault),[],'test').pages.get('/places/yellowstone/');assert.equal((html.match(/No cancellation records yet/g)||[]).length,1);assert.match(html,/No visits recorded yet/);assert.doesNotMatch(html,/No place notes|No stamping locations|Established|<dt>Area|Official park resources/);
});
test('unknown park location is labeled as state context without claiming a park pin',t=>{
 const f=fixture(t,{states:['WY'],visits:[]});f.write('Places/Yellowstone.md',f.data);const html=createSite(loadContent(f.vault),[],'test').pages.get('/places/yellowstone/');
 assert.match(html,/State context ·/);assert.match(html,/exact park location is not shown/);assert.doesNotMatch(html,/Park location ·/);
});
test('managed stamp anchors and preserved legacy aliases survive visit date changes',t=>{
 const f=fixture(t);const v=f.data.visits[0];v.id='stable-visit';v.anchor_aliases=['visit-2020-01-01-1'];v.stamps[0].id='stable-stamp';v.stamps[0].anchor_aliases=['visit-2020-01-01-1-stamp-1'];f.write('Places/Yellowstone.md',f.data);
 const html=createSite(loadContent(f.vault),[],'test').pages.get('/places/yellowstone/');for(const id of ['visit-stable-visit','stamp-stable-stamp','visit-2020-01-01-1','visit-2020-01-01-1-stamp-1'])assert.ok(html.includes(`id="${id}"`));
});
