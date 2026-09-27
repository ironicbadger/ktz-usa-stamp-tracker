export function parseStampRows(text){
 if(!text.trim())return [];
 return text.trim().split(/\r?\n/).filter(Boolean).map((line,i)=>{
  const [name,t='main',date='',...extra]=line.split('\t').map(s=>s.trim());
  const type=({main:'main',sub:'sub',additional:'sub',limited:'limited','limited edition':'limited'})[t.toLowerCase()];
  const parsed=new Date(date+'T12:00:00Z');
  if(!name||!type||extra.some(Boolean)||date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date))throw Error(`Check row ${i+1}: use a name, Main / Additional / Limited edition, and YYYY-MM-DD.`);
  return {name,type,...(date?{date}:{}),photos:[]};
 });
}
export function syncStampField(data,stamp,field,value){
 stamp[field]=value;
 const identity=stamp.cancellation_id||((data.stamps||[]).includes(stamp)?stamp.id:null);
 const linked=identity?[...(data.stamps||[]).filter(s=>s.id===identity),...(data.visits||[]).flatMap(v=>v.stamps||[]).filter(s=>s.cancellation_id===identity)]:[stamp];
 for(const s of linked)s[field]=value;
 return linked;
}
