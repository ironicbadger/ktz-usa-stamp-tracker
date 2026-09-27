# Changelog

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
