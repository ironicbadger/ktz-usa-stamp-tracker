# State albums and Associations validation

Date: 2026-09-26. Branch: `design/modern-stamp-book`.

## Results

- `npm test`: **62 passed**. Includes state membership across regions, canonical multi-state links, filter parity, preferred navigation expansion and stable ties; Associations extraction, reference links, backlinks, repeated headings, sanitization and anchor collisions. Raw output: `state-associations-unit-results.txt`.
- Normal build: **500 pages / 429 places / 0 trips**. Generated checker verified **367,559 local targets**.
- Fictional build: **518 pages / 446 places / 1 trip**. Generated checker verified **391,079 local targets**.
- Installed Chrome/Playwright: **52 checkpoints, 9 axe scans, zero violations and zero console/page errors**. Raw results: `state-associations-browser-results.json`.
- Catalogue audit: **56 state and territory pages**, **515 total membership tiles**, no unrelated or duplicate tiles. Georgia has 11 places, with two photographed fictional main stamps and nine uncollected entries in the preview.
- Real content remains blank: **429 places, zero visits, zero Associations entries and zero expected cancellation lists**. No changes to real Places, Regions, Trips or Attachments.
- Both servers remain bound to `0.0.0.0`: normal port **8766**, fictional port **8767**. Georgia and Yellowstone returned HTTP 200 through LAN address `10.42.7.224` on both ports.

## Visual and interaction review

The existing region album is the state-page reference; the classic Visits heading, rule and prose establish the Associations treatment. The selected page typography, shell and cancellation sidebar remain the baseline from the [preceding layout review](validation.md).

- `desktop-state-georgia.png`: 1440 CSS pixels, full page. Three columns of tiles with bounded square stamp areas, contained artwork, dashed empty states, ordinary labels and filters. Southeast expands by default; Georgia is highlighted. The initial render expanded North Atlantic too because of the Appalachian Trail; this was corrected to open the region with the most Georgia members.
- `mobile-state-georgia.png`: 390 CSS pixels, full page. Two-column grid; square artwork and blank spaces; wrapped long names; no horizontal overflow.
- `desktop-associations.png`: 1440 CSS pixels, scrolled to Visits. Associations directly follows the visit entries with a matching serif heading and plain body text. Book link remains inline; no cards or special buttons.
- `mobile-associations.png`: 390 CSS pixels, scrolled to Visits. Associations follows Visits and precedes About this place, with the same quiet styling.

All four captures were opened and inspected. The Associations sample prose was shortened after the full browser run, then recaptured and checked; fixture labeling remains on the page. The initial rectangular gallery spaces were corrected to square spaces shared by region and state pages. Browser geometry checks verify both photographed and uncollected state slots on desktop/mobile, and regional slots on desktop. Mobile checks at 390px and 320px verify both DOM order and bounding positions for Visits → Associations → About this place. The old generic mobile section selector was narrowed so it cannot override Associations placement.

Behavior checks cover region → Georgia, Places → Georgia, exact Georgia membership, collection filters, Wyoming/Montana → one Yellowstone page, and search → Associations. Existing eight-viewport cancellation, location, trip, navigation, keyboard and overflow coverage also passes. A separate read-only code review found no concrete actionable issue.

## Limits and reproduction

The preview artwork and collection entries are fictional. Example external review URLs are not production destinations. Real authoring accepts any ordinary inline URL; no Perfect Prose integration is required. The Markdown template was checked as a file, without a new manual Obsidian session. Axe scans are scoped automated checks, not comprehensive accessibility certification. No production deployment occurred.

Run `npm test`, `npm run build`, `npm run check`, `npm run qa:fixture`, `npm run qa:check`, then `QA_CHROME=1 npm run qa:browser` with both preview servers running. See the [feature notes](../state-pages-and-associations.md) and [authoring guide](../../../vault/Start%20here.md).
