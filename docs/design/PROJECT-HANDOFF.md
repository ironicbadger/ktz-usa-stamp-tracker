# Project continuation

Repository: https://github.com/ironicbadger/ktz-usa-stamp-tracker

Read [the design handoff](README.md) and its latest three mockups before any UI work.

## Working baseline

A static Node.js generator renders 429 blank place notes, nine book-region pages, search, backlinks, visits, collected stamps and automatic trip pages. The vault is the database. Authors use vanilla Obsidian plus Templater and Obsidian Git; no custom editor.

Place frontmatter contains `title`, `park_code`, `states`, `passport_region`, and `visits`. Each visit stores `date` once, optional trip wikilink, notes and a stamps array. Each stamp has `name`, `type: main|sub`, optional `location`, `photos` attachment wikilinks and `notes`. Multiple visits and main/sub stamps are supported. Trip notes optionally add custom prose; visit references populate their children automatically. Visit-history links target the relevant in-page visit.

All real place notes are blank for the author. Do not generate fictional collection records, filler or cutesy prose. Official NPS links exist in the catalogue. Region maps are optional supplied images; generated locator maps in the design references are not production geography.

## Files and commands

- `src/content.mjs`: content validation, wikilinks, backlinks and trip/visit/stamp model.
- `src/site.mjs`: site rendering.
- `static/site.css`, `static/app.js`: styling and browser interactions.
- `scripts/build.mjs`, `scripts/serve.mjs`, `scripts/check.mjs`: build, preview and link validation.
- `data/catalogue.json`: place catalogue and NPS resources.
- `vault/Places`, `vault/Regions`, `vault/Trips`, `vault/Attachments`: authored content.
- `vault/Scripts/stamp_book.js`, `vault/Templates`: authoring helpers.
- `.github/workflows/site.yml`, `wrangler.jsonc`: CI and Cloudflare plumbing.

Run `just setup`, then `just dev` (localhost:8766) or `just lan` (0.0.0.0:8766). `just check` runs tests/build/link checks. `just build` builds static output. `just obsidian` opens the vault on macOS. See the root README for deployment details. The old host's LAN URL is not portable; use the new host's address.

Templater is pinned to 2.20.0 and Obsidian Git to 2.40.0. Native visit/stamp creation was tested with Obsidian 1.12.7 in an isolated QA vault; latest Templater at that time required a newer Obsidian version. Plugin binaries are installed by setup and are not committed.

## Deployment status

Baseline commit: `c30f54360175153e96ef4a909b0cff14af06bf5d`.
Verified successful CI: https://github.com/ironicbadger/ktz-usa-stamp-tracker/actions/runs/36263264512

The baseline passed 10 tests and built 444 HTML pages; generated-link validation checked 279723 targets. GitHub uploaded the static-site artifact. Cloudflare Pages configuration and local runtime were verified, but production deployment was intentionally skipped without credentials. The user will provide Cloudflare credentials later; do not ask for them during transfer. Do not claim the new site is deployed to Cloudflare. The original us-stamps site is a separate project and should not be changed by this handoff.

The design package contains proposals only; the new styling and stamping-location extension are not implemented. Resume from the user's next instruction.
