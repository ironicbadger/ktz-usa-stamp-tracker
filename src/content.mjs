import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const regions = ['North Atlantic','Mid-Atlantic','National Capital','Southeast','Midwest','Southwest','Rocky Mountain','Western','Pacific Northwest & Alaska'];
export const stateNames = Object.fromEntries('AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|AS:American Samoa|GU:Guam|MP:Northern Mariana Islands|PR:Puerto Rico|VI:U.S. Virgin Islands|UM:U.S. Minor Outlying Islands'.split('|').map(s=>s.split(':')));
export const slug = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const escape = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export const walk = dir => !fs.existsSync(dir)?[]:fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
export function parseNote(text,file='note') {
 const m=text.replace(/\r\n/g,'\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
 if(!m)throw Error(`${file}: missing YAML frontmatter`);
 const doc=YAML.parseDocument(m[1],{uniqueKeys:true});
 if(doc.errors.length)throw Error(`${file}: ${doc.errors[0].message}`);
 const data=doc.toJSON();
 if(!data || typeof data!=='object' || Array.isArray(data))throw Error(`${file}: frontmatter must be an object`);
 return {data,body:m[2]};
}
function assert(ok,file,message){if(!ok)throw Error(`${file}: ${message}`)}
function text(value){return typeof value==='string' && value.trim().length>0}
export function validatePlace(p,file) {
 assert(text(p.title),file,'title is required');
 assert(Array.isArray(p.states)&&p.states.length&&p.states.every(s=>stateNames[s]),file,'states must contain valid state abbreviations');
 assert(regions.includes(p.passport_region),file,'passport_region must match a region name');
 assert(Array.isArray(p.visits),file,'visits must be a list (use [] when empty)');
 for(const [i,v] of p.visits.entries()) {
  const context=`${file}, visit ${i+1}`;
  assert(v&&validDate(v.date),context,'date must be a real YYYY-MM-DD date in quotes');
  assert(v.notes===undefined||typeof v.notes==='string',context,'notes must be text');
  assert(!v.trip||(/^\[\[Trips\/[^\]|#]+\]\]$/.test(v.trip)&&!v.trip.includes('..')),context,'trip must be [[Trips/Trip name]]');
  assert(Array.isArray(v.stamps),context,'stamps must be a list (use [] when empty)');
  for(const s of v.stamps) {
   assert(s&&text(s.name)&&['main','sub'].includes(s.type),context,'each stamp needs a name and type: main or sub');
   assert(s.location===undefined||typeof s.location==='string',context,'stamp location must be text');
   assert(s.notes===undefined||typeof s.notes==='string',context,'stamp notes must be text');
   assert(Array.isArray(s.photos)&&s.photos.every(text),context,'stamp photos must be a list (use [] when empty)');
  }
 }
}
export function loadContent(vault) {
 const nodes=[];
 for(const kind of ['Places','Trips','Regions'])for(const file of walk(path.join(vault,kind)).filter(f=>f.endsWith('.md'))) {
  const {data,body}=parseNote(fs.readFileSync(file,'utf8'),file);
  if(kind==='Places')validatePlace(data,file);
  assert(text(data.title),file,'title is required');
  if(kind==='Regions')assert(regions.includes(data.title),file,'unknown region title');
  const key=path.relative(vault,file).replaceAll(path.sep,'/').slice(0,-3);
  nodes.push({kind,key,file,data,body,title:data.title,url:`/${kind.toLowerCase()}/${slug(path.basename(file,'.md'))}/`,outgoing:new Set()});
 }
 const places=nodes.filter(n=>n.kind==='Places').sort((a,b)=>a.title.localeCompare(b.title));
 for(const p of places)for(const [i,v] of p.data.visits.entries()) {
  v.anchor=`visit-${v.date}-${i+1}`;
  v.stamps.forEach((s,j)=>{s.anchor=`${v.anchor}-stamp-${j+1}`;s.date=v.date;s.visit=v;s.place=p});
  if(v.trip) {
   const key=v.trip.slice(2,-2);
   if(!nodes.some(n=>n.key===key))nodes.push({kind:'Trips',key,title:key.slice(6),data:{title:key.slice(6)},body:'',url:`/trips/${slug(key.slice(6))}/`,outgoing:new Set()});
  }
 }
 for(const r of regions)if(!nodes.some(n=>n.kind==='Regions'&&n.title===r))throw Error(`Missing region note: ${r}`);
 const urls=new Set();
 for(const n of nodes){assert(!urls.has(n.url),n.key,`duplicate page URL ${n.url}`);urls.add(n.url)}
 const usedAssets=new Set();
 const assets=walk(path.join(vault,'Attachments')).filter(f=>!path.basename(f).startsWith('.'));
 function findNote(ref,from) {
  const clean=ref.replace(/\.md$/,'');
  const exact=nodes.find(n=>n.key===clean);if(exact)return exact;
  const matches=nodes.filter(n=>path.basename(n.key)===clean||n.title===clean);
  assert(matches.length===1,from.key,`wikilink "${ref}" ${matches.length?'is ambiguous':'does not exist'}`);return matches[0];
 }
 function photo(ref,from) {
  const raw=ref.replace(/^!?(\[\[)/,'').replace(/\]\]$/,'').split('|')[0];
  const clean=decodeURIComponent(raw).replace(/^\//,'');
  assert(!clean.split('/').includes('..'),from.key,'attachment paths cannot contain ..');
  let found=assets.filter(f=>path.relative(vault,f).replaceAll(path.sep,'/')===clean);
  if(!found.length)found=assets.filter(f=>path.basename(f)===clean);
  assert(found.length===1,from.key,`attachment "${raw}" ${found.length?'is ambiguous':'does not exist'}`);
  assert(/\.(png|jpe?g|webp|gif|avif)$/i.test(found[0]),from.key,'photos must be PNG, JPEG, WebP, GIF or AVIF');
  usedAssets.add(found[0]);
  return '/attachments/'+path.relative(path.join(vault,'Attachments'),found[0]).split(path.sep).map(encodeURIComponent).join('/');
 }
 function render(body,from) {
  const wikified=body.replace(/(!?)\[\[([^\]]+)\]\]/g,(_,embed,raw)=> {
   const [ref,alias]=raw.split('|');
   if(embed)return `<img src="${escape(photo(ref,from))}" alt="${escape(alias||path.basename(ref))}" loading="lazy">`;
   const [name,heading]=ref.split('#');const target=name?findNote(name,from):from;
   from.outgoing.add(target.key);
   return `<a href="${target.url}${heading?'#'+slug(heading):''}">${escape(alias||heading||target.title)}</a>`;
  });
  const renderer=new marked.Renderer();
  const headingIds=new Map();
  renderer.heading=({tokens,depth})=>{const content=renderer.parser.parseInline(tokens);const base=slug(content.replace(/<[^>]+>/g,''));const count=headingIds.get(base)||0;headingIds.set(base,count+1);return `<h${depth} id="${base}${count?'-'+count:''}">${content}</h${depth}>`};
  return sanitizeHtml(marked.parse(wikified,{renderer}),{
   allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img']),
   allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','title','loading'],h1:['id'],h2:['id'],h3:['id'],h4:['id'],h5:['id'],h6:['id']},
   allowedSchemes:['http','https','mailto'],
   transformTags:{a:(tag,attrs)=> {
    if(attrs.href?.endsWith('.md')&&!/^https?:/.test(attrs.href)){const target=findNote(attrs.href,from);from.outgoing.add(target.key);attrs.href=target.url}
    if(/^https?:/.test(attrs.href||'')){attrs.target='_blank';attrs.rel='noopener noreferrer'}
    return {tagName:tag,attribs:attrs};
   },img:(tag,attrs)=>({tagName:tag,attribs:{...attrs,src:attrs.src?.startsWith('/attachments/')?attrs.src:photo(attrs.src||'',from),loading:'lazy'}})}
  });
 }
 for(const n of nodes){n.html=render(n.body,n);if(n.kind==='Places')for(const v of n.data.visits){v.html=render(v.notes||'',n);if(v.trip)n.outgoing.add(v.trip.slice(2,-2));for(const s of v.stamps){s.html=render(s.notes||'',n);s.images=s.photos.map(ref=>photo(ref,n))}}if(n.kind==='Regions'&&n.data.map)n.map=photo(n.data.map,n)}
 for(const n of nodes)n.backlinks=nodes.filter(other=>other.key!==n.key&&other.outgoing.has(n.key));
 return {nodes,places,trips:nodes.filter(n=>n.kind==='Trips').sort((a,b)=>a.title.localeCompare(b.title)),regionPages:nodes.filter(n=>n.kind==='Regions').sort((a,b)=>regions.indexOf(a.title)-regions.indexOf(b.title)),assets:[...usedAssets],vault};
}
