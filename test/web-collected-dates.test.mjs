import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRecords,validatePlace,regions} from '../src/content.mjs';
const place=(key='Places/Yellowstone')=>({key,kind:'Places',body:'',data:{title:'Yellowstone',park_code:'yell',states:['WY'],passport_region:'Rocky Mountain',visits:[]}});
test('collected dates persist independently and unlisted cancellations need no expectation',()=>{
 const p=place();p.data.visits=[{date:'2026-09-27',stamps:[{name:'Unlisted',type:'main',date:'2019-06-17',photos:[]},{name:'Legacy',type:'sub',photos:[]}]}];
 validatePlace(p.data,p.key);const model=loadRecords([p,...regions.map(title=>({key:'Regions/'+title,kind:'Regions',data:{title},body:''}))]);assert.equal(model.places[0].data.visits[0].stamps[0].date,'2019-06-17');assert.equal(model.places[0].data.visits[0].stamps[1].date,'2026-09-27');
 p.data.visits[0].stamps[0].date='2019-02-30';assert.throws(()=>validatePlace(p.data,p.key),/collected date/);
});
