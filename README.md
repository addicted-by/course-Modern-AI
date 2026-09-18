# Modern AI

**Modern AI: Architectural Foundations, Mathematical Rigor & End-to-End Systems** (2026–2027)  
Author: Aleksey Ryabykin

This repository contains materials, lecture slides, and project documentation for the Modern AI course.

## Community & Contacts

- 💬 **Telegram Group:** [Join Chat](https://t.me/+I-joDKs8iiIwOTQy) — official discussions, lecture Q&A, and announcements
- ✈️ **Instructor Telegram:** [@addicted_by](https://t.me/addicted_by) — direct contact with Aleksey Ryabykin
- 🐙 **GitHub Repository:** [course-Modern-AI](https://github.com/addicted-by/course-Modern-AI/tree/main)


## Project Structure

```text
.
├── _quarto.yml              # Root Quarto website configuration
├── index.qmd                # Course homepage
├── assets/                  # Static assets
│   └── logos/               # Partner & Sponsor logos (Baikal, Huawei)
├── pages/                   # HTML components and partials
│   └── contacts.html        # Contact cards component
├── raw/                     # Course source materials

│   ├── modules.qmd          # Course modules catalog
│   ├── projects.qmd         # Capstone projects catalog
│   ├── lectures.qmd         # Lectures hub & schedule
│   ├── seminars.qmd         # Seminars hub & schedule
│   ├── lectures/            # Lectures directory
│   │   ├── .gitkeep
│   │   ├── 00_template/     # Slide templates, SCSS theme, logos & components
│   │   └── 01_intro/        # Lecture 01: Course Structure & Roadmap
│   │       ├── course_structure.qmd # Lecture presentation (Reveal.js)
│   │       ├── course_structure.css # Presentation layout styles
│   │       ├── references.bib       # Citations & references
│   │       ├── assets/              # Instructor & QR assets
│   │       ├── project_pages/       # Capstone project briefs & descriptions
│   │       └── vendor/katex/        # Vendored KaTeX distribution for offline rendering
│   └── seminars/            # Seminars directory
│       └── .gitkeep
├── styles/                  # Custom CSS stylesheets
│   ├── contact_cards.css    # Contact cards styling
│   ├── footer.css           # Page footer styling
│   └── logos.css            # Partner logos styling
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
quarto render raw/lectures/01_intro/course_structure.qmd
```

The output presentation is generated at `raw/lectures/01_intro/course_structure.html`.

## Deployment

The website is configured for automated deployment to **GitHub Pages** via GitHub Actions:

- Every push to the `main` branch automatically triggers `.github/workflows/publish.yml`.
- The workflow installs Quarto, executes `quarto render`, and publishes the generated site.
- Manual trigger is also supported via `workflow_dispatch` in the Actions tab on GitHub.
