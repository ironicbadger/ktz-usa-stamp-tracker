# The Stamp Book — SQLite web app prototype

This branch is an isolated web-app experiment. The approved static site remains on `design/modern-stamp-book`; this work lives on `prototype/sqlite-web-app` in a separate Git worktree.

The app uses **SQLite, a locally bundled Tiptap editor, and one Node container**. Reader pages retain the approved classic design. Edit prose, Associations, visits, expected cancellations, collected stamps, photographs and location reports in the browser; preview before saving, inspect history, and restore older revisions. Markdown/Obsidian is a one-time import source, not the runtime database or required editing interface.

## Run the prototype

```sh
npm ci
npm run web:build
npm run web:import -- --vault vault --data .web-data
# Point to a private file containing an editor password of at least 12 characters.
APP_PASSWORD_FILE=/absolute/path/to/password-file npm run web:start
# Reader: http://localhost:8770/ ; editor: http://localhost:8770/edit/
```

Import never overwrites later browser edits. For a populated **fictional** demonstration, generate `npm run qa:fixture` and import `.qa/vault` into a fresh data directory instead of `vault`. Keep the database and uploads together on a persistent volume.

- [Architecture decision: focused app versus MediaWiki](docs/web-app/architecture.md)
- [Local/container deployment, HTTPS, backup and restore](docs/web-app/deployment.md)
- [Editor guide and limitations](docs/web-app/editor-guide.md)
- [Verification and prototype acceptance](docs/web-app/verification.md)

Public reading is unauthenticated; editing uses a shared owner password with session and CSRF protection. This is a personal prototype, not a multi-user publishing platform. A responsive editor, recovery drafts, manifest/icons and cached offline reading form the PWA foundation. **Phone installation requires HTTPS; saving and opening the editor require a connection.** There is no automatic offline synchronization or native companion app yet.

The original static-site workflow is retained below for reference and migration tests.

---

# Stamp Book

A static stamp collection website authored in an Obsidian vault. Includes 429 blank place notes, nine book regions, 56 state and territory albums, search, visit history, associations, trip pages, photos, and backlinks. No database or server is required.

## Local use

Install Node.js 22+ and [just](https://github.com/casey/just), then:

```sh
just setup       # dependencies and pinned Obsidian plugins
just dev         # http://localhost:8766; rebuilds on note changes
just check       # tests, build, and generated-link checks
just build       # static output in dist/
just lan         # preview on 0.0.0.0:8766
just obsidian    # open the vault on macOS
```

Open `vault/` in Obsidian 1.12.2 or later, enable community plugins, and read **Start here**. Templater provides Record visit, Edit expected cancellations, Add stamp, Add stamp photos, Edit visit, and New trip commands. The Git plugin's **Commit-and-sync** sends edits to GitHub using your existing Git authentication. Site code and private Obsidian settings are not published.

Place notes have prefilled `title`, `park_code`, `states`, `passport_region`, and an empty `visits` list. Each visit stores its date once, optional `[[Trips/Trip name]]`, notes, and stamps (`name`, `type: main|sub`, optional location/notes, `photos`). Trip introductions are editable Markdown; matching visits populate automatically. Put photos in `vault/Attachments/`. A region's optional `map` property accepts an attachment wikilink. See [catalogue provenance](data/README.md) for scope and initial region assignments.

## Cloudflare Pages

GitHub Actions tests and builds every push to `main` and every pull request, checks generated links, and uploads `dist` as an artifact. Deployment is skipped until credentials exist.

1. Add repository Actions secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages → Edit).
2. Create a **Direct Upload** Pages project named `ktz-usa-stamp-tracker`, production branch `main`; or set those environment variables locally and run `just cloudflare-create`.
3. Push to `main` or rerun the workflow. It deploys the verified build automatically.

`just cloudflare` runs Cloudflare's local Pages preview. `just deploy` validates and deploys locally when credentials are set. No Cloudflare credentials are stored in this repository.

Design decisions, mockups and remote continuation notes: [design handoff](docs/design/README.md).

## Design and location authoring

The classic article layout uses a collapsible Places browser, Tailscale-style navigation spacing, short inline visits, and a compact cancellation album above a sourced locator map. The first listed cancellation has its own large square and Last collected date panel; every additional box stays square in the grid below. The place’s optional top-level `stamps` list defines expected cancellations; repeat impressions share a slot, while all records remain accessible in closed details. Stamping locations are authored in the same Obsidian note through **Add or update stamping location**. See [Start here](vault/Start%20here.md) for the workflow and [location model](docs/design/location-model.md) for provenance, history, imports, and optional park facts.

Each state has a visual album at `/states/state-name/`, reached from the Places browser and region headings. Multi-state places appear in every relevant state album while keeping one canonical place page. Region and state albums share square stamp spaces and collection filters.

Write `## Associations` in a place note for free-form paragraphs about books, music, or other connections. It appears directly below Visits and accepts ordinary inline links to any site. The **Associations** template inserts the heading; an empty section stays hidden. See [state albums and Associations](docs/design/state-pages-and-associations.md).

For an isolated populated preview (fictional QA records only):

```sh
npm run qa:fixture
node scripts/serve.mjs --out .qa/dist --host 0.0.0.0 --port 8767
npm run qa:check
```

This creates `.qa/vault` and `.qa/dist`; it never populates the real `vault/` or normal `dist/`. Fictional stamp artwork is visibly marked SAMPLE or DESIGN TEST ONLY. Re-run `qa:fixture` after code changes to refresh that preview.

With the normal and isolated preview servers running, `QA_CHROME=1 npm run qa:browser` tests the layouts and core interactions using installed Google Chrome. Alternatively, run `npx playwright install chromium` once and then `npm run qa:browser`. Browser captures and raw results go to `.qa/`; the reviewed captures and validation report are retained in [docs/design/verification](docs/design/verification/validation.md).
