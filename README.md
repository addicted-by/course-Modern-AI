# Modern AI

**Modern AI: Architectural Foundations, Mathematical Rigor & End-to-End Systems** (2026–2027)  
Author: Aleksey Ryabykin

This repository contains materials, lecture slides, and project documentation for the Modern AI course.

## Project Structure

```text
.
├── _quarto.yml              # Root Quarto website configuration
├── index.qmd                # Course homepage
├── 00_template/             # Global slide templates, SCSS theme, logos & components
├── 01_intro/                # Lecture 01: Course Structure & Roadmap
│   ├── course_structure.qmd # Lecture presentation (Reveal.js)
│   ├── course_structure.css # Presentation layout styles
│   ├── references.bib       # Citations & references
│   ├── assets/              # Instructor & QR assets
│   ├── project_pages/       # Capstone project briefs & descriptions
│   └── vendor/katex/        # Vendored KaTeX distribution for offline rendering
└── .github/workflows/
    └── publish.yml          # GitHub Actions workflow for GitHub Pages
```

## Quick Start

### Prerequisites

- [Quarto](https://quarto.org/) (>= 1.4)

### Local Preview

To launch a live local preview server of the entire website:

```bash
quarto preview
```

### Full Website Build

To build the static website (outputs to `_site/`):

```bash
quarto render
```

### Render Only Lecture 01

To render only the course structure presentation:

```bash
quarto render 01_intro/course_structure.qmd
```

The output presentation is generated at `01_intro/course_structure.html`.

## Deployment

The website is configured for automated deployment to **GitHub Pages** via GitHub Actions:

- Every push to the `main` branch automatically triggers `.github/workflows/publish.yml`.
- The workflow installs Quarto, executes `quarto render`, and publishes the generated site.
- Manual trigger is also supported via `workflow_dispatch` in the Actions tab on GitHub.
