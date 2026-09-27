import fs from 'node:fs';
import assert from 'node:assert/strict';
const pkg=JSON.parse(fs.readFileSync('package.json'));
const lock=JSON.parse(fs.readFileSync('package-lock.json'));
assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
if(process.env.REF_TYPE==='tag')assert.equal(process.env.REF_NAME,'v'+pkg.version,'Release tag must match package.json');
console.log('Release version verified:',pkg.version);
