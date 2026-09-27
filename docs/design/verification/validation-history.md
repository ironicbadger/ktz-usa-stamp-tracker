# Implementation validation

Date: 2026-09-26. Branch: `design/modern-stamp-book`.

## Results

- `npm test`: **29 tests passed**. Raw output: `unit-results.txt`.
- `npm run build`: **444 pages from 429 places, 0 trips**.
- `npm run check`: **444 HTML pages and 325,425 local links/assets/search targets** checked.
- `npm run qa:fixture` / `npm run qa:check`: **446 pages and 328,325 targets** checked in the isolated populated fixture.
- `QA_CHROME=1 npm run qa:browser`: passed. Exact browser results are in `browser-results.json`; screenshots are in this directory.
- `git diff --check`: passed.
- Actual source content: **429 places, zero visits, zero stamping locations, zero published attachments**, recorded in `content-integrity.json`. `vault/Places`, `vault/Regions`, `vault/Trips`, and `vault/Attachments` have no changes from the cloned commit.
- HTTP 200 from the host's LAN address on ports 8766 and 8767; both preview servers bind to `0.0.0.0`.

## Requirement evidence

| Requirement | Implementation and evidence |
| --- | --- |
| Modern documentation style and readable sizes | `static/site.css`; desktop/mobile screenshots; browser measurements 16px body, 15px directory, 240px directory and 280px rail |
| Main stamps only in the top rail, vertically stacked and contained | `src/site.mjs`; sidebar unit test; browser 200px cap and intrinsic-ratio assertions; focused comparison |
| Full main/sub collection, multiple photos, notes, locations, visits | Full-width collection renderer; `desktop-collection.png`, `mobile-collection.png`; content and browser link checks |
| Notes, visits, locations on one canonical place page | Existing canonical URLs preserved; section IDs and stable visit/stamp identities; generated-link checker; observation → visit → trip browser test |
| Multi-state directory and region overview links | Three canonical Yellowstone links verified after filtering; content tests; separate expansion buttons and navigation links |
| Compact factual information and optional map | Existing official NPS links preserved; optional `area`, `established`, attachment `map`; blank facts omitted; optional-map/long-name fixture tested at all widths |
| Preserve region slots, trips, search and backlinks | Existing tests retained; browser region filters, search and trip navigation; authored backlinks tested |
| Backward-compatible location schema | `docs/design/location-model.md`; legacy-note validation test; unchanged source notes |
| Add/update location and Add stamp workflow | New Templater template plus registered command; automated authoring harness tests known/new/name-only locations, source and observation provenance, and stamp-list updates |
| No duplicate visit date or author-entered IDs | Authoring tests for inherited observation dates and automatically generated identities; site resolves observation dates from visits |
| Corrections survive imports; historic names and closed/moved locations remain | Pure append-only merge and validated local import command; import idempotence/conflict tests; rename snapshots; report-history UI; moved-location fixture |
| Safe cancellation and concurrent edits | Draft-only prompts; complete visits/locations snapshot checked before commit; tests prove no partial location/visit changes after cancellation or concurrent edits |
| Stable new links and legacy compatibility | New visit/stamp identities; old anchors retained when editing a legacy visit; date-change and alias-rendering tests |
| Responsive order, overflow, keyboard and contrast | Approved mobile order; 320–1435px checks; 200% reflow equivalent; skip-link focus; scoped Axe audits with zero violations |
| Blank real vault, isolated testing | `.qa/vault` and `.qa/dist` only; fixture-generation script; unchanged source directories and integrity JSON |
| Desktop/mobile screenshots and visual comparison | `../../../design-qa.md`, three full comparisons, focused rail comparison, representative captures |
| Documentation and local delivery | README, vault Start here, location-model notes, handoff status and implementation goal updated; normal preview on 8766, optional fictional fixture on 8767 |
| No production deployment | No deployment command run; no credentials needed or requested |

## Reproduce

```sh
npm ci
npm test
npm run build
npm run check
npm run qa:fixture
npm run qa:check
# In separate terminals:
node scripts/serve.mjs --host 0.0.0.0 --port 8766
node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767
# With installed Google Chrome:
QA_CHROME=1 npm run qa:browser
# Or install Playwright Chromium once, then run npm run qa:browser:
npx playwright install chromium
```

The browser test is a local verification command, not part of the lightweight default CI test suite. Authoring tests simulate Obsidian's Templater and frontmatter APIs; this change was not manually exercised inside the native Obsidian application. The existing pinned plugins and native authoring architecture are retained.
