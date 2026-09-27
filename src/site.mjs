import {stampTypeLabel} from './cancellations.mjs';
import {escape as e,slug,regions,stateNames} from './content.mjs';
import {placeContent} from './place-page.mjs';
const date=d=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const external=(url,label)=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const section=(title,body,id='')=>`<section ${id?`id="${id}"`:''}><h2>${e(title)}</h2>${body}</section>`;
const stamps=p=>p.data.visits.flatMap(v=>v.stamps);
const newest=items=>items.slice().sort((a,b)=>b.date.localeCompare(a.date));
const mains=p=>newest(stamps(p).filter(s=>s.type==='main'));
const collected=p=>mains(p).length>0;
const anchorAliases=record=>[...new Set([record.legacyAnchor,...(record.anchor_aliases||[])])].filter(a=>a&&a!==record.anchor).map(a=>`<span id="${e(a)}" class="anchor-alias"></span>`).join('');
export function createSite(model,catalogue,assetVersion) {
 const {nodes,places,trips,regionPages}=model;
 const regionURL=name=>regionPages.find(r=>r.title===name).url;
 const stateURL=code=>`/states/${slug(stateNames[code])}/`;
 const statePages=[...new Set(places.flatMap(p=>p.data.states))].sort((a,b)=>stateNames[a].localeCompare(stateNames[b])).map(code=>{
  const counts=regions.map(region=>places.filter(p=>p.data.states.includes(code)&&p.data.passport_region===region).length);
  const primaryRegion=regions[counts.indexOf(Math.max(...counts))];
  return {title:stateNames[code],url:stateURL(code),stateCode:code,primaryRegion,data:{states:[code]}};
 });
 function tree(current) {
  const branch=(kind,label,url,id,open,body)=>`<div class="tree-${kind}" data-label="${e(label)}"><div class="tree-row"><button class="tree-toggle" type="button" aria-label="Expand or collapse ${e(label)}" aria-expanded="${open}" aria-controls="${id}"><img src="/icons/caret-right.svg" width="14" height="14" alt=""></button><a href="${url}" ${url===current?.url?'aria-current="page"':''}>${e(label)}</a></div><div class="tree-children" id="${id}" ${open?'':'hidden'}>${body}</div></div>`;
  return regions.map(region=>{
   const members=places.filter(p=>p.data.passport_region===region);
   const states=[...new Set(members.flatMap(p=>p.data.states))].sort((a,b)=>stateNames[a].localeCompare(stateNames[b]));
   const open=current?.data.passport_region===region||current?.title===region||current?.primaryRegion===region;
   return branch('region',region,regionURL(region),'tree-'+slug(region),!!open,states.map(state=>branch('state',stateNames[state],stateURL(state),'tree-'+slug(region)+'-'+state,!!(open&&current?.data.states?.[0]===state),`<div class="tree-sites">${members.filter(p=>p.data.states.includes(state)).map(p=>`<a class="tree-site" href="${p.url}" ${p===current?'aria-current="page"':''}>${e(p.title)}</a>`).join('')}</div>`)).join(''));
  }).join('');
 }
 function layout(title,body,current) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><link rel="icon" href="/icons/postage-stamp.svg" type="image/svg+xml"><meta name="description" content="${e(title)} — places, visits and collected stamps."><title>${e(title)} · Stampendium</title><link rel="stylesheet" href="/site.css?v=${assetVersion}"><link rel="stylesheet" href="/navigation.css?v=${assetVersion}"><script src="/app.js?v=${assetVersion}" defer></script></head><body><a class="skip-link" href="#content">Skip to content</a><header><button class="directory-toggle" aria-expanded="false" aria-controls="directory-content"><img src="/icons/list.svg" width="24" height="24" alt=""><span class="sr-only">Browse places</span></button><a class="brand" href="/">Stampendium</a><nav class="top-nav" aria-label="Main"><a href="/">Regions</a><a href="/places/">All places</a><a href="/trips/">Trips</a><a href="/about/">About</a></nav><form action="/search/" role="search"><label class="sr-only" for="header-search">Search the collection</label><input id="header-search" name="q" type="search" placeholder="Search places, visits, trips…"><button>Search</button></form></header><div class="layout"><aside class="directory" aria-label="Place directory"><div class="directory-heading"><strong>Places</strong><button class="directory-close" aria-label="Hide places">hide</button></div><div id="directory-content"><label class="sr-only" for="tree-filter">Filter directory</label><input id="tree-filter" type="search" placeholder="Filter places…"><nav class="place-tree" aria-label="Regions, states and places">${tree(current)}</nav><p class="tree-empty" hidden>No matching places.</p></div></aside><main id="content">${body}</main></div><footer>Stampendium · Personal collection · <a href="/about/">Sources</a></footer></body></html>`;
 }
 const title=(name,kicker='')=>`${kicker?`<p class="kicker">${e(kicker)}</p>`:''}<h1>${e(name)}</h1>`;
 const backlinks=n=>n.backlinks.length?section('Linked from',`<ul>${n.backlinks.map(b=>`<li><a href="${b.url}">${e(b.title)}</a></li>`).join('')}</ul>`):'';
 function resources(p) {
  const links=catalogue.find(c=>c.code===p.data.park_code)?.resources||{};
  const labels={website:'Park website',maps:'Park maps',visit:'Plan your visit'};
  const official=Object.entries(links).filter(([k,url])=>labels[k]&&/^https:\/\/(www\.|home\.)?nps\.gov\//.test(url));
  return official.length?`<ul class="resource-links">${official.map(([k,url])=>`<li>${external(url,labels[k])}</li>`).join('')}</ul>`:'';
 }
 const locationLink=s=>s.locationRecord?`<a href="#${s.locationRecord.anchor}">${e(s.location||s.locationRecord.name)}</a>`:e(s.location||'');
 const stampPhoto=(s,src,i)=>`<a class="stamp-photo-link" href="${e(src)}" aria-haspopup="dialog" aria-label="View ${e(s.name)}${s.images.length>1?' — photo '+(i+1):''}"><img src="${e(src)}" alt="${e(s.name)}${s.images.length>1?' — photo '+(i+1):''}" loading="lazy"></a>`;
 const stampViewerInfo=s=>`<template class="stamp-viewer-info"><p class="stamp-viewer-place">${e(s.place.title)}</p><h2 id="stamp-viewer-title">${e(s.name)}</h2><dl><div><dt>Type</dt><dd>${e(stampTypeLabel(s.type))}</dd></div><div><dt>Collected</dt><dd>${date(s.date)}</dd></div>${s.location||s.locationRecord?`<div><dt>Location</dt><dd>${e(s.location||s.locationRecord.name)}</dd></div>`:''}</dl><h3>Visit · ${date(s.visit.date)}</h3><div class="prose">${s.visit.html||'<p class="muted">No visit notes recorded.</p>'}</div><a class="stamp-viewer-visit" href="${s.place.url}#${s.visit.anchor}">View visit</a></template>`;
 const stampCard=s=>`<article class="stamp" id="${s.anchor}">${anchorAliases(s)}${stampViewerInfo(s)}<div class="stamp-images">${s.images.length?s.images.slice(0,1).map((src,i)=>stampPhoto(s,src,i)).join(''):'<p class="photo-pending">Collected · No photo</p>'}</div><div class="stamp-description"><h4>${e(s.name)}</h4>${s.location||s.locationRecord?`<p class="small">Location: ${locationLink(s)}</p>`:''}<p><a class="small" href="${s.place.url}#${s.visit.anchor}">Collected ${date(s.date)} · View visit</a></p><div class="prose">${s.html}</div>${s.images.length>1?`<div class="stamp-photos">${s.images.slice(1).map((src,i)=>stampPhoto(s,src,i+1)).join('')}</div><p class="small">${s.images.length} photos</p>`:''}</div></article>`;
 const availability={available:'Available',seasonal:'Seasonal',unavailable:'No longer available',moved:'Moved',unknown:'Availability unknown'};
 const reportBody=r=>`<div class="location-columns"><div><h4>Available stamps</h4>${r.stamps.length?`<ul class="available-stamps">${r.stamps.map(s=>`<li>${e(s.name)} <span class="small">${stampTypeLabel(s.type)} · ${availability[s.availability]}</span></li>`).join('')}</ul>`:'<p class="muted">No stamps listed in this report.</p>'}</div><div><h4>Where to look</h4>${r.access?`<p class="preserve-lines">${e(r.access)}</p>`:'<p class="muted">Access details not recorded.</p>'}<p class="small">${r.visit?`Observed on a visit · <a href="#${r.visit.anchor}">${date(r.visit.date)}</a>`:`${r.origin==='imported'?'Imported listing':'Published listing'} · ${external(r.source.url,'Source')} · Checked ${date(r.source.checked)}`}</p>${r.notes?`<p class="preserve-lines">${e(r.notes)}</p>`:''}</div></div>`;
 function locationCard(l) {
  return `<article class="location" id="${l.anchor}"><h3>${e(l.name)}</h3><p class="small availability">${availability[l.current.availability]}</p>${reportBody(l.current)}${l.maps_url?`<p>${external(l.maps_url,'Open location in Google Maps')}</p>`:''}${l.collected.length?`<details class="collected-here"><summary>${l.collected.length} collected here</summary><p class="small">${l.collected.map(s=>`<a href="#${s.anchor}">${e(s.name)} · ${date(s.date)}</a>`).join(' · ')}</p></details>`:''}${l.reports.length>1?`<details class="report-history"><summary>Other reports (${l.reports.length-1})</summary><p class="small">Reports may disagree. Authored updates take priority over imports; earlier records remain below.</p>${l.reports.filter(r=>r!==l.current).slice().reverse().map(r=>`<div class="previous-report"><p class="small">${availability[r.availability]}</p>${reportBody(r)}</div>`).join('')}</details>`:''}</article>`;
 }
 function place(p) {
  return layout(p.title,placeContent(p,{regionURL,resources,locationCard,stampCard,backlinks,nodes,catalogue}),p);
 }
 function collectionAlbum(members) {
  return `<p class="summary"><strong>${members.filter(collected).length} / ${members.length}</strong> places with a main stamp</p><div class="collection-controls"><label>Show <select id="collection-filter"><option value="all">All places</option><option value="collected">Main stamp recorded</option><option value="missing">No main stamp recorded</option></select></label></div><div class="album-grid">${members.map(p=>{const main=mains(p),image=p.data.featured_stamp_id?p.cancellations?.[0]?.image:main.flatMap(s=>s.images)[0];return `<a href="${p.url}" class="album-slot" data-collected="${main.length>0}">${image?`<img src="${image}" alt="${e(p.title)} featured stamp" loading="lazy">`:`<span class="empty-stamp">${main.length?'Collected · No photo':'Not collected'}</span>`}<strong>${e(p.title)}</strong><span>${p.data.states.map(e).join(' · ')}</span>${main.length?`<span>${main.length} main ${main.length===1?'impression':'impressions'}</span>`:''}</a>`}).join('')}</div><p id="collection-empty" class="muted" hidden>No places match this filter.</p>`;
 }
 function state(s) {
  const members=places.filter(p=>p.data.states.includes(s.stateCode));
  return layout(s.title,`${title(s.title,'STATE COLLECTION')}${collectionAlbum(members)}`,s);
 }
 function region(r) {
  const members=places.filter(p=>p.data.passport_region===r.title);
  const states=[...new Set(members.flatMap(p=>p.data.states))].sort((a,b)=>stateNames[a].localeCompare(stateNames[b]));
  return layout(r.title,`${title(r.title,'REGIONAL COLLECTION')}<div class="prose">${r.html}</div>${r.map?`<figure class="regional-map"><a href="${r.map}" target="_blank" rel="noopener"><img src="${r.map}" alt="${e(r.title)} regional book map"></a></figure>`:''}<p>${external('https://www.nps.gov/subjects/gisandmapping/nps-maps.htm','Official NPS map library')}</p>${collectionAlbum(members)}${section('Places by state',`<div class="state-list">${states.map(s=>`<section id="state-${s.toLowerCase()}"><h3><a href="${stateURL(s)}">${e(stateNames[s])}</a></h3><ul>${members.filter(p=>p.data.states.includes(s)).map(p=>`<li><a href="${p.url}">${e(p.title)}</a></li>`).join('')}</ul></section>`).join('')}</div>`)}${backlinks(r)}`,r);
 }
 function trip(t) {
  const visits=places.flatMap(p=>p.data.visits.filter(v=>v.trip===`[[${t.key}]]`).map(v=>({p,v}))).sort((a,b)=>a.v.date.localeCompare(b.v.date)||a.p.title.localeCompare(b.p.title));
  return layout(t.title,`${title(t.title,'TRIP')}<div class="prose">${t.html}</div><p class="summary">${visits.length} ${visits.length===1?'visit':'visits'} · ${visits.reduce((n,{v})=>n+v.stamps.length,0)} stamps</p>${visits.length?visits.map(({p,v})=>`<section><p class="kicker">${date(v.date)}</p><h2><a href="${p.url}#${v.anchor}">${e(p.title)}</a></h2><div class="prose">${v.html}</div>${v.stamps.length?`<div class="stamp-grid">${v.stamps.map(s=>`<a class="trip-stamp" href="${p.url}#${s.anchor}">${s.images[0]?`<img src="${s.images[0]}" alt="${e(s.name)}" loading="lazy">`:'<span class="empty-stamp">Collected · No photo</span>'}<strong>${e(s.name)}</strong><span>${stampTypeLabel(s.type)}</span></a>`).join('')}</div>`:''}</section>`).join(''):'<p class="muted">No visits linked to this trip.</p>'}${backlinks(t)}`,t);
 }
 const pages=new Map();
 pages.set('/',layout('Regions',`${title('The collection')}<p class="summary">${places.length} places · ${places.reduce((n,p)=>n+p.data.visits.length,0)} visits · ${places.reduce((n,p)=>n+stamps(p).length,0)} stamps</p><div class="region-grid">${regionPages.map(r=>{const members=places.filter(p=>p.data.passport_region===r.title);return `<a href="${r.url}"><h2>${e(r.title)}</h2><p>${members.filter(collected).length} / ${members.length} places with a main stamp</p></a>`}).join('')}</div>`));
 pages.set('/places/',layout('All places',`${title('All places')}<p>${places.length} places. <a href="/search/">Search the collection</a>.</p><ul class="all-places">${places.map(p=>`<li><a href="${p.url}">${e(p.title)}</a><span>${p.data.states.map(e).join(' · ')}</span></li>`).join('')}</ul>`));
 pages.set('/trips/',layout('Trips',`${title('Trips')}${trips.length?`<ul class="trip-list">${trips.map(t=>`<li><a href="${t.url}">${e(t.title)}</a></li>`).join('')}</ul>`:'<p class="muted">No trips recorded.</p>'}`));
 pages.set('/search/',layout('Search',`${title('Search')}<form id="search-form" action="/search/"><label for="search-input">Places, states, visits, stamps and trips</label><input id="search-input" type="search" name="q" autocomplete="off"><button>Search</button></form><p id="search-status" aria-live="polite"></p><ul id="search-results"></ul><noscript>Search requires JavaScript. <a href="/places/">Browse all places</a>.</noscript>`));
 pages.set('/about/',layout('About',`${title('About')}<p>A personal record of park visits and collected stamps.</p><p>Each place has one page, including places that span multiple states. Main stamps fill the regional collection; substamps stay with the place. A filled slot records a collection, not completion of every available stamp.</p>${section('Sources',`<p>The starting catalogue contains ${places.length} places imported from the original <a href="https://us-stamps.ktz.me/">US Stamps site</a>. It includes affiliated sites and separately listed park and preserve units.</p><ul><li>${external('https://www.nps.gov/','National Park Service')}</li><li>${external('https://www.nps.gov/subjects/gisandmapping/nps-maps.htm','Official NPS maps')}</li><li>${external('https://americasnationalparks.org/passport-to-your-national-parks/passport-cancellation-locations/','Passport cancellation locations')}</li></ul><p>Passport book regions are separate from NPS administrative regions. The initial state-based grouping can be adjusted in each place note.</p>`)}`));
 for(const n of nodes)pages.set(n.url,n.kind==='Places'?place(n):n.kind==='Regions'?region(n):trip(n));
 for(const s of statePages)pages.set(s.url,state(s));
 pages.set('/404.html',layout('Page not found',`${title('Page not found')}<p><a href="/search/">Search the collection</a> or <a href="/">browse regions</a>.</p>`));
 const search=nodes.map(n=>({title:n.title,url:n.url,kind:n.kind,text:[n.title,n.body,...(n.data.states||[]).flatMap(s=>[s,stateNames[s]]),n.data.passport_region||''].join(' ')}));
 for(const s of statePages)search.push({title:s.title,url:s.url,kind:'State',text:`${s.title} ${s.stateCode}`});
 for(const p of places)if(p.associationsBody?.trim())search.push({title:`${p.title} — Associations`,kind:'Associations',url:p.url+'#associations',text:`${p.title} ${p.associationsBody}`});
 for(const p of places)for(const v of p.data.visits){search.push({title:`${p.title} — ${v.date}`,kind:'Visit',url:p.url+'#'+v.anchor,text:`${p.title} ${v.date} ${v.notes||''} ${v.trip||''}`});for(const s of v.stamps)search.push({title:s.name,kind:stampTypeLabel(s.type),url:p.url+'#'+s.anchor,text:`${s.name} ${s.location||''} ${s.notes||''} ${s.date} ${p.title}`})}
 for(const p of places)for(const l of p.locations||[])search.push({title:l.name,kind:'Stamping location',url:p.url+'#'+l.anchor,text:[p.title,l.name,...(l.aliases||[]),...l.reports.flatMap(r=>[r.access||'',r.notes||'',r.availability,...r.stamps.map(s=>s.name)])].join(' ')});
 return {pages,search,layout};
}
