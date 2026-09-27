import {normalizeDocument,plainText} from './rich-text.mjs';

// Explicit, repeatable enrichment: never applied silently at server startup.
export function enrichPlace(record,facts){
 if(record.kind!=='Places'||record.data.title!==facts.title)return {record,fields:[]};
 const result=structuredClone(record),data=result.data,fields=[];
 if(!data.area&&Number.isFinite(facts.area)){data.area=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(facts.area)+' acres';fields.push('area')}
 if(!data.established&&facts.established){data.established=facts.established;data.established_label='Established / authorized';fields.push('established')}
 const about=result.prose?.about;
 const hasAbout=about?plainText(about.html||'').trim()||JSON.stringify(about.json).includes('"text"'):plainText(result.body||'').trim();
 if(!hasAbout&&facts.description&&!result.body?.trim()){
  result.prose??={};result.prose.about=normalizeDocument({json:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:facts.description}]}]}});
  result.body=result.prose.about.html;
  if(result.prose.associations?.html&&plainText(result.prose.associations.html).trim())result.body+='\n\n## Associations\n\n'+result.prose.associations.html;
  fields.push('description');
 }
 if(fields.length){
  data.fact_sources??=[];
  for(const field of fields)if(facts.sources[field])data.fact_sources.push({field,...facts.sources[field],checked:facts.checked});
 }
 return {record:result,fields};
}
