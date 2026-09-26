# Stamp Book

1. Open a place in **Places**. Write general notes below its properties.
2. Run **Templater: Insert template** → **Record visit**. Enter the date, optional trip, and notes.
3. Run **Add stamp** for each main stamp or substamp. Choose the visit rather than typing its date again.
4. Copy photographs into **Attachments**. Select them in **Add stamp** or **Add stamp photos**.
5. Use **Edit visit** to change a date, trip, or write-up. **New trip** creates an editable trip introduction; linked visits populate its website page automatically.
6. Run **Git: Commit-and-sync** to send changes to GitHub. For local preview, run `just dev` from the repository, then open http://localhost:8766/.

On first opening, enable community plugins. `just setup` installs Templater and Git. Git uses the computer's existing GitHub authentication; automatic commit-and-sync can be enabled in its settings.

A `main` stamp fills the place's regional slot; a `sub` stamp appears on the place and trip pages. Multiple main stamps are supported. A filled slot does not mean every possible stamp has been collected.

Region notes can contain an introduction and an optional `map: "[[Attachments/map-photo.jpg]]"`. `[[Place links]]` become website links and backlinks. Content in Places, Trips, Regions, and referenced Attachments is public when deployed.

## Stamping locations

Run **Add or update stamping location** in a place note to record where stamps can be found, even before you collect them. Choose an existing location to update or rename it. The prompts cover available stamps, availability, access notes, optional maps link, and your source. Each update is a complete report; the previous stamp list is offered for editing and earlier reports remain available.

Choose **Observed on a visit** to select an existing visit. Its date is used automatically. Choose **Published website** to record a source URL and the date you checked it. You can record availability for the whole location and for each stamp separately.

**Add stamp** now offers known locations, a name-only option for old-style records, or a newly discovered location. IDs are generated automatically; do not edit them. Cancelling any prompt saves nothing. If another edit changes visits or locations while prompts are open, the command asks you to try again.

Renaming a location keeps the name recorded with older stamps. Mark moved or closed desks accordingly instead of deleting them. Website location details show your latest authored report, followed by earlier reports that may disagree. Imports cannot replace your corrections. Use another authored update when information changes.

## Optional park facts

Place properties may include `area` as text with units, `established` as a quoted `YYYY-MM-DD` date, and `map` as an attachment wikilink. Add only information you have checked. Missing facts are omitted on the site.

The top of the page shows up to three recent main-stamp impressions; **View all main stamps** opens the complete collection on the same page. All main stamps and substamps retain their photos and visit links. On mobile, park facts follow the collection, locations, visits, and notes.
