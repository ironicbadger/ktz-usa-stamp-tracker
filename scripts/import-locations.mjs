// Explicit local import; no network access or automatic matching by name.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';
import {parseNote,validatePlace} from '../src/content.mjs';
import {mergeLocationImports} from '../src/locations.mjs';
export function importLocations(noteFile,incoming) {
 const original=fs.readFileSync(noteFile,'utf8');
 const {data}=parseNote(original,noteFile);
 const merged=mergeLocationImports(data,incoming);validatePlace(merged,noteFile);
 const match=original.match(/^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))([\s\S]*)$/);
 const doc=YAML.parseDocument(match[2]);doc.set('stamping_locations',merged.stamping_locations);
 const updated=match[1]+doc.toString().trimEnd()+match[3]+match[4];
 if(fs.readFileSync(noteFile,'utf8')!==original)throw Error('Note changed during import; retry with the latest note');
 const temporary=noteFile+'.import-'+process.pid;
 try{fs.writeFileSync(temporary,updated,{flag:'wx'});fs.renameSync(temporary,noteFile)}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}
 return merged;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [note,input]=process.argv.slice(2);if(!note||!input)throw Error('Usage: node scripts/import-locations.mjs "vault/Places/Place.md" reports.json');
 importLocations(path.resolve(note),JSON.parse(fs.readFileSync(input,'utf8')));console.log('Location reports imported; authored reports and collection history retained.');
}
