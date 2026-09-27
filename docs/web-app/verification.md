# Prototype verification and acceptance

Verified 27 September 2026. The experiment is on `prototype/sqlite-web-app` in `/Users/alex/git/ib/stamp-book-web-app`, based on committed approved-site baseline `a162b30`. The original checkout remains `/Users/alex/git/ib/ktz-usa-stamp-tracker` on `design/modern-stamp-book` with its previews on 8766/8767. No original vault changes were made.

## Result

A working SQLite-backed browser-authoring prototype is running on **http://10.42.7.224:8770/**, with the editor at **/edit/**. The approved reader design remains. The current demonstration contains 429 catalogue places, nine regions, one fictional trip, and sample collections at Yellowstone, Moores Creek and two Georgia sites. Browser-test-created pages were archived outside the live database before preparing this clean demonstration. Yellowstone was then saved through the real editor and its visible About text, Associations, visits and six cancellation slots were compared before/after: unchanged.

The local process is managed by the separate launch agent `me.ktz.stamp-book-web-prototype`. Its password is in the ignored owner-readable `secrets/editor-password` file; it is not in Git or this report. Database/uploads are in ignored `.web-data`. Restart only this prototype with `launchctl kickstart -k gui/$(id -u)/me.ktz.stamp-book-web-prototype`; do not reuse the old previews' service labels.

## Evidence

| Requirement | Current evidence |
| --- | --- |
| Separate worktree and committed baseline | Git worktree list shows the original checkout and dedicated prototype branch; original remains clean at `a162b30` |
| Proportionate architecture research | [Decision record](architecture.md) cites current MediaWiki, VisualEditor, SQLite, Tiptap, Lexical and PWA documentation; focused app selected instead of a fork |
| SQLite is runtime truth | Normalized node/visit/impression/expected-stamp/location/report tables and revision snapshots; container reads and edits after `/app/vault` is removed |
| Lossless initial migration | Populated fixture import/reopen compares every source data/body field and exact HTML for all **518** fixture pages, plus search; absent expectations and extra fields preserved |
| Repeatable import | Same source import is an idempotent no-op after edits; changed imports refuse to overwrite a populated DB; invalid source leaves no partial migration |
| Real browser authoring | **26 LAN Chrome checks**: rich text/inline link, trip creation, visit, expected cancellation, impression, photo, location report, preview, save, history preview/restore, drafts and conflicts |
| Editor safety | Canonical Tiptap JSON regenerated server-side; forged HTML ignored; invalid dates/links/oversized bodies rejected; CSRF, exact Origin, authentication and rate-limit tests pass |
| Revision/persistence | Transactional saves and stale-version rejection; restore appends history; reopened DB, Node server restart and full container restart retain data |
| Original reader behavior | **52 existing browser checkpoints** against a separate SQLite-backed fixture server, including state isolation, filters, primary + adaptive square slots, maps, locations, links and eight viewport widths |
| Mobile usability | 320px/390px editor and 320–1920px reader checks; inspected real captures; no horizontal overflow. Save actions remain in normal flow and existing place metadata starts collapsed |
| Accessibility | Nine reader axe scans and one editor axe scan, zero violations; no browser JavaScript errors. These are scoped automated checks, not a full certification |
| PWA foundation | **Five checks**: secure-context registration/manifest/icons; reader cache; API/editor exclusion; offline cached reading with notice; uncached offline fallback; LAN HTTP explicitly not installable evidence |
| Container deployment | Linux Node **24.21.0**, app UID1000, persistent volume, password-file secret, health, import, editor API, upload and restart tested; [container report](container-verification.md) identifies final image |
| Backup/restore | Fresh restored container volume retained 438 records, six Yellowstone revisions and two uploaded images; database integrity and image checksums verified |
| Test suite | **82/82 passed on macOS Node22.23.2 and Linux Node24.21.0**, with no skipped tests in either final run |

The full test suite includes eight real HTTP tests in addition to the persistence/import tests and existing collection tests. Reader regression uses a separate temporary database and port8773; it shuts that server down after the run. Container validation used separate volumes and port8772, now stopped. Neither testing path shares the live demo database or the old preview storage.

## Reviewed screenshots and raw results

Actual clean demonstration captures, all opened and inspected:

- [Desktop editor](verification/yellowstone-editor-desktop.png)
- [Mobile editor](verification/yellowstone-editor-mobile.png)
- [Mobile visit authoring](verification/yellowstone-visits-mobile.png)
- [Desktop reader](verification/yellowstone-reader-desktop.png)
- [Mobile reader](verification/yellowstone-reader-mobile.png)

Raw evidence in `verification/`: `unit-results.txt`, `linux-tests.txt`, `reader-results.json`, `editor-results.json`, `pwa-results.json`, `demo-results.json`. The browser test records reference disposable QA pages; those pages were archived before final demo preparation. No credentials or DB files are committed.

## Reproduce

```sh
npm ci
npm run web:build
npm run qa:fixture
npm test
# With the unchanged blank static preview on 8766:
node scripts/verify-web-reader.mjs
# With a disposable editable web server on 8770 and a configured password file:
APP_PASSWORD_FILE=/absolute/path/to/password-file node scripts/verify-web-editor.mjs
node scripts/verify-web-pwa.mjs
```

The editor verification creates clearly labeled QA pages and a trip. Run it against disposable data, not a personal production collection. The PWA verification uses localhost (a secure-context exception) and checks the LAN origin separately. Container instructions are in [deployment](deployment.md); the Docker image excludes design documentation, so a populated QA-fixture test inside that image needs those fixture assets mounted read-only, as described in the container report.

## Practical limits and next steps

This is a verified prototype, not a claim of production completeness. Authentication is one shared owner password, with sessions and rate limits held in memory. Remote deployment needs HTTPS and a tested backup schedule. Phone installation has not been tested on physical iOS/Android devices; viewport checks are not a substitute. There is no automatic offline write queue, sync/merge engine, multi-user permissions, native companion app, or full support for every Obsidian extension. Common rich-text editing has broader recovery through revisions, but its undo stack resets when structural form changes recreate editor instances. See the [editor guide](editor-guide.md) for upload and draft details.

Recommended next work is a hands-on authoring review using the clean sample, then a real-content migration rehearsal and HTTPS phone/PWA test. If that experience works well, harden authentication and automated backup operations before moving the live site. Build a native companion only if the PWA proves unable to meet camera, offline or integration needs; the current API and structured model provide a reusable starting point.
