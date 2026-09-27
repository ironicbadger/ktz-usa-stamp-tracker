import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'data/maps');
const nps='https://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer';
const census='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/USLandmass/MapServer/0';
const query=(url,params)=>url+'/query?'+new URLSearchParams({...params,outSR:'4326',f:'geojson'});
const sources=[
 ['nps-centroids.geojson',query(nps+'/0',{where:'1=1',outFields:'UNIT_CODE,UNIT_NAME,STATE,Status,AreaID',geometryPrecision:'6'}),nps+'/0'],
 ['yellowstone-boundary.geojson',query(nps+'/2',{where:"UNIT_CODE='YELL'",outFields:'UNIT_CODE,UNIT_NAME',maxAllowableOffset:'0.001',geometryPrecision:'5'}),nps+'/2'],
 ['states.geojson',query(census,{where:'1=1',outFields:'STUSAB,NAME,INTPTLAT,INTPTLON',maxAllowableOffset:'0.002',geometryPrecision:'5'}),census],
 ['land.geojson','https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson','https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/'],
 ['lakes.geojson','https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson','https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-lakes/']
];
fs.mkdirSync(out,{recursive:true});
const manifest=[];
for(const [file,url,source] of sources){
 const response=await fetch(url);
 if(!response.ok)throw Error(`Cannot fetch ${file}: ${response.status}`);
 const original=await response.text();
 const data=JSON.parse(original);
 if(data.type!=='FeatureCollection'||!data.features.length||data.exceededTransferLimit)throw Error(`Incomplete GeoJSON: ${file}`);
 // Store geometry and source fields only; no generated geography enters these files.
 fs.writeFileSync(path.join(out,file),JSON.stringify(data)+'\n');
 manifest.push({file,source,download:url,retrieved:new Date().toISOString().slice(0,10),features:data.features.length,sha256:createHash('sha256').update(JSON.stringify(data)+'\n').digest('hex')});
 console.log(`${file}: ${data.features.length} source features`);
}
fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify(manifest,null,2)+'\n');
