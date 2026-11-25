# Tools Showcase implementation plan

**Goal:** Rename the existing website section to Model Showcase and add Tools Showcase in the same format, with an authoritative SQLite catalogue and exact presentation/slide bindings.

**Architecture:** Keep the existing model catalogue and URLs. Store tools, groups and bindings in `data/tools.sqlite3`; share the presentation parser and website rendering helpers. Quarto synchronization imports presentation content transactionally, then the website reads SQLite. No JSON catalogue or automatic database reconstruction.

**Scope:** The supplied Tools lecture contains 34 slides, 13 tools, three groups, 13 use-case slides and seven technical figures. Copy the complete local source/media closure into the main project. Preserve notes, sources, caveats and branding. Add the lecture in M1 after Model Showcase and before Code Agents.

**Constraints:** Work in the main repository. No commit, push or deployment. Subagents use GPT-6 Sol medium/high. Preserve unrelated dirty files and existing model catalogue records.

- [x] Inspect the source and migrate the Tools lecture and dependency closure.
- [x] Add authoritative tools schema, transactional importer and SQL-fixture tests.
- [x] Add Tools catalogue/detail generation, using the existing layout and shared search behaviour.
- [x] Rename visible Model Showcase labels; integrate both sections in navigation, home and build hooks.
- [x] Verify source changes propagate; manual catalogue edits survive; invalid bindings roll back; missing DB fails.
- [x] Build the site and verify exact rendered slide IDs/positions in both catalogues.
- [x] Check desktop/mobile pages, filters, local assets, source links, notes and all tools; inspect the copied lecture runtime.
- [x] Document editing/build workflow and provide local previews.

## Verification

- 37 unit/integration tests pass; clean temporary SQLite+QMD copy builds all 14 tool pages without a JSON registry.
- Final complete Quarto render passes. Both publication checks match all 95 model and 34 tool source slide IDs and positions.
- 299 website browser checks pass at desktop/mobile widths: filtering, reset, names, provenance, notes, local assets and links. Navigation fits at 1440, 1280, 1200, 1024 and 390 pixels.
- Fixed dark use-case text contrast and preserved full navbar branding; navbar collapses below 1200 pixels.
- Tools lecture: 136 screenshots at four viewport sizes, keyboard/overview/scroll/speaker checks, no runtime errors, 17 final axe samples with zero violations, and a 34-page print PDF.
- Promoted 13 secondary headings to the correct semantic level while preserving their visual styling.
- Independent backend/rendering review found no blocking issue. No commit, push or deployment.
