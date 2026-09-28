import {validDate} from './content.mjs';
export function formatDate(value){
 return new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).formatToParts(new Date(value+'T12:00:00Z')).map(part=>part.type==='year'?part.value.padStart(4,'0'):part.value).join('');
}
export function tripDateGroups(trips,places){
 const entries=trips.map(trip=>{
  const visits=places.flatMap(p=>p.data.visits.filter(v=>v.trip===`[[${trip.key}]]`).map(v=>v.date)).sort();
  const date=trip.data.start_date||visits[0]||'';
  return {trip,date:validDate(date)?date:''};
 }).sort((a,b)=>b.date.localeCompare(a.date)||a.trip.title.localeCompare(b.trip.title));
 const groups=new Map();
 for(const entry of entries){const year=entry.date.slice(0,4)||'Undated';if(!groups.has(year))groups.set(year,[]);groups.get(year).push(entry)}
 return groups;
}
