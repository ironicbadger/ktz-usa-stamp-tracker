import fs from 'node:fs';
import path from 'node:path';
const plugins=[{repo:'SilentVoid13/Templater',version:'2.20.0',id:'templater-obsidian'},{repo:'Vinzent03/obsidian-git',version:'2.40.0',id:'obsidian-git'}];
for(const plugin of plugins){
 const dir=path.resolve('vault/.obsidian/plugins',plugin.id);fs.mkdirSync(dir,{recursive:true});
 for(const file of ['manifest.json','main.js','styles.css']){
  const response=await fetch(`https://github.com/${plugin.repo}/releases/download/${plugin.version}/${file}`);
  if(!response.ok)throw Error(`Plugin download failed: ${plugin.id}/${file} (${response.status})`);
  fs.writeFileSync(path.join(dir,file),Buffer.from(await response.arrayBuffer()));
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
 if(manifest.id!==plugin.id||manifest.version!==plugin.version)throw Error('Plugin manifest mismatch');
 console.log(`Installed ${plugin.id} ${plugin.version}`);
}
