# Yellowstone page exploration

Ten independent full-page mockup renders, numbered in the order displayed in the main chat. These are alternatives awaiting selection, not implemented UI. Prompts, original output paths, and reference images are recorded in manifest.json. Current site code was not changed during this exploration.

## Latest user constraints

- The previous layout is too busy and hard to follow; make reading order clear and remove repeated summaries and panels.
- Stamping locations are rare-use information: one small closed disclosure, showing minimal information until explicitly opened. Yellowstone has two fictional locations.
- Most parks have ONE stamp. Only roughly 10–20% have more, usually around six. Yellowstone is the multi-stamp stress case, not the default page template.
- Keep one stamp at a normal 120–160px scale, with no empty slots or reserved grid height. Grow to a wrapping horizontal collection for multiple stamps.
- Do not reserve a whole side column or half the page solely for a single stamp. Park story, photo and visits must work independently of stamp count.
- Separate main/substamp group labels only when both categories exist. Avoid repeating stamp imagery in visit summaries.
- Use the existing fictional Yellowstone content: June 19 and 21, 2019 visits, two main stamps, four substamps, diary, and credited Lower Falls photograph.

The single-stamp prevalence clarification arrived after generation began. It is recorded as an implementation requirement for the selected direction; the renders show the requested populated Yellowstone case. Rendered text/artwork is illustrative and must be replaced with the existing real content/assets during implementation. Option 7 contains extra repeated visit thumbnails despite the no-duplication prompt; omit those if that direction is selected. Its locations are still collapsed as requested.

No option has been selected. Do not infer a selection from this file or build before the user's choice.
