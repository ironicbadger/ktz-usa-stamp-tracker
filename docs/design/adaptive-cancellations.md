# Adaptive cancellation album

User direction, 26 September 2026. Design exploration; no application implementation yet.

The right sidebar keeps a fixed album footprint, approximately the space previously occupied by six cancellations. Its layout is determined by the number of expected cancellations listed in the site's `stamps` YAML entry. The cancellation boxes themselves must always be square and equally sized within each count layout. One cancellation uses the largest square that fits the album; nine use a three-by-three grid. Artwork retains its proportions inside each box and is never stretched or cropped.

| Entries in the site list | Columns | Rows |
| --- | --- | --- |
| 1 | 1 | 1 |
| 2 | 2 | 1 |
| 3–4 | 2 | 2 |
| 5–6 | 3 | 2 |
| 7–9 | 3 | 3 |

Render exactly one slot per listed cancellation in YAML order. Center the arrangement horizontally and vertically inside the stable album footprint, and center incomplete final rows. Do not create extra bordered spaces to complete a rectangle or stretch boxes to fill partial rows.

Calculate one square side length for every box in the layout:

`side = min((availableWidth - (columns - 1) * gap) / columns, (availableHeight - (rows - 1) * gap) / rows)`

Here, available width and height are the album's usable inner dimensions after padding. Set both the width and height of every box to this side length. Any remaining space belongs around the centered arrangement, not inside stretched boxes. Artwork fits within its square box while retaining its original aspect ratio. The component's outer height stays fixed, so the preferred locator map beneath it does not move when the count changes.

The site-level list describes expected distinct cancellations. Visit stamp records describe collected impressions and fill the matching slots. Repeat impressions of one cancellation do not create more expected slots. An uncollected listed cancellation is a blank album slot; collected records without images need a separate missing-photo state. The list itself supplies the count, avoiding a second manually maintained count field. This is the proposed design contract, not a claim that the existing parser already supports it. Implement matching and authoring using the existing automatically managed identities when this design is built.

Nine is the sidebar display ceiling. If a site lists more, retain every record and provide a View all link beneath the first nine. Absence of an expected list must not be presented as a verified zero or a fabricated collection checklist.

The inline component study lets the user vary expected and collected counts, using six existing fictional stamp images plus missing-photo examples. It was checked in Playwright at widths736px and320px for all counts1–9: exact slot counts,240px album height, stable position of following content, no overflow or runtime errors. One-stamp and nine-stamp screenshots were visually inspected for proportional artwork and readable controls. The inline study is conversation content, not a site deployment or a replacement locator-map design.

## Related settled direction

Visits stay on the place page as short dated entries. A relevant external blog post may be linked naturally within an entry; the link is optional. Do not create standalone visit journal pages, require blog links, or duplicate entries in a Travel notes section. Preserve the locator-map styling in [the user's preferred reference](references/locator-map-preference.png).
