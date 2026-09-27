import {appVersion} from './version.mjs';
import {themeToggle} from './theme-controls.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecords,escape,slug} from '../src/content.mjs';
import {createSite} from '../src/site.mjs';
import {normalizeRichRecord,plainText} from './rich-text.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'data/catalogue.json')));
export const recordURL=record=>`/${record.kind.toLowerCase()}/${slug(path.basename(record.key))}/`;
export function renderCollection(store,replacement){
 const all=store.list();
 const records=replacement?[...all.filter(r=>r.key!==replacement.key),replacement]:all;
 const normalized=records.map(normalizeRichRecord);
 const assets=store.listAssets().map(a=>({path:a.path,file:path.join(store.uploadsDir,a.path)}));
 const model=loadRecords(normalized,{assets});
 const {pages,search,layout}=createSite(model,catalogue,appVersion);
 const decorate=(html,record)=>{
  const tools=record?`<nav class="page-tools" aria-label="Page actions"><a href="/edit/?key=${encodeURIComponent(record.key)}">Edit this page</a><a href="/edit/?key=${encodeURIComponent(record.key)}&view=history">History</a></nav>`:'';
  const controls=`<div class="header-tools"><div class="header-controls">${themeToggle}<a href="${record?'/edit/?key='+encodeURIComponent(record.key):'/edit/'}">Edit mode</a></div>`;
  return html.replace('</head>',`<script src="/web/theme.js?v=${appVersion}"></script><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#ffffff"><link rel="apple-touch-icon" href="/web/icon-192.png"><link rel="stylesheet" href="/web/reader.css?v=${appVersion}"><link rel="stylesheet" href="/web/theme.css?v=${appVersion}"><script src="/web/pwa.js" defer></script></head>`).replace('<form action="/search/" role="search">',controls+'<form action="/search/" role="search">').replace('</form></header>','</form></div></header>').replace('<main id="content">','<main id="content">'+tools);
 };
 for(const [url,html] of pages)pages.set(url,decorate(html,records.find(r=>recordURL(r)===url)));
 for(const item of search)item.text=plainText(item.text);
 return {model,pages,search,renderPage:body=>decorate(layout('The collection',body))};
}
export function editorRecord(record){
 const copy=structuredClone(record);
 const ids=new Set((copy.data.stamps||[]).map(s=>s.id).filter(Boolean));
 for(const [i,s]of (copy.data.stamps||[]).entries())if(!s.id){let id=`known-${i+1}`;while(ids.has(id))id+='-legacy';s.id=id;ids.add(id)}
 for(const v of copy.data.visits||[])for(const s of v.stamps||[])if(!s.cancellation_id){const matching=(copy.data.stamps||[]).filter(c=>c.name.trim().toLowerCase()===s.name.trim().toLowerCase()&&(c.type||'main')===s.type);if(matching.length===1)s.cancellation_id=matching[0].id;}
 for(const [i,v] of (copy.data.visits||[]).entries()){
  const oldVisit=`visit-${v.date}-${i+1}`;
  if(!v.id){v.id=`legacy-${v.date}-${i+1}`;v.anchor_aliases=[...new Set([...(v.anchor_aliases||[]),oldVisit])];}
  for(const [j,s] of v.stamps.entries())if(!s.id){s.id=`legacy-${v.date}-${i+1}-${j+1}`;s.anchor_aliases=[...new Set([...(s.anchor_aliases||[]),`${oldVisit}-stamp-${j+1}`])];}
 }
 return copy;
}
export function renderedRecord(collection,key){
 const node=collection.model.nodes.find(n=>n.key===key);
 if(!node)return null;
 return {about:node.html||'',associations:node.associationsHtml||'',visits:(node.data.visits||[]).map((v,index)=>({index,html:v.html||'',stamps:v.stamps.map((s,index)=>({index,html:s.html||''}))}))};
}
export function blankPage(message){return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Stamp Book</title><script src="/web/theme.js"></script><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/web/theme.css"><main style="max-width:700px;margin:60px auto;padding:20px"><h1>The Stamp Book</h1><p>${escape(message)}</p><p><a href="/edit/">Open editor</a></p></main></html>`;}
