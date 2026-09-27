import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import {cancellationAlbum} from '../src/cancellations.mjs';
import {loadContent, regions, validatePlace} from '../src/content.mjs';

const impression = (name, date, extra = {}) => ({name, type: 'main', photos: [], images: [], date, ...extra});
const place = data => ({data: {visits: [], ...data}});
const validPlace = extra => ({title: 'Test', states: ['WY'], passport_region: 'Rocky Mountain', visits: [], ...extra});

test('expected YAML order and default type define all slots, including uncollected and more than nine', () => {
 const expected = Array.from({length: 12}, (_, i) => ({id: `expected-${i}`, name: `Cancellation ${i}`}));
 const p = place({stamps: expected});
 const model = cancellationAlbum(p);
 assert.equal(model.expectedCancellationsKnown, true);
 assert.equal(model.cancellations.length, 12);
 assert.deepEqual(model.cancellations.map(s => s.name), expected.map(s => s.name));
 assert.ok(model.cancellations.every(s => s.expected && !s.collected && s.type === 'main' && s.impressions.length === 0 && s.image === undefined));
 assert.equal(expected[0].type, undefined);
});

test('explicit identities survive renamed cancellations; repeats group newest first with an older photo fallback', () => {
 const older = impression('Original name', '2020-01-01', {id: 'old', anchor: 'stamp-old', cancellation_id: 'park', images: ['/attachments/old.png']});
 const newer = impression('Renamed cancellation', '2026-09-26', {id: 'new', anchor: 'stamp-new', cancellation_id: 'park'});
 const p = place({stamps: [{id: 'park', name: 'Current name'}], visits: [{stamps: [older]}, {stamps: [newer]}]});
 const {cancellations: [entry]} = cancellationAlbum(p);
 assert.equal(entry.anchor, 'cancellation-record-park');
 assert.equal(entry.name, 'Current name');
 assert.deepEqual(entry.impressions.map(s => s.id), ['new', 'old']);
 assert.equal(entry.impressions[0].date, '2026-09-26');
 assert.equal(entry.image, '/attachments/old.png');
 assert.equal(entry.collected, true);
 assert.equal(older.name, 'Original name');
 assert.equal(older.anchor, 'stamp-old');
 assert.equal(p.data.visits[0].stamps[0], older);
 assert.equal(newer.cancellationRecord, entry);
});

test('the first YAML entry stays primary even when a later main cancellation has a newer photograph', () => {
 const p = place({stamps: [{id: 'first', name: 'First listed', type: 'sub'}, {id: 'later', name: 'Later main'}], visits: [{stamps: [impression('Later main', '2026-09-26', {cancellation_id: 'later', images: ['/attachments/later.png']})]}]});
 const {cancellations} = cancellationAlbum(p);
 assert.equal(cancellations[0].id, 'first');
 assert.equal(cancellations[0].collected, false);
 assert.equal(cancellations[0].impressions[0]?.date, undefined);
 assert.equal(cancellations[1].image, '/attachments/later.png');
});

test('legacy matching is unambiguous by normalized name and type; ambiguous and unmatched records remain visible', () => {
 const p = place({stamps: [{id: 'main', name: 'Park'}, {id: 'sub', name: 'Park', type: 'sub'}, {id: 'a', name: 'Duplicate'}, {id: 'b', name: 'Duplicate'}], visits: [{stamps: [impression(' PARK ', '2026-01-01'), impression('Park', '2026-01-01', {type: 'sub'}), impression('Duplicate', '2026-01-01'), impression('Unexpected', '2026-01-01')]}]});
 const {cancellations} = cancellationAlbum(p);
 assert.equal(cancellations.length, 6);
 assert.equal(cancellations[0].impressions.length, 1);
 assert.equal(cancellations[1].impressions.length, 1);
 assert.equal(cancellations[2].collected, false);
 assert.equal(cancellations[3].collected, false);
 assert.deepEqual(cancellations.slice(4).map(s => [s.name, s.expected]), [['Duplicate', false], ['Unexpected', false]]);
});

