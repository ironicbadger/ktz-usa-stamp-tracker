# Stamp Book

A static stamp collection website authored in an Obsidian vault. Includes 429 blank place notes, nine book regions, search, visit history, trip pages, photos, and backlinks. No database or server is required.

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

Open `vault/` in Obsidian 1.12.2 or later, enable community plugins, and read **Start here**. Templater provides Record visit, Add stamp, Add stamp photos, Edit visit, and New trip commands. The Git plugin's **Commit-and-sync** sends edits to GitHub using your existing Git authentication. Site code and private Obsidian settings are not published.

Place notes have prefilled `title`, `park_code`, `states`, `passport_region`, and an empty `visits` list. Each visit stores its date once, optional `[[Trips/Trip name]]`, notes, and stamps (`name`, `type: main|sub`, optional location/notes, `photos`). Trip introductions are editable Markdown; matching visits populate automatically. Put photos in `vault/Attachments/`. A region's optional `map` property accepts an attachment wikilink. See [catalogue provenance](data/README.md) for scope and initial region assignments.

## Cloudflare Pages

GitHub Actions tests and builds every push to `main` and every pull request, checks generated links, and uploads `dist` as an artifact. Deployment is skipped until credentials exist.

1. Add repository Actions secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages → Edit).
2. Create a **Direct Upload** Pages project named `ktz-usa-stamp-tracker`, production branch `main`; or set those environment variables locally and run `just cloudflare-create`.
3. Push to `main` or rerun the workflow. It deploys the verified build automatically.

`just cloudflare` runs Cloudflare's local Pages preview. `just deploy` validates and deploys locally when credentials are set. No Cloudflare credentials are stored in this repository.

Design decisions, mockups and remote continuation notes: [design handoff](docs/design/README.md).
