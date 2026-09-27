> Production updates: use versioned images and follow [releases and recovery](releases.md). Startup keeps seven verified backups in `/data/backups` before migrations.

# Deploying The Stamp Book

The main branch contains the application. The server reads SQLite at runtime; it does not continually read or rewrite the Obsidian vault.

## Authentication

For password-free editor access, use [OIDC / Tailscale tsidp](oidc.md) and the standalone `compose.oidc.yaml`. It replaces the shared password; no application password file is required. The password setup below remains available for existing installations.

## Local run

Use Node 24 for parity with the container. The initial local environment used Node 22.23.2, where the built-in SQLite API emits an experimental warning.

```sh
npm ci
npm run web:build
npm run web:import -- --vault vault --data .web-data
APP_PASSWORD_FILE=/absolute/path/to/private-password-file DATA_DIR=.web-data HOST=0.0.0.0 PORT=8770 node web/server.mjs
```

Create a password file outside the repository containing a strong password of at least 12 characters, with permissions that restrict access to its owner. `APP_PASSWORD` is also supported, but avoid placing passwords in committed files or shell history. Import the bundled blank catalogue or point `--vault` at an existing vault. The importer creates `stamp-book.sqlite` and copies relevant assets into `uploads` within the data directory.

Import is explicit. Starting the server creates the database schema but does not automatically import a vault. The same source fingerprint can be imported again as a no-op, including after browser edits. A changed source cannot overwrite an existing populated database. Use a new data directory for a separate migration test.

## Container

The image uses `node:24-bookworm-slim`, installs locked dependencies, builds browser assets with `npm run web:build`, and starts `node web/server.mjs` as the non-root `node` user (UID 1000). The application binds to `0.0.0.0:8770` inside the container. `/healthz` is the container health check.

Create the password file outside the checkout, then set its absolute path:

```sh
export STAMP_BOOK_PASSWORD_FILE=/absolute/path/to/private-password-file
# Local reverse proxy is the default host binding.
export ORIGIN=http://localhost:8770
docker compose pull
docker compose run --rm stamp-book npm run web:import -- --vault vault --data /data
docker compose up -d
docker compose ps
```

The Compose secret mounts that file at `/run/secrets/app_password`; it is not baked into the image. Docker Compose file secrets are mounted files, not an encrypted secret vault. Ensure the file is readable by UID 1000 inside your container runtime, while restricting host access appropriately.

The default host binding is `127.0.0.1:8770`. To expose the app on your LAN, set both the bind address and its actual browser origin before starting:

```sh
export STAMP_BOOK_BIND=0.0.0.0
export ORIGIN=http://YOUR-LAN-IP:8770
docker compose up -d
```

Use the actual full origin, including scheme and port. The database and uploads live together in the `stamp-book-data` named volume. Docker initializes a new named volume from the image directory with its UID 1000 ownership. An existing bind-mounted directory instead needs ownership/permissions allowing UID 1000 to write. Do not solve this by running the whole app as root.

The bundled vault is an initial migration source only. To import a different vault, mount it read-only and use its container path:

```sh
docker compose run --rm -v /absolute/path/to/vault:/import:ro stamp-book \
  npm run web:import -- --vault /import --data /data
```

Run one replica against one local SQLite volume. Do not attach the same database volume to independently deployed app replicas or a network filesystem. The small single-owner workload does not need a separate database server.

## HTTPS and phone installation

Put the container behind your existing HTTPS reverse proxy and set `ORIGIN=https://your-hostname`. Preserve the original host/protocol forwarding expected by your proxy configuration. HTTPS enables secure cookies and the browser capabilities required for an installable PWA. Plain HTTP on another machine's LAN IP is useful for layout testing, but does not establish that phone installation or offline capabilities work.

The app's mobile UI and draft recovery are distinct from automatic offline synchronization. Do not assume unsent edits have reached the server; check the saved state. A native companion app and background sync are outside this prototype.

## Backup and restore

The application backup command produces a consistent database snapshot and includes uploaded assets. The backup destination must be a new directory outside the data directory; restore refuses nonempty destinations and checks database integrity plus uploaded-file checksums. Keep backups outside the data volume and copy them to a separate machine/storage system. Do not copy just the live SQLite file: committed writes may still be in its WAL.

For a simple predictable backup, stop writes while taking it. The server can be stopped without deleting its volume:

```sh
docker compose stop stamp-book
# /absolute/path/to/backups must be writable by container UID 1000.
docker compose run --rm -v /absolute/path/to/backups:/backups stamp-book \
  node web/backup.mjs backup --data /data --out /backups/stamp-book-2026-09-27
docker compose start stamp-book
```

Test a restore into a new empty directory/volume first. Do not restore over a running app or treat a successful backup command as proof of recoverability:

```sh
# Local example: destination must be empty.
node web/backup.mjs restore --from /absolute/path/to/backups/stamp-book-2026-09-27 \
  --data /absolute/path/to/empty-restored-data
```

Start a separate server against the restored data, verify representative pages, uploaded images and history, then switch deployment only after the verification succeeds. `docker compose down` retains the volume; `docker compose down -v` deletes it and should not be used for routine restarts.

## Validation status

The Linux Node 24 image passed build, import, authenticated editing, restart persistence, revision restore, image upload and backup/restore checks. See [container verification](container-verification.md) for the exact tested image and limits. A successful macOS Node 22 test is not a substitute for testing the Node 24 Linux image. Pin the image to a tested digest before production deployment.

## CI images and deployment artifacts

App CI tests every pull request and main push. Successful main pushes and `v*` tags publish multi-platform images (linux/amd64 and linux/arm64) to GHCR. The `main` tag tracks the current application; `sha-<full commit>` identifies a build. The deployment artifact includes Compose, this guide, configuration examples and an `image.env` pinning the published digest. Copy its `STAMP_BOOK_IMAGE` value into `.env` to deploy that exact build.

Before upgrading, back up your data, then run `docker compose pull` and `docker compose up -d`. Keep the previous image digest and backup for rollback; an older image may require restoring its corresponding database backup after schema changes. Never delete the data volume during an upgrade.

To build locally instead of pulling the published image:

```sh
docker compose -f compose.yaml -f compose.build.yaml build
docker compose -f compose.yaml -f compose.build.yaml up -d
```

For initial setup copy `.env.example` to `.env`, set the password file path, bind address and public origin, and explicitly import the bundled catalogue once. The release artifact works without cloning the repository.
