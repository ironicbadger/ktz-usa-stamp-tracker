import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getLocatorMap} from '../src/locator-maps.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file)));
const catalogue=read('data/catalogue.json');
const source=read('data/maps/nps-centroids.geojson').features;

test('every catalogue locator retains sourced NPS coordinates and visible pins',()=>{
 for(const place of catalogue){
  const map=getLocatorMap({park_code:place.code,states:place.states,title:place.title});
  assert.equal(map.kind,'park',place.code);
  const candidates=source.filter(f=>f.properties.UNIT_CODE.toLowerCase()===place.code.toLowerCase());
  for(const coordinate of map.coordinates)assert.ok(candidates.some(f=>JSON.stringify(f.geometry.coordinates)===JSON.stringify(coordinate)),`${place.code}: pin must come from its NPS unit`);
  const svg=fs.readFileSync(path.join(root,'static',map.image),'utf8');
  assert.equal((svg.match(/viewBox="0 0 256 256"/g)||[]).length,map.coordinates.length,`${place.code}: every source pin must be visible`);
  assert.ok(map.coordinates.length>0);
  assert.match(svg,/<desc id="description">/);
  assert.doesNotMatch(svg,/NaN|Infinity/);
 }
});

test('unknown locations show explicitly labeled state context without a fabricated pin',()=>{
 const map=getLocatorMap({park_code:'unknown',states:['NC'],title:'Unlocated place'});
 assert.equal(map.kind,'state-context');assert.equal(map.label,'State context');
 assert.match(map.alt,/exact park location is not shown/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'static',map.image),'utf8'),/viewBox="0 0 256 256"/);
 assert.equal(getLocatorMap({park_code:'unknown',states:[]}),null);
 assert.equal(getLocatorMap({park_code:'unknown',states:['NC','SC']}),null);
});

test('Yellowstone and Moores Creek have legible regional labels and distinct sourced geography',()=>{
 const yell=fs.readFileSync(path.join(root,'static',getLocatorMap({park_code:'yell'}).image),'utf8');
 const mocr=fs.readFileSync(path.join(root,'static',getLocatorMap({park_code:'mocr'}).image),'utf8');
 for(const state of ['MONTANA','WYOMING','IDAHO'])assert.match(yell,new RegExp(state));
 assert.match(yell,/green outline shows the park boundary/);
 assert.match(mocr,/NORTH CAROLINA/);assert.match(mocr,/Moores Creek/);
 assert.notEqual(yell,mocr);
});

test('checked-in geography matches its recorded source checksums',()=>{
 for(const item of read('data/maps/sources.json')){
  const bytes=fs.readFileSync(path.join(root,'data/maps',item.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.file);
  assert.ok(item.source.startsWith('https://'));
 }
});
