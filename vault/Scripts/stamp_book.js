// Templater user script. Uses Obsidian's native YAML writer; authors never edit IDs.
module.exports = async function(tp, action) {
 const app=tp.app,notice=message=>new tp.obsidian.Notice(message);
 const prompt=async(label,value='',multiline=false)=>{const result=await tp.system.prompt(label,value,false,multiline);if(result===null||result===undefined)throw Error('cancelled');return result};
 const choose=async(labels,values,label)=>{const result=await tp.system.suggester(labels,values,false,label);if(result===null||result===undefined)throw Error('cancelled');return result};
 const safeName=name=>name.trim().replace(/[<>:"/\\|?*\[\]#]/g,'-').replace(/\.+$/,'');
 const createTrip=async(name)=>{const file=`Trips/${safeName(name)}.md`;if(!app.vault.getAbstractFileByPath(file))await app.vault.create(file,`---\ntitle: ${JSON.stringify(name.trim())}\n---\n`);return file};
 try {
  if(action==='trip'){
   const name=(await prompt('Trip name')).trim();if(!safeName(name)){notice('Enter a trip name.');return}
   tp.hooks.on_all_templates_executed(async()=>{const file=await createTrip(name);await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(file))});return;
  }
  const file=tp.config.target_file;
  if(!file?.path.startsWith('Places/')){notice('Open a place note first.');return}
  const raw=await app.vault.read(file),match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if(!match){notice('This note has no frontmatter.');return}
  const current=tp.obsidian.parseYaml(match[1]);
  const visits=current.visits||[];
  const chooseTrip=async(previous)=>{
   const files=app.vault.getMarkdownFiles().filter(f=>f.path.startsWith('Trips/'));
   const options=['No trip','Create a trip',...files.map(f=>f.basename)];
   const value=await choose(options,['',':new',...files.map(f=>`[[${f.path.slice(0,-3)}]]`)],'Trip (optional)'+(previous?' — currently '+previous:''));
   if(value!==':new')return {link:value};
   const name=(await prompt('Trip name')).trim();if(!safeName(name))throw Error('Enter a trip name.');
   return {link:`[[Trips/${safeName(name)}]]`,name};
  };
  const selectVisit=()=>choose(visits.map((v,i)=>`${v.date}${v.trip?' · '+v.trip.slice(8,-2):''} · ${i+1}`),visits.map((_,i)=>i),'Choose the visit');
  const commit=(callback)=>tp.hooks.on_all_templates_executed(async()=>{try{await app.fileManager.processFrontMatter(file,callback);notice('Saved.')}catch(error){notice(error.message)}});
  const checked=(fm,index)=>{if(JSON.stringify(fm.visits?.[index])!==JSON.stringify(visits[index]))throw Error('This visit changed while the prompts were open. Please try again.');return fm.visits[index]};
  if(action==='visit'||action==='edit-visit'){
   if(action==='edit-visit'&&!visits.length){notice('No visits to edit.');return}
   const index=action==='edit-visit'?await selectVisit():null,old=index===null?{}:visits[index];
   const date=await prompt('Visit date (YYYY-MM-DD)',old.date||tp.date.now('YYYY-MM-DD'));
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date){notice('Enter a real date in YYYY-MM-DD format.');return}
   const trip=await chooseTrip(old.trip),notes=await prompt('Visit notes (optional)',old.notes||'',true);
   // Wait until Templater finishes writing its empty insertion before updating YAML.
   tp.hooks.on_all_templates_executed(async()=>{
    try {if(trip.name)await createTrip(trip.name);await app.fileManager.processFrontMatter(file,fm=>{
     fm.visits??=[];const visit=index===null?{stamps:[]}:checked(fm,index);
     visit.date=date;visit.notes=notes;if(trip.link)visit.trip=trip.link;else delete visit.trip;
     if(index===null)fm.visits.push(visit);
    });notice('Visit saved. Use Add stamp to record its stamps.')}catch(error){notice(error.message)}
   });return;
  }
  if(!visits.length){notice('Use Record visit first.');return}
  const index=await selectVisit();
  if(action==='stamp'){
   const type=await choose(['Main stamp','Substamp'],['main','sub'],'Stamp type');
   const name=(await prompt('Stamp name',type==='main'?current.title:'')).trim();if(!name){notice('Enter a stamp name.');return}
   const location=await prompt('Stamp location (optional)'),notes=await prompt('Stamp notes (optional)','',true);
   const photos=app.vault.getFiles().filter(f=>f.path.startsWith('Attachments/')&&/\.(png|jpe?g|webp|gif|avif)$/i.test(f.path));
   const selected=photos.length?await tp.system.multi_suggester(f=>f.path.slice(12),photos,false,'Select photos, or confirm with none'):[];
   if(selected===null)return;
   const stamp={name,type,location,photos:selected.map(f=>`[[${f.path}]]`),notes};
   commit(fm=>{checked(fm,index).stamps.push(stamp)});return;
  }
  if(action==='photos'){
   const records=visits[index].stamps;if(!records.length){notice('No stamps on this visit.');return}
   const which=await choose(records.map(s=>`${s.name} · ${s.type} · ${s.location||''}`),records.map((_,i)=>i),'Choose the stamp');
   const photos=app.vault.getFiles().filter(f=>f.path.startsWith('Attachments/')&&/\.(png|jpe?g|webp|gif|avif)$/i.test(f.path));
   if(!photos.length){notice('Copy photos into Attachments first.');return}
   const selected=await tp.system.multi_suggester(f=>f.path.slice(12),photos,false,'Select photos to add');if(selected===null)return;
   commit(fm=>{const stamp=checked(fm,index).stamps[which];stamp.photos=[...new Set([...stamp.photos,...selected.map(f=>`[[${f.path}]]`)])]});
  }
 }catch(error){if(error.message!=='cancelled')notice(error.message)}
};
