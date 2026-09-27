import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDocument,normalizeRichRecord} from '../web/rich-text.mjs';
const doc=text=>({json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]},html:'<script>forged HTML ignored</script>'});
test('canonical editor JSON, not supplied HTML, controls publication',()=>{
 const record=normalizeRichRecord({kind:'Places',key:'Places/Example',body:'Old source',data:{visits:[{notes_doc:doc('Visit'),stamps:[{notes_doc:doc('Stamp')}]}]},prose:{about:doc('About <script> & [[literal brackets]]'),associations:doc('A book')}});
 assert.doesNotMatch(record.body,/forged|<script>/);assert.match(record.body,/&lt;script&gt;/);assert.match(record.body,/&#91;&#91;literal brackets/);assert.match(record.body,/## Associations/);assert.equal(record.data.visits[0].notes,'<p>Visit</p>');
});
test('rich links and images reject active or external executable content',()=>{
 const linked=href=>({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'link',marks:[{type:'link',attrs:{href}}]}]}]});
 for(const href of ['javascript:alert(1)','data:text/html,abc','//evil.example','/\\evil'])assert.throws(()=>renderDocument(linked(href)));
 for(const href of ['https://example.com/book','/places/example/','#visits','mailto:hello@example.com'])assert.match(renderDocument(linked(href)),/<a /);
 assert.throws(()=>renderDocument({type:'doc',content:[{type:'image',attrs:{src:'https://example.com/x.svg'}}]}));
 assert.match(renderDocument({type:'doc',content:[{type:'image',attrs:{src:'/attachments/local.webp',alt:'<x>'}}]}),/alt="&lt;x&gt;"/);
});
test('editor document complexity has a predictable upper bound',()=>{
 let node={type:'paragraph',content:[]};for(let i=0;i<45;i++)node={type:'blockquote',content:[node]};assert.throws(()=>renderDocument({type:'doc',content:[node]}),/too large/);
 assert.throws(()=>renderDocument({type:'doc',content:[{type:'iframe'}]}),/Unsupported/);
});
