import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const out=path.resolve('.qa/screenshots');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch(process.env.QA_CHROME==='1'?{channel:'chrome'}:{});
const context=await browser.newContext({viewport:{width:1435,height:1096},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const base=process.env.QA_URL||'http://localhost:8767';const results=[];
const record=(name,data={})=>results.push({name,...data});
const noOverflow=async()=>{const v=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert.ok(v.scroll<=v.client,JSON.stringify(v));return v};
const axe=async(name)=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();record(name,{violations:a.violations});assert.equal(a.violations.length,0,JSON.stringify(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))))};
try{
 await page.goto(base+'/places/yellowstone-national-park/');await page.locator('.main-summary img').first().waitFor();
 const sizes=await page.evaluate(()=>({rail:document.querySelector('.place-rail').getBoundingClientRect().width,directory:document.querySelector('.directory').getBoundingClientRect().width,images:[...document.querySelectorAll('.main-summary img')].map(i=>({width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})),fonts:{body:getComputedStyle(document.body).fontSize,nav:getComputedStyle(document.querySelector('.place-tree')).fontSize}}));
 assert.equal(await page.locator('img').filter({visible:true}).evaluateAll(images=>images.filter(i=>i.loading!=='lazy'&&(!i.complete||!i.naturalWidth)).length),0);assert.equal(sizes.rail,250);assert.ok(sizes.directory<=48);for(const i of sizes.images){assert.ok(i.width<=80);assert.ok(Math.abs(i.width/i.height-i.naturalWidth/i.naturalHeight)<0.01)}record('desktop dimensions',sizes);
 await noOverflow();await page.screenshot({path:path.join(out,'desktop-place.png')});await axe('desktop accessibility');
 await page.locator('#stamps').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'desktop-collection.png')});
 await page.getByRole('link',{name:'Stamping locations',exact:true}).click();assert.equal(new URL(page.url()).hash,'#stamping-locations');await page.screenshot({path:path.join(out,'desktop-locations.png')});
 const history=page.locator('.report-history').first();await history.locator('summary').click();assert.equal(await history.getAttribute('open'),'');assert.ok(await history.getByText('Imported listing',{exact:false}).isVisible());record('location history disclosure');
 await page.locator('#location-centre-a').getByRole('link',{name:'September 25, 2026',exact:true}).click();assert.equal(new URL(page.url()).hash,'#visit-sample-visit');
 await page.locator('#visit-sample-visit').getByRole('link',{name:'Design QA trip',exact:true}).click();await page.waitForURL('**/trips/design-qa-trip/');assert.equal(await page.locator('.trip-stamp').count(),5);record('observation → visit → trip');
 await page.goto(base+'/regions/rocky-mountain/');await page.locator('#collection-filter').selectOption('collected');assert.equal(await page.locator('.album-slot:visible').count(),1);await page.locator('#collection-filter').selectOption('missing');assert.ok(await page.locator('.album-slot:visible').count()>1);record('region filters');await page.screenshot({path:path.join(out,'desktop-region.png')});await axe('region accessibility');
 await page.goto(base+'/search/?q=wildlife');await page.waitForFunction(()=>document.querySelector('#search-status').textContent.includes('result'));assert.ok(await page.locator('#search-results li').count()>0);record('stamp and location search');await axe('search accessibility');
 await page.goto(base+'/places/yellowstone-national-park/');const before=await page.locator('main').boundingBox();await page.getByRole('button',{name:'Browse places',exact:true}).click();assert.deepEqual(await page.locator('main').boundingBox(),before);await page.locator('#tree-filter').fill('Yellowstone');assert.equal(await page.locator('.tree-site:visible').count(),3);await page.locator('#tree-filter').fill('not-a-park');assert.ok(await page.locator('.tree-empty').isVisible());await page.locator('#tree-filter').fill('');await page.keyboard.press('Escape');assert.equal(await page.locator('.directory-toggle').getAttribute('aria-expanded'),'false');assert.ok(await page.locator('.directory-toggle').evaluate(e=>e===document.activeElement));record('directory drawer, filter, Escape and focus');
 // Keyboard skip link and an ordinary link must have a visible focus indicator.
 await page.goto(base+'/places/yellowstone-national-park/');await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to content');const focus=await page.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle);assert.notEqual(focus,'none');await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#content');record('keyboard skip link and focus');
 for(const width of [320,390,768,1024,1435]){
  await page.setViewportSize({width,height:width<500?844:1096});await page.goto(base+'/places/yellowstone-national-park/');record('viewport '+width,await noOverflow());
  if(width<=900){const order=await page.locator('.main-summary,#stamps,#stamping-locations,#visits,#notes,.park-facts').evaluateAll(es=>es.map(e=>e.id));assert.deepEqual(order,['main-stamps','stamps','stamping-locations','visits','notes','park-facts']);const ys=await page.locator('.main-summary,#stamps,.park-facts').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.ok(ys[0]<ys[1]&&ys[1]<ys[2])}
  if(width===390){
   await page.screenshot({path:path.join(out,'mobile-place.png')});await axe('mobile accessibility');
   await page.getByRole('button',{name:'Browse places',exact:true}).click();assert.equal(await page.locator('.directory-toggle').getAttribute('aria-expanded'),'true');await page.locator('#tree-filter').fill('Yellowstone');assert.equal(await page.locator('.tree-site:visible').count(),3);await page.getByRole('button',{name:'Browse places',exact:true}).click();await page.getByRole('link',{name:'Stamps',exact:true}).click();await page.screenshot({path:path.join(out,'mobile-collection.png')});record('mobile directory and section links');
  }
  if(width===768)await page.screenshot({path:path.join(out,'tablet-place.png')});
  await page.goto(base+'/places/qa-long-name/');await noOverflow();const aspect=await page.locator('.main-summary img').evaluateAll(images=>images.map(i=>({w:i.width,h:i.height,nw:i.naturalWidth,nh:i.naturalHeight})));for(const i of aspect){assert.ok(i.w<=200);assert.ok(Math.abs(i.w/i.h-i.nw/i.nh)<0.02)}await page.locator('#park-facts').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.locator-map')?.naturalWidth>0);assert.ok(await page.locator('.locator-map').isVisible());
 }
 // 200% desktop zoom reflows to an equivalent 718 CSS px viewport.
 await page.setViewportSize({width:718,height:548});await page.goto(base+'/places/yellowstone-national-park/');await noOverflow();record('200% desktop reflow equivalent');
 await page.setViewportSize({width:1435,height:1096});await page.goto('http://localhost:8766/places/yellowstone-national-park/');assert.equal(await page.locator('.stamp').count(),0);assert.equal(await page.locator('.location').count(),0);assert.equal(await page.locator('.main-summary').count(),0);await page.screenshot({path:path.join(out,'desktop-blank.png')});record('real vault remains blank');await axe('blank accessibility');
 assert.deepEqual(errors,[]);record('browser errors',{errors});
 console.log(JSON.stringify({passed:true,results},null,2));
}finally{fs.writeFileSync(path.resolve('.qa/browser-results.json'),JSON.stringify({results,errors},null,2));await browser.close()}
