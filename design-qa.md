# Design QA — The Stamp Book

final result: passed

## Comparison target and evidence

The authority is `docs/design/README.md` and its written constraints. The three selected images are complementary sections of one page, not separate routes. The generated mockup copy and artwork are not production content.

| View | Source visual truth | Rendered implementation | Combined comparison |
| --- | --- | --- | --- |
| Page top | `docs/design/mockups/refinement-01-narrow-main-stamp-sidebar.png` | `docs/design/verification/desktop-place.png` | `docs/design/verification/comparison-top.png` |
| Collection | `docs/design/mockups/refinement-02-full-stamp-collection.png` | `docs/design/verification/desktop-collection.png` | `docs/design/verification/comparison-collection.png` |
| Locations | `docs/design/mockups/refinement-03-stamping-locations.png` | `docs/design/verification/desktop-locations.png` | `docs/design/verification/comparison-locations.png` |
| Focused rail | First reference above | Desktop place capture above | `docs/design/verification/comparison-sidebar.png` |

All source and implementation captures were opened and reviewed together through the combined comparison images. The focused rail comparison was additionally inspected at readable size to check image containment, caption wrapping, typography, borders, and spacing. Individual full-size desktop collection, mobile collection, mobile top, tablet, locations, and blank-place screenshots were also opened.

Browser: headless installed Google Chrome through Playwright, explicitly authorized by the user after the in-app browser failed screenshot capture. The in-app browser remained usable for DOM interaction checks. Device scale factor: 1.

Top reference and implementation: 1435 × 1096 pixels, matching 1435 × 1096 CSS viewport. Lower references: 1487 × 1058 pixels, scaled to 1435 CSS px width in comparison HTML; implementation: 1435 × 1096 pixels. Full comparison images are 2870 × 1140 pixels, with 32px labels added by the comparison viewer. Focused comparison is 680 × 760 pixels, using unscaled crops rendered in that viewer. Source files were not modified.

State: populated **isolated QA vault**, including two photographed main stamps, one earlier missing-photo impression, three substamps, multiple photos, two visits, a trip, and location reports. The reference has fewer directory entries, no real visit history, different illustrative artwork, and mock-only banners. Content differences are explicitly accounted for; this is a layout and behavior comparison, not a claim of pixel-identical fixture data. Lower reference headers/breadcrumbs represent context; implementation screenshots show actual in-page scrolling rather than invented pages.

## Comparison history and fixes

1. **P1 — directory links nested inside disclosure controls.** Axe detected nested interactive elements in the original directory pattern. Replaced it with separate named buttons and links. Buttons expose expansion state and their controlled subtree; links still navigate to region/state overviews. Post-fix desktop/mobile/region/search/blank-page audits report zero violations for the selected WCAG A/AA rules.
2. **P2 — lower collection and location sections constrained to the reading column.** Initial implementation retained empty rail width below the overview. Changed the page structure so these sections span the full article width. Post-fix collection and location captures, and their combined comparisons, show the intended full-width layouts.
3. **P2 — extra photos elongated the left image column.** Moved secondary thumbnails into the description area, retaining a single contained primary image. Post-fix collection screenshot shows compact cards and all photos remain linked.
4. **P1 — SVG icons failed to decode in the old preview process.** Added the SVG MIME type, restarted both preview servers, and added browser assertions for visible eager image decoding. The final top/mobile screenshots show the real Phosphor icons and no broken image markers.
5. **P2 — mobile visual and reading orders could differ.** Responsive code now moves the existing sections, without cloning them or duplicating IDs. Browser tests assert both DOM order and visual positions. The order is the one confirmed by the user.

These issues were fixed, recaptured, and rechecked. No actionable P0/P1/P2 findings remain in the reviewed states.

## Required fidelity surfaces

- **Fonts and typography:** clean system sans-serif stack; 16px body, 15px directory, 14px support, 36px desktop title and 32px mobile title. Strong but restrained heading hierarchy and readable wrapping. The written size targets override oversized generated headings. The populated and long-name fixtures wrap without horizontal overflow.
- **Spacing and layout:** measured 240px left directory and 280px right rail, with a flexible article and full-width lower sections. Thin dividers and 3–4px corner radii. Main images measure 200px at desktop; thumbnail groups sit with descriptions. Responsive layout collapses the rail at 1150px and directory at 800px.
- **Colors and tokens:** white surfaces, dark neutral text, muted secondary text, blue links and active navigation, neutral borders. Automated color contrast checks passed in the audited states; focus outlines remain visible on keyboard navigation.
- **Image quality:** real library SVG icons with attribution; generated test artwork is clearly marked DESIGN TEST ONLY and lives outside the actual vault. No invented production stamps or maps. Photos use their intrinsic ratio with contained sizing; wide and tall fixtures are tested. Optional maps and unsupported facts are omitted from real pages until authored.
- **Copy and content:** no mock banners, invented dates, placeholder counts, or mock-only routes enter the normal site. Empty places have one compact collection message. Reports distinguish published/imported claims from visit observations and expose earlier reports. The QA-only notes explicitly identify fictional test records.

