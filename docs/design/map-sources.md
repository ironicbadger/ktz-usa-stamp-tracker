# Locator maps

The park infobox uses small, locally generated SVG maps: cream land, pale sage state context, a red park marker, readable state names and a scale bar. These are geographic locators, not directions to entrances or cancellation desks. No map outline or coordinate is AI-generated.

## Data and attribution

- **Park pins:** [National Park Service Land Resources Division — NPS Boundary Centroids, layer 0](https://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/0). All 429 current catalogue codes match this source. A pin represents the official administrative centroid, which may differ from an entrance or visitor center. When a code has multiple features, exact unit-name matches are preferred; otherwise the related source features are retained rather than choosing an arbitrary center.
- **Yellowstone outline:** [NPS Boundary, layer 2 of the same service](https://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2), queried by `UNIT_CODE='YELL'`. The green polygon is the administrative park boundary.
- **State and territory outlines:** [U.S. Census Bureau TIGERweb USLandmass — States](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/USLandmass/MapServer/0), January 1, 2026 vintage. Its 56 features include the states, District of Columbia, and island territories. The published interior-point coordinates guide state label placement.
- **Surrounding land and lakes:** [Natural Earth 1:50m physical vectors](https://www.naturalearthdata.com/downloads/50m-physical-vectors/), from the [maintainers' GeoJSON repository](https://github.com/nvkelso/natural-earth-vector). Natural Earth is [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- **Pin symbol:** Phosphor `map-pin-fill`, already included by the project dependency and its existing icon license.

Download URLs, retrieval dates, feature counts, and SHA-256 checksums are recorded in `data/maps/sources.json`. The corresponding source geometry is checked into `data/maps/`, so normal builds have no network dependency.

## Generation and integration

`node scripts/build-locator-maps.mjs` regenerates the local SVG assets and `data/locator-maps.json` from checked-in data. `node scripts/fetch-map-data.mjs` deliberately refreshes the five source datasets; review source and map changes before keeping an update. No package dependency was added.

`getLocatorMap(placeData)` in `src/locator-maps.mjs` accepts `{park_code, states, title}` and returns `{image, alt, source, label, kind}` (plus the source coordinates for park maps), or `null`. Known parks get an NPS locator. An unknown park with one recognized state gets an explicitly labeled **State context** map with no park pin. Unknown multi-state places return `null` rather than implying a precise location. Authored custom map attachments can still take precedence in the renderer.

The generator projects source coordinates onto a local equirectangular view, compensating horizontal scale at the central latitude. It unwraps antimeridian geometry for Alaska and Pacific territories, clips source polygons to the viewport, and simplifies their projected paths at a subpixel tolerance. The scale bar is calculated at the central latitude. Fixed viewport choices and label anchors for Yellowstone and Moores Creek are cartographic composition decisions; their outlines and pins still come entirely from the cited geometry. Other parks use their state context or a regional crop for very large states.

The 360 × 244 SVG viewBox stays crisp at the infobox's approximately 230px display width. Preserve its native aspect ratio: imposing another ratio with `object-fit: contain` makes the actual map smaller. Source font sizes of 15px for states, 16px for parks, and 14px for the scale produce approximately 9.6px, 10.2px, and 8.9px labels at 230px. The generator reserves room for pins, labels and the scale, omitting secondary state labels that would collide. The restrained maps are intentionally limited to orientation; the official NPS map and planning links remain separate.

## Retained historical asset

`static/maps/yellowstone-regional.jpg` is the earlier, busier NPS regional map, cleaned up by National Park Maps and retrieved from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NPS_yellowstone-regional-map.jpg) on September 26, 2026. It remains as a historical source asset; the new locator API replaces it for the infobox.
