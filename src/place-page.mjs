import {escape as e, stateNames} from './content.mjs';
import {getLocatorMap} from './locator-maps.mjs';

import {formatDate as date} from './trip-dates.mjs';
const aliases = record => [...new Set([record.legacyAnchor, ...(record.anchor_aliases || [])])].filter(id => id && id !== record.anchor).map(id => `<span id="${e(id)}" class="anchor-alias"></span>`).join('');

function cancellationSlot(cancellation, primary = false) {
  const state = cancellation.collected ? cancellation.image ? 'Collected' : 'Collected · photo needed' : 'Not collected';
  const blank = `<span class="slot-placeholder"><img class="placeholder-icon" src="/icons/${cancellation.collected ? 'camera' : 'postage-stamp'}.svg" alt="" width="32" height="32"><span>${cancellation.collected ? 'Photo needed' : 'Not collected'}</span></span>`;
  return `<a class="cancellation-slot${primary ? ' primary-slot' : ''}${!cancellation.collected ? ' is-uncollected' : ''}" href="#${e(cancellation.anchor)}" data-collected="${cancellation.collected}" data-has-photo="${Boolean(cancellation.image)}" aria-label="${e(cancellation.name)} — ${state}" title="${e(cancellation.name)} — ${state}">${cancellation.image ? `<img class="cancellation-artwork" src="${e(cancellation.image)}" alt="${e(cancellation.name)}" width="240" height="240">` : blank}</a>`;
}

function primaryDate(cancellation) {
  const latest = cancellation.impressions[0]?.date;
  if (!latest) return '';
  const parsed = new Date(latest + 'T12:00:00Z');
  const month = new Intl.DateTimeFormat('en-US', {month: 'long', timeZone: 'UTC'}).format(parsed);
  return `<div class="primary-date"><span class="primary-date-label">Collected</span><time datetime="${latest}"><span class="sr-only">${date(latest)}</span><span class="date-day" aria-hidden="true">${parsed.getUTCDate()}</span><span class="date-month-year" aria-hidden="true"><span>${month}</span><span>${parsed.getUTCFullYear()}</span></span></time></div>`;
}

function cancellationAlbum(p) {
  const all = p.cancellations;
  const primary = all[0];
  const shown = all.slice(1, 10);
  const columns = shown.length <= 1 ? 1 : shown.length <= 4 ? 2 : 3;
  const rows = [];
  for (let start = 0; start < shown.length; start += columns) {
    rows.push(`<div class="cancellation-row">${shown.slice(start, start + columns).map(c => cancellationSlot(c)).join('')}</div>`);
  }
  const known = all.filter(c => c.expected);
  const countText = p.expectedCancellationsKnown && known.length
    ? `${known.filter(c => c.collected).length} of ${known.length} collected${all.some(c => !c.expected) ? ` · ${all.filter(c => !c.expected).length} additional recorded` : ''}`
    : all.length ? `${all.filter(c => c.collected).length} cancellation${all.length === 1 ? '' : 's'} recorded` : '';
  return `<section class="cancellation-summary" id="stamps" aria-labelledby="cancellations-title" data-total="${all.length}"><h2 id="cancellations-title">Cancellations</h2>${primary ? `<div class="primary-cancellation">${cancellationSlot(primary, true)}${primaryDate(primary)}</div>` : '<div class="cancellation-empty"><img src="/icons/postage-stamp.svg" width="40" height="40" alt=""><span>No cancellation records yet.</span></div>'}${shown.length ? `<div class="secondary-cancellations"><h3>Other cancellations</h3><div class="cancellation-album" data-count="${shown.length}" style="--album-columns:${columns}" aria-label="Other cancellations">${rows.join('')}</div></div>` : ''}${countText ? `<p class="album-count">${countText}</p>` : ''}${all.length > 10 ? `<p class="album-more"><a href="#cancellation-details">View all ${all.length} cancellations</a></p>` : ''}</section>`;
}

