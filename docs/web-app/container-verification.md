# Container verification

Verified on 27 September 2026 using the existing OrbStack installation and Docker 29.4.0. Only prototype-named containers/volumes were created. The reader/editor previews on ports 8766, 8767 and 8770 were not reused as test storage.

Final image: `stamp-book-prototype:qa`, image ID `35506cc45dd2`; base `node:24-bookworm-slim`, resolved digest `sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6`.

| Check | Result |
| --- | --- |
| Build from lockfile | `npm ci` and `npm run web:build` passed inside Linux image |
| Runtime | Node 24.21.0, UID 1000 |
| Linux test suite | Generated populated QA fixture, then 82 tests passed, 0 failed, 0 skipped |
| Explicit blank catalogue import | 438 records, zero imported images |
| Password file | Read-only mounted password file accepted; secret was not printed or baked into image |
| Authentication and editing | Login, authenticated record fetch, rich-text update and revision increment passed |
| Reader update | Saved text immediately visible on public place page |
| Restart persistence | Saved text/revision survived full container restart |
| Revision restore | Earlier revision restored as a new revision |
| State browsing | Georgia route returned HTTP 200 |
| No vault dependency | Renamed `/app/vault` inside throwaway container, restarted server, then read and restored records successfully |
| Health | `/healthz` returned SQLite status; Docker reported healthy |
| Image upload | JPEG accepted, processed to WebP and served successfully |
| Backup/restore | Stopped app, backed up to separate volume, restored into fresh volume; 438 records, 6 Yellowstone revisions and 2 uploaded images preserved; restore verified asset checksum |

The isolated test server was bound to `127.0.0.1:8772` and stopped cleanly after verification; prototype-only named volumes remain as backup evidence. Fixture generation/tests ran in a separate disposable container as root because they write under the image’s root-owned source directory; the app itself ran and was tested as UID 1000. The design docs were mounted read-only solely to supply fixture images, and are excluded from the application image. Password and machine-readable scratch results are under ignored `.qa/container`; credentials must not be committed. The database is synthetic test storage, separate from the user's vault and the populated demonstration database.

This verifies container mechanics and API behavior, not phone installation, browser editor ergonomics, or public HTTPS deployment. The final image was rebuilt after editor integration and all listed API/restart/vault-independence/backup smoke checks were repeated. Raw final Linux test output is in ignored `.qa/container/final-linux-tests.txt`. Further implementation changes require another image rebuild.
