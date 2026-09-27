import maps from '../data/locator-maps.json' with {type:'json'};

/** Local, sourced map assets. Unknown places get state context without an invented pin. */
export function getLocatorMap(placeData={}){
 const park=maps.parks[String(placeData.park_code||'').toLowerCase()];
 if(park)return park;
 const states=[...new Set((placeData.states||[]).map(s=>String(s).toUpperCase()))];
 return states.length===1?maps.states[states[0]]||null:null;
}
