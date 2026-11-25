# Model Showcase

Lecture source: `lecture01_part2_final_v3_showcase.qmd`. The 95 ordered
includes contain 41 model cards, 41 result slides, 12 comparisons and an index.

The entry point and its source/support/media closure were copied from the
course authoring folder into this project. Existing identical theme, KaTeX
and font dependencies are reused. The shared header uses Baikal + CA logos.
The model claims, examples, citations and speaker notes are retained.

From the repository root, render the lecture with:

```sh
quarto render raw/lectures/01_intro/lecture01_part2_final_v3_showcase.qmd --to revealjs
```

The website Model Showcase catalog is generated from these same QMD includes by
`scripts/build-showcase.py`, invoked automatically by the project pre-render
hook. Edit the lecture includes, then run `quarto render` or `quarto preview`.
Do not hand-edit the generated pages under `raw/showcase/`.

Media live beside the deck in `assets/`; the four `final_parts/showcase*`
folders contain content, styles and the Reveal template. All required local
resources are included in the project build.

Local outputs: `_site/raw/showcase.html` and
`_site/raw/lectures/01_intro/lecture01_part2_final_v3_showcase.html`.

## Model database

`data/models.sqlite3` is the authoritative catalogue: families, models,
presentations and exact card/results slide bindings are edited in SQLite.
Source content is synchronized from the presentation without overwriting
these catalogue definitions. The website generator reads only SQLite.

The root Quarto pre-render hook runs `scripts/sync-models.py`, then
`scripts/build-showcase.py --no-sync`. The database is project data and
belongs in version control. See `docs/model-catalog.md` for the editing
workflow, schema and examples.
