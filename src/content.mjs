import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import {availability,safeURL,currentReport,resolveLocation} from './locations.mjs';
import {validateCancellations,cancellationAlbum} from './cancellations.mjs';

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
function validateLocations(p,file) {
 const id=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value);
 const unique=(items,label)=>{const values=items.filter(Boolean);assert(new Set(values).size===values.length,file,`duplicate ${label} ID`)};
 assert(p.stamping_locations===undefined||Array.isArray(p.stamping_locations),file,'stamping_locations must be a list');
 const locations=p.stamping_locations||[];
 unique(p.visits.map(v=>v.id),'visit');
 unique(p.visits.flatMap(v=>v.stamps.map(s=>s.id)),'stamp');
 for(const v of p.visits)for(const s of v.stamps)assert(s.id===undefined||id(s.id),file,'invalid stamp ID');
 for(const v of p.visits)assert(v.id===undefined||id(v.id),file,'invalid visit ID');
 for(const record of p.visits.flatMap(v=>[v,...v.stamps]))assert(record.anchor_aliases===undefined||(Array.isArray(record.anchor_aliases)&&record.anchor_aliases.every(id)),file,'anchor aliases must be a list of safe identifiers');
 unique(locations.map(l=>l?.id),'location');
 const reportIDs=[];
 for(const l of locations){
  assert(l&&id(l.id)&&text(l.name),file,'location requires an ID and name');
  assert(l.aliases===undefined||(Array.isArray(l.aliases)&&l.aliases.every(text)),file,'location aliases must be a list of names');
  assert(!l.maps_url||safeURL(l.maps_url),file,'location maps_url must be an HTTP(S) URL');
  assert(Array.isArray(l.reports)&&l.reports.length,file,'location requires at least one report');
  for(const r of l.reports){
   assert(r&&id(r.id)&&['authored','imported'].includes(r.origin),file,'report requires an ID and origin');reportIDs.push(r.id);
   assert(availability.includes(r.availability),file,'invalid location availability');
   for(const key of ['access','notes'])assert(r[key]===undefined||typeof r[key]==='string',file,`report ${key} must be text`);
   assert(Array.isArray(r.stamps)&&r.stamps.every(s=>s&&text(s.name)&&['main','sub','limited'].includes(s.type)&&availability.includes(s.availability)),file,'reported stamps need a name, type and availability');
   assert(Boolean(r.source)!==Boolean(r.visit_id),file,'report requires exactly one source or visit reference');
   if(r.visit_id){assert(r.origin==='authored'&&p.visits.some(v=>v.id===r.visit_id),file,'observation must reference an existing visit ID');assert(r.date===undefined&&r.checked===undefined,file,'observation inherits its visit date')}
   if(r.source)assert(safeURL(r.source.url)&&validDate(r.source.checked),file,'published source requires an HTTP(S) URL and real checked date');
  }
 }
 unique(reportIDs,'report');
 for(const v of p.visits)for(const stamp of v.stamps)assert(stamp.location_id===undefined||locations.some(l=>l.id===stamp.location_id),file,'stamp refers to an unknown location ID');
 assert(p.fact_sources===undefined||(Array.isArray(p.fact_sources)&&p.fact_sources.every(s=>s&&text(s.label)&&safeURL(s.url))),file,'fact sources need a label and an HTTP(S) URL');
 assert(p.established_label===undefined||text(p.established_label),file,'established label must be text');
 assert(p.area===undefined||text(p.area),file,'area must be text with units');
 assert(p.established===undefined||validDate(p.established),file,'established must be a real ISO date');
 assert(p.map===undefined||text(p.map),file,'map must be an attachment reference');
}
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
   assert(s&&text(s.name)&&['main','sub','limited'].includes(s.type),context,'each stamp needs a name and type: main or sub or limited');
   assert(s.date===undefined||validDate(s.date),context,'collected date must be a real YYYY-MM-DD date');
   assert(s.location===undefined||typeof s.location==='string',context,'stamp location must be text');
   assert(s.notes===undefined||typeof s.notes==='string',context,'stamp notes must be text');
   assert(Array.isArray(s.photos)&&s.photos.every(text),context,'stamp photos must be a list (use [] when empty)');
  }
 }
 validateLocations(p,file);
 validateCancellations(p,file);
}
export function loadContent(vault) {
 const records=[];
 for(const kind of ['Places','Trips','Regions'])for(const file of walk(path.join(vault,kind)).filter(f=>f.endsWith('.md'))) {
  const {data,body}=parseNote(fs.readFileSync(file,'utf8'),file);
  const key=path.relative(vault,file).replaceAll(path.sep,'/').slice(0,-3);
  records.push({kind,key,file,data,body});
 }
 const assets=walk(path.join(vault,'Attachments')).filter(f=>!path.basename(f).startsWith('.')).map(file=>({path:path.relative(path.join(vault,'Attachments'),file).replaceAll(path.sep,'/'),file}));
 return loadRecords(records,{assets,vault});
}
// The web app supplies records from SQLite directly. The file adapter above is
// retained for the static builder and one-time imports, never for runtime edits.
export function loadRecords(records,{assets=[],vault}={}) {
 const nodes=[];
 for(const record of records){
  const {kind,key,body='',file=key}=record,data=structuredClone(record.data);
  assert(['Places','Trips','Regions'].includes(kind),file,'unknown content kind');
  assert(typeof key==='string'&&key.startsWith(kind+'/'),file,'invalid content key');
  assert(typeof body==='string',file,'body must be text');
  if(kind==='Places')validatePlace(data,file);
  if(kind==='Trips'&&data.start_date)assert(validDate(data.start_date),file,'trip start_date must be a valid YYYY-MM-DD date');
  assert(text(data.title),file,'title is required');
  if(kind==='Regions')assert(regions.includes(data.title),file,'unknown region title');
  nodes.push({kind,key,file,data,body,title:data.title,url:`/${kind.toLowerCase()}/${slug(path.basename(key))}/`,outgoing:new Set()});
 }
 const places=nodes.filter(n=>n.kind==='Places').sort((a,b)=>a.title.localeCompare(b.title));
 for(const p of places)for(const [i,v] of p.data.visits.entries()) {
  v.legacyAnchor=`visit-${v.date}-${i+1}`;
  v.anchor=v.id?`visit-${v.id}`:v.legacyAnchor;
  v.stamps.forEach((s,j)=>{s.legacyAnchor=`${v.legacyAnchor}-stamp-${j+1}`;s.anchor=s.id?`stamp-${s.id}`:s.legacyAnchor;s.date=s.date||v.date;s.visit=v;s.place=p});
  if(v.trip) {
   const key=v.trip.slice(2,-2);
   if(!nodes.some(n=>n.key===key))nodes.push({kind:'Trips',key,title:key.slice(6),data:{title:key.slice(6)},body:'',url:`/trips/${slug(key.slice(6))}/`,outgoing:new Set()});
  }
 }
 for(const r of regions)if(!nodes.some(n=>n.kind==='Regions'&&n.title===r))throw Error(`Missing region note: ${r}`);
 const urls=new Set();
 for(const n of nodes){assert(!urls.has(n.url),n.key,`duplicate page URL ${n.url}`);urls.add(n.url)}
 const usedAssets=new Set();
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
  let found=assets.filter(asset=>'Attachments/'+asset.path===clean||asset.path===clean);
  if(!found.length)found=assets.filter(asset=>path.basename(asset.path)===clean);
  assert(found.length===1,from.key,`attachment "${raw}" ${found.length?'is ambiguous':'does not exist'}`);
  assert(/\.(png|jpe?g|webp|gif|avif)$/i.test(found[0].path),from.key,'photos must be PNG, JPEG, WebP, GIF or AVIF');
  usedAssets.add(found[0].file);
  return '/attachments/'+found[0].path.split('/').map(encodeURIComponent).join('/');
 }
 function render(body,from,splitAssociations=false) {
  const wikified=body.replace(/(!?)\[\[([^\]]+)\]\]/g,(_,embed,raw)=> {
   const [ref,alias]=raw.split('|');
   if(embed)return `<img src="${escape(photo(ref,from))}" alt="${escape(alias||path.basename(ref))}" loading="lazy">`;
   const [name,heading]=ref.split('#');const target=name?findNote(name,from):from;
   from.outgoing.add(target.key);
   return `<a href="${target.url}${heading?'#'+slug(heading):''}">${escape(alias||heading||target.title)}</a>`;
  });
  const tokens=splitAssociations?marked.lexer(wikified):undefined;
  const associationHeadings=new Set(tokens?.filter(token=>token.type==='heading'&&token.depth===2&&token.text.trim().toLowerCase()==='associations'));
  const renderer=new marked.Renderer();
  const headingIds=new Map();
  renderer.heading=token=>{const {tokens,depth}=token;const content=renderer.parser.parseInline(tokens);let base=slug(content.replace(/<[^>]+>/g,''));if(base==='associations'&&associationHeadings.size&&!associationHeadings.has(token))base='associations-heading';const count=headingIds.get(base)||0;headingIds.set(base,count+1);return `<h${depth} id="${base}${count?'-'+count:''}">${content}</h${depth}>`};
  const sanitize=html=>sanitizeHtml(html,{
   allowedTags:sanitizeHtml.defaults.allowedTags.concat(['img']),
   allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','title','loading'],h1:['id'],h2:['id'],h3:['id'],h4:['id'],h5:['id'],h6:['id']},
   allowedSchemes:['http','https','mailto'],
   transformTags:{a:(tag,attrs)=> {
    if(attrs.href?.endsWith('.md')&&!/^https?:/.test(attrs.href)){const target=findNote(attrs.href,from);from.outgoing.add(target.key);attrs.href=target.url}
    const linkedNode=nodes.find(node=>node.url===attrs.href?.split('#')[0]);
    if(linkedNode)from.outgoing.add(linkedNode.key);
    if(/^https?:/.test(attrs.href||'')){attrs.target='_blank';attrs.rel='noopener noreferrer'}
    return {tagName:tag,attribs:attrs};
   },img:(tag,attrs)=>({tagName:tag,attribs:{...attrs,src:attrs.src?.startsWith('/attachments/')?attrs.src:photo(attrs.src||'',from),loading:'lazy'}})}
  });
  if(!splitAssociations)return sanitize(marked.parse(wikified,{renderer}));
  // Parse in source order so Markdown references and repeated heading IDs keep
  // their original meaning even though Associations moves below Visits.
  const notes=[],associations=[],associationBody=[],associationAliases=[];
  let inAssociations=false,hasAssociations=false;
  for(const token of tokens){
   const fragment=[token];fragment.links=tokens.links;
   const html=marked.parser(fragment,{renderer});
   if(associationHeadings.has(token)){
    hasAssociations=true;inAssociations=true;
    const id=html.match(/id="([^"]+)"/)?.[1];
    if(id&&id!=='associations')associationAliases.push(id);
    continue;
   }
   if(token.type==='heading'&&token.depth<=2)inAssociations=false;
   if(inAssociations){associations.push(html);associationBody.push(token.raw)}else notes.push(html);
  }
  return {html:sanitize(notes.join('')),associationsHtml:sanitize(associations.join('')),associationsBody:associationBody.join(''),associationAliases,hasAssociations};
 }
 for(const n of nodes){if(n.kind==='Places')Object.assign(n,render(n.body,n,true));else n.html=render(n.body,n);if(n.kind==='Places')for(const v of n.data.visits){v.html=render(v.notes||'',n);if(v.trip)n.outgoing.add(v.trip.slice(2,-2));for(const s of v.stamps){s.html=render(s.notes||'',n);s.images=s.photos.map(ref=>photo(ref,n))}}if(n.kind==='Places')for(const s of n.data.stamps||[])s.images=(s.photos||[]).map(ref=>photo(ref,n));if(n.kind==='Regions'&&n.data.map)n.map=photo(n.data.map,n)}
 for(const p of places){
  Object.assign(p,cancellationAlbum(p));
  if(p.data.map)p.map=photo(p.data.map,p);
  p.locations=(p.data.stamping_locations||[]).map(l=>({...l,anchor:`location-${l.id}`,reports:l.reports.map(r=>({...r,visit:r.visit_id?p.data.visits.find(v=>v.id===r.visit_id):undefined})),collected:[]}));
  for(const l of p.locations)l.current=currentReport(l);
  for(const v of p.data.visits)for(const stamp of v.stamps){stamp.locationRecord=resolveLocation(p.locations,stamp);stamp.locationRecord?.collected.push(stamp)}
 }
 for(const n of nodes)n.backlinks=nodes.filter(other=>other.key!==n.key&&other.outgoing.has(n.key));
 return {nodes,places,trips:nodes.filter(n=>n.kind==='Trips').sort((a,b)=>a.title.localeCompare(b.title)),regionPages:nodes.filter(n=>n.kind==='Regions').sort((a,b)=>regions.indexOf(a.title)-regions.indexOf(b.title)),assets:[...usedAssets],vault};
}
