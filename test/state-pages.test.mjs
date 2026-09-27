import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import {parseDocument, DomUtils} from 'htmlparser2';
import {loadContent, regions} from '../src/content.mjs';
import {createSite} from '../src/site.mjs';

const elements = (root, predicate) => DomUtils.findAll(predicate, root.children || []);
const byClass = (root, name) => elements(root, node => node.attribs?.class?.split(' ').includes(name));
const byID = (root, id) => elements(root, node => node.attribs?.id === id)[0];
const main = html => byID(parseDocument(html), 'content');
const text = node => DomUtils.textContent(node);

function fixture(t) {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'stamp-states-'));
  t.after(() => fs.rmSync(vault, {recursive: true, force: true}));
  for (const dir of ['Places', 'Regions', 'Attachments']) fs.mkdirSync(path.join(vault, dir));
  const write = (file, data) => fs.writeFileSync(path.join(vault, file), `---\n${YAML.stringify(data)}---\n`);
  for (const title of regions) write(`Regions/${title}.md`, {title});
  fs.writeFileSync(path.join(vault, 'Attachments/main.png'), 'fixture image');
  const stamp = (type, photos = []) => ({name: `${type} cancellation`, type, photos});
  const place = (title, states, passport_region, visits = []) => write(`Places/${title}.md`, {title, states, passport_region, visits});
  place('Georgia Park', ['GA'], 'Southeast', [
    {date: '2020-01-01', stamps: [stamp('main', ['[[Attachments/main.png]]'])]},
    {date: '2021-01-01', stamps: [stamp('main')]}
  ]);
  place('Border Trail', ['GA', 'AL'], 'Mid-Atlantic', [{date: '2020-01-01', stamps: [stamp('main')]}]);
  place('Georgia Historic Site', ['GA'], 'Southeast');
  place('Carolina Park', ['NC'], 'Southeast', [{date: '2020-01-01', stamps: [stamp('sub', ['[[Attachments/main.png]]'])]}]);
  place('Capital Park', ['DC'], 'National Capital');
  place('Island Park', ['VI', 'PR'], 'Southeast');
  const model = loadContent(vault);
  return {model, site: createSite(model, [], 'test')};
}

test('one canonical page exists per represented state or territory, including multiword and dotted names', t => {
  const {site} = fixture(t);
  assert.deepEqual([...site.pages.keys()].filter(url => url.startsWith('/states/')).sort(), [
    '/states/alabama/', '/states/district-of-columbia/', '/states/georgia/',
    '/states/north-carolina/', '/states/puerto-rico/', '/states/u-s-virgin-islands/'
  ]);
  assert.equal(text(elements(main(site.pages.get('/states/georgia/')), node => node.name === 'h1')[0]), 'Georgia');
  assert.equal(site.pages.has('/states/u-s-minor-outlying-islands/'), false);
  assert.equal(site.pages.has('/states/wyoming/'), false);
});

test('state main content contains only its members across regions and preserves canonical place URLs', t => {
  const {site} = fixture(t);
  const content = main(site.pages.get('/states/georgia/'));
  const cards = byClass(content, 'album-slot');
  assert.deepEqual(cards.map(card => card.attribs.href), [
    '/places/border-trail/', '/places/georgia-historic-site/', '/places/georgia-park/'
  ]);
  assert.equal(byClass(content, 'state-list').length, 0);
  assert.equal(byClass(content, 'region-grid').length, 0);
  assert.doesNotMatch(text(content), /Carolina Park|Capital Park|Island Park|Places by state/);
  const alabama = byClass(main(site.pages.get('/states/alabama/')), 'album-slot');
  assert.equal(alabama.length, 1);
  assert.equal(alabama[0].attribs.href, '/places/border-trail/');
  assert.ok(site.pages.has(alabama[0].attribs.href));
});

test('state albums share regional tiles and filter semantics for photos, missing photos, and substamps', t => {
  const {site} = fixture(t);
  const georgia = main(site.pages.get('/states/georgia/'));
  const region = main(site.pages.get('/regions/southeast/'));
  const cards = byClass(georgia, 'album-slot');
  assert.match(text(byClass(georgia, 'summary')[0]), /2 \/ 3 places with a main stamp/);
  assert.deepEqual(cards.map(card => card.attribs['data-collected']), ['true', 'false', 'true']);
  assert.match(text(cards[0]), /Collected · No photo/);
  assert.match(text(cards[1]), /Not collected/);
  assert.match(text(cards[2]), /2 main impressions/);
  assert.equal(elements(cards[2], node => node.name === 'img')[0].attribs.src, '/attachments/main.png');
  const regionalCard = byClass(region, 'album-slot').find(card => card.attribs.href === '/places/georgia-park/');
  assert.equal(DomUtils.getOuterHTML(cards[2]), DomUtils.getOuterHTML(regionalCard));
  assert.equal(DomUtils.getOuterHTML(byID(georgia, 'collection-filter')), DomUtils.getOuterHTML(byID(region, 'collection-filter')));
  assert.ok('hidden' in byID(georgia, 'collection-empty').attribs);
  const carolinaCard = byClass(main(site.pages.get('/states/north-carolina/')), 'album-slot')[0];
  assert.equal(carolinaCard.attribs['data-collected'], 'false');
  assert.match(text(carolinaCard), /Not collected/);
});

