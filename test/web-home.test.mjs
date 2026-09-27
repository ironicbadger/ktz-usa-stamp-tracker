import test from 'node:test';
import assert from 'node:assert/strict';
import {completion,renderHome} from '../web/home.mjs';
const place=(title,stamps=[])=>({title,key:'Places/'+title,url:'/places/'+title.toLowerCase().replaceAll(' ','-')+'/',data:{passport_region:'Western',visits:[{stamps}]}});
test('completion counts places with a main stamp once, not visits, substamps or expected stamps',()=>{
 assert.deepEqual(completion([place('A',[{type:'main'},{type:'main'}]),place('B',[{type:'substamp'}]),place('C')]),{done:1,total:3,percent:33});
 assert.deepEqual(completion([]),{done:0,total:0,percent:0});
});
test('featured site is real, excludes previous selection and handles absent pictured sites',()=>{
 const model={places:[place('Yosemite National Park'),place('Olympic National Park')],regionPages:[{title:'Western',url:'/regions/western/'}]};
 const first=renderHome(model,{choose:()=>0});const second=renderHome(model,{previous:first.featuredKey,choose:()=>0});assert.notEqual(first.featuredKey,second.featuredKey);assert.match(first.html,/0 \/ 2 places/);assert.match(first.html,/class="collection-home"/);assert.equal((first.html.match(/<progress /g)||[]).length,2);
 assert.doesNotThrow(()=>renderHome({places:[],regionPages:[]}));
});