## Responsive and interaction verification

See `docs/design/verification/browser-results.json` and `scripts/verify-browser.mjs` for exact checks:

- 320, 390, 768, 1024, and 1435px widths; no horizontal document overflow.
- 718px reflow as the CSS viewport equivalent of 200% zoom on the 1435px desktop layout. This is a reflow check, not a native browser zoom-control test.
- User-approved mobile order: title/links → main summary → collection → locations → visits → notes → facts.
- Mobile directory expansion/filtering, empty filter state, desktop directory filtering, region collection filters, search results, location history disclosure, and observation → visit → trip navigation.
- Keyboard skip link and visible focus; named independent disclosure controls; one h1 per page checked in generated output.
- No browser console errors or unhandled page errors in the completed run.
- Automated WCAG 2 A/AA and 2.1 AA checks for populated desktop/mobile, region, search, and blank place. This is scoped automated verification, not a comprehensive accessibility certification.

## Follow-up polish and intentional differences

- P3: the standard Phosphor rubber-stamp mark differs from the generated perforated-square mark. It is a real reusable icon asset, not a traced or fabricated logo.
- The full catalogue creates a denser directory than the simplified mock. Each applicable state still contains the same canonical place link.
- Facts/maps are deliberately absent where no factual source data exists. Fixture artwork and record counts differ from the design images.
- Mobile had no selected visual mockup. Its approved content order has been implemented and visually reviewed at 390px and tablet width.

## Implementation checklist

- [x] Compare the three intended views and a focused sidebar region.
- [x] Fix all P0/P1/P2 findings and recapture.
- [x] Inspect desktop, mobile, tablet, blank and populated states.
- [x] Preserve the real collection data and existing page routes.
- [x] Verify core interactions, dimensions, contrast, focus, image decoding and responsive overflow.
- [x] Save representative screenshots, source comparison evidence, and functional validation.

## Follow-up: traditional page width

The user requested a less busy, traditional-width page after reviewing the implementation. The page, header and footer now share a centered 1200px maximum width (previously the layout allowed 1680px and the header was unbounded). Secondary desktop grids use two columns for regions/trips/substamps and three for regional album slots. The directory collapses at 1000px, while the stamp rail still collapses at 1150px. These refinements supersede the earlier directory breakpoint above.

Reviewed `docs/design/verification/desktop-traditional-width.png` at 1435 × 1096. The full existing browser verification passed again at 320, 390, 768, 1024 and 1435px, including overflow, interaction and scoped accessibility checks. The user's width preference overrides the wider reference compositions. Final result remains passed for this scoped refinement.

## Wikipedia reference refinement — 2026-09-26

Visual target: user's supplied Simple English Wikipedia Yellowstone screenshot, excluding Appearance. Preserve the approved 1200px page cap. Compared the supplied reference with the final desktop and mobile captures in `docs/design/verification/*-wikipedia-layout.png`.

Implemented Georgia/Linux Libertine serif headings with Arial body, blue links, thin gray rules, a compact header with a Places drawer, collapsible article contents, and one gray bordered park infobox. Stamp collection begins the desktop article; smaller stamp images retain original aspect ratios. Removed the repeated locations overview, expanded visit stamp lists, and redundant trip backlinks. Collected-at-location links remain available in a disclosure. Mobile section order remains approved.

Yellowstone now has a sourced NPS regional locator map (see map-sources.md). Other parks retain authored map support; this does not claim map coverage for all parks.

Verification: 29 unit tests pass; real and fixture builds and internal link checks pass. Playwright checks 320, 390, 768, 1024, 1435px and zoom reflow, image proportions, drawer filtering, Escape/focus return, outside-click close, contents collapse and anchor navigation, report history and trip navigation. Zero browser errors and zero tested axe WCAG A/AA violations. Captures visually checked against the user reference, with deliberate adaptation for stamp records rather than encyclopedia prose. Real vault collection remains untouched.

Final result: passed.
