# Changelog

## 1.2.0

- Compact per-visit stamp tables with spreadsheet paste, bulk type changes and removal.
- One editable stamp name, optional photos, actual collection dates and Main, Additional or Limited edition types.
- Choose a featured stamp; default to the first main stamp. Name-only stamps retain a blank photo slot.
- Collapse place details, associations, uncollected known stamps and stamping locations. Edit photos through the thumbnail or Edit photo action.
- Add sourced short descriptions and founding/authorization dates for all 429 catalogue places, plus verified acreage for 424. Apply missing facts explicitly with the included enrichment command; existing authored fields and collection data are preserved.
- Preserve legacy notes, locations, photo references and revision history. No schema changes. Older releases do not understand the new limited-edition type; keep this release or restore a matching backup when rolling back.

## 1.1.4

- Edit mode opens the current page and retains page search; saving returns to the reader.
- Upload photos to create collected cancellations directly, without expected entries.
- Edit actual collection dates independently from visit dates; new dates start blank.
- Preserve existing dates, release safeguards, themes and interactive maps. No schema changes.

## 1.1.3

- Clicking a place's locator map opens that place in interactive Google Maps, using its name and states instead of opening the static image.
- Add an explicit Explore interactive map link beneath the preview. No schema changes.


## 1.1.2

- Move the theme switch to a sun/moon icon in the top navigation, beside Edit mode.
- Remove the homepage title, subheading and separate actions row; tighten section spacing.
- Version reader/editor style URLs so updated styling is loaded on release changes.
- No database schema changes.


## 1.1.1

- Bring the homepage into the existing reader shell: shared top navigation, Places directory, typography, spacing and borders.
- Retain randomized featured parks, whole-book and regional progress, and both themes.
- No schema changes. Startup backups and safe migration checks are unchanged.


## 1.1.0

- A photographic featured-place home page, rotating on refresh without immediate
  repeats, and real overall / per-region main-stamp completion.
- Persistent dark and white light themes throughout reader, editor and offline UI.
- Real, credited NPS photographs bundled locally for Yosemite, Great Smoky Mountains,
  Olympic and Grand Canyon. The initial featured pool is these four pictured places;
  all 429 catalogue places remain available through region browsing and search.
- Seven verified pre-migration startup backups, including uploaded photographs;
  transactional, checksummed migration history and newer-schema rejection.
- Safe restore to a fresh directory, durable writes, graceful shutdown, versioned
  release validation and stale-editor update notices.
- Readable author attribution for new edits, while preserving stable OIDC identity
  and all prior revision history.

Schema 1 adopts the existing v1.0 database unchanged. Schema 2 adds a nullable
revision author-name column; prior revisions remain intact.
