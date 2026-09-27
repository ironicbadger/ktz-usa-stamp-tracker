# Tailscale navigation and primary cancellation validation

Latest additions: [state albums and Associations](state-associations-validation.md) (62 tests, 52 browser checkpoints, 9 accessibility scans). The report below records the preceding layout milestone.

Date: 2026-09-26. Branch: `design/modern-stamp-book`. This supersedes [earlier validation](validation-history.md).

## Results

- `npm test`: **49 passed**, including cancellation matching, repeat/history preservation, authoring cancellation/concurrency, rendered anchor collision and state-context coverage, and sourced-map coverage. Raw output: `unit-results.txt`.
- Normal build: **444 pages / 429 places / 0 trips**. `npm run check`: **326,298** local links/assets/search targets checked.
- Isolated QA build: **462 pages / 446 places / 1 trip**. `npm run qa:check`: **348,698** local targets checked.
- `QA_CHROME=1 npm run qa:browser`: **45 checkpoints passed**, including one primary plus 0–9 additional slots across 1920, 1440, 1280, 1279, 1024, 768, 390 and 320px. **Seven scoped axe scans, zero violations; zero browser errors.** Exact results: `browser-results.json`.
- Real content integrity: **429 places, zero visits, zero stamping locations, zero expected lists**. No changes in `vault/Places`, `vault/Regions`, `vault/Trips` or `vault/Attachments`; see `content-integrity.json`.
- Both preview servers bind to `0.0.0.0`. LAN address: `10.42.7.224`; normal site port 8766, fictional preview port 8767.

## Evidence

| Requirement | Evidence |
| --- | --- |
| Tailscale navigation with classic article typography | `current-desktop-place.png` ; 1760px shell, Inter Places browser, Georgia/Times headings and Arial body |
| Separate primary square and adaptive additional squares | `current-desktop-one-stamp.png`, `current-desktop-place.png`, `current-desktop-nine-stamps.png`; geometry assertions across eight widths |
| YAML defines expectations; repeat impressions share one slot | `src/cancellations.mjs`, model and authoring tests, repeat/legacy/empty/overflow browser fixtures |
| Missing photos differ from uncollected entries | Count fixtures check collected and photo states; square cells remain blank only when uncollected |
| Records beyond primary plus nine retained | Eleven-entry fixture; View all opens all detail records |
| Short inline visits and optional external blog link | Two concise Yellowstone entries; Moores has no blog link; no separate visit pages or duplicated Travel notes |
| Rarely needed locations closed | Default disclosure assertions; deep links reveal current/historical reports and associated visits |
| Locator maps and supported facts | 429 sourced park locators, 56 state-only fallbacks; map tests verify pins/provenance and no invented fallback pins; native map ratio and enlarged labels |
| Responsive mobile order | `current-mobile-place.png`, `current-small-mobile-place.png`, `current-tablet-place.png`; DOM order and overflow assertions |
| Existing navigation and saved links | Directory/filter/Escape/focus, region filters, search, observation→visit→trip, legacy and canonical impression anchors |
| Authoring preservation | Expected-list editor and Add stamp draft atomically; renamed expected entries preserve impression names, photos and dates |
| Visual fidelity review | `../../../design-qa.md`, combined shell and focused navigation comparisons, plus primary state comparisons |

## Reproduce

```sh
npm ci
npm test
npm run build
npm run check
npm run qa:fixture
npm run qa:check
# Separate terminals:
node scripts/serve.mjs --host 0.0.0.0 --port 8766
node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767
QA_CHROME=1 npm run qa:browser
```

The browser suite uses installed Chrome when `QA_CHROME=1`; alternatively install Playwright Chromium and omit that variable. 720px reflow tests the CSS viewport equivalent of 200% zoom, not native browser zoom controls. Axe results are scoped automated checks, not a comprehensive accessibility certification. Obsidian authoring uses a simulated Templater/frontmatter test harness; no manual native-app test was performed. Map pins indicate administrative centers, not entrances or stamping desks. No production deployment was performed.

The sidebar’s first YAML entry is primary even when uncollected, type sub, or missing its photo. Dedicated fixtures verify that later photographed entries cannot replace it. The Last collected time uses its latest impression, independently from representative-photo fallback. Blank and photo-needed states are visually distinct.
