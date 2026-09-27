# Web app architecture decision

The prototype keeps The Stamp Book's existing reader design and replaces the authoring/runtime dependency on an Obsidian vault with a focused Node service, SQLite database, and browser editor. Markdown remains an import format, not the ongoing editing workflow. This experiment lives on a separate Git worktree and branch; it does not replace the static site.

## Why not MediaWiki?

MediaWiki already supplies mature page history, permissions and visual editing. VisualEditor is bundled with MediaWiki and its core can also run independently. It is a credible choice for an encyclopedia with broad community editing. [VisualEditor documentation](https://www.mediawiki.org/wiki/VisualEditor), [extension installation](https://www.mediawiki.org/wiki/Extension:VisualEditor).

The Stamp Book instead has a small, structured domain: expected cancellations, repeat collected impressions, dates, visits, trips, location reports, and a few prose sections. A wiki implementation would still need custom forms/extensions and templates to model that domain and retain the approved albums. MediaWiki recommends MariaDB; its SQLite documentation calls support second-class and lists extension compatibility issues. [Installation guidance](https://www.mediawiki.org/wiki/Manual:Installing_MediaWiki/en), [SQLite support](https://www.mediawiki.org/wiki/Manual:SQLite/en).

**Decision:** borrow the useful Wikipedia workflow—Edit, Preview, Save, History and Restore—without adopting or forking MediaWiki. This is an architectural judgment about the maintenance and integration burden, not a claim that MediaWiki cannot support the application.

## Editor and data model

Tiptap works in vanilla JavaScript and supplies a schema-based editor on ProseMirror. It fits the current frontend without a framework rewrite. Keep the toolbar small: emphasis, headings, lists, links and undo/redo. A visit's date, a stamp's collection state and a trip association belong in ordinary labeled fields, not hidden editor markup. [Vanilla JavaScript integration](https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript).

Tiptap recommends JSON as its persisted document representation. Store editable documents with a format version; generate or sanitize HTML at the server boundary for display. Local editor assets should be bundled, avoiding a hosted editor dependency. Lexical was considered: its modular framework is capable but requires more assembly for this particular editor. [Tiptap document model](https://tiptap.dev/docs/editor/core-concepts/introduction), [Lexical overview](https://lexical.dev/).

The intended durable model separates places, expected stamp definitions, collected impressions, visits, trips, and uploaded assets. The primary cancellation remains first in the expected list; collecting it repeatedly must not create new expected definitions. Preserve imported IDs and source data so migration can be audited. Rich prose remains independent of layout. Associations is simply another prose section with ordinary inline links.

Saves should be transactional, produce immutable history snapshots, and check the version being edited to prevent silently overwriting another browser's changes. Restore should append a new revision rather than erase history. These protections are useful even for a single owner with a laptop and phone; live collaborative editing is unnecessary.

## Runtime and deployment

One Node process serves the approved reader pages, editor assets and same-origin API. SQLite plus an uploads directory live on one persistent local volume. Keep a single application replica and short write transactions; SQLite is a good fit for this small collection and modest write concurrency. Do not put a WAL database on a shared network filesystem or distribute replicas around a shared DB file. [SQLite appropriate uses](https://www.sqlite.org/whentouse.html), [WAL constraints](https://www.sqlite.org/wal.html).

The container uses Node 24 on Debian slim. Local prototype development began on Node 22.23.2, where `node:sqlite` is experimental; do not mistake local tests for validation of the container runtime. The built-in driver avoids native npm-addon compilation. Pin the tested image digest for a production release and retest runtime upgrades. [Node SQLite API and version history](https://nodejs.org/api/sqlite.html).

Backups must include both a consistent SQLite snapshot and uploaded files. Copying only a live `.sqlite` file can miss committed WAL changes. Use the application backup command and test restore into a fresh data directory. [SQLite backup API](https://www.sqlite.org/backup.html).

## Phone use

Start with responsive editing and a PWA rather than a separate native app. The same authenticated API can later support a companion client. A manifest, icons and service worker can make the app installable and provide a useful offline shell; they do not by themselves create safe offline editing or sync.

Preserve unsaved local drafts and explicitly report failed saves. Automatic queued writes, attachment upload recovery and cross-device conflict merging are separate future work. PWA installation/service workers require HTTPS outside localhost; an HTTP LAN preview is not a phone PWA installation test. [PWA installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [service worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## Prototype boundary

The useful proof is import → edit prose → record a visit/cancellation → save → restart → read the saved page → inspect and restore history. Preserve the existing state/region albums, compact location details, maps and cancellation hierarchy throughout. Production confidence additionally requires migration checks, backup/restore verification, secure deployment, upload limits and mobile browser testing. This document describes the design intent; the deployment guide and test results identify what was actually exercised.
