
export const availability = ['available','seasonal','unavailable','moved','unknown'];
export const safeURL = value => {
 try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
};
export const currentReport = location => location.reports.filter(r=>r.origin==='authored').at(-1) || location.reports.at(-1);
export function resolveLocation(locations, stamp) {
 if(stamp.location_id)return locations.find(l=>l.id===stamp.location_id);
 const matches=locations.filter(l=>[l.name,...(l.aliases||[])].includes(stamp.location));
 return matches.length===1?matches[0]:undefined;
}

// Pure append-only reconciliation. Validation of the complete result belongs to validatePlace.
// Import callers must provide stable location IDs; names are never a matching key.
export function mergeLocationImports(place, incoming) {
 const result=structuredClone(place);
 result.stamping_locations??=[];
 for(const item of incoming) {
  if(!item.id||!item.name||!Array.isArray(item.reports))throw Error('Imports require a location ID, name and reports');
  let location=result.stamping_locations.find(l=>l.id===item.id);
  if(!location){location={id:item.id,name:item.name,reports:[]};if(item.maps_url)location.maps_url=item.maps_url;result.stamping_locations.push(location)}
  for(const report of item.reports) {
   if(!report.id||report.origin!=='imported'||!safeURL(report.source?.url)||!report.source?.checked||report.visit_id)throw Error('Imported reports require an ID and published source provenance');
   const existing=location.reports.find(r=>r.id===report.id);
   if(existing){
    const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
    if(canonical(existing)!==canonical(report))throw Error(`Report ${report.id} changed: use a new report ID to retain history`);
   }else location.reports.push(structuredClone(report));
  }
 }
 return result;
}
