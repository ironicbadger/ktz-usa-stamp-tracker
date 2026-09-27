# Releases, upgrades and recovery

Production starts at **v1.1.0**. Use a version tag and pin its image digest in
production. `main` is a development channel, not an automatic update policy.
The app version is visible on the home page and `/healthz`; the database schema
version is independent. Release tags must match both package manifests. Never
move a released tag or edit an applied SQL migration; add a new migration and
release instead.

## Before every startup

Opening an existing database makes a complete, verified backup **before** any
schema or journal change. Backups live at:

```
/data/backups/startup-<UTC timestamp>-<unique suffix>/
  stamp-book.sqlite
  uploads/
  backup.json
```

Each backup is a consistent SQLite `VACUUM INTO` snapshot, including committed
WAL writes, plus all registered upload files. Database SHA-256, SQLite integrity,
foreign keys and asset checksums are checked before publishing the backup by
atomic rename. Files and directories are flushed to disk. The manifest records
app version, schema version and creation time. Keep the SQLite database and
uploads together.

The last **seven successful startup snapshots** are retained, including repeated
starts of the same app version. Page edit history is separate and remains
append-only without a seven-revision limit. Incomplete backups are never counted.
Pruning occurs only after successful migration; failed migrations may leave
additional backups so an unsuccessful restart cannot discard the recovery point.
Manual release backups outside this rotation are recommended before upgrades.

A failed backup, corrupt database, missing registered photo, altered migration
history, unsupported newer schema or failed migration prevents startup. Migrations
run in one transaction. The process entry point refuses to initialize a missing
database; a first installation must explicitly run the vault import. Imports never
replace existing edits. Do not automatically import or restore during an upgrade.

## Updating

1. Check the release notes. Take a manual backup / ZFS snapshot; verify off-host
   replication if protecting against host or pool failure.
2. Update the Compose image to `ghcr.io/ironicbadger/ktz-usa-stamp-tracker:vX.Y.Z@sha256:...`.
3. `docker compose pull stamp-book` then `docker compose up -d --no-deps stamp-book`.
4. Check health, version, login, collection and the newly created backup. Leave
   other services alone. Give shutdown 60 seconds to finish in-flight requests.

There is no automatic reload of an open editor. It announces a new app version;
recovery drafts remain on the device. Stale versioned editor writes are rejected
rather than interpreted by a different release. Sign in again after a restart.
Optimistic revision checks still prevent Alex and Cat from overwriting one
another's saves. History shows the author's display name and retains their
issuer/subject identity in the database. Older history is preserved unchanged.

## Restore (app must be stopped)

Never copy over a live database or discard its WAL. Restore into a **new, empty**
directory. Use the backup's matching release, or a newer release supporting its
schema; a binary rollback alone is not a database rollback.

For appnv the dataset root is `/mnt/nvmeu2/appdata/apps/stamp-book`. With the desired
release image in `$IMAGE` and chosen directory name in `$BACKUP`:

```sh
cd /root
docker compose stop stamp-book
# Mount the whole dataset for access to both source and fresh destination.
docker run --rm --user 1000:1000 \
  -v /mnt/nvmeu2/appdata/apps/stamp-book:/collection \
  "$IMAGE" node web/backup.mjs restore \
  --from "/collection/data/backups/$BACKUP" \
  --data /collection/restored-data
```

The dataset root must allow UID 1000 to create the destination, or create an empty
UID-1000-owned staging parent first and use that path. Restore verifies database
and asset checksums, stages a full copy and atomically renames it into place.
Then change the Compose data bind to `restored-data`, validate, and start the
matching image. Keep the original `data/` directory and its backups untouched
until recovery has been inspected. Restoring an older snapshot intentionally
returns to that point in time; review newer edits before switching.

Dataset-local backups protect against update mistakes, not destruction of the
storage pool. Appnv's dataset is covered by meeseeks' recursive appdata zrepl
jobs; verify successful replication rather than assuming configuration is proof.
