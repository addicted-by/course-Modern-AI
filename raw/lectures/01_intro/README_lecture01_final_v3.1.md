# Engineering the frontier — combined lecture v3.1

`lecture01_final_v3.1.qmd` is the entry point for lecture 3, “There is no single
trick.”, in the repository's `lectures.yml` catalog. It includes Architecture,
Data, Training, Inference, and Tools in that order, including the Inference
appendix. The presentation has 128 main slides and seven optional architecture
detail slides.

## Build

Run from the repository root:

```sh
python3 raw/lectures/01_intro/project_pages/build.py
quarto render
```

The presentation is written to
`_site/raw/lectures/01_intro/lecture01_final_v3.1.html`. The homepage and lecture
catalog link to it automatically. To rebuild only this presentation:

```sh
quarto render raw/lectures/01_intro/lecture01_final_v3.1.qmd
```

## Dependencies and maintenance

- The five `lecture01_part2_final_v3_*.qmd` files and their `final_parts/`
  includes are the editable slide sources. Notes are embedded in these sources.
- The combined YAML configuration stays **after** the includes, so the child
  documents cannot replace the combined stylesheet list. Do not add HTML
  comments before the first include: Reveal would create an empty slide.
- Six top-level stylesheets and imported CSS in `final_parts/` provide layouts.
  The custom architecture dialog uses `final_parts/arch_20261007/details.js`.
  These runtime dependencies are explicitly published through `lectures.yml`.
- Figures, local fonts, templates, math helpers, and their licenses are in
  `assets/`; local KaTeX is in `vendor/katex/`. The catalog publishes both trees.
- `lecture01_final_v3.1.bib` preserves this lecture's bibliography separately
  from the bibliography used by existing presentations.
- The site supplies the shared `../00_template/` theme and partner header.
  The monochrome preset honors `$lecture-load-web-fonts`, allowing this lecture
  to use its bundled fonts while retaining the existing default for other decks.
- The “Next: Tools” link in the Inference recap targets `#/frontier-f35` within
  the combined presentation.

All required sources and assets are stored in this repository. The original
authoring workspace is not needed to build or view the lecture. Publishing uses
the repository's existing GitHub Pages workflow after a push to `main`.
