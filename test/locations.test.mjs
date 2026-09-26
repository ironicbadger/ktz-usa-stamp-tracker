import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePlace} from '../src/content.mjs';
import {currentReport,mergeLocationImports,resolveLocation} from '../src/locations.mjs';
const report=(id,extra={})=>({id,origin:'authored',availability:'available',access:'At the desk',stamps:[{name:'Park stamp',type:'main',availability:'seasonal'}],source:{url:'https://www.nps.gov/test/',checked:'2026-09-20'},...extra});
const place=()=>({title:'Park',states:['WY'],passport_region:'Rocky Mountain',visits:[{id:'visit-a',date:'2026-09-21',stamps:[{name:'Stamp',type:'main',photos:[],location:'Old desk',location_id:'desk'}]}],stamping_locations:[{id:'desk',name:'New desk',aliases:['Old desk'],reports:[report('published')]}]});
test('legacy notes work without locations, facts or managed IDs',()=>{const p=place();delete p.stamping_locations;delete p.visits[0].stamps[0].location_id;delete p.visits[0].id;assert.doesNotThrow(()=>validatePlace(p,'legacy'))});
test('source validation rejects malformed reports, dates, references and duplicate identities',()=>{
 const cases=[p=>p.stamping_locations[0].reports[0].source.checked='2026-02-30',p=>p.stamping_locations[0].reports[0].source.url='javascript:alert(1)',p=>p.stamping_locations[0].reports[0].visit_id='visit-a',p=>p.stamping_locations[0].reports[0].stamps[0].availability='yes',p=>p.visits[0].stamps[0].location_id='missing',p=>p.stamping_locations.push(structuredClone(p.stamping_locations[0])),p=>p.stamping_locations[0].reports.push(structuredClone(p.stamping_locations[0].reports[0])),p=>p.visits.push(structuredClone(p.visits[0]))];
 for(const mutate of cases){const p=place();mutate(p);assert.throws(()=>validatePlace(p,'invalid'))}
});
test('observations inherit visit dates and cannot carry a duplicate date or dangling visit',()=>{
 const p=place();const r=report('observed',{visit_id:'visit-a'});delete r.source;p.stamping_locations[0].reports.push(r);assert.doesNotThrow(()=>validatePlace(p,'observation'));
 r.date='2026-09-21';assert.throws(()=>validatePlace(p,'observation'),/inherits/);delete r.date;r.visit_id='gone';assert.throws(()=>validatePlace(p,'observation'),/existing visit/);
});
test('imports append without replacing names, authored corrections or historical snapshots',()=>{
 const p=place();p.stamping_locations[0].reports.push(report('correction',{availability:'moved'}));
 const input=[{id:'desk',name:'Wrong imported name',reports:[report('imported',{origin:'imported'})]}];
 const merged=mergeLocationImports(p,input);validatePlace(merged,'merged');
 assert.equal(merged.stamping_locations[0].name,'New desk');assert.deepEqual(merged.visits,p.visits);assert.equal(merged.stamping_locations[0].reports.length,3);assert.equal(currentReport(merged.stamping_locations[0]).availability,'moved');assert.equal(p.stamping_locations[0].reports.length,2);
 assert.deepEqual(mergeLocationImports(merged,input),merged);input[0].reports[0].availability='unavailable';assert.throws(()=>mergeLocationImports(merged,input),/new report ID/);
});
test('renames and aliases resolve old names without rewriting them; ambiguous names stay plain',()=>{
 const p=place(),locations=p.stamping_locations;const s={location:'Old desk'};assert.equal(resolveLocation(locations,s).id,'desk');assert.equal(s.location,'Old desk');
 locations.push({id:'other',name:'Old desk',reports:[]});assert.equal(resolveLocation(locations,s),undefined);assert.equal(resolveLocation(locations,{...s,location_id:'desk'}).id,'desk');
});
test('file import preserves body, unrelated properties and records; invalid import leaves file unchanged',async t=>{
 const fs=await import('node:fs');const os=await import('node:os');const path=await import('node:path');const YAML=await import('yaml');const {importLocations}=await import('../scripts/import-locations.mjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-import-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'Place.md');
 const data=place();data.custom='Keep me';const body='\n## Personal notes\nKeep this exact body.\n';fs.writeFileSync(file,'---\n'+YAML.stringify(data)+'---\n'+body);
 importLocations(file,[{id:'desk',name:'Imported name',reports:[report('new-import',{origin:'imported'})]}]);
 const saved=fs.readFileSync(file,'utf8');assert.ok(saved.endsWith(body));assert.match(saved,/custom: Keep me/);assert.match(saved,/New desk/);assert.match(saved,/Old desk/);
 assert.throws(()=>importLocations(file,[{id:'desk',name:'Desk',reports:[report('bad-date',{origin:'imported',source:{url:'https://example.com',checked:'2026-02-30'}})]}]),/checked date/);assert.equal(fs.readFileSync(file,'utf8'),saved);
});
