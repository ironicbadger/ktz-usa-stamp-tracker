import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'data/maps');
const output=path.join(root,'static/maps/locators');
const read=name=>JSON.parse(fs.readFileSync(path.join(input,name)));
const npsSource='https://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer';
const censusSource='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/USLandmass/MapServer/0';
const W=360,H=244,cos=latitude=>Math.cos(latitude*Math.PI/180);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const number=value=>Math.round(value*10)/10;
const pointsOf=geometry=>geometry.type==='Polygon'?geometry.coordinates:geometry.type==='MultiPolygon'?geometry.coordinates.flat():[];

// Unwrap each source ring continuously before moving it into the local longitude window.
// This preserves Alaska and Pacific geometries on either side of the antimeridian.
function localRing(ring,longitude){
 const result=[];let previous=ring[0][0];
 for(const [source,latitude] of ring){let x=source;while(x-previous>180)x-=360;while(x-previous< -180)x+=360;result.push([x,latitude]);previous=x}
 const middle=(Math.min(...result.map(p=>p[0]))+Math.max(...result.map(p=>p[0])))/2;
 const shift=Math.round((longitude-middle)/360)*360;
 return result.map(([x,y])=>[x+shift,y]);
}
function bounds(rings){
 const all=rings.flat();return [Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>p[1]))];
}
function fitBox(box,padding=1.16){
 const longitude=(box[0]+box[2])/2,latitude=(box[1]+box[3])/2;
 let width=Math.max(.4,(box[2]-box[0])*cos(latitude))*padding,height=Math.max(.3,box[3]-box[1])*padding;
 if(width/height<W/H)width=height*W/H;else height=width*H/W;
 return {longitude,latitude,box:[longitude-width/cos(latitude)/2,latitude-height/2,longitude+width/cos(latitude)/2,latitude+height/2]};
}
function viewport(place,features,states){
 if(place.code==='yell')return fitBox([-113.35,43.05,-107.65,46.25],1);
 if(place.code==='mocr')return fitBox([-84.4,33.6,-75.3,36.8],1.08);
 const center=features[0]?.geometry.coordinates;
 const relevant=states.filter(s=>place.states.includes(s.properties.STUSAB));
 const longitude=center?.[0]??Number(relevant[0]?.properties.INTPTLON??-98);
 const box=bounds(relevant.flatMap(s=>pointsOf(s.geometry).map(r=>localRing(r,longitude))));
 if(!Number.isFinite(box[0]))return fitBox([longitude-5,(center?.[1]??39)-3,longitude+5,(center?.[1]??39)+3]);
 if(center){
  // Small parks retain a recognizable state context; very large states use a regional crop.
  const latitude=center[1],stateWidth=(box[2]-box[0])*cos(latitude),stateHeight=box[3]-box[1];
  if(stateWidth>10||stateHeight>8){
   const latitudeSpan=place.states.includes('AK')?7:5;
   return fitBox([longitude-4/cos(latitude),latitude-latitudeSpan/2,longitude+4/cos(latitude),latitude+latitudeSpan/2],1.08);
  }
 }
 // Some units cross the catalogue's primary-state border. Always retain every sourced pin.
 for(const feature of features){let [lon,lat]=feature.geometry.coordinates;while(lon-longitude>180)lon-=360;while(lon-longitude< -180)lon+=360;box[0]=Math.min(box[0],lon);box[1]=Math.min(box[1],lat);box[2]=Math.max(box[2],lon);box[3]=Math.max(box[3],lat)}
 return fitBox(box,features.length?1.25:1.12);
}
function clip(ring,box){
 let points=ring;
 for(const [axis,edge,sign] of [[0,box[0],1],[0,box[2],-1],[1,box[1],1],[1,box[3],-1]]){
  const result=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],insideA=sign*(a[axis]-edge)>=0,insideB=sign*(b[axis]-edge)>=0;
   if(insideA)result.push(a);
   if(insideA!==insideB){const t=(edge-a[axis])/(b[axis]-a[axis]);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}
  }
  points=result;if(!points.length)break;
 }
 return points;
}
function simplify(points,tolerance=.38){
 if(points.length<4)return points;
 const dist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
 const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
 while(stack.length){const [a,b]=stack.pop();let furthest=tolerance,index=-1;for(let i=a+1;i<b;i++){const d=dist(points[i],points[a],points[b]);if(d>furthest){furthest=d;index=i}}if(index!==-1){keep.add(index);stack.push([a,index],[index,b])}}
 return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
}
function area(points){let sum=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=a[0]*b[1]-b[0]*a[1]}return Math.abs(sum/2)}
function inside(point,rings){
 let within=false;const [x,y]=point;
 for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)within=!within;
 }
 return within;
}
function pathData(geometry,view){
 const project=([x,y])=>[(x-view.box[0])/(view.box[2]-view.box[0])*W,H-(y-view.box[1])/(view.box[3]-view.box[1])*H];
 const polygons=[];
 for(const ring of pointsOf(geometry)){
  const local=localRing(ring,view.longitude),b=bounds([local]);
  if(b[2]<view.box[0]||b[0]>view.box[2]||b[3]<view.box[1]||b[1]>view.box[3])continue;
  const clipped=clip(local,view.box).map(project);
  if(clipped.length<3||area(clipped)<.2)continue;
  polygons.push(simplify(clipped));
 }
 return {d:polygons.map(p=>'M'+p.map(([x,y])=>`${number(x)},${number(y)}`).join('L')+'Z').join(''),polygons};
}
function projectedPoint([lon,lat],view){while(lon-view.longitude>180)lon-=360;while(lon-view.longitude< -180)lon+=360;return [(lon-view.box[0])/(view.box[2]-view.box[0])*W,H-(lat-view.box[1])/(view.box[3]-view.box[1])*H]}
function wrap(text,max=24){const lines=[''];for(const word of text.split(' ')){const last=lines.length-1;if(lines[last]&&lines[last].length+word.length+1>max)lines.push(word);else lines[last]+=(lines[last]?' ':'')+word}return lines.slice(0,3)}
// Conservative Arial metrics keep labels apart without introducing a browser build dependency.
function textWidth(text,size){return [...text].reduce((sum,c)=>sum+(c===' '?.3:/[ilI.,'|]/.test(c)?.3:/[MW@]/.test(c)?.94:/[A-Z0-9]/.test(c)?.7:.59)*size,0)+4}
const pinPath='M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z';
function render(place,features,data){
 const view=viewport(place,features,data.states),statePaths=data.states.map(s=>({...s,...pathData(s.geometry,view)})).filter(s=>s.d);
 const map=[];
 const shape=(geometry,fill,stroke='none',strokeWidth=0)=>{const {d}=pathData(geometry,view);if(d)map.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" fill-rule="evenodd"/>`)};
 for(const land of data.land)shape(land.geometry,'#f5f1e5');
 for(const state of statePaths){const focus=place.code!=='yell'&&place.states.includes(state.properties.STUSAB);map.push(`<path d="${state.d}" fill="${focus?'#e0e8d3':'#f3f0e4'}" stroke="#a6afa1" stroke-width=".9" fill-rule="evenodd"/>`)}
 for(const lake of data.lakes)shape(lake.geometry,'#dfedf0');
 if(place.code==='yell')for(const boundary of data.yellowstone)shape(boundary.geometry,'#b9cda2','#839877',1.3);
 const labels=[];
 const points=features.map(f=>projectedPoint(f.geometry.coordinates,view)).filter(([x,y])=>x>12&&x<W-12&&y>14&&y<H-18);
 // State label placements are typographic anchors only; all outlines and pins use source geometry.
 const custom=place.code==='yell'?{MT:[-109.15,45.97],WY:[-108.62,43.48],ID:[-112.53,43.9]}:place.code==='mocr'?{NC:[-79.55,35.85],SC:[-80.76,33.65]}:{};
 const reserved=[[8,H-44,140,38]];
 const pinRects=points.map(([x,y])=>[x-11,y-23,22,24]);
 const overlaps=(x,y,w,h,boxes=reserved)=>boxes.some(([rx,ry,rw,rh])=>x+w>rx-5&&x<rx+rw+5&&y+h>ry-5&&y<ry+rh+5);
 if(features.length){
  const primary=points[0];
  if(primary){
   const [x,y]=primary,title=place.code==='yell'?['Yellowstone','National Park']:place.code==='mocr'?['Moores Creek','National Battlefield']:wrap(place.title.replace(/ National /,'\nNational ').replace(/\n/g,' '),22);
   const width=Math.max(...title.map(t=>textWidth(t,16))),height=title.length*20;
   const naturalY=Math.max(23,Math.min(H-37-height,y-10));
   const candidates=[[x+17,naturalY],[x-width-17,naturalY],[x-width/2,y-height-20],[x-width/2,y+24]].map(([tx,ty])=>[Math.max(8,Math.min(W-width-8,tx)),Math.max(23,Math.min(H-height-24,ty))]);
   const [tx,ty]=candidates.find(([cx,cy])=>!overlaps(cx,cy-16,width,height,[...pinRects,...reserved]))||candidates[0];
   reserved.push([tx,ty-16,width,height]);
   labels.push(`<text class="park-label" x="${number(tx)}" y="${number(ty)}">${title.map((line,i)=>`<tspan x="${number(tx)}" dy="${i?20:0}">${esc(line)}</tspan>`).join('')}</text>`);
  }
 }
 reserved.push(...pinRects);
 for(const state of statePaths.sort((a,b)=>Number(place.states.includes(b.properties.STUSAB))-Number(place.states.includes(a.properties.STUSAB))||Math.max(...b.polygons.map(area))-Math.max(...a.polygons.map(area)))){
  const code=state.properties.STUSAB,isSelected=place.states.includes(code);
  if(place.code==='yell'&&!custom[code]||place.code==='mocr'&&!custom[code])continue;
  const largest=state.polygons.slice().sort((a,b)=>area(b)-area(a))[0];
  if(!largest||area(largest)<(isSelected?700:4200))continue;
  let [x,y]=custom[code]?projectedPoint(custom[code],view):projectedPoint([Number(state.properties.INTPTLON),Number(state.properties.INTPTLAT)],view);
  if(x<25||x>W-25||y<20||y>H-34){const b=bounds([largest]);x=(b[0]+b[2])/2;y=(b[1]+b[3])/2}
  const name=code==='DC'?'D.C.':state.properties.NAME.toUpperCase(),w=textWidth(name,15);
  const valid=(cx,cy)=>cx-w/2>=8&&cx+w/2<=W-8&&cy>=20&&cy<=H-38&&[-.5,0,.5].every(dx=>[-15,-6,3].every(dy=>inside([cx+dx*w,cy+dy],state.polygons)))&&!overlaps(cx-w/2,cy-15,w,18);
  if(!valid(x,y)){
   // A clipped polygon's bounding-box center can fall in a neighboring state or a hole.
   // Seek an actual interior label anchor, then omit labels without a collision-free home.
   const candidates=[];
   for(let cy=24;cy<H-38;cy+=20)for(let cx=20;cx<W-20;cx+=20)if(valid(cx,cy))candidates.push([cx,cy]);
   candidates.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));
   if(!candidates.length)continue;
   [x,y]=candidates[0];
  }
  reserved.push([x-w/2,y-15,w,18]);
  labels.unshift(`<text class="state-label" x="${number(x)}" y="${number(y)}" text-anchor="middle">${esc(name)}</text>`);
 }
 for(const [x,y] of points)map.push(`<svg x="${number(x-11)}" y="${number(y-22)}" width="22" height="24" viewBox="0 0 256 256"><path d="${pinPath}" fill="#c74737" stroke="#fff" stroke-width="9"/></svg>`);
 const milesAcross=(view.box[2]-view.box[0])*cos(view.latitude)*69.0934;
 const desired=milesAcross*.23,scaleMiles=[1,2,5,10,20,25,50,100,200,500,1000,2000].filter(n=>n<=desired).at(-1)||1,scaleWidth=scaleMiles/milesAcross*W;
 const scale=`<g class="scale" transform="translate(14 ${H-18})"><path d="M0,-5V0H${number(scaleWidth)}V-5${scaleWidth>=64?`M${number(scaleWidth/2)},-3V0`:''}" fill="none" stroke="#59605a"/><text x="0" y="-9">0</text>${scaleWidth>=64?`<text x="${number(scaleWidth/2)}" y="-9" text-anchor="middle">${scaleMiles/2}</text>`:''}<text x="${number(scaleWidth)}" y="-9" text-anchor="middle">${scaleMiles}</text><text x="${number(scaleWidth+22)}" y="-9">mi</text></g>`;
 const kind=features.length?'park':'state-context';
 const alt=features.length?`Locator map of ${place.title}; red marker${features.length>1?'s show NPS administrative centers':' shows the NPS administrative center'}${place.code==='yell'?'; green outline shows the park boundary':''}.`:`State context map for ${place.states.join(', ')}; an exact park location is not shown.`;
 return {alt,kind,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title description"><title id="title">${esc(place.title)} locator</title><desc id="description">${esc(alt)} Geography: NPS Land Resources Division, U.S. Census Bureau, Natural Earth. Regional orientation, not entrance directions.</desc><style>text{font-family:Arial,Helvetica,sans-serif;fill:#394338}.state-label{font-size:15px;letter-spacing:.25px;paint-order:stroke;stroke:#f4f1e7;stroke-width:3px;stroke-linejoin:round}.park-label{font-size:16px;font-weight:600;paint-order:stroke;stroke:#f6f3e9;stroke-width:3px;stroke-linejoin:round}.scale text{font-size:14px}</style><rect width="${W}" height="${H}" fill="#dfedf0"/>${map.join('')}${labels.join('')}${scale}</svg>\n`};
}
export function buildLocatorMaps(){
 const data={states:read('states.geojson').features,land:read('land.geojson').features,lakes:read('lakes.geojson').features,yellowstone:read('yellowstone-boundary.geojson').features};
 const centroids=read('nps-centroids.geojson').features,catalogue=JSON.parse(fs.readFileSync(path.join(root,'data/catalogue.json'))),maps={parks:{},states:{}};
 fs.mkdirSync(output,{recursive:true});
 const normalized=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const place of catalogue){
  const matches=centroids.filter(f=>f.properties.UNIT_CODE.toLowerCase()===place.code.toLowerCase());
  const named=matches.filter(f=>normalized(f.properties.UNIT_NAME)===normalized(place.title));
  const features=named.length?named:matches;
  const result=render(place,features,data),file=`${place.code}.svg`;
  fs.writeFileSync(path.join(output,file),result.svg);
  maps.parks[place.code]={image:'/maps/locators/'+file,alt:result.alt,source:features.length?npsSource+'/0':censusSource,label:features.length?'Locator map':'State context',kind:result.kind,coordinates:features.map(f=>f.geometry.coordinates)};
 }
 for(const state of data.states){
  const code=state.properties.STUSAB,place={code:'state-'+code,title:state.properties.NAME,states:[code]},result=render(place,[],data),file=`state-${code.toLowerCase()}.svg`;
  fs.writeFileSync(path.join(output,file),result.svg);
  maps.states[code]={image:'/maps/locators/'+file,alt:result.alt,source:censusSource,label:'State context',kind:'state-context'};
 }
 fs.writeFileSync(path.join(root,'data/locator-maps.json'),JSON.stringify(maps,null,2)+'\n');
 console.log(`Generated ${Object.keys(maps.parks).length} park locators and ${Object.keys(maps.states).length} state-context maps.`);
 return maps;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildLocatorMaps();
