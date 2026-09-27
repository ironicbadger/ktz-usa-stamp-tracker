Catalogue provenance

- 429 unique park codes imported from the existing us-stamps.ktz.me catalogue (437 source rows). This preserves its scope, including affiliated sites and separately listed park/preserve units; it is not a claim of 429 current NPS administrative units or a complete stamper inventory.
- Official NPS homepages checked 2026-09-26. State coverage and resource links were refreshed where available. Old codes with shared/new NPS websites are resolved in catalogue.json. American Memorial Park is assigned MP. Ronald Reagan Boyhood Home has no verified dedicated NPS page, so no link is invented.
- Passport regions are separate from NPS administrative regions. Initial assignments use state groups plus explicit National Capital and cross-region overrides in seed-notes.mjs. Multi-region trails and other edge cases can be corrected in each note's passport_region field; their states remain complete independently.
- Geographic/NPS facts are prefilled. No visits, collection claims, photographs, descriptions, or travel experiences are imported.

Sources: https://www.nps.gov/subjects/gisandmapping/nps-maps.htm and https://americasnationalparks.org/passport-to-your-national-parks/passport-cancellation-locations/

Place-fact enrichment (2026-09-27)

- `park-facts.json` covers the same 429 catalogue entries, without changing catalogue scope. Short NPS introductions/summaries and original establishment/authorization dates are sourced per entry.
- Gross area in acres comes from the NPS June 30, 2026 report; source row names are retained. Multi-state rows are combined, as are Big Cypress Addition and Everglades Expansion according to the workbook footnotes. American Memorial Park uses the NPS Geodiversity Atlas.
- No acreage is invented for Ala Kahakai, Captain John Smith Chesapeake, Lewis and Clark, Selma to Montgomery, or Ronald Reagan Boyhood Home. These five records retain an explanation of the gap.
- Use `scripts/enrich-park-facts.mjs --data <directory>` for a dry run, then add `--apply` to fill missing fields with revision history. It preserves authored fields and never imports visits, collection claims or photographs.
