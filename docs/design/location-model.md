# Location model and display decisions

Defined before implementation and now implemented. Existing place notes require no bulk migration.

## Identity and history

`stamping_locations` is an optional list within a place note. Each location has an automatically generated `id`, editable `name`, optional `aliases` and `maps_url`, and an append-only `reports` list. Names are for authors; IDs are managed by Templater. Renaming adds the former name to aliases. A collected stamp may have `location_id` plus the existing `location` string, which remains the historical name captured when it was collected. Legacy free-text locations still render; exact, unambiguous name/alias matches may link them to location details without rewriting their text.

Visits optionally gain an automatically generated `id` when first used by an observation. Reports reference `visit_id`; the visit remains the only source of its date. Changing a visit date changes the displayed observation date. New stable visit anchors use IDs; legacy date/index anchors are retained as aliases for existing links.

## Reports

Each report has an automatically generated `id`, `origin: authored|imported`, `availability: available|seasonal|unavailable|moved|unknown`, `access`, `notes`, and a `stamps` list. Each available stamp has `name`, `type: main|sub`, and its own `availability`. Either `source: {url, checked}` or `visit_id` is required, never both. URLs must be HTTP(S); checked dates must be real ISO dates. A visit observation cannot contain a second date.

The latest appended authored report is the displayed report; otherwise the latest appended imported report is displayed. Report order expresses revisions, not the visit's chronological order. Older reports remain inspectable, including conflicting availability claims. A complete report is a snapshot; when entering an update, Templater pre-fills the prior selected report. Removed stamps remain in previous reports. Location-wide and stamp-specific availability are shown independently.

Imports use `mergeLocationImports(place, incoming)` from `src/locations.mjs`: known location IDs match explicitly, never by fuzzy names. Existing names, aliases, maps links, authored reports, visits, and collection snapshots are never replaced. Incoming reports must have source provenance and `origin: imported`. Repeated identical reports are ignored; changed reports must carry a new report ID, otherwise the merge fails rather than overwrites history. Unknown location IDs add a location. Importers must retain stable location IDs and mint report IDs per revision. There is no automatic scraper or production import scheduled by this change.

## Optional facts

Place frontmatter may include `area` (text with units), `established` (ISO date), and `map` (attachment wikilink). These are author-supplied factual fields, not inferred from mockups. States and official resource URLs retain their existing sources. Missing fields are omitted.

## Collection and responsive decisions

The sidebar uses the [adaptive cancellation album](adaptive-cancellations.md): the first expected entry has its own primary square and collection-date panel; the remaining main stamps and substamps use an adaptive album capped at nine additional square slots. Repeat impressions remain grouped in closed cancellation details. Every collected impression, photo, location snapshot and visit link is retained. Missing photos and uncollected expected entries are distinct.

Stamping locations are a closed native disclosure with only its label and count visible. Expanding reveals reports, access information, provenance and history. Direct links reveal the relevant disclosure automatically.

Mobile order, confirmed by the user: title, cancellation album and details, stamping locations, visits, place notes, park facts. Directory navigation expands in normal document flow at tablet widths. Below 720px, the sidebar joins that reading order; desktop keeps a broad reading column inside the responsive Tailscale-style frame.

## YAML example (documentation only)

```yaml
stamping_locations:
  - id: generated-location-id
    name: Visitor centre
    aliases: [Former visitor centre name]
    reports:
      - id: generated-report-id
        origin: authored
        availability: seasonal
        access: Ask at the information desk.
        stamps:
          - name: Park cancellation
            type: main
            availability: available
        source:
          url: https://www.nps.gov/
          checked: '2026-09-26'
        notes: Confirm opening hours before visiting.
```

For an observation, replace `source` with `visit_id` pointing to a visit's managed ID. Templater makes these connections; the example is not something authors must type.

Import a JSON array of locations and published reports explicitly with:

```sh
node scripts/import-locations.mjs 'vault/Places/Place.md' reports.json
```

The command validates the complete merged place before writing, preserves the Markdown body and unrelated properties, and replaces the file atomically. It does not fetch information or choose matches automatically. Imports with reused-but-changed report IDs fail rather than overwrite a previous report.

New visits and collected stamps also receive automatic IDs, giving their canonical links stability across date changes and reordering. Legacy date/index anchors remain on the page for compatibility. Editing a legacy visit through Templater assigns identities to that visit and its stamps and retains the previous date/index anchors in `anchor_aliases`. Direct manual reordering or date edits of unconverted legacy records still use the original date/index convention.
