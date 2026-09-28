import test from 'node:test';import assert from 'node:assert/strict';
import {formatDate,tripDateGroups} from '../src/trip-dates.mjs';
const trip=(title,start_date)=>({key:'Trips/'+title,title,data:{start_date}});
test('trips group by start year, newest first, falling back to earliest linked visit',()=>{
 const trips=[trip('Undated'),trip('Older','2019-07-01'),trip('Latest','2026-09-01'),trip('Linked')];
 const places=[{data:{visits:[{trip:'[[Trips/Linked]]',date:'2026-07-04'},{trip:'[[Trips/Linked]]',date:'2026-06-01'},{trip:'[[Trips/Latest]]',date:'2025-01-01'}]}}];
 const groups=tripDateGroups(trips,places);assert.deepEqual([...groups.keys()],['2026','2019','Undated']);assert.deepEqual(groups.get('2026').map(e=>[e.trip.title,e.date]),[['Latest','2026-09-01'],['Linked','2026-06-01']]);
});
test('display the entire stored year, including an accidentally incomplete year',()=>{assert.equal(formatDate('0002-09-20'),'September 20, 0002');assert.equal(formatDate('2026-09-20'),'September 20, 2026')});

import {validateAuthoredDates} from '../web/date-validation.mjs';
test('reject incomplete years on authored visits, stamp dates and trip start dates',()=>{for(const data of [{visits:[{date:'0002-09-20'}]},{visits:[{date:'2026-09-20',stamps:[{date:'0202-09-20'}]}]},{start_date:'0002-09-20'}])assert.throws(()=>validateAuthoredDates(data),/complete four-digit year/);assert.doesNotThrow(()=>validateAuthoredDates({start_date:'2026-09-20'}))});
