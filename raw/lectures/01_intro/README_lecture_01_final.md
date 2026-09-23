# Building the introduction lecture

The source filename is `lecture_01_final.qmd` (with an underscore after
`lecture`). Run from the **repository root**:

```sh
quarto render raw/lectures/01_intro/lecture_01_final.qmd
# Build the complete site, as GitHub Actions does:
quarto render
```

The published presentation is generated at
`_site/raw/lectures/01_intro/lecture_01_final.html`.
It is linked from the lectures catalog and included in the root
`_quarto.yml` render list. The existing `assets/**` and `vendor/**` resource
rules copy its images, animations and local KaTeX distribution into `_site`.

## Required files

- `lecture_01_final.qmd`: all 51 slides, inline SVG diagrams, fragments and notes.
- `lecture_01_final.css`: lecture layouts and the DINO image sprite reference.
- `lecture_01_final.bib`: the bibliography used by citations.
- `_metadata.yml`: inherited slide settings for the root website build
  (1600 × 900, theme, navigation, logo/scaler include and execution settings).
- `_quarto.yaml`: the existing configuration for rendering from this directory.
- `../00_template/theme/theme.scss`, its imported SCSS partials and preset,
  and `../00_template/theme/header-logos.html`: the existing shared site theme,
  logos and slide scaling controls. The website's existing logo variant is retained.
- `vendor/katex/dist/`: the existing KaTeX JavaScript, CSS, auto-render extension
  and fonts. Include the vendored `vendor/katex/LICENSE` when copying it elsewhere.
- The 34 image/animation files listed below, preserving their relative paths.

The QMD and CSS are already assembled. `final_parts/`, research, validation
reports, other lecture drafts and the source tree's generated HTML / `_files/`
directories are **not** needed. Quarto generates Reveal.js and other runtime
libraries during the build. The shared theme loads text fonts from Google Fonts;
external reading links also require an internet connection.

## Image and animation manifest

- `assets/final/fragmented-action.svg`
- `assets/final/fragmented-audio.svg`
- `assets/final/fragmented-samoyed.jpg`
- `assets/final/fragmented-state.svg`
- `assets/final/navier-agent-search.svg`
- `assets/final/part_04_10/dino-attention-maps.png`
- `assets/final/part_04_10/dog.jpg`
- `assets/final/part_11_18/o1-compute.png`
- `assets/final/part_11_18/svo-original.jpg`
- `assets/final/part_19_25/arc-ls20.gif`
- `assets/final/part_19_25/arc-s5i5.gif`
- `assets/final/part_19_25/arc-sp80.gif`
- `assets/final/part_19_25/metr-o3-50-time-horizon.png`
- `assets/final/part_26_30/astra-terminal-bench-science-viewport.png`
- `assets/final/part_26_30/fable-page-heading.png`
- `assets/final/part_26_30/gpt56-release-heading.png`
- `assets/final/part_31_37/alphafold3-fig1.png`
- `assets/final/part_31_37/efficiency.svg`
- `assets/final/part_31_37/epoch-compute.svg`
- `assets/final/part_31_37/epoch-power.svg`
- `assets/final/part_31_37/iea-energy.svg`
- `assets/final/part_31_37/metr-horizons.svg`
- `assets/final/part_38_43/astra-dialogue.jpg`
- `assets/final/part_38_43/astra-memory.jpg`
- `assets/final/part_38_43/astra-scene.jpg`
- `assets/final/part_38_43/cat.png`
- `assets/final/part_38_43/codex-ui-crop.webp`
- `assets/final/part_38_43/mariner-frame.jpg`
- `assets/final/part_38_43/proof-excerpt.png`
- `assets/final/revision_20260923/clip/bicycle.jpg`
- `assets/final/revision_20260923/clip/cup.png`
- `assets/final/revision_20260923/clip/dog.jpg`
- `assets/final/revision_20260923/vision/alexnet-fig3-detail.png`
- `assets/final/revision_20260923/vision/bicycle.jpg`

## Verification

Verified on 2026-09-23 with Quarto 1.10.18 and headless Chromium on macOS:

- Full `quarto render` completed successfully for all seven site pages/decks.
- All 51 lecture slides and 51 speaker-note blocks are present.
- Keyboard navigation, fragment reveal and slide scaling controls work.
- KaTeX renders the eight formula blocks without errors.
- All HTML images, images embedded in SVG and the CSS DINO sprite load.
- No missing local resources, browser JavaScript errors or failed requests.
- The lecture catalog link works with a `/course-Modern-AI/` URL prefix.
- The existing 19-slide course structure deck still initializes correctly.
- Representative rendered slides were visually inspected.

The original QMD, CSS, bibliography and 34 media files were copied byte-for-byte;
source files remain in the authoring repository. No prebuilt HTML or Quarto
runtime directories were copied. GitHub Pages publishes these changes after
its existing workflow runs on a push to `main`.
