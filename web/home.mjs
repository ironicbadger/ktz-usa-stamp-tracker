import fs from 'node:fs';
import crypto from 'node:crypto';
import {escape as e} from '../src/content.mjs';
import {appVersion} from './version.mjs';
const featured=JSON.parse(fs.readFileSync(new URL('../data/featured.json',import.meta.url)));
export const hasMain=p=>(p.data.visits||[]).some(v=>(v.stamps||[]).some(s=>s.type==='main'));
export function completion(places){const done=places.filter(hasMain).length;return {done,total:places.length,percent:places.length?Math.round(done/places.length*100):0}}
const progress=({done,total,percent},label)=>`<progress max="${total||1}" value="${done}" aria-label="${e(label)}: ${done} of ${total} places with a main stamp">${percent}%</progress>`;
export function featureCandidates(model){return featured.flatMap(f=>{const place=model.places.find(p=>p.title===f.title);return place?[{...f,place}]:[]})}
export function renderHome(model,{previous='',page=body=>body,choose=length=>crypto.randomInt(length)}={}){
 const book=completion(model.places),pool=featureCandidates(model),eligible=pool.filter(f=>f.place.key!==previous),choices=eligible.length?eligible:pool;
 const feature=choices.length?choices[choose(choices.length)]:null;
 const hero=feature?`<section class="featured-site" aria-label="Featured place"><a class="featured-photo" href="${feature.place.url}" tabindex="-1" aria-hidden="true"><img src="${feature.image}" alt="" width="1600" height="1067" fetchpriority="high"></a><div class="featured-copy"><p class="kicker">Featured place</p><h2>${e(feature.place.title)}</h2><p class="featured-region">${e(feature.place.data.passport_region)}</p><p class="featured-description">${e(feature.description)}</p><a class="featured-link" href="${feature.place.url}">Open this place <span aria-hidden="true">→</span></a></div></section><div class="feature-caption"><a href="${feature.source}" target="_blank" rel="noopener noreferrer">Photo: ${e(feature.credit)}</a><span>A fresh place with every refresh.</span></div>`:'<p class="empty-feature">Every collection begins with a place. <a href="/places/">Explore yours.</a></p>';
 const content=`<div class="collection-home"><h1>The collection</h1><p class="home-intro">Places, memories, and the stamps along the way.</p><section class="book-progress" aria-label="Overall completion"><div><h2>Your book</h2><p>${book.done} / ${book.total} places with a main stamp</p></div><strong>${book.percent}%</strong>${progress(book,'Your book')}</section>${hero}<section class="home-regions" aria-labelledby="regions-title"><h2 id="regions-title">Regions</h2><div class="region-progress-grid">${model.regionPages.map(r=>{const counts=completion(model.places.filter(p=>p.data.passport_region===r.title));return `<a class="region-progress-item" href="${r.url}"><h3>${e(r.title)}</h3><div><span>${counts.done} / ${counts.total} places</span><span class="region-percent">${counts.percent}%</span></div>${progress(counts,r.title)}</a>`}).join('')}</div><p class="small completion-note">A place counts once you’ve collected its main stamp.</p></section><p class="small release-version">v${appVersion}</p></div>`;
 const html=page(content).replace('</head>',`<link rel="stylesheet" href="/web/home.css?v=${appVersion}"></head>`);
 return {html,featuredKey:feature?.place.key||''};
}
