// Expected cancellations belong to the place; impressions belong to visits.
const key = stamp => `${stamp.type || 'main'}\u0000${stamp.name.trim().toLowerCase()}`;
const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value);

export function validateCancellations(place, file) {
 const assert = (condition, message) => { if (!condition) throw Error(`${file}: ${message}`); };
 assert(place.stamps === undefined || Array.isArray(place.stamps), 'site stamps must be a list of expected cancellations');
 const expected = place.stamps || [];
 const ids = new Set();
 for (const stamp of expected) {
  assert(stamp && typeof stamp.name === 'string' && stamp.name.trim(), 'expected cancellation requires a name');
  assert(stamp.type === undefined || ['main', 'sub'].includes(stamp.type), 'expected cancellation type must be main or sub');
  assert(stamp.id === undefined || identifier(stamp.id), 'invalid expected cancellation ID');
  if (stamp.id !== undefined) {
   assert(!ids.has(stamp.id), 'duplicate expected cancellation ID');
   ids.add(stamp.id);
  }
 }
 for (const visit of place.visits) for (const stamp of visit.stamps) {
  assert(stamp.cancellation_id === undefined || (identifier(stamp.cancellation_id) && ids.has(stamp.cancellation_id)), 'stamp refers to an unknown cancellation ID');
 }
}

export function cancellationAlbum(place) {
 const expectedKnown = Array.isArray(place.data.stamps);
 const expected = place.data.stamps || [];
 // Reserve authored IDs before allocating display-only identities for old notes.
 const ids = new Set(expected.map(stamp => stamp.id).filter(Boolean));
 const displayID = base => {
  let value = base, suffix = 2;
  while (ids.has(value)) value = `${base}-${suffix++}`;
  ids.add(value);
  return value;
 };
 const entries = expected.map((stamp, index) => ({
  ...stamp, id: stamp.id || displayID(`expected-${index + 1}`),
  name: stamp.name, type: stamp.type || 'main', expected: true, impressions: []
 }));
 const byID = new Map(entries.filter((_, i) => expected[i].id).map(entry => [entry.id, entry]));
 const byName = new Map();
 for (const entry of entries) {
  const name = key(entry);
  byName.set(name, [...(byName.get(name) || []), entry]);
 }
 const observed = new Map();
 for (const visit of place.data.visits) for (const stamp of visit.stamps) {
  const matches = byName.get(key(stamp)) || [];
  let entry = stamp.cancellation_id ? byID.get(stamp.cancellation_id) : matches.length === 1 ? matches[0] : undefined;
  if (!entry) {
   const name = key(stamp);
   entry = observed.get(name);
   if (!entry) {
    entry = {id: displayID(`observed-${observed.size + 1}`), name: stamp.name, type: stamp.type || 'main', expected: false, impressions: []};
    entries.push(entry);
    observed.set(name, entry);
   }
  }
  entry.impressions.push(stamp);
  stamp.cancellationRecord = entry;
 }
 for (const entry of entries) {
  entry.anchor = `cancellation-record-${entry.id}`;
  // A later record wins ties; an older photographed impression still represents
  // a cancellation when the newest impression has no photograph yet.
  entry.impressions.reverse().sort((a, b) => b.date.localeCompare(a.date));
  entry.image = entry.impressions.find(stamp => stamp.images?.length)?.images[0];
  entry.collected = entry.impressions.length > 0;
 }
 return {cancellations: entries, expectedCancellationsKnown: expectedKnown};
}
