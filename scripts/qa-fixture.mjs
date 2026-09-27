// Isolated demo content; never writes to vault/ or dist/.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {build,root} from './build.mjs';
const vault=path.join(root,'.qa/vault'),out=path.join(root,'.qa/dist');
fs.rmSync(vault,{recursive:true,force:true});
fs.mkdirSync(vault,{recursive:true});
for(const dir of ['Places','Regions','Trips'])fs.cpSync(path.join(root,'vault',dir),path.join(vault,dir),{recursive:true});
fs.mkdirSync(path.join(vault,'Attachments'),{recursive:true});
fs.copyFileSync(path.join(root,'test/fixtures/assets/sample-stamp.png'),path.join(vault,'Attachments/sample-stamp.png'));
for(const [name,source] of [['wide','mockups/style-02-modern-docs-selected.png'],['tall','references/layout-before-mobile.png']])fs.copyFileSync(path.join(root,'docs/design',source),path.join(vault,'Attachments/qa-'+name+'.png'));
const write=(file,data,body='')=>fs.writeFileSync(path.join(vault,file),`---\n${YAML.stringify(data)}---\n${body}`);
fs.cpSync(path.join(root,'test/fixtures/assets/yellowstone'),path.join(vault,'Attachments/yellowstone'),{recursive:true});
const photo='[[Attachments/sample-stamp.png]]';
const picture=name=>`[[Attachments/yellowstone/${name}.png]]`;
const stamp=(id,name,type,location,asset,notes)=>({id,name,type,location,location_id:location.startsWith('Old Faithful')?'centre-a':'centre-b',photos:[picture(asset)],notes});
const firstStamps=[
 stamp('geyser-main','Yellowstone · geyser design','main','Old Faithful Visitor Education Center','yellowstone-main','The first page of our Yellowstone collection. Blue ink, collected before an evening walk through the basin.'),
 stamp('old-faithful-sub','Old Faithful','sub','Old Faithful Visitor Education Center','old-faithful','A memento of the eruption we waited for after dinner.'),
 stamp('prismatic-sub','Grand Prismatic Spring','sub','Old Faithful Visitor Education Center','grand-prismatic','Steam, bright colours and a very cold boardwalk.')
];
const secondStamps=[
 stamp('bison-main','Yellowstone · bison design','main','Canyon Visitor Education Center','yellowstone-bison','A second main design, added on our canyon day.'),
 stamp('canyon-sub','Grand Canyon of the Yellowstone','sub','Canyon Visitor Education Center','yellowstone-canyon','The roar of Lower Falls is the bit the photograph cannot keep.'),
 stamp('mammoth-sub','Mammoth Hot Springs','sub','Canyon Visitor Education Center','mammoth','A little reminder of the terraces and a day of wildly changing weather.')
];
const listing=items=>items.map(s=>({name:s.name,type:s.type,availability:'unknown'}));
const report=(id,visit,items,access)=>({id,origin:'authored',availability:'unknown',visit_id:visit,access,stamps:listing(items),notes:'Fictional sample report for this design preview. Designs, collection details and availability are not verified.'});
write('Places/Yellowstone National Park.md',{
 title:'Yellowstone National Park',park_code:'yell',states:['WY','MT','ID'],passport_region:'Rocky Mountain',design_preview:true,
 area:'Approx. 2.22 million acres',established:'1872-03-01',
 visits:[
 {id:'sample-visit',date:'2019-06-19',trip:'[[Trips/Design QA trip]]',notes:'### Geysers, boardwalks and an evening return\n\nWe set off from the lake after breakfast, stopped at the smaller geyser basins and made a leisurely circuit of the Old Faithful area. The book picked up its first main stamp and two substamps.\n\n**Favourite moment:** returning in the evening when the steam hung over the river and the busiest stops had gone quiet. **Weather:** cool and overcast. **Route:** Lake Yellowstone → Old Faithful → West Yellowstone.',stamps:firstStamps},
 {id:'canyon-visit',date:'2019-06-21',trip:'[[Trips/Design QA trip]]',notes:'### Canyon colours and a northern loop\n\nA second day in the park, with Lower Falls as the centrepiece and a detour north to the terraces at Mammoth. We added the bison main stamp and two more substamps, then let the wildlife stops dictate the rest of the afternoon.\n\n**Favourite moment:** that first glimpse into the yellow canyon. **Weather:** sunshine, sharp wind and a brief flurry. **Route:** West Yellowstone → Canyon Village → Mammoth → east entrance.',stamps:secondStamps}
 ],
 stamping_locations:[
 {id:'centre-a',name:'Old Faithful Visitor Education Center',maps_url:'https://www.google.com/maps/search/?api=1&query=Old+Faithful+Visitor+Education+Center',reports:[{id:'earlier-sample',origin:'imported',availability:'unknown',access:'An earlier sample listing, retained to demonstrate report history.',stamps:listing(firstStamps),source:{url:'https://www.nps.gov/yell/planyourvisit/visitorcenters.htm',checked:'2019-06-18'},notes:'Illustrative import only; the linked NPS page is general visitor-center information, not evidence for these sample stamps.'},report('onsite-a','sample-visit',firstStamps,'Sample authoring note: ask at the visitor information desk in the Old Faithful area. Confirm current stamp availability with staff.')]},
 {id:'centre-b',name:'Canyon Visitor Education Center',maps_url:'https://www.google.com/maps/search/?api=1&query=Canyon+Visitor+Education+Center',reports:[report('onsite-b','canyon-visit',secondStamps,'Sample authoring note: the information desk in Canyon Village is the starting point for this fictional collection stop.')]}
 ]
},`### Steam, yellow cliffs and the long way round

*19–21 June 2019 · A fictional diary inspired by the USA road-trip posts.*

<figure>

![[Attachments/yellowstone/artist-point.jpg|Lower Falls and the Grand Canyon of the Yellowstone, seen from Artist Point]]

<figcaption>Lower Falls from Artist Point · NPS / Diane Renkin · Public domain. <a href="https://npgallery.nps.gov/AssetDetail/5a670eaa-1dd8-b71b-0b6d-9271ae453304">Photo source</a></figcaption>
</figure>

We arrived with a route neatly marked on the map. By lunchtime the map was mostly a suggestion. Every short drive seemed to acquire another stop: a ribbon of steam beyond the trees, a glimpse of movement in the grass, a boardwalk that looked too interesting to pass. The stamp book was supposed to be a quick errand. It became an excuse to slow down and ask what was worth seeing nearby.

Old Faithful was the obvious event, but the quieter corners of the geyser basins stayed with me just as much. Pale ground, deep blue water and clouds building behind the pines made the whole place feel slightly unreal. We collected our first stamps, escaped for something to eat and came back later. The evening version of the park felt like a different place: fewer voices, cool air, and steam drifting across the view.

On the second visit we traded hot pools for the canyon. Nothing on the approach quite prepared us for the drop at Artist Point. The river looked impossibly small below the walls, then Lower Falls supplied the scale. I took the photograph, put the camera away, and stood there for another few minutes. Some views deserve longer than the time needed to prove you were there.

The northern loop added terraces, wildlife watching and a reminder that June does not guarantee summer weather here. We ended up rummaging for another layer before the sky brightened again. By the time we turned towards the exit, the itinerary had thoroughly unravelled. Six impressions in the book, two very full days, and several good reasons to come back. Next time I would leave even more of the day unplanned.

**Inspiration:** [The Yellowstone Geyser Basins](https://blog.ktz.me/the-yellowstone-geyser-basins/), [Grand Canyon of the Yellowstone](https://blog.ktz.me/grand-canyon-of-the-yellowstone/) and [Bears, Otters, Wolves and Mammoths](https://blog.ktz.me/bears-otters-wolves-and-mammoths/). This is newly written sample text, not a quotation or a claim about your actual visits.

**Park facts:** [National Park Service](https://www.nps.gov/yell/planyourvisit/parkfacts.htm).
`);
write('Trips/Design QA trip.md',{title:'USA road trip 2019 · sample'},'A fictional two-stop Yellowstone chapter for the design preview, inspired by the [2019 road-trip journal](https://blog.ktz.me/tag/usa-roadtrip-2019/). The visits and stamps below are illustrative. [[Places/Yellowstone National Park]]');
write('Places/QA long name.md',{title:'An exceptionally long place name for responsive testing across narrow screens and large text settings',states:['WY'],passport_region:'Western',visits:[{date:'2026-09-20',stamps:[{name:'Wide image geometry fixture',type:'main',photos:['[[Attachments/qa-wide.png]]']},{name:'Tall image geometry fixture',type:'main',photos:['[[Attachments/qa-tall.png]]']}]}],area:'A long author-supplied area with units for layout testing',established:'1900-01-01',map:photo},'Isolated fixture for optional metadata and a map attachment. The test image is not a real locator map.');
build({vault,out});
console.log('Isolated QA preview: node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767');
