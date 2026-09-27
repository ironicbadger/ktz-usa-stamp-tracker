const directory=document.querySelector('.directory');
const directoryButton=document.querySelector('.directory-toggle');
const setDirectoryOpen=expanded=>{directory.classList.toggle('expanded',expanded);directoryButton.setAttribute('aria-expanded',String(expanded))};
const directoryNarrow=matchMedia('(max-width: 1279px)');
setDirectoryOpen(!directoryNarrow.matches);
directoryNarrow.addEventListener('change',()=>setDirectoryOpen(!directoryNarrow.matches));
document.querySelector('.directory-close')?.addEventListener('click',()=>{setDirectoryOpen(false);directoryButton.focus()});
directoryButton?.addEventListener('click',()=>setDirectoryOpen(!directory.classList.contains('expanded')));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&directory.classList.contains('expanded')){setDirectoryOpen(false);directoryButton.focus()}});

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
// Move the original sections so reading and keyboard order follow the mobile layout.
const placePage=document.querySelector('.place-page');
if(placePage){
 const narrow=matchMedia('(max-width: 720px)');
 const overview=placePage.querySelector('.place-overview'),rail=placePage.querySelector('.place-rail');
 const album=placePage.querySelector('#stamps'),facts=placePage.querySelector('#park-facts');
 const notes=placePage.querySelector('#notes'),visits=placePage.querySelector('#visits'),associations=placePage.querySelector('#associations'),locations=placePage.querySelector('#stamping-locations'),collection=placePage.querySelector('#cancellation-details');
 const extra=[...overview.children].filter(el=>![notes,visits,associations,locations,collection].includes(el));
 const reflow=()=>{
  if(narrow.matches){for(const node of [album,collection,locations,visits,associations,notes,...extra,facts])if(node)placePage.append(node)}
  else{for(const node of [album,facts])if(node)rail.append(node);for(const node of [notes,visits,associations,locations,collection,...extra])if(node)overview.append(node)}
 };
 narrow.addEventListener('change',reflow);reflow();
}
// Deep links reveal their parent disclosures before scrolling to a record.
function revealHash(){
 let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
 if(!id)return;
 const target=document.getElementById(id);if(!target)return;
 if(target.matches('details'))target.open=true;
 for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.matches('details'))parent.open=true;
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealHash);
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(link&&link.hash===location.hash)requestAnimationFrame(revealHash);
});
revealHash();
