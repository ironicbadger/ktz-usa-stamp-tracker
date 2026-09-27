# The Stamp Book

The main branch is the deployable Stamp Book application.

The app uses **SQLite, a locally bundled Tiptap editor, and one Node container**. Reader pages retain the approved classic design. Edit prose, Associations, visits, expected cancellations, collected stamps, photographs and location reports in the browser; preview before saving, inspect history, and restore older revisions. Markdown/Obsidian is a one-time import source, not the runtime database or required editing interface.

## Run locally

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

Public reading is unauthenticated; editing uses a shared owner password with session and CSRF protection. The app is designed for a single owner. A responsive editor, recovery drafts, manifest/icons and cached offline reading form the PWA foundation. **Phone installation requires HTTPS; saving and opening the editor require a connection.** There is no automatic offline synchronization or native companion app yet.


## Container deployment

Download the deployment artifact from the **App CI** workflow, or use `compose.yaml` from this repository. Copy `.env.example` to `.env`, configure your password file and origin, then:

```sh
docker compose pull
docker compose run --rm stamp-book npm run web:import -- --vault vault --data /data
docker compose up -d
```

CI tests pull requests and publishes AMD64/ARM64 images to `ghcr.io/ironicbadger/ktz-usa-stamp-tracker` on main and version tags. Deployment artifacts pin the image by digest. One container serves the app; SQLite and uploads persist in the named volume. See the deployment guide for HTTPS, backups, upgrades and local image builds.

The legacy vault and static renderer remain available for one-time imports and regression checks (`npm run site:build`, `npm run site:check`); authoring now happens in the web editor.