test('state navigation opens the canonical page and preserves regional state anchors', t => {
  const {site} = fixture(t);
  const document = parseDocument(site.pages.get('/states/georgia/'));
  const directory = byClass(document, 'directory')[0];
  const active = elements(directory, node => node.name === 'a' && node.attribs['aria-current'] === 'page');
  assert.equal(active.length, 2);
  assert.ok(active.every(link => link.attribs.href === '/states/georgia/' && text(link) === 'Georgia'));
  const stateBranches = byClass(directory, 'tree-state').filter(node => node.attribs['data-label'] === 'Georgia');
  assert.equal(stateBranches.filter(branch => byClass(branch, 'tree-toggle')[0].attribs['aria-expanded'] === 'true').length, 1);
  for (const branch of byClass(directory, 'tree-region')) {
    const expected = branch.attribs['data-label'] === 'Southeast';
    assert.equal(byClass(branch, 'tree-toggle')[0].attribs['aria-expanded'], String(expected));
    for (const stateBranch of byClass(branch, 'tree-state')) {
      assert.equal(byClass(stateBranch, 'tree-toggle')[0].attribs['aria-expanded'], String(expected && stateBranch.attribs['data-label'] === 'Georgia'));
    }
  }
  const regionalState = byID(main(site.pages.get('/regions/southeast/')), 'state-ga');
  const heading = elements(regionalState, node => node.name === 'h3')[0];
  assert.equal(elements(heading, node => node.name === 'a')[0].attribs.href, '/states/georgia/');
  const placeDirectory = byClass(parseDocument(site.pages.get('/places/border-trail/')), 'directory')[0];
  assert.ok(elements(placeDirectory, node => node.name === 'a' && node.attribs.href === '/states/alabama/').length);
  assert.equal(elements(directory, node => node.name === 'a' && /#state-/.test(node.attribs.href || '')).length, 0);
});

test('equal state membership counts open the first region in stable book order', t => {
  const {model} = fixture(t);
  model.places.find(p => p.title === 'Georgia Park').data.states = ['AL'];
  const {pages} = createSite(model, [], 'test');
  const document = parseDocument(pages.get('/states/alabama/'));
  const directory = byClass(document, 'directory')[0];
  const openRegions = byClass(directory, 'tree-region').filter(branch => byClass(branch, 'tree-toggle')[0].attribs['aria-expanded'] === 'true');
  assert.deepEqual(openRegions.map(branch => branch.attribs['data-label']), ['Mid-Atlantic']);
  const openStates = byClass(directory, 'tree-state').filter(branch => byClass(branch, 'tree-toggle')[0].attribs['aria-expanded'] === 'true');
  assert.deepEqual(openStates.map(branch => branch.attribs['data-label']), ['Alabama']);
  assert.deepEqual(byClass(byID(document, 'content'), 'album-slot').map(card => card.attribs.href), ['/places/border-trail/', '/places/georgia-park/']);
});

test('search indexes state names and abbreviations and only nonblank associations', t => {
  const {model} = fixture(t);
  const park = model.places.find(p => p.title === 'Georgia Park');
  park.associationsBody = 'A favourite afternoon near Savannah with **coastal history**.';
  model.places.find(p => p.title === 'Border Trail').associationsBody = ' \n ';
  const {search} = createSite(model, [], 'test');
  const states = search.filter(item => item.kind === 'State');
  assert.equal(states.length, 6);
  assert.deepEqual(states.find(item => item.title === 'Georgia'), {title: 'Georgia', url: '/states/georgia/', kind: 'State', text: 'Georgia GA'});
  assert.ok(states.some(item => item.url === '/states/u-s-virgin-islands/' && item.text.includes('VI')));
  const associations = search.filter(item => item.kind === 'Associations');
  assert.equal(associations.length, 1);
  assert.equal(associations[0].url, '/places/georgia-park/#associations');
  assert.match(associations[0].text, /Georgia Park.*Savannah.*coastal history/);
});
