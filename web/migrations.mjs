import crypto from 'node:crypto';

// Never edit an applied migration. Add the next sequential version instead.
export const migrations = [{version: 1, name: 'baseline', sql: `   CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS nodes (key TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('Places','Trips','Regions')),data TEXT NOT NULL,body TEXT NOT NULL,prose TEXT,revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS visits (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,date TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS impressions (node_key TEXT NOT NULL,visit_position INTEGER NOT NULL,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,visit_position,position),FOREIGN KEY(node_key,visit_position) REFERENCES visits(node_key,position) ON DELETE CASCADE);
   CREATE TABLE IF NOT EXISTS expected_stamps (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS locations (node_key TEXT NOT NULL REFERENCES nodes(key) ON DELETE CASCADE,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,position));
   CREATE TABLE IF NOT EXISTS location_reports (node_key TEXT NOT NULL,location_position INTEGER NOT NULL,position INTEGER NOT NULL,id TEXT,data TEXT NOT NULL,PRIMARY KEY(node_key,location_position,position),FOREIGN KEY(node_key,location_position) REFERENCES locations(node_key,position) ON DELETE CASCADE);
   CREATE TABLE IF NOT EXISTS revisions (node_key TEXT NOT NULL REFERENCES nodes(key),revision INTEGER NOT NULL,snapshot TEXT NOT NULL,actor TEXT NOT NULL,summary TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(node_key,revision));
   CREATE TRIGGER IF NOT EXISTS revisions_no_update BEFORE UPDATE ON revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
   CREATE TRIGGER IF NOT EXISTS revisions_no_delete BEFORE DELETE ON revisions BEGIN SELECT RAISE(ABORT,'Revision history is append-only'); END;
   CREATE TABLE IF NOT EXISTS assets (path TEXT PRIMARY KEY,mime TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,original_name TEXT NOT NULL,created_at TEXT NOT NULL);
  `}, {version: 2, name: 'revision-author-name', sql: 'ALTER TABLE revisions ADD COLUMN actor_name TEXT;'}];
export const schemaVersion = migrations.at(-1).version;
const checksum = sql => crypto.createHash('sha256').update(sql).digest('hex');
export function checkDatabase(db) {
 const rows = db.prepare('PRAGMA integrity_check').all();
 if(rows.length !== 1 || rows[0].integrity_check !== 'ok') throw Error('Database integrity check failed; refusing to start.');
 if(db.prepare('PRAGMA foreign_key_check').all().length) throw Error('Database foreign-key check failed; refusing to start.');
}
export function migrate(db, steps = migrations) {
 const target = steps.at(-1)?.version || 0;
 const current = db.prepare('PRAGMA user_version').get().user_version;
 if(current > target) throw Error(`Database schema ${current} is newer than supported schema ${target}. Use the matching app release; never downgrade this database.`);
 checkDatabase(db);
 db.exec('BEGIN IMMEDIATE');
 try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);
  if(current === 0 && tables.length) {
   const required = ['metadata','nodes','visits','impressions','expected_stamps','locations','location_reports','revisions','assets'];
   if(required.some(t=>!tables.includes(t))) throw Error('Unrecognized legacy schema; restore or inspect it before upgrading.');
  }
  if(current > 0 && !tables.includes('schema_migrations')) throw Error('Migration history is missing; refusing to start.');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
  const applied = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
  if(applied.length !== current) throw Error('Migration history does not match schema version.');
  for(let i=0;i<steps.length;i++) {
   const step=steps[i];
   if(step.version !== i+1) throw Error('Migrations must have consecutive version numbers.');
   if(step.version <= current) {
    if(applied[i]?.checksum !== checksum(step.sql) || applied[i]?.name !== step.name) throw Error(`Applied migration ${step.version} was modified; refusing to start.`);
   } else {
    db.exec(step.sql);
    db.prepare('INSERT INTO schema_migrations VALUES (?,?,?,?)').run(step.version,step.name,checksum(step.sql),new Date().toISOString());
    db.exec(`PRAGMA user_version=${step.version}`);
   }
  }
  const columns={metadata:['key','value'],nodes:['key','kind','data','body','prose','revision','updated_at'],visits:['node_key','position','id','date','data'],impressions:['node_key','visit_position','position','id','data'],expected_stamps:['node_key','position','id','data'],locations:['node_key','position','id','data'],location_reports:['node_key','location_position','position','id','data'],revisions:['node_key','revision','snapshot','actor','summary','created_at'],assets:['path','mime','size','sha256','original_name','created_at']};
  for(const [table,required] of Object.entries(columns)){
   const actual=db.prepare('PRAGMA table_info('+table+')').all().map(c=>c.name);
   if(required.some(name=>!actual.includes(name)))throw Error('Unexpected schema in '+table+'; refusing to start.');
  }
  checkDatabase(db);
  db.exec('COMMIT');
 } catch(error) { db.exec('ROLLBACK'); throw error; }
}
