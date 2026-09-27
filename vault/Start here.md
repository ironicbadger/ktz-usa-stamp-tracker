# Stamp Book

1. Open a place in **Places**. Write general notes below its properties.
2. Run **Templater: Insert template** → **Record visit**. Enter the date, optional trip, and notes.
3. Run **Add stamp** for each main stamp or substamp. Choose the visit, then choose the expected cancellation or add a newly discovered one. You do not type its date again.
4. Copy photographs into **Attachments**. Select them in **Add stamp** or **Add stamp photos**.
5. Use **Edit visit** to change a date, trip, or write-up. **New trip** creates an editable trip introduction; linked visits populate its website page automatically.
6. Run **Git: Commit-and-sync** to send changes to GitHub. For local preview, run `just dev` from the repository, then open http://localhost:8766/.

On first opening, enable community plugins. `just setup` installs Templater and Git. Git uses the computer's existing GitHub authentication; automatic commit-and-sync can be enabled in its settings.

A `main` stamp fills the place's regional slot; a `sub` stamp appears on the place and trip pages. Multiple main stamps are supported. A filled slot does not mean every possible stamp has been collected.

## Expected cancellations

Run **Edit expected cancellations** in a place note to list the distinct cancellations available at that site. This works before your first visit and does not mark anything as collected. Add each cancellation by name and choose main stamp or substamp, then choose **Save expected list**. Choose an existing entry to rename it or change its type. IDs are managed automatically; you never need to type them.

The place's top-level `stamps` list describes expected cancellations. Each visit's separate `stamps` list records the impressions you actually collected. **Add stamp** connects the two lists automatically and can add a newly discovered cancellation to the expected list at the same time. Repeat impressions remain separate visit records but share one cancellation box in the album. Renaming an expected cancellation preserves the name recorded with older impressions.

Expected but uncollected cancellations have empty boxes. Collected cancellations without photographs have a distinct photo-needed state. A representative photograph is taken from the newest photographed impression. Keep the main cancellation first in the expected list: that entry always occupies the primary square. Its Last collected panel shows the latest impression date. The sidebar then shows up to nine additional cancellations; the complete record remains on the place page.

Existing notes without an expected list still work: their collected impressions are grouped by name and type, and the site does not pretend to know how many cancellations exist. Legacy impressions match a named expected entry only when that name and type identify it unambiguously. Unmatched old records are retained. An explicitly saved empty expected list differs from an unknown list.

Region notes can contain an introduction and an optional `map: "[[Attachments/map-photo.jpg]]"`. `[[Place links]]` become website links and backlinks. Content in Places, Trips, Regions, and referenced Attachments is public when deployed.

## Associations

In a place note, run **Templater: Insert template** → **Associations**, or type `## Associations` below the properties. Write a paragraph or two beneath it about books, music, or anything else you associate with the place or a trip there. Use ordinary inline Markdown links such as `[my review](https://example.com/book-review)` for a Perfect Prose review or any other page. Links are optional; no special book or music properties are needed.

This text appears directly below Visits on the place page, once rather than repeated in the general notes. Subheadings such as `### Books` can belong to Associations; the next level-one or level-two heading ends the section. An empty section is not displayed. General notes outside this section still appear under About this place.

## State albums

Click a state name in the Places browser or on a region page to open its own visual stamp grid. It includes every place assigned to that state, with the same collected and not-collected filters as a region album. A place spanning several states appears in each relevant album and keeps one place page. State pages are generated from the existing `states` properties; no separate state notes are needed.

## Stamping locations

Run **Add or update stamping location** in a place note to record where stamps can be found, even before you collect them. Choose an existing location to update or rename it. The prompts cover available stamps, availability, access notes, optional maps link, and your source. Each update is a complete report; the previous stamp list is offered for editing and earlier reports remain available.

Choose **Observed on a visit** to select an existing visit. Its date is used automatically. Choose **Published website** to record a source URL and the date you checked it. You can record availability for the whole location and for each stamp separately.

**Add stamp** offers known locations, a name-only option for old-style records, or a newly discovered location. IDs are generated automatically; do not edit them. Cancelling any prompt saves nothing. If another edit changes visits, locations, or expected cancellations while prompts are open, the command asks you to try again.

Renaming a location keeps the name recorded with older stamps. Mark moved or closed desks accordingly instead of deleting them. Website location details show your latest authored report, followed by earlier reports that may disagree. Imports cannot replace your corrections. Use another authored update when information changes.

## Optional park facts

Place properties may include `area` as text with units, `established` as a quoted `YYYY-MM-DD` date, and `map` as an attachment wikilink. Add only information you have checked. Missing facts are omitted on the site.

All main stamps and substamps retain their photos and visit links on the place page.
