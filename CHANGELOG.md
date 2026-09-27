# Changelog

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
