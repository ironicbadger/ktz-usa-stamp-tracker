# Proposed implementation goal

Status: implemented on `design/modern-stamp-book`; see `../../design-qa.md` and `verification/validation.md` for verification.

Implement The Stamp Book's selected modern documentation design and its three complementary refined views, while preserving the static Node.js website, Obsidian authorship, existing collection records, and one canonical page per place. The authority is `docs/design/README.md`; mockup content is illustrative.

## Visual direction

- White surfaces, readable sans-serif typography, blue links, thin neutral dividers, restrained borders, and generous but purposeful spacing.
- Desktop: approximately 240px left directory, flexible reading column, and 280px right sidebar. Replace the floated infobox layout so it cannot create large empty gaps.
- Starting typography targets: 16px body, 15px navigation, 14px supporting text, and 34–36px page titles. Validate wrapping, contrast, zoom, and responsive behavior in the browser.
- Preserve the region → state → place directory, expandable branches, active-place indication, and region overview links. Multi-state places appear under each applicable state and retain one canonical URL.
- Apply the same design language to place, region, trip, search, and other existing pages. Preserve the region collection-book slots and optional region maps.

## Place page and collection

- Keep page title, states, useful navigation, notes, visit history, collection, and stamping locations on one place page with stable in-page anchors.
- The top right sidebar contains only collected main stamps. Stack multiple main stamps vertically and cap their images at approximately 200px wide without cropping or distorting them. Substamps appear in the full collection.
- Put compact park facts, a small locator map when available, and official website/maps/planning links below the main stamps. Show only supported facts and real assets; omit unavailable facts instead of inventing them.
- Give each collected main stamp and substamp its own full-collection entry with name, all photos, location, notes, and a link to the corresponding visit. Preserve separate impressions collected on separate visits.
- Keep resources and empty states compact. Blank places must remain useful without repeated empty-state panels or fabricated records.
- Preserve search, backlinks, visit anchors, attachment links, and automatically populated trip pages.

## Stamping locations and authorship

- Extend the same place note to distinguish where stamps are available from what was actually collected during a visit.
- Define and document a backward-compatible YAML model before implementing the extension. Existing notes and free-text stamp locations must continue to work.
- Provide an Obsidian Templater Add/update stamping location command for name, available stamps, access instructions, availability, and source or observation provenance.
- Update Add stamp to offer known locations by readable name and permit adding a newly discovered location. Authors never type IDs.
- Published claims retain source URLs and checked dates. On-site observations reference a visit and inherit its date without asking for it twice.
- Preserve authored corrections and discoveries through subsequent imports. Retain conflicting claims and their provenance where needed; do not silently replace historical collection context with current availability.
- Retain closed or moved locations for historical references. Present reported availability distinctly from on-site observations.
- Render available stamps, access notes, provenance, optional external Google Maps links, and links to relevant collected impressions and visits.
- Validate prompt cancellation and concurrent edits so authoring helpers do not partially or silently overwrite notes.

## Decisions to resolve during design/model planning

- Safe location matching and renaming, including any automatically managed identity and compatibility with existing free-text locations.
- Representation of multiple sources, conflicts, corrections, location-wide availability, and availability of individual stamps.
- Which repeat impressions appear in the top sidebar, deterministic ordering, behavior with many main stamps, and missing-photo presentation.
- Final mobile section order and navigation behavior. The desktop mockups do not constitute an approved mobile design; propose and review a mobile layout before considering visual design complete.
- Source and availability of optional park facts and locator maps. This goal does not authorize an unbounded data-import project.

## Boundaries

- Keep the 429 source place notes blank apart from existing factual metadata; no fictional visits, stamps, locations, boilerplate, or generated artwork in real collection data.
- Use isolated fixtures for populated-state testing and visual review.
- Keep vanilla Obsidian, Templater, and Obsidian Git as the authoring workflow. No custom web editor, database migration, road-trip planner, marketing hero, statistics dashboard, paper textures, or content overlay modals.
- Keep deployment deferred. Continue using the LAN preview; production credentials are not required for this goal.
- Do not copy mockup dates, placeholder text, sample banners, invented maps, inconsistent counts, or lower-section breadcrumbs as new routes.

## Verification and completion criteria

1. Compare the implementation against the selected mockups at desktop widths, with the sidebar dimensions and image caps verified.
2. Review narrow mobile, tablet, and desktop layouts, keyboard navigation, visible focus, readable contrast, heading structure, zoom behavior, and horizontal overflow. Stamp content must not be buried below a large facts panel on mobile.
3. Exercise blank places, populated places, multiple visits, multiple main stamps and substamps, multiple photos, missing optional images/facts, multi-state navigation, long names, closed/moved locations, and conflicting location reports using isolated fixtures.
4. Add meaningful tests for the location model, date inheritance, history preservation, backward compatibility, and authoring commands; retain existing coverage.
5. Pass the repository's tests, static build, and generated-link checks. Confirm search, visit/trip links, backlinks, images, and all new in-page references work.
6. Update authoring documentation and design notes to reflect implemented behavior and resolved decisions.
7. Deliver a working LAN preview, representative desktop/mobile screenshots, and a concise validation report. No production deployment is part of completion.

## Implementation sequence after review

1. Resolve mobile and collection-display behavior; agree the location schema and provenance rules.
2. Implement the shared layout, typography, navigation, compact facts, and responsive place-page structure.
3. Implement full collection presentation and verify existing page types.
4. Implement location validation, rendering, and Obsidian authoring helpers with compatibility tests.
5. Run visual and functional checks, refine layout, and update documentation.
