
default:
    @just --list

# Install exact dependencies and the pinned Obsidian Templater plugin.
setup:
    npm ci
    node scripts/setup-obsidian.mjs

# Validate notes, run tests, and check the generated website.
check:
    npm test
    npm run build
    npm run check

# Build the static website into dist/.
build:
    npm run build

# Rebuild changed notes and serve the local site (localhost:8766).
dev:
    npm run dev

# Live preview accessible over the LAN.
lan:
    npm run dev -- --host 0.0.0.0

# Serve the existing build without watching.
preview:
    npm run preview

# Test the built site with Cloudflare's local Pages runtime.
cloudflare: build
    npm run cf:preview

# Deploy when CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are set.
deploy: check
    npm run deploy

# Open the content vault in Obsidian (macOS).
obsidian:
    open "obsidian://open?path={{justfile_directory()}}/vault"

# One-time Pages project creation after credentials have been supplied.
cloudflare-create:
    npx wrangler pages project create ktz-usa-stamp-tracker --production-branch main
