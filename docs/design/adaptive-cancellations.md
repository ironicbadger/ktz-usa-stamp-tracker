# Adaptive cancellation album

User direction, 26 September 2026. Implemented in the local site; see [verification](verification/validation.md).

The first entry in the site’s `stamps` YAML list is always the primary cancellation, displayed as one large square at the top. It is never replaced by a later entry because that entry has a photo, a newer visit or a different type. Put the main cancellation first when authoring. A compact calendar-style panel shows **Last collected**, using that cancellation’s latest impression date. An uncollected primary has no invented date.

The remaining entries use a separate fixed square album below the primary. Its layout is determined by the number of additional expected cancellations. The cancellation boxes themselves must always be square and equally sized within each count layout. One cancellation uses the largest square that fits the album; nine use a three-by-three grid. Artwork retains its proportions inside each box and is never stretched or cropped.

| Additional entries after the primary | Columns | Rows |
| --- | --- | --- |
| 1 | 1 | 1 |
| 2 | 2 | 1 |
| 3–4 | 2 | 2 |
| 5–6 | 3 | 2 |
| 7–9 | 3 | 3 |

Render exactly one slot per listed cancellation in YAML order, with the primary removed from the additional grid. Center the arrangement horizontally and vertically inside the stable album footprint, and center incomplete final rows. Do not create extra bordered spaces to complete a rectangle or stretch boxes to fill partial rows.

Calculate one square side length for every box in the layout:

`side = min((availableWidth - (columns - 1) * gap) / columns, (availableHeight - (rows - 1) * gap) / rows)`

Here, available width and height are the album's usable inner dimensions after padding. Set both the width and height of every box to this side length. Any remaining space belongs around the centered arrangement, not inside stretched boxes. Artwork fits within its square box while retaining its original aspect ratio. The component's outer height stays fixed, so the preferred locator map beneath it does not move when the count changes.

The site-level list describes expected distinct cancellations. Visit stamp records describe collected impressions and fill the matching slots. Repeat impressions of one cancellation do not create more expected slots. An uncollected listed cancellation is a pale square with a dashed border, stamp icon and Not collected label; collected records without images need a separate missing-photo state. The list itself supplies the count, avoiding a second manually maintained count field. The parser and authoring commands implement this contract. Templater manages optional stable IDs and connects impressions through `cancellation_id`. Older impressions match by normalized name and type only when unambiguous; unmatched history stays visible as additional recorded cancellations.

The sidebar shows the primary plus up to nine additional cancellations. If a site lists more than ten in total, retain every record and provide a View all link. Absence of an expected list must not be presented as a verified zero or a fabricated collection checklist.

The inline component study lets the user vary expected and collected counts, using six existing fictional stamp images plus missing-photo examples. It was checked in Playwright at widths736px and320px for all counts1–9: exact slot counts,240px album height, stable position of following content, no overflow or runtime errors. One-stamp and nine-stamp screenshots were visually inspected for proportional artwork and readable controls. The inline study is conversation content, not a site deployment or a replacement locator-map design.

## Related settled direction

Visits stay on the place page as short dated entries. A relevant external blog post may be linked naturally within an entry; the link is optional. Do not create standalone visit journal pages, require blog links, or duplicate entries in a Travel notes section. Preserve the locator-map styling in [the user's preferred reference](references/locator-map-preference.png).

## Authored list

```yaml
stamps:
  - id: park-cancellation
    name: Park cancellation
    type: main
  - id: visitor-centre
    name: Visitor centre
    type: sub
visits:
  - date: '2026-09-26'
    notes: A short visit note, optionally with an external Markdown link.
    stamps:
      - cancellation_id: park-cancellation
        name: Park cancellation
        type: main
        photos: []
```

This example is documentation, not collection data. `id` is optional when editing YAML by hand, and `type` defaults to `main` on expected entries. Collected impressions retain their existing required type. Use **Edit expected cancellations** in Obsidian to manage the list without a visit. **Add stamp** chooses an expected cancellation or adds a new discovery and its impression together. Cancelling prompts or detecting a concurrent edit writes neither half.

The first available image in newest-first impression order represents a collected cancellation. Every original photo and record remains in the expanded details. Missing expected lists fall back to observed groups without claiming that the list is complete. An explicit empty list produces no filler slots.
