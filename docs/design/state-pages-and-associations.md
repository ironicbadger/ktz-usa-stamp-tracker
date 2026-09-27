# State albums and Associations

State collections extend the existing regional album. Each represented state or territory gets one canonical `/states/<state-name>/` page, linked from the Places browser and regional state headings. The current catalogue produces 56 pages. Georgia contains 11 places, including cross-state trails and parks; places belonging only to other states do not appear. Membership comes from each place's existing `states` property, across all passport regions. Multi-state places retain a single canonical place URL.

The grid uses a main-stamp photograph when available, a distinct collected-without-photo status, or an uncollected square. Artwork fits inside the square without cropping. Region and state pages share the renderer and their All places, Main stamp recorded and No main stamp recorded filters. A place's card represents its main-stamp collection status, not completion of every cancellation. Existing regional state anchors remain valid. State names and abbreviations are searchable.

On a state page, the Places browser expands the region containing the most of that state's places. This keeps Georgia under Southeast rather than opening the long North Atlantic branch just because the Appalachian Trail also crosses Georgia. Other branches remain available, and the state album includes all its places regardless of passport region.

## Associations authoring

Add a top-level Markdown `## Associations` heading to a place note, or insert the Associations template. The following prose appears once, immediately beneath Visits. It can contain paragraphs, emphasis, ordinary inline links, wiki links and optional level-three subheadings. A book review link is just a link; it needs no special Perfect Prose integration. Empty sections are omitted visually.

The next top-level level-one or level-two heading ends the section. Only a plain top-level `## Associations` heading is extracted; quoted and fenced examples or a level-three heading remain general notes. Reference-style links, backlinks and heading IDs are preserved. Repeated Associations blocks merge while retaining their anchors. Nested headings cannot take the main `#associations` anchor. Associations text is searchable with a direct link to the section.

On mobile, Associations follows Visits and precedes About this place. The established album, locations and facts order remains. The fixture uses fictional Yellowstone book/music paragraphs with a generic inline example link; it does not assert the owner's actual reading or listening history. The real vault remains unpopulated.

## Review

Normal preview: port 8766. Fictional preview: port 8767. Useful routes:

- `/states/georgia/`
- `/states/wyoming/` and `/states/montana/` (shared Yellowstone link)
- `/places/yellowstone-national-park/#associations`

See [verification](verification/state-associations-validation.md) for test results and screenshots.
