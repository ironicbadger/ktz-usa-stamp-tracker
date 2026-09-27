# Browser authoring

Open `/edit/` and sign in with the configured editor password. The public reader also has **Edit this page** and **History** links. The editor catalogue includes places, trips and regions; search by name or create a place/trip.

## Edit, preview, save

A page's text uses a visual editor with bold, italic, headings, lists, links and undo/redo. Associations is a separate text area for books, music and other connections; a review is an ordinary inline link. The reader layout itself is not a free-form page builder. Less frequently changed place details sit in a collapsed section on existing pages.

Write an optional edit summary and choose **Preview** to see the reader page without publishing. **Save changes** validates the complete record and appends a revision. Check the saved confirmation; local typing alone does not publish. **Jump to save** reaches the actions without a floating panel covering fields.

## Visits and cancellations

Add a visit with its date, optional trip and short rich-text notes. Add each collected cancellation beneath that visit. Select an expected cancellation when it is known, or record an unlisted one by name and type. The visit supplies its date. Photographs can be selected from files or the phone's image picker/camera where supported; the server decodes, rotates and optimizes raster uploads.

The expected-cancellation list is independent of visits. Its first entry is the primary large square; use the up/down controls to reorder it. Additional expected cancellations remain separate from repeated impressions collected on later visits. An unspecified list stays unspecified unless you add entries.

Existing photos, legacy free-text locations, extra imported fields and old impression anchors are preserved. Removing an item edits the current draft; past saved revisions remain available. A referenced visit, location or expected cancellation cannot be removed in a way that leaves the record invalid: saving reports the problem.

## Stamping locations

Locations are optional. Their old reports are shown read-only; add a new report based on a dated visit or a published source and checked date. Include access notes, availability and relevant expected cancellations. This preserves prior reports and authored precedence rather than silently replacing them. You can remove an empty location draft before its first report.

## History and drafts

History lists revisions with timestamps and summaries. **View this revision** previews an older version; **Restore this revision** creates a new revision containing it. History is append-only.

The browser keeps a recovery draft on the current device. After a reload, explicitly restore or discard it. If another tab/device saved a newer revision, your old draft cannot overwrite it: the server rejects the stale save and the browser retains your draft. Compare with the current page and reconcile it manually. Drafts are not synchronized between devices and are not a backup of the server.

## Current limits

- One shared owner password; no individual accounts, roles, SSO or collaborative cursors.
- Online authoring. A secure-origin PWA can show previously opened reader pages offline, but cannot queue changes or synchronize them later. Local unsaved drafts can be recovered after reconnecting.
- Common rich-text paragraphs, headings, lists, emphasis, links and images are supported. Arbitrary Obsidian plugins, embedded widgets and Markdown tables are not a complete round-trip editing contract. Original imported source is preserved in the initial database revision for recovery.
- Rich-text undo applies within an editor instance. Adding/reordering structured entries rebuilds parts of the form and resets that editor's undo stack; recovery drafts and saved revisions are the broader safety net.
- Raster uploads are limited to 12 MiB and 60 million input pixels, then contained within 2400×2400 and converted to WebP. JPEG, PNG, WebP, GIF and AVIF are accepted; HEIC and arbitrary files/SVG are not supported. Animation is not preserved.
- Uploading and attaching a photo are separate steps. An upload from an abandoned draft may remain as an unreferenced asset. No garbage collector deletes it automatically; preserving history requires care before any future cleanup.
- No page-deletion UI or permanent history purge. No native phone application has been built. The same API and domain model could support one later if PWA capabilities prove insufficient.

Use HTTPS for real remote editing and phone PWA installation. The LAN demo is fictional and meant for reviewing the prototype. See [deployment](deployment.md) for persistence, backup and restore.