test('unknown expected count differs from an explicit empty list and missing photos differ from uncollected', () => {
 const p = place({visits: [{stamps: [impression('Park', '2026-01-01'), impression('park', '2026-02-01'), impression('Park', '2026-01-01', {type: 'sub'})]}]});
 let model = cancellationAlbum(p);
 assert.equal(model.expectedCancellationsKnown, false);
 assert.equal(model.cancellations.length, 2);
 assert.ok(model.cancellations.every(s => !s.expected && s.collected && !s.image));
 assert.equal(model.cancellations[0].impressions.length, 2);
 p.data.stamps = [];
 model = cancellationAlbum(p);
 assert.equal(model.expectedCancellationsKnown, true);
 assert.equal(model.cancellations.length, 2);
});

test('display identities cannot collide with authored IDs', () => {
 const {cancellations} = cancellationAlbum(place({stamps: [{name: 'Unmanaged'}, {id: 'expected-1', name: 'Managed'}, {id: 'observed-1', name: 'Another'}], visits: [{stamps: [impression('Legacy', '2026-01-01')]}]}));
 assert.equal(new Set(cancellations.map(s => s.id)).size, 4);
 assert.equal(cancellations[0].id, 'expected-1-2');
 assert.equal(cancellations[3].id, 'observed-1-2');
});

test('a valid cancellation ID named details cannot collide with the collection disclosure', () => {
 const data = validPlace({stamps: [{id: 'details', name: 'Park'}]});
 assert.doesNotThrow(() => validatePlace(data, 'Test'));
 const {cancellations: [entry]} = cancellationAlbum(place(data));
 assert.equal(entry.anchor, 'cancellation-record-details');
 assert.notEqual(entry.anchor, 'cancellation-details');
});

test('expected list validation rejects malformed records, duplicate identities, and broken references', () => {
 assert.doesNotThrow(() => validatePlace(validPlace({stamps: [{name: 'Park'}, {id: 'sub', name: 'Substamp', type: 'sub', custom: 'kept'}]}), 'Test'));
 for (const [stamps, message] of [
  ['bad', /site stamps must be a list/],
  [[null], /requires a name/],
  [[{name: ' '}], /requires a name/],
  [[{name: 'Park', type: 'primary'}], /type must be main or sub/],
  [[{name: 'Park', id: '../bad'}], /invalid expected cancellation ID/],
  [[{name: 'A', id: 'same'}, {name: 'B', id: 'same'}], /duplicate expected cancellation ID/]
 ]) assert.throws(() => validatePlace(validPlace({stamps}), 'Test'), message);
 const visits = [{date: '2026-09-26', stamps: [{name: 'Park', type: 'main', photos: [], cancellation_id: 'missing'}]}];
 assert.throws(() => validatePlace(validPlace({visits}), 'Test'), /unknown cancellation ID/);
 assert.doesNotThrow(() => validatePlace(validPlace({stamps: [{id: 'missing', name: 'Renamed park'}], visits}), 'Test'));
});

test('loadContent resolves representative photos and exposes cancellation links without changing impression anchors', t => {
 const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'cancellation-test-'));
 t.after(() => fs.rmSync(vault, {recursive: true, force: true}));
 for (const dir of ['Places', 'Regions', 'Attachments']) fs.mkdirSync(path.join(vault, dir));
 const write = (file, data) => fs.writeFileSync(path.join(vault, file), `---\n${YAML.stringify(data)}---\n`);
 for (const title of regions) write(`Regions/${title}.md`, {title});
 fs.writeFileSync(path.join(vault, 'Attachments/park.png'), 'fixture');
 write('Places/Test.md', validPlace({stamps: [{id: 'park', name: 'Park'}, {name: 'Uncollected'}], visits: [{date: '2026-09-26', stamps: [{name: 'Older name', type: 'main', cancellation_id: 'park', photos: ['[[Attachments/park.png]]']}]}]}));
 const {places: [p]} = loadContent(vault);
 assert.equal(p.expectedCancellationsKnown, true);
 assert.equal(p.cancellations[0].image, '/attachments/park.png');
 assert.equal(p.data.visits[0].stamps[0].anchor, 'visit-2026-09-26-1-stamp-1');
 assert.equal(p.data.visits[0].stamps[0].cancellationRecord, p.cancellations[0]);
 assert.equal(p.cancellations[1].collected, false);
});
