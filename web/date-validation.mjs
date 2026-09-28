// Keep legacy records readable, but do not accept partially entered years in edits.
export function validateAuthoredDates(data){
 const check=(value,label)=>{if(value&&Number(String(value).slice(0,4))<1000)throw Object.assign(Error(`Enter a complete four-digit year for ${label}.`),{status:400})};
 check(data.start_date,'the trip start date');check(data.established,'the establishment date');
 for(const visit of data.visits||[]){check(visit.date,'the visit date');for(const stamp of visit.stamps||[])check(stamp.date,'the stamp collection date')}
}
