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
  const locations=current.stamping_locations||[];
  const cancellations=current.stamps||[];
  const copy=value=>JSON.parse(JSON.stringify(value));
  const draftVisits=copy(visits),draftLocations=copy(locations),draftCancellations=copy(cancellations);
  let cancellationsChanged=false;
  const identity=()=>crypto.randomUUID();
  const realDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  const httpURL=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}};
  const statuses=['available','seasonal','unavailable','moved','unknown'];
  const statusLabels=['Available','Seasonal','No longer available','Moved','Unknown'];
  const saveDraft=()=>commit(fm=>{
   if(JSON.stringify(fm.visits||[])!==JSON.stringify(visits)||JSON.stringify(fm.stamping_locations||[])!==JSON.stringify(locations)||JSON.stringify(fm.stamps)!==JSON.stringify(current.stamps))throw Error('Visits, locations or expected cancellations changed while the prompts were open. Please try again.');
   fm.visits=draftVisits;
   if(draftLocations.length)fm.stamping_locations=draftLocations;
   if(cancellationsChanged)fm.stamps=draftCancellations;
  });
  const cancellationKey=stamp=>`${stamp.type||'main'}\u0000${stamp.name.trim().toLowerCase()}`;
  const manageCancellation=record=>{
   record.id??=identity();cancellationsChanged=true;
   // Link unambiguous old impressions before a cancellation is renamed. Their
   // original name, date, photos and impression anchors remain unchanged.
   if(draftCancellations.filter(s=>cancellationKey(s)===cancellationKey(record)).length===1){
    for(const visit of draftVisits)for(const stamp of visit.stamps)if(!stamp.cancellation_id&&cancellationKey(stamp)===cancellationKey(record))stamp.cancellation_id=record.id;
   }
   return record;
  };
  const editCancellation=async(existing)=>{
   const type=await choose(['Main stamp','Substamp'],['main','sub'],'Cancellation type'+(existing?' — currently '+(existing.type||'main'):''));
   const name=(await prompt('Cancellation name',existing?.name||(type==='main'?current.title:''))).trim();
   if(!name)throw Error('Enter a cancellation name.');
   if(draftCancellations.some(s=>s!==existing&&cancellationKey(s)===cancellationKey({name,type})))throw Error('That cancellation already exists. Choose it from the list.');
   const record=existing||{id:identity(),name,type};
   if(existing)manageCancellation(record);else draftCancellations.push(record);
   record.name=name;record.type=type;
   return manageCancellation(record);
  };
  if(action==='cancellations'){
   while(true){
    const selected=await choose(['Save expected list','Add an expected cancellation',...draftCancellations.map(s=>`${s.name} · ${s.type||'main'}`)],[':done',':new',...draftCancellations.map((_,i)=>i)],'Expected cancellations — these do not record a collection');
    if(selected===':done')break;
    await editCancellation(selected===':new'?null:draftCancellations[selected]);
   }
   for(const record of draftCancellations)manageCancellation(record);
   cancellationsChanged=true;saveDraft();return;
  }
  const editLocation=async(existing,observationIndex)=>{
   const old=existing?(existing.reports.filter(r=>r.origin==='authored').at(-1)||existing.reports.at(-1)):{};
   const name=(await prompt('Stamping location name',existing?.name||'')).trim();
   if(!name)throw Error('Enter a location name.');
   if(draftLocations.some(l=>l!==existing&&[l.name,...(l.aliases||[])].some(n=>n.toLowerCase()===name.toLowerCase())))throw Error('That location name already exists. Choose it from the list.');
   const maps=(await prompt('Google Maps link (optional)',existing?.maps_url||'')).trim();
   if(maps&&!httpURL(maps))throw Error('Enter an HTTP(S) maps link.');
   const availability=await choose(statusLabels,statuses,'Location availability — currently '+(old.availability||'unknown'));
   const access=await prompt('Where to find the stamps / access notes',old.access||'',true);
   const available=copy(old.stamps||[]);
   while(true){
    const choice=await choose(['Finish stamp list','Add an available stamp',...available.map(s=>s.name)],[':done',':add',...available.map((_,i)=>i)],'Stamps available here');
    if(choice===':done')break;
    const previous=choice===':add'?{}:available[choice];
    if(choice!==':add'&&await choose(['Edit this stamp','Remove from current listing'],['edit','remove'],'Update '+previous.name)==='remove'){available.splice(choice,1);continue}
    const stampName=(await prompt('Available stamp name',previous.name||'')).trim();if(!stampName)throw Error('Enter a stamp name.');
    const type=await choose(['Main stamp','Substamp'],['main','sub'],'Available stamp type');
    const state=await choose(statusLabels,statuses,'Stamp availability — currently '+(previous.availability||availability));
    const stamp={name:stampName,type,availability:state};
    if(choice===':add')available.push(stamp);else available[choice]=stamp;
   }
   const kind=await choose(['Observed on a visit','Published website'],['visit','source'],'How do you know?');
   const report={id:identity(),origin:'authored',availability,access,stamps:available};
   if(kind==='visit'){
    if(!draftVisits.length)throw Error('Record a visit first, or use a published website source.');
    const visitIndex=observationIndex??await selectVisit();
    draftVisits[visitIndex].id??=identity();report.visit_id=draftVisits[visitIndex].id;
   }else{
    const url=(await prompt('Source URL',old.source?.url||'')).trim();if(!httpURL(url))throw Error('Enter an HTTP(S) source URL.');
    const checked=await prompt('Date checked (YYYY-MM-DD)',tp.date.now('YYYY-MM-DD'));if(!realDate(checked))throw Error('Enter a real checked date.');
    report.source={url,checked};
   }
   report.notes=await prompt('Availability changes / additional notes',old.notes||'',true);
   const location=existing||{id:identity(),name,reports:[]};
   if(existing&&name!==existing.name)location.aliases=[...new Set([...(existing.aliases||[]),existing.name])];
   location.name=name;if(maps)location.maps_url=maps;else delete location.maps_url;
   location.reports.push(report);if(!existing)draftLocations.push(location);
   return location;
  };
  if(action==='location'){
   const selected=await choose(['Add a location',...locations.map(l=>l.name)],[':new',...locations.map((_,i)=>i)],'Add or update a stamping location');
   await editLocation(selected===':new'?null:draftLocations[selected]);saveDraft();return;
  }
  if(action==='visit'||action==='edit-visit'){
   if(action==='edit-visit'&&!visits.length){notice('No visits to edit.');return}
   const index=action==='edit-visit'?await selectVisit():null,old=index===null?{}:visits[index];
   const date=await prompt('Visit date (YYYY-MM-DD)',old.date||tp.date.now('YYYY-MM-DD'));
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date){notice('Enter a real date in YYYY-MM-DD format.');return}
   const trip=await chooseTrip(old.trip),notes=await prompt('Visit notes (optional)',old.notes||'',true);
   // Wait until Templater finishes writing its empty insertion before updating YAML.
   tp.hooks.on_all_templates_executed(async()=>{
    try {if(trip.name)await createTrip(trip.name);await app.fileManager.processFrontMatter(file,fm=>{
     fm.visits??=[];const visit=index===null?{id:identity(),stamps:[]}:checked(fm,index);
     if(index!==null){
      visit.id??=identity();
      const legacy=`visit-${visit.date}-${index+1}`;
      visit.anchor_aliases=[...new Set([...(visit.anchor_aliases||[]),legacy])];
      for(const [j,stamp] of visit.stamps.entries()){stamp.id??=identity();stamp.anchor_aliases=[...new Set([...(stamp.anchor_aliases||[]),`${legacy}-stamp-${j+1}`])]}
     }
     visit.date=date;visit.notes=notes;if(trip.link)visit.trip=trip.link;else delete visit.trip;
     if(index===null)fm.visits.push(visit);
    });notice('Visit saved. Use Add stamp to record its stamps.')}catch(error){notice(error.message)}
   });return;
  }
  if(!visits.length){notice('Use Record visit first.');return}
  const index=await selectVisit();
  if(action==='stamp'){
   const expected=draftCancellations.length?await choose([...draftCancellations.map(s=>`${s.name} · ${s.type||'main'}`),'Add a newly discovered cancellation'],[...draftCancellations.map((_,i)=>i),':new'],'Choose the cancellation collected'):':new';
   const cancellation=expected===':new'?await editCancellation(null):manageCancellation(draftCancellations[expected]);
   const {name}=cancellation,type=cancellation.type||'main';
   const selection=await choose(['No location','Enter a location name only','Add a newly discovered location',...locations.map(l=>l.name)],[':none',':text',':new',...locations.map((_,i)=>i)],'Stamping location');
   let known,location='';
   if(selection===':text')location=await prompt('Stamp location (optional)');
   else if(selection===':new'){known=await editLocation(null,index);location=known.name}
   else if(selection!==':none'){known=draftLocations[selection];location=known.name}
   const notes=await prompt('Stamp notes (optional)','',true);
   const photos=app.vault.getFiles().filter(f=>f.path.startsWith('Attachments/')&&/\.(png|jpe?g|webp|gif|avif)$/i.test(f.path));
   const selected=photos.length?await tp.system.multi_suggester(f=>f.path.slice(12),photos,false,'Select photos, or confirm with none'):[];
   if(selected===null||selected===undefined)return;
   const stamp={id:identity(),cancellation_id:cancellation.id,name,type,location,photos:selected.map(f=>`[[${f.path}]]`),notes};
   if(known)stamp.location_id=known.id;
   draftVisits[index].stamps.push(stamp);saveDraft();return;
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
