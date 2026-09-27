# Design QA — classic adaptive album

final result: passed

The final browser and source comparisons are complete. This report supersedes [the earlier design QA](docs/design/verification/design-qa-history.md).

## Target

Source visual truth: `docs/design/references/locator-map-preference.png`, the user’s 819 × 1920 two-page study. The written refinements in `docs/design/README.md` and `adaptive-cancellations.md` override its fixed six-cell grid, duplicate prose sections and linked visit-note titles.

Implementation: fictional Moores Creek and Yellowstone on port 8767. One and six distinct cancellations, respectively; the nine-slot edge case and the real blank vault are checked separately. The reference contains different prose, invented geography and a simplified directory. These are intentional data differences, not pixel-identical content claims.

## Issues fixed during this iteration

- **P2 — stretched title row:** the rail spanning two automatic grid rows left excessive whitespace before the article. `grid-template-rows: auto 1fr` now keeps the title and article together.
- **P1 — inline link identification:** source-caption and footer links depended on color alone. Persistent underlines now identify inline links; prose and visit metadata links receive the same treatment.
- **P2 — locator labels too small:** a forced 8/5 image ratio letterboxed the 360 × 244 SVG, shrinking its labels to about 6–7px. The image now preserves its native ratio and uses larger internal labels. At230px, states/park/scale text measure about 9.6/10.2/8.9px. The pre-fix capture is `docs/design/verification/classic-before-map-fix.png`.
- **P2 — state-only context caption:** unknown park locations received the right unpinned map but the wrong “Park location” caption. The renderer now explicitly labels them “State context”. A renderer and browser regression check cover this.
- **P2 — record/disclosure ID collision:** a valid expected ID `details` collided with the cancellation disclosure. Record anchors now use `cancellation-record-`; model and browser regression checks cover the collision while existing impression anchors remain unchanged.

## Required fidelity surfaces

- **Typography:** Georgia/Times serif wordmark and headings, Arial/Helvetica body. Desktop title 34px, article headings 26px, sidebar headings 21px, body 16px. Thin underlined heading rules and ordinary blue links follow the classic reference. Long titles and small screens wrap instead of clipping.
- **Spacing/layout:** 1200px page cap, 178px Places track, 28px gaps and 260px desktop rail. The title no longer expands vertically to match the rail. An inner 230px square album on desktop (maximum 240px) retains the same footprint across counts 1–9; every cell stays square, and incomplete rows remain centered. No hero, TOC or Appearance rail.
- **Colors/tokens:** white page, #202122 text, #54595d secondary text, #3366cc links, pale neutral borders and selected navigation. Maps use cream land, sage state/park context, pale water and a red marker. No decorative shadows or textures.
- **Image quality:** generated SAMPLE artwork stays isolated to fixtures. Images preserve intrinsic proportions with `object-fit:contain`; wide/tall and missing-photo states are exercised. Maps use actual checked-in NPS/Census/Natural Earth geometry, not fabricated map drawings. Enlarged labels and map-native aspect ratio are reviewed at actual sidebar size.
- **Copy/content:** two short dated Yellowstone visits, one Moores visit, optional inline external blog link, no duplicated Travel notes or separate visit journal. Stamping locations and full impression records are closed by default. Expected versus collected and photo-needed states remain distinct. Real content contains no fictional visits or stamp lists.

## Verification scope

Playwright with installed Chrome, explicitly authorized by the user, device scale 1. Counts1–9, partial collections, repeated impressions, more than nine, absent/empty expected lists, long names and extreme image ratios. Desktop/tablet/mobile widths 1440, 1024, 768, 390, 320; 720px reflow approximates 200% zoom on 1440px. This is a CSS reflow check, not native browser zoom-control automation.

Interactions include Places expand/filter/Escape/focus, keyboard skip link, slot-to-record disclosure, saved impression and legacy anchors, location history, observation-to-visit-to-trip, search, and region filters. Scoped axe WCAG 2A/AA and 2.1AA checks cover desktop, one-stamp, mobile, region, search and blank pages. Native Obsidian authoring is tested through the existing Templater harness; it has not been manually exercised in the native app.

## Final comparison evidence

| View | Implementation | Combined source/render evidence |
| --- | --- | --- |
| One cancellation | `docs/design/verification/classic-desktop-one-stamp.png` | `docs/design/verification/classic-comparison-one.png` |
| Six cancellations | `docs/design/verification/classic-desktop-place.png` | `docs/design/verification/classic-comparison-six.png` |
| Focused album and map | Same six-cancellation capture | `docs/design/verification/classic-comparison-rail.png` |
| Nine cancellations | `docs/design/verification/classic-desktop-nine-stamps.png` | Geometry and state checks in `browser-results.json` |
| Mobile | `docs/design/verification/classic-mobile-place.png` | Visually inspected separately; no selected mobile raster reference exists |

Source dimensions: 819 × 1920 raster pixels; original CSS size and device density are unknown. The first page is cropped from y32 for 864px; the second from y944 for 976px. Each full comparison displays the source page at 819px and the implementation’s 1200px page frame, cropped from its 1440px browser capture, at 819px (scale 0.6825). No image stretching or alteration of the source is used. The comparison images are 1680 × 1040. The focused 562 × 1090 rail comparison uses unscaled crops so typography, square borders, artwork and map labels can be inspected at readable size; it intentionally retains the differing rail proportions.

Desktop captures use a 1440 ×1100 CSS viewport, device scale 1, and full-page output 1440 ×1272. Mobile uses 390 ×844 CSS, device scale 1, output 390 ×2200; tablet uses 1024 ×1100 CSS. The page is light-themed, unauthenticated and showing fictional collection content with details closed. Content and selected rail dimensions differ deliberately from the older reference according to the subsequent user requirements.

The combined images were opened and inspected together, followed by the focused rail and full mobile capture. Post-fix evidence shows the corrected title rhythm, square centered album cells, contained artwork, clearer map labels, restrained rules and readable inline visits. Generated decorative terrain in the mockup is replaced by sourced geographic geometry; this is an intentional factual-map choice. The full directory uses real unabbreviated catalogue names, so it is denser than the simplified reference. The broadened center, smaller rail and square album follow the later width and cancellation requirements.

All 48 tests pass. Both builds and link checks pass. The final browser run passes 36 checkpoints, six scoped axe scans with zero violations, and zero browser errors. No actionable P0/P1/P2 issues remain in the reviewed states. The implementation is complete locally; production deployment is outside this goal.

## Implementation checklist

- [x] Compare one-stamp and six-stamp pages against the preferred reference in combined images.
- [x] Inspect focused cancellation/map details and mobile/tablet/blank states.
- [x] Fix title spacing, inline links, map legibility/context labels and anchor collision.
- [x] Verify square counts 1–9, overflow, repeats, missing photos and legacy records.
- [x] Preserve the real vault, authoring workflow and existing impression links.
- [x] Save representative captures, test results and updated design documentation.

The final map-only label-placement correction was regenerated and checked with all map tests plus a label audit across 485 SVGs. Both builds and link checks were rerun; affected Moores Creek and nine-slot screenshots were refreshed and compared again. The Yellowstone map did not change, so its desktop/mobile captures remain current.
