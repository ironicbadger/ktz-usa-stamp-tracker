# Browser authoring

Open `/edit/` and sign in using the configured password or OIDC provider. The public reader also has **Edit this page** and **History** links. On a readable page, either edit link opens that page directly. Page search remains available while editing, so you can switch to another place, trip or region. The catalogue also lets you create a place/trip.

## Edit, preview, save

A page's text uses a visual editor with bold, italic, headings, lists, links and undo/redo. Associations is a separate text area for books, music and other connections; a review is an ordinary inline link. The reader layout itself is not a free-form page builder. Less frequently changed place details sit in a collapsed section on existing pages.

Write an optional edit summary and choose **Preview** to see the reader page without publishing. **Save changes** validates the complete record and appends a revision. After a successful save, the app returns to that page in the reader so you can see the result. Local typing alone does not publish. **Jump to save** reaches the actions without a floating panel covering fields.

## Visits and stamps

Each visit has one compact stamp table. Enter a name, choose **Main**, **Additional**, or **Limited edition**, and optionally add photographs. The collected date defaults to the visit date and can be overridden per row. New visits start undated; uploading never inserts today's date. Short prose and inline links belong in the visit note below the table.

Use **Add row** for a name-only stamp, or expand **Upload several stamp photos** to create one row per image. Click a row's photo cell to add or remove photographs of that same stamp. Photos are decoded, rotated and optimized on upload.

**Paste rows** accepts tab-separated name, type and optional YYYY-MM-DD date columns copied from a spreadsheet. Invalid rows reject the whole batch. Check rows to change their type together or remove them together. Tab moves between the ordinary editable cells. On small screens the table scrolls horizontally within its own region.

Choose **Featured** on any row to put that stamp first on the place page and use it in state/region grids. Without an override, the first main stamp is featured. Selecting a collected impression also selects that impression's photograph and date. A stamp without a photograph has a blank square. Removing the featured row clears its override.

**Other known stamps** is a collapsed table for stamps you know exist but have not collected. A name and type are sufficient. **Record in visit…** moves a known stamp into the chosen visit table, keeping its identity. There is no separate expected-cancellation selector in the collected-stamp form. Renaming an existing linked stamp updates its known definition and linked visit rows; dates and photographs remain specific to each visit.

Legacy per-stamp notes, location text, extra imported fields, photos and anchors remain stored. They are no longer repeated as routine entry fields. Removing an item edits the draft; saved versions remain in History. Referenced visits/locations cannot be deleted if doing so would leave a report invalid.

## NPS place facts

**Place details & about**, **Associations**, and **Stamping locations** start collapsed. The facts section includes source links for imported details. Dates from the NPS chronology are labeled **Established / authorized**: its chronology includes original authorizations and predecessor designations, not exclusively the date of the current name.

`data/park-facts.json` contains sourced descriptions and dates for all 429 catalogue entries, and acreage for 424. Acreage comes from the June 30, 2026 NPS gross-acreage report, with multi-state rows and expressly listed additions combined. Four historic trails and Ronald Reagan Boyhood Home have no separately verified acreage in that report; their area remains blank. Source names, source notes and verification dates are retained in the data.

To fill missing fields in an explicitly chosen database, run:

```sh
node scripts/enrich-park-facts.mjs --data /path/to/data
node scripts/enrich-park-facts.mjs --data /path/to/data --apply
```

The first command reports proposed changes. Applying creates revisions and preserves authored facts, existing prose, visits and photos. It never runs automatically at app startup. Review the preview before applying it to a production database.

## Stamping locations

Locations are optional. Their old reports are shown read-only; add a new report based on a dated visit or a published source and checked date. Include access notes, availability and relevant expected cancellations. This preserves prior reports and authored precedence rather than silently replacing them. You can remove an empty location draft before its first report.

## History and drafts

History lists revisions with timestamps and summaries. **View this revision** previews an older version; **Restore this revision** creates a new revision containing it. History is append-only.

The browser keeps a recovery draft on the current device. After a reload, explicitly restore or discard it. If another tab/device saved a newer revision, your old draft cannot overwrite it: the server rejects the stale save and the browser retains your draft. Compare with the current page and reconcile it manually. Drafts are not synchronized between devices and are not a backup of the server.

## Current limits

- Password or OIDC authentication; no collaborative cursors or separate per-page permissions.
- Online authoring. A secure-origin PWA can show previously opened reader pages offline, but cannot queue changes or synchronize them later. Local unsaved drafts can be recovered after reconnecting.
- Common rich-text paragraphs, headings, lists, emphasis, links and images are supported. Arbitrary Obsidian plugins, embedded widgets and Markdown tables are not a complete round-trip editing contract. Original imported source is preserved in the initial database revision for recovery.
- Rich-text undo applies within an editor instance. Adding/reordering structured entries rebuilds parts of the form and resets that editor's undo stack; recovery drafts and saved revisions are the broader safety net.
- Raster uploads are limited to 12 MiB and 60 million input pixels, then contained within 2400×2400 and converted to WebP. JPEG, PNG, WebP, GIF and AVIF are accepted; HEIC and arbitrary files/SVG are not supported. Animation is not preserved.
- Uploading creates a draft cancellation with its photo attached; saving publishes it. An upload from an abandoned draft may remain as an unreferenced asset. No garbage collector deletes it automatically; preserving history requires care before any future cleanup.
- No page-deletion UI or permanent history purge. No native phone application has been built. The same API and domain model could support one later if PWA capabilities prove insufficient.

Use HTTPS for real remote editing and phone PWA installation. The local authoring preview uses an isolated production snapshot; changes there do not publish to production. See [deployment](deployment.md) for persistence, backup and restore.
