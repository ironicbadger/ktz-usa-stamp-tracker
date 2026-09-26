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
