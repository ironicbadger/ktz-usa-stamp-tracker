const directory=document.querySelector('.directory');
const directoryButton=document.querySelector('.directory-toggle');
const setDirectoryOpen=expanded=>{directory.classList.toggle('expanded',expanded);directoryButton.setAttribute('aria-expanded',String(expanded))};
directoryButton?.addEventListener('click',()=>setDirectoryOpen(!directory.classList.contains('expanded')));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&directory.classList.contains('expanded')){setDirectoryOpen(false);directoryButton.focus()}});
document.addEventListener('click',event=>{if(!directory.contains(event.target))setDirectoryOpen(false)});
const toggles=[...document.querySelectorAll('.tree-toggle')];
const initialOpen=new Map(toggles.map(button=>[button,button.getAttribute('aria-expanded')==='true']));
const setExpanded=(button,expanded)=>{button.setAttribute('aria-expanded',String(expanded));document.getElementById(button.getAttribute('aria-controls')).hidden=!expanded};
for(const button of toggles)button.addEventListener('click',()=>setExpanded(button,button.getAttribute('aria-expanded')!=='true'));
document.querySelector('#tree-filter')?.addEventListener('input',e=>{
 const q=e.target.value.trim().toLowerCase();let found=0;
 for(const region of document.querySelectorAll('.tree-region')){
  let count=0;const rm=region.dataset.label.toLowerCase().includes(q);
  for(const state of region.querySelectorAll('.tree-state')){
   let total=0;const sm=state.dataset.label.toLowerCase().includes(q);
   for(const site of state.querySelectorAll('.tree-site')){const match=!q||rm||sm||site.textContent.toLowerCase().includes(q);site.hidden=!match;if(match)total++}
   state.hidden=total===0;const button=state.querySelector('.tree-toggle');setExpanded(button,q?total>0:initialOpen.get(button));count+=total;
  }
  region.hidden=count===0;const button=region.querySelector('.tree-toggle');setExpanded(button,q?count>0:initialOpen.get(button));found+=count;
 }
 document.querySelector('.tree-empty').hidden=found>0;
});
document.querySelector('#collection-filter')?.addEventListener('change',e=>{let visible=0;document.querySelectorAll('.album-slot').forEach(slot=>{slot.hidden=e.target.value==='collected'?slot.dataset.collected!=='true':e.target.value==='missing'?slot.dataset.collected==='true':false;if(!slot.hidden)visible++});document.querySelector('#collection-empty').hidden=visible>0});
const form=document.querySelector('#search-form');
if(form){
 const input=document.querySelector('#search-input'),results=document.querySelector('#search-results'),status=document.querySelector('#search-status');
 const index=fetch('/search.json').then(r=>{if(!r.ok)throw Error('Search index unavailable');return r.json()});
 let request=0;
 async function search(){const revision=++request,q=input.value.trim().toLowerCase();results.replaceChildren();if(!q){status.textContent='Enter a name, state, date or note.';return}status.textContent='Searching…';try{const entries=await index;if(revision!==request)return;const terms=q.split(/\s+/),matches=entries.filter(item=>terms.every(term=>item.text.toLowerCase().includes(term)));status.textContent=`${matches.length} result${matches.length===1?'':'s'}${matches.length>100?' · showing the first 100':''}`;for(const item of matches.slice(0,100)){const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small');a.href=item.url;a.textContent=item.title;small.textContent=item.kind;li.append(a,small);results.append(li)}}catch(error){status.textContent='Search could not load. Try reloading, or browse All places.'}}
 input.value=new URLSearchParams(location.search).get('q')||'';search();input.addEventListener('input',search);form.addEventListener('submit',e=>{e.preventDefault();history.replaceState(null,'','?q='+encodeURIComponent(input.value));search()});
}
// Move existing sections, not copies, so mobile reading and keyboard order match the layout.
const placePage=document.querySelector('.place-page');
if(placePage){
 const narrow=matchMedia('(max-width: 900px)');
 const heading=placePage.querySelector('.place-heading'),overview=placePage.querySelector('.place-overview'),top=placePage.querySelector('.place-top'),rail=placePage.querySelector('.place-rail'),body=placePage.querySelector('.place-body');
 const summary=placePage.querySelector('.main-summary'),facts=placePage.querySelector('.park-facts'),collection=placePage.querySelector('#stamps'),locations=placePage.querySelector('#stamping-locations'),visits=placePage.querySelector('#visits'),notes=placePage.querySelector('#notes');
 const extra=[...overview.children].filter(e=>e!==visits&&e!==notes&&!e.classList.contains('location-summary'));
 const reflow=()=>{
  if(narrow.matches){for(const node of [heading,summary,collection,locations,visits,notes,...extra,facts])if(node)placePage.append(node)}
  else{top.prepend(heading);heading.after(rail);if(summary)rail.append(summary);rail.append(facts);for(const node of [collection,locations,visits,notes,...extra])if(node)overview.append(node)}
 };
 narrow.addEventListener('change',reflow);reflow();
}
