// One entry point for navigation, search, and the current page's authoring controls.
const make=(tag,text,attrs={})=>{const node=document.createElement(tag);if(text)node.textContent=text;for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node};
let palette,searchIndex,indexPromise;
const shortcut=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘K':'Ctrl+K';
const trigger=make('button','Search & actions '+shortcut,{type:'button',class:'command-trigger','aria-haspopup':'dialog'});
(document.querySelector('.header-controls')||document.querySelector('.editor-header')||document.querySelector('header'))?.append(trigger);
const navigate=url=>{const target=new URL(url,location.origin);if(target.origin===location.origin)location.assign(target.href)};
function reveal(node){for(let p=node.parentElement;p;p=p.parentElement)if(p.matches('details'))p.open=true;node.scrollIntoView({block:'center'});node.focus()}
function pageCommands(){
 const commands=[['Regions','/'],['All places','/places/'],['Trips','/trips/'],['About','/about/'],['Add trip','/edit/?new=trip'],['Add place','/edit/?new=place'],['Open editor','/edit/']].map(([label,url])=>({label,group:'Navigation',run:()=>navigate(url)}));
 for(const node of document.querySelectorAll('.page-tools a'))commands.push({label:node.textContent.trim(),group:'This page',run:()=>navigate(node.href)});
 const editor=document.querySelector('#editor-app');
 if(editor?.dataset.key)commands.push({label:'View published page',group:'This page',run:async()=>{const response=await fetch('/api/records?key='+encodeURIComponent(editor.dataset.key));if(!response.ok)throw Error('This page is not available.');navigate((await response.json()).url)}});
 const roots=[editor,document.querySelector('.editor-header'),document.querySelector('.header-controls'),...document.querySelectorAll('dialog[open]')].filter(Boolean);
 for(const root of roots)for(const node of root.querySelectorAll('button,summary,input:not([type=hidden]),select,textarea,[contenteditable=true]')){
  if(node===trigger||node.disabled||node.closest('[hidden]'))continue;
  const isField=node.matches('input,select,textarea,[contenteditable=true]');
  const label=node.getAttribute('aria-label')||node.closest('label')?.childNodes[0]?.textContent?.trim()||node.textContent.trim();if(!label)continue;
  const section=node.closest('section');const context=node.closest('[role=toolbar]')?.getAttribute('aria-label')||section?.querySelector('.visit-heading strong,h2,h3')?.textContent||'';
  commands.push({label:(isField?'Edit ':'')+label,group:context||'This page',run:()=>{reveal(node);if(!isField)node.click();else if(node.matches('input[type=file]'))node.click()}});
 }
 if(!editor)for(const node of document.querySelectorAll('main details>summary'))commands.push({label:node.textContent.trim(),group:'This page',run:()=>{node.parentElement.open=true;reveal(node)}});
 return commands;
}
function openPalette(){
 if(palette?.open){palette.querySelector('input').focus();return}
 const origin=document.activeElement;palette=make('dialog','',{class:'command-palette','aria-labelledby':'command-title'});
 const heading=make('h2','Search & actions',{id:'command-title'}),close=make('button','Close',{type:'button',class:'command-close'});
 const input=make('input','',{type:'search',placeholder:'Find a place, trip, visit, or action…',role:'combobox','aria-label':'Search places and actions','aria-controls':'command-results','aria-expanded':'true','aria-autocomplete':'list',autocomplete:'off'});
 const list=make('div','',{id:'command-results',role:'listbox','aria-label':'Search results'}),status=make('p','',{class:'command-status',role:'status'});
 const top=make('div','',{class:'command-heading'});top.append(heading,close);palette.append(top,input,status,list);document.body.append(palette);
 const dialog=palette;let selected=0,results=[],pendingAction,commands=pageCommands();
 const paint=()=>{const terms=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const matches=item=>terms.every(t=>(item.label+' '+item.group+' '+(item.text||'')).toLowerCase().includes(t));
 const pages=(searchIndex||[]).map(item=>({label:item.title,group:item.kind,text:item.text,run:()=>navigate(item.url)}));
 results=[...commands.filter(matches),...(terms.length?pages.filter(matches):[])].slice(0,60);selected=0;list.replaceChildren();
 results.forEach((item,i)=>{const row=make('div','',{id:'command-'+i,role:'option','aria-selected':i===0?'true':'false',class:'command-result'});row.append(make('span',item.label),make('small',item.group));row.addEventListener('click',()=>activate(i));list.append(row)});
 status.textContent=results.length?`${results.length} results · ↑ ↓ to choose · Enter to open`:indexPromise&&!searchIndex?'Loading site search…':'No matching actions or pages.';
 sync();
 };
 const sync=()=>{for(const [i,node]of [...list.children].entries())node.setAttribute('aria-selected',String(i===selected));if(results.length){input.setAttribute('aria-activedescendant','command-'+selected);list.children[selected]?.scrollIntoView({block:'nearest'})}else input.removeAttribute('aria-activedescendant')};
 const activate=i=>{if(!results[i])return;pendingAction=results[i];dialog.close()};
 input.addEventListener('input',paint);input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();return}if(['ArrowDown','ArrowUp','Enter'].includes(event.key)){event.preventDefault();if(event.key==='Enter')activate(selected);else if(results.length){selected=(selected+(event.key==='ArrowDown'?1:-1)+results.length)%results.length;sync()}}});
 close.onclick=()=>palette.close();palette.addEventListener('close',async()=>{dialog.remove();if(palette===dialog)palette=null;origin?.focus({preventScroll:true});if(pendingAction)try{await pendingAction.run()}catch(error){alert(error.message)}},{once:true});
 if(!searchIndex&&!indexPromise)indexPromise=fetch('/search.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{searchIndex=data}).catch(()=>{searchIndex=[]}).finally(()=>{indexPromise=null});
 indexPromise?.then(()=>{if(dialog.open)paint()});paint();palette.showModal();input.focus();
}
trigger.addEventListener('click',openPalette);
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&!event.altKey&&event.key.toLowerCase()==='k'){event.preventDefault();openPalette()}});
