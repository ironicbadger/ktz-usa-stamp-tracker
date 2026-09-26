const directory=document.querySelector('.directory');
document.querySelector('.directory-toggle')?.addEventListener('click',e=>{const expanded=directory.classList.toggle('expanded');e.currentTarget.setAttribute('aria-expanded',String(expanded))});
const details=[...document.querySelectorAll('.place-tree details')];
const initialOpen=new Map(details.map(d=>[d,d.open]));
document.querySelector('#tree-filter')?.addEventListener('input',e=>{
 const q=e.target.value.trim().toLowerCase();let found=0;
 for(const region of document.querySelectorAll('.tree-region')){
  let count=0;const rm=region.dataset.label.toLowerCase().includes(q);
  for(const state of region.querySelectorAll('.tree-state')){
   let total=0;const sm=state.dataset.label.toLowerCase().includes(q);
   for(const site of state.querySelectorAll('.tree-site')){const match=!q||rm||sm||site.textContent.toLowerCase().includes(q);site.hidden=!match;if(match)total++}
   state.hidden=total===0;state.open=q?total>0:initialOpen.get(state);count+=total;
  }
  region.hidden=count===0;region.open=q?count>0:initialOpen.get(region);found+=count;
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
