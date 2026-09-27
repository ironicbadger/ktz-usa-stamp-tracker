# Design handoff

Start here when continuing this project. The current implementation is the classic Wikipedia-inspired layout with an adaptive square cancellation album. The user’s later written requirements supersede the older generated studies.

## Current design

- White page, blue links, Georgia/Times headings and Arial body text; thin rules, restrained borders, no required hero image.
- Tailscale-style navigation and shell spacing: 1760px maximum frame, 40px desktop outer padding, 32px gutters, and a two-column Places track from a ten-column grid. The browser collapses below 1280px to protect the article’s reading width. Keep a broad reading column and compact cancellation/locator-map sidebar. No table of contents or Appearance rail.
- Short, dated visits stay inline. A relevant external blog link can appear naturally in an entry; it is optional. No separate visit journal or duplicate Travel notes section.
- Associations follows Visits, using plain paragraphs and optional inline links for books, music and other personal connections. Author it under `## Associations` in the place note. No special external-site setup or media cards.
- Every represented state or territory has its own visual stamp album. Region headings and Places state links open these pages; each contains only places assigned to that state. Region and state albums share square stamp spaces and collection filters.
- Stamping locations and cancellation details are closed by default. Selecting a cancellation or following an old impression link reveals its records.
- The place’s top-level `stamps` YAML list defines expected distinct cancellations. The first listed cancellation is always the large primary square, followed by a designed Last collected date panel when collected. Remaining entries use a separate adaptive square album, up to nine additional cancellations. Incomplete rows are centered. Artwork is contained without distortion.
- Uncollected listed cancellations have a pale, dashed square with a stamp icon and an explicit Not collected label. Collected impressions without a photo have a distinct status. Repeat impressions share one slot; all history remains available. Beyond the primary plus nine additional slots, every record is retained behind View all. Unknown lists never invent a checklist.
- Locator maps use sourced geographic geometry and park locations. Unsupported park facts are omitted. The same layout works for a modest battlefield and Yellowstone.
- Mobile order: title, cancellation album/details, collapsed stamping locations, visits, associations, place notes, park facts. The Places browser opens in document flow.

The latest navigation authority is [the user’s Tailscale screenshot](references/tailscale-navigation-preference.png), measured against its live documentation layout. This supersedes the earlier 1200px cap and blue directory links while retaining classic article typography.

## Visual authority and verification

[Preferred reference](references/locator-map-preference.png) establishes the classic typography, Places browser, quiet sidebar and locator-map treatment. Its duplicated Notes/Travel notes and fixed six-slot grids were superseded by the later visit and [adaptive-album requirements](adaptive-cancellations.md).

See the [implementation goal](implementation-goal.md), [design QA](../../design-qa.md), and [verification report](verification/validation.md). Reviewed captures are in `verification/`. This is a local implementation; production deployment remains deferred.

## Data and authoring

[Start here](../../vault/Start%20here.md) documents the Obsidian workflow, including **Edit expected cancellations**. IDs are managed automatically, while names remain editable. Visit impressions, multiple photos, original location text, stable links and historical reports are preserved.

- [Cancellation layout and matching](adaptive-cancellations.md)
- [State albums and Associations](state-pages-and-associations.md)
- [Location reports, imports and optional facts](location-model.md)
- [Map sources and regeneration](map-sources.md)
- [Fictional preview assets](yellowstone-preview-assets.md)

The real 429-place vault remains blank. Fictional Yellowstone has two visits, six distinct cancellations and example Associations; Moores Creek has one visit and one cancellation. Georgia has two fictional photographed main stamps to illustrate the state gallery. Edge cases live only in `.qa/vault`.

## Continue locally or remotely

```sh
npm ci
npm test
npm run build
npm run check
npm run qa:fixture
npm run qa:check
node scripts/serve.mjs --host 0.0.0.0 --port 8766
# Separate terminal, fictional preview:
node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767
# Both servers running, installed Chrome:
QA_CHROME=1 npm run qa:browser
```

Maps and sample assets are checked in; ordinary builds require no map-service access. Rebuild the QA fixture after code changes. Do not copy its invented collection data into `vault/`.

[Historical handoff and earlier mockups](handoff-history.md) retain the design history and original 11 mockups. The old modern-documentation and photo-led directions are not the current target.
