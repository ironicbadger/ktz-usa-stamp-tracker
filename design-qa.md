# Design QA — Tailscale navigation and primary cancellation

final result: passed

Final post-fix browser captures and comparison are complete. Earlier settled classic-layout review remains in [classic-design-qa.md](docs/design/verification/classic-design-qa.md).

## Current visual authority

- `docs/design/references/tailscale-navigation-preference.png`: user’s 2846 × 1854 screenshot, controlling left navigation style and shell spacing.
- `docs/design/references/tailscale-live-1440.png`: live Tailscale documentation captured at 1440 CSS pixels, used for computed widths, font, colors and spacing.
- `docs/design/references/locator-map-preference.png`: classic article typography, restrained right infobox and locator-map treatment. Later requirements explicitly replace its duplicate prose and fixed six-cell album.
- The user’s written refinement: the first YAML cancellation is always one large primary square; other cancellations appear in the adaptive grid below; primary gets a designed date panel; uncollected slots get a designed blank state.

## Implemented surfaces

**Typography.** Tailscale’s open-source Inter is bundled under SIL OFL1.1 and scoped to the Places browser. Navigation uses 14px/1.2, semibold region headings, regular child links and a regular active label. Georgia/Times headings and Arial body remain on the article. The primary date uses a large serif day with compact month/year text.

**Layout and spacing.** The shell follows Tailscale’s 1760px maximum including 40px side padding, 32px gutters and a left navigation track spanning two of ten columns: 246.4px at 1440. The article retains its 260px park rail. Below 1280, Places collapses into a bounded scrolling section opened with the menu button, protecting the reading column; at 720 the park sections follow the previously approved mobile order. The primary image box remains square and separate from the date strip. Additional slots retain the stable square footprint and center incomplete rows.

**Colors and tokens.** Neutral #292524 navigation links, #eeebea nested guides and #f5f5f4 active background with 4px rounding match the reference. Classic blue article links remain. The uncollected state uses a pale fill, dashed border, real stamp-library icon and explicit status; it is distinct from the camera/photo-needed state of a collected record.

**Assets and image quality.** Existing sample cancellation artwork is reused with contained proportional sizing. Phosphor stamp/camera icons are actual library assets. Maps retain sourced geographic geometry and enlarged labels. No placeholder art replaces source assets. Inter is locally served with its license; builds have no font-service dependency.

**Copy and behavior.** First YAML entry stays primary regardless of its type, collection status or later photographed entries. Last collected uses its latest impression date; the representative photo may come from an older photographed impression without changing that label’s meaning. No date is invented for an uncollected entry. The sidebar contains the primary plus at most nine additional cancellations; every historical record and overflow entry remains accessible in closed details. Short inline visits and optional blog links remain.

## Fix history

1. Earlier classic-layout issues (title gap, map labels/context caption, inline link identification and anchor collision) remain fixed; see the prior report and its comparison captures.
2. **P1 accessibility:** an aria-label on the semantic time element failed the scoped axe check. Replaced with a screen-reader-only full date inside time; visual date fragments are hidden from assistive technology.
3. **P1 accessibility:** optional help text in the uncollected square had insufficient contrast. Removed the redundant helper sentence, leaving the explicit, higher-contrast Not collected status.

The post-fix browser pass confirms both corrections: seven scoped axe scans have zero violations.

## Final comparison and evidence

- Full shell: `docs/design/verification/current-shell-comparison.png` combines the live Tailscale source and final Stamp Book capture at equal 1440px browser width, both shown at 0.5 scale. Only navigation and shell proportions are the Tailscale target; its marketing header, article styling and right TOC are intentionally not copied.
- Focused navigation: `docs/design/verification/current-navigation-comparison.png` puts source and implementation together at native 1× scale. Source crop: x40/y161/247px wide; implementation crop: x40/y108/247px wide. It shows the matched font, link padding, group weight, active treatment and nested rules despite differing content.
- Primary state review: `docs/design/verification/current-primary-states.png` combines actual filled, uncollected and collected-without-photo components at 1×. Each stamp area is 230×230px; the date strip is a separate 61px-high panel. Uncollected has no date strip. Artwork is uncropped; blank status is explicit and readable.
- Full implementation: `current-desktop-place.png`, `current-desktop-one-stamp.png`, `current-desktop-ten-stamps.png`, `current-desktop-primary-uncollected.png`, `current-desktop-primary-photo-needed.png`, `current-mobile-place.png` and the other current-* viewport captures in `docs/design/verification/`.

The supplied user source is 2846×1854 raster pixels; its original CSS size is not asserted. The live source is 1440×1000 pixels at device scale 1. Final desktop is captured at 1440×1100 CSS with full-page output 1440×1537; mobile at 390×844 CSS with full-page output 390×2570, both scale 1. Full combined image uses equal image-width scaling; focused comparisons remain native density. The shell content differs intentionally because this is a park record rather than a documentation article. Source assets were not altered.

Both combined source/render images were opened and inspected, followed by the primary state sheet and full mobile capture. No actionable P0/P1/P2 mismatch remains. The first primary/date implementation was also captured before the accessibility fixes; post-fix evidence removes the redundant helper copy and retains the same layout.

Verification: 49 unit tests; 45 browser checkpoints at 1920, 1440, 1280, 1279, 1024, 768, 390 and 320px; seven WCAG 2A/AA and 2.1AA axe scans with zero violations; zero console or unhandled page errors. Normal 444-page and fictional 462-page builds and generated link checks pass. The font-provenance file was renamed to a public .txt resource to preserve the existing prohibition on publishing Markdown source. Native Obsidian operations are covered by a simulated Templater harness, not a manual native-app run. 720px CSS reflow is an equivalent layout check, not a native browser zoom-control test.

## Completion checklist

- [x] Measure and compare Tailscale’s actual navigation, font, width and padding.
- [x] Keep the first YAML entry primary, with an accurate, accessible date panel.
- [x] Keep all cancellation boxes square and preserve history/overflow.
- [x] Distinguish uncollected from collected without a photo.
- [x] Check responsive layout, keyboard, disclosures, search and existing routes.
- [x] Preserve the real collection vault and keep previews running on the LAN.
