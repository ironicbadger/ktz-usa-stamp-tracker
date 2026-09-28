# Changelog

## 1.2.8

- Merge reader search and command actions into the existing top-nav search box, with click, typing and Command-K / Control-K entry points.
- Includes Trips below Visits from 1.2.7. No database changes.

## 1.2.7

- Place the Trips section directly below Visits on desktop and mobile place pages.

## 1.2.6

- Draw a continuous focus ring around the entire header search control so the Search button cannot obscure the input outline.
- Includes the command palette, trip context and simplified dates from 1.2.5. No database changes.

## 1.2.5

- Simplify the featured stamp collection date to a single line in a consistent font size.

- Add a Command-K / Control-K search and action palette across the reader and editor, with navigation, page search, creation, contextual editor actions and field focusing.
- Show linked trips prominently on place pages, with explicit trip labels on visits. Hide the section when no visits belong to trips.
- No database or schema migration.

## 1.2.4

- Group trips by year, newest first, with ISO dates before names. Use an optional authored start date or the earliest linked visit; keep undated trips last.
- Reject incomplete years in editor and API saves, and display stored years with four digits.
- No database or schema migration.

## 1.2.3

- Add a prominent Add trip action to the Trips page and the top of the editor catalogue.
- Open a blank trip editor directly, retain that destination through sign-in, and return to the readable trip after saving.
- No database or schema changes.

## 1.2.2

- Open cancellation photos in an accessible in-page viewer with collection date, stamp details, visit notes and navigation between photos.
- Size the secondary cancellation grid to its actual rows while keeping individual stamps square.
- No database or schema changes.

## 1.2.1

- Rebrand the reader, editor, sign-in screens, browser titles and installed PWA as Stampendium.
- Refresh offline caches so previously cached pages adopt the new branding.
- Preserve database filenames, volumes, existing URLs, authentication settings, theme preferences and recovery drafts. No data or schema migration.

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
