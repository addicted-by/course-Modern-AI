# Lecture 02: Linear Algebra

The complete combined lecture covers preliminaries, matrix decompositions, applications,
and ReplaceMe, with proofs and speaker notes. The source includes only the final slide
parts and assets used by `lecture02_final_v2.qmd`.

## Build

From the repository root, with Quarto and Node.js 22 on `PATH`:

```sh
quarto render raw/lectures/02_linalg/lecture02_final_v2.qmd --to revealjs
```

The website build publishes `_site/raw/lectures/02_linalg/lecture02_final_v2.html`.
Run `quarto render` at the repository root to build the whole course site.
No Python execution or npm installation is needed for the presentation. KaTeX,
its license, fonts, original theme and rendering helpers are local; the filter
renders formulas at build time. The source `_quarto.yaml` settings are preserved
in `_metadata.yml` so this lecture inherits the course website project.

The five linked application notebooks include executed HTML and editable IPYNB
sources in `notebooks/applications/`; see its README to regenerate them. Online
videos and external readings keep their original URLs and need network access.
