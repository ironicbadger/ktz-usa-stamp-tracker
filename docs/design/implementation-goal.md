# Implementation goal

Update the site to the user’s settled classic design and square adaptive cancellation behavior while preserving the static build, Obsidian authoring, existing collection records and canonical URLs. The latest authority is [the design handoff](README.md), including subsequent written refinements to the reference image.

## Layout and content

1. Use classic serif headings, Arial body, blue links, white surfaces and thin rules across place, region, trip, search and directory pages.
2. Use the measured Tailscale shell: 1760px maximum, 40px outer padding and 32px gutters, with its wider neutral Places navigation. Collapse the browser below 1280px to keep a readable center, and compact cancellations, locator map and supported facts on the right. Do not require a hero photo.
3. Keep each visit a short dated entry, optionally containing an external blog link. Avoid separate visit pages and duplicate journal sections.
4. Collapse stamping locations and detailed impression history by default. Preserve reports, conflicting claims, provenance, location snapshots, photos, backlinks and stable/legacy anchors when expanded or directly linked.
5. Use sourced locator maps for catalogue parks and explicitly labeled state context when no park location is known. Never invent pins or park facts.

## Adaptive cancellation model

1. The place’s top-level `stamps` YAML list supplies expected distinct cancellations and ordering, with optional managed IDs. A separate count field is unnecessary.
2. Always show the first YAML entry separately as a full primary square, with a Last collected date panel when collected. Show the remaining entries in a stable square album: 1 column for one, 2 for two through four, 3 for five through nine. Every slot stays square; incomplete rows and arrangements are centered. All artwork preserves aspect ratio.
3. Show a designed pale, dashed slot with a real stamp icon and Not collected label for an expected but uncollected cancellation, and a distinct missing-photo status for a collected impression. Do not invent filler slots.
4. Group repeated impressions into one slot and retain every record. Explicit IDs survive renames; legacy matching must be unambiguous. Unmatched historical impressions stay visible.
5. Cap only the additional grid at nine, beneath the separate primary. Additional records remain reachable through View all. Missing expected lists never imply verified completeness.
6. Add a simple Obsidian command to edit expected cancellations independently of visits. Add stamp chooses an expected cancellation or saves a discovery and impression together. Authoring cancellation and concurrent edits must not partially overwrite data.

## Responsive and interaction behavior

- Mobile: title, cancellations and their details, stamping locations, visits, notes, park facts. Keep actual DOM/focus order consistent with visual order.
- Collapse Places at tablet widths and allow the user to open it in document flow. Use a single content column at phone widths.
- Verify counts 1–9, repeat impressions, unknown and empty lists, more than nine, missing photos, extreme image ratios and long names.
- Verify keyboard, visible focus, closed/default and hash-open disclosures, search, trips, directory branches, region navigation, zoom/reflow, contrast and horizontal overflow.

## Boundaries and completion

The 429 real place notes remain blank apart from existing factual metadata. Fictional data and artwork are isolated to QA fixtures. Keep the existing Obsidian/Templater/Git workflow; do not introduce a web editor, database, blog, planner or production deployment.

Completion requires passing model/authoring/rendering tests, static builds and local link checks, browser and accessibility checks, reviewed desktop/mobile screenshots against the preferred reference, updated authoring and design documentation, and working LAN previews. See [design QA](../../design-qa.md) and [verification](verification/validation.md) for final evidence.