function parkFacts(p, {catalogue, regionURL, resources}) {
  const parkResources = resources(p);
  const imported = catalogue.find(c => c.code === p.data.park_code)?.map;
  const map = p.map ? {image: p.map, alt: `${p.title} locator map`} : getLocatorMap(p.data) || (imported ? {image: imported.image, alt: `${p.title} locator map`, source: imported.source} : null);
  const interactiveMap = 'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:[p.title,...p.data.states.map(s=>stateNames[s]||s)].join(', ')});
  return `<section class="park-facts" id="park-facts">${map ? `<h2>Locator map</h2><figure class="map-figure"><a href="${e(interactiveMap)}" target="_blank" rel="noopener noreferrer" aria-label="Explore ${e(p.title)} in Google Maps (opens in a new tab)"><img class="locator-map" src="${e(map.image)}" alt="${e(map.alt)}" width="480" height="300"></a><figcaption>${map.kind === 'state-context' ? 'State context · ' : ''}<a href="${e(interactiveMap)}" target="_blank" rel="noopener noreferrer">Explore interactive map ↗</a>${map.source ? ` · <a href="${e(map.source)}" target="_blank" rel="noopener noreferrer">Map source</a>` : ''}</figcaption></figure>` : ''}<h2 class="facts-heading">Park facts</h2><dl>${p.data.established ? `<div><dt>${e(p.data.established_label||'Established')}</dt><dd>${date(p.data.established)}</dd></div>` : ''}${p.data.area ? `<div><dt>Area</dt><dd>${e(p.data.area)}</dd></div>` : ''}<div><dt>${p.data.states.length === 1 ? 'State' : 'States'}</dt><dd>${p.data.states.map(s => e(stateNames[s])).join(', ')}</dd></div><div><dt>Book region</dt><dd><a href="${regionURL(p.data.passport_region)}">${e(p.data.passport_region)}</a></dd></div></dl>${p.data.fact_sources?.length ? `<details class="fact-sources"><summary>Fact sources</summary>${p.data.fact_sources.map(s=>`<p><a href="${e(s.url)}" rel="noopener noreferrer" target="_blank">${e(s.label)}</a>${s.note?`<br><small>${e(s.note)}</small>`:''}</p>`).join('')}</details>`:''}${parkResources ? `<h3>Official park resources</h3>${parkResources}` : ''}</section>`;
}

function cancellationDetails(p, stampCard) {
  if (!p.cancellations.length) return '<span id="cancellation-details"></span>';
  return `<details class="collection-details" id="cancellation-details"><summary>Cancellation details <span class="disclosure-count">${p.cancellations.length}</span></summary><div class="disclosure-body">${p.cancellations.map(c => `<article class="cancellation-record" id="${e(c.anchor)}"><h3>${e(c.name)}</h3>${c.collected ? c.impressions.map(stampCard).join('') : '<p class="muted">Not collected.</p>'}</article>`).join('')}</div></details>`;
}

function visits(p, nodes) {
  return `<section id="visits" class="visits"><h2>Visits</h2>${p.data.visits.length ? p.data.visits.map(v => {
    const trip = v.trip && nodes.find(n => n.key === v.trip.slice(2, -2));
    const stampLink = v.stamps.length ? `<a href="#${e(v.stamps[0].anchor)}">${v.stamps.length} stamp${v.stamps.length === 1 ? '' : 's'}</a>` : '';
    const meta = [trip ? `<a href="${trip.url}">${e(trip.title)}</a>` : '', stampLink].filter(Boolean).join(' · ');
    return `<article class="visit" id="${e(v.anchor)}">${aliases(v)}<time datetime="${v.date}">${date(v.date)}</time><div class="visit-content"><div class="prose">${v.html || '<p class="muted">Visit recorded.</p>'}</div>${meta ? `<p class="visit-meta">${meta}</p>` : ''}</div></article>`;
  }).join('') : '<p class="muted">No visits recorded yet.</p>'}</section>`;
}

export function placeContent(p, context) {
  const {regionURL, nodes, stampCard, locationCard, backlinks} = context;
  const notes = p.html ? `<section id="notes" class="place-notes"><h2>About this place</h2><div class="prose">${p.html}</div></section>` : '<span id="notes"></span>';
  const associationAnchors = (p.associationAliases || []).map(id => `<span class="anchor-alias" id="${e(id)}"></span>`).join('');
  const associations = p.associationsHtml?.trim() ? `<section id="associations" class="associations"><h2>Associations</h2>${associationAnchors}<div class="prose">${p.associationsHtml}</div></section>` : p.hasAssociations ? `<span id="associations">${associationAnchors}</span>` : '';
  const locations = p.locations.length ? `<details id="stamping-locations" class="stamping-locations"><summary>Stamping locations <span class="disclosure-count">${p.locations.length}</span></summary><div class="disclosure-body">${p.locations.map(locationCard).join('')}</div></details>` : '<span id="stamping-locations"></span>';
  const linked = backlinks({...p, backlinks: p.backlinks.filter(b => !p.data.visits.some(v => v.trip === `[[${b.key}]]`))});
  return `<div class="place-page"><div class="place-heading"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Regions</a><span>/</span><a href="${regionURL(p.data.passport_region)}">${e(p.data.passport_region)}</a></nav><h1>${e(p.title)}</h1><p class="place-states">${p.data.states.map(s => e(stateNames[s])).join(', ')}</p>${p.data.design_preview ? '<p class="preview-label">Sample collection</p>' : ''}</div><aside class="place-rail">${cancellationAlbum(p)}${parkFacts(p, context)}</aside><div class="place-overview">${notes}${visits(p, nodes)}${associations}${locations}${cancellationDetails(p, stampCard)}${linked}</div></div>`;
}
