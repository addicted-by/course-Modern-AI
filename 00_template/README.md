# Modern AI Course — Quarto Lecture Template

This directory contains the **reference slide template, design system, and component showcase** for the **Modern AI** course.

---

## Directory Structure

```
00_template/
├── _quarto.yaml          # Quarto revealjs slide deck configuration (16:9 1600x900)
├── template.qmd          # Golden reference showcase demonstrating all slide archetypes
├── references.bib        # BibTeX citation library for academic papers
├── AI_GUIDE.md           # Authoring manual, design tokens, and copy-paste snippets
├── README.md             # Quickstart guide and rendering commands
├── assets/               # Shared icons, badges, and visual assets
├── figures/              # Diagrams, architectural schematics, and plots
└── theme/
    ├── theme.scss        # Master SCSS manifest (imports all theme layers & active preset)
    ├── theme-swiss.scss  # Standalone entrypoint: Swiss Editorial Minimal (Variant A)
    ├── theme-dark-tech.scss # Standalone entrypoint: Precision Dark Tech (Variant B)
    ├── theme-academic.scss  # Standalone entrypoint: Academic Monograph (Variant C)
    ├── theme-monochrome.scss # Standalone entrypoint: Kinetic Monochrome (Variant D)
    ├── _variables.scss   # SASS defaults & CSS custom properties (:root)
    ├── _typography.scss  # Inter & JetBrains Mono typography scale & utilities
    ├── _layout.scss      # Grid layouts, flex columns, hero & section containers
    ├── _components.scss  # Callout boxes, metric cards, compare cards, quizzes
    ├── _reveal-overrides.scss # Reveal.js engine overrides, macOS terminal, KaTeX
    └── presets/          # Aesthetic preset token layers
```

---

## Quickstart Commands

### 1. Live Interactive Preview
Launches a local development server with instant live-reload on file edits:

```bash
quarto preview 00_template/template.qmd
```

### 2. Production HTML Render
Compiles the standalone Reveal.js presentation with 0 compilation warnings:

```bash
quarto render 00_template/template.qmd
```

### 3. Rendering All Presentations
From the repository root:

```bash
# Render template showcase
quarto render 00_template/template.qmd

# Render Lecture 1
quarto render 01_intro/lecture_01.qmd
```

---

## Preset Switcher & Aesthetic Variants

The theme engine provides **4 distinct aesthetic presets**, each designed for specific lecture topics and visual tones while sharing the same component markup, typography scales, and KaTeX math normalization:

| Preset Variant | Theme Entrypoint | Aesthetic Characteristics & Best Use |
|:---|:---|:---|
| **Variant A: Swiss Editorial Minimal** *(Default)* | `theme-swiss.scss` | Clean off-white canvas (`#f8fafc`), pure white surfaces (`#ffffff`), vermilion / orange / blue accents (`#ff3b00`, `#ea580c`, `#2563eb`). International Typographic Style for general curriculum and daytime lectures. |
| **Variant B: Precision Dark Tech** | `theme-dark-tech.scss` | Obsidian canvas (`#090a0f`), deep slate surfaces (`#111625`), neon cyan / violet accents (`#38bdf8`, `#a855f7`). IDE / Terminal aesthetic for systems, GPU kernel programming, and low-level acceleration. |
| **Variant C: Academic Monograph** | `theme-academic.scss` | Warm parchment canvas (`#fbfbf9`), ivory surfaces, Oxford emerald / antique gold accents (`#047857`, `#b45309`, `#d97706`), serif headings (*Newsreader*). Ideal for theoretical foundations, mathematical proofs, and survey papers. |
| **Variant D: Kinetic Monochrome** | `theme-monochrome.scss` | Stark white canvas (`#ffffff`), pure black structure (`#000000`), slate / acid lime pop highlights (`#475569`, `#bef264`). High-contrast Swiss modernist style for architecture taxonomies and executive overviews. |
| **Variant E: Nordic Slate Minimal** | `theme-nordic-slate.scss` | Cold graphite canvas (`#f4f4f6`), deep zinc typography (`#18181b`), understated sage and slate accents (`#059669`, `#475569`). Scandinavian minimalism for systems and code reviews. |
| **Variant F: Warm Editorial Sandstone** | `theme-warm-editorial.scss` | Warm sandstone canvas (`#faf7f2`), deep stone charcoal text (`#1c1917`), rich terracotta and rust accents (`#c2410c`, `#b45309`). Bookish monograph aesthetic for formal papers and symposiums. |

### How to Switch Presets

#### Method 1: Global Switch via `theme.scss`
Edit `00_template/theme/theme.scss` and uncomment the desired preset import at the top:

```scss
/* 1. Active Aesthetic Preset */
@import "presets/preset-swiss-minimal"; // Variant A: Swiss Minimal (default)
// @import "presets/preset-nordic-slate";   // Variant E: Nordic Slate
// @import "presets/preset-warm-editorial"; // Variant F: Warm Editorial
// @import "presets/preset-academic";       // Variant C: Academic Monograph
// @import "presets/preset-dark-tech";      // Variant B: Precision Dark Tech
// @import "presets/preset-monochrome";     // Variant D: Kinetic Monochrome
```

#### Method 2: Per-Deck Standalone Entrypoint in `_quarto.yaml`
In any lecture's `_quarto.yaml` (or frontmatter of `.qmd`), point directly to the desired standalone entrypoint file:

```yaml
format:
  revealjs:
    theme:
      - default
      - ../00_template/theme/theme-dark-tech.scss # Switch to Dark Tech preset
```

---

## How to Create a New Lecture Module

To create a new lecture (e.g. `02_vision_transformers/`):

1. **Create the lecture directory:**
   ```bash
   mkdir 02_vision_transformers
   ```

2. **Create `_quarto.yaml` inside the new folder:**
   ```yaml
   format:
     revealjs:
       theme:
         - default
         - ../00_template/theme/theme.scss
       width: 1600
       height: 900
       margin: 0.05
       slide-number: c/t
       progress: true
       controls: true
       navigation-mode: linear
       transition: none
       background-transition: none
       center: false
       html-math-method: katex
   execute:
     eval: false
     echo: true
     warning: false
     message: false
   bibliography: references.bib
   ```

3. **Create `lecture_02.qmd` using `00_template/template.qmd` as a baseline:**
   - Use `# {background-color="#0f172a"}` with `.hero-container` for the title slide.
   - Use `# {background-color="#0f172a"}` with `.section-slide` for section dividers.
   - Use `## Question Title` for all content slides following the **One question per slide** rule.
   - Include detailed speaker notes `::: {.notes}` on every content slide.

4. **Reference the Design Manual:**
   - Consult [`AI_GUIDE.md`](AI_GUIDE.md) for all CSS component classes, modality badges, and markdown code snippets.

---

## Reveal.js Presentation Controls

When viewing the rendered HTML slides in your browser:

| Key | Action |
|:---|:---|
| **Space** / **→** | Advance to the next slide |
| **←** | Return to the previous slide |
| **S** | Open **Speaker View** (speaker notes, elapsed timer, next slide preview) |
| **F** | Toggle **Fullscreen mode** |
| **O** / **Esc** | Toggle **Slide Overview matrix** |
| **B** / **.** | Blank / pause the presentation screen |
| **?** | Show full keyboard shortcut help menu |

---

## Automated Test Suite

The presentation template system includes a 6-tier opaque-box E2E test suite covering 364 test cases across all features, edge cases, cross-feature combinations, and real-world compilation workloads:

```bash
# Run comprehensive E2E test suite (364 tests)
pytest 00_template/tests
```

---

## Slide Archetype Suites & Component Index

`template.qmd` and `archetypes_showcase.qmd` serve as golden references showcasing the modular Hero and Section archetype suites alongside 15 distinct pedagogical slide archetypes:

### Hero (Title) Slide Archetypes:
| # | Archetype Name | Class Modifiers | Design Characteristics |
|---|---|---|---|
| **H1** | **Modern Split / Grid Hero** | `.hero-split` / `.hero-grid` | 2-column layout pairing primary title typography on the left with a structured module highlight/summary card on the right. |
| **H2** | **Atmospheric Dark / Glow Hero** | `.hero-glow` / `.hero-atmospheric` | Deep obsidian canvas with dynamic radial glow backdrop, glowing pill badges, and illuminated accent dots. |
| **H3** | **Editorial Swiss / Academic Hero** | `.hero-editorial` / `.hero-academic` | Asymmetrical International Typographic Style with top metadata bar, subtitle accent border, and 4-column structured footer grid. |
| **H4** | **Glass Card Hero** | `.hero-card` / `.hero-glass` | Floating frosted-glass container with multi-layered backdrop blur, subtle micro-border, and gradient top accent bar. |
| **H5** | **Swiss Pure Monograph Hero** | `.hero-swiss-pure` | Pure minimalist monograph layout with giant high-contrast title, 1px hairline rule, and inline small-caps metadata. |
| **H6** | **Minimal Split Typography** | `.hero-minimal-split` | Bold left headline with generous line-height paired with right plain typographic list (zero heavy cards). |
| **H7** | **Warm Editorial Hero** | `.hero-editorial-warm` | Elegant serif/grotesk title pairing with understated author line and date stamp on warm sandstone canvas. |
| **H8** | **Deep Matte Dark Minimal** | `.hero-dark-minimal` | Matte dark canvas with pure white typography, 1px hairline divider, and single understated accent line. |

### Section Divider Slide Archetypes:
| # | Archetype Name | Class Modifiers | Design Characteristics |
|---|---|---|---|
| **S1** | **Bold Numeral & Watermark Section** | `.section-watermark` / `.section-numeral` | Massive 15rem watermark background numeral behind high-contrast forefront title typography. |
| **S2** | **Split Overview / Agenda Card Section** | `.section-split` / `.section-agenda` | 2-column split with section title on the left and a structured agenda card previewing 2–4 bullet points on the right. |
| **S3** | **Minimalist Accent Section** | `.section-minimal` / `.section-line` | Clean Swiss minimalist layout with a horizontal accent pill bar, tracked kicker, and uncluttered layout. |
| **S4** | **Centered Banner Section** | `.section-banner` / `.section-centered` | Centered alignment with pill badge and framed glass banner container. |
| **S5** | **Hairline Agenda Section** | `.section-hairline-agenda` | Left section title + right minimal text agenda with simple numerical markers (no glowing badges). |
| **S6** | **Pure Numeral & Italic Abstract** | `.section-pure-numeral` | Large clean modern numeral in subtle contrast, bold title, and one-sentence italic abstract. |
| **S7** | **Minimal Line & Section Tracker** | `.section-minimal-line` | Understated horizontal 1px accent marker with small-caps section tracker and crisp title. |
| **S8** | **Centered Modern Hairline Section** | `.section-centered-modern` | Symmetrical centered title framed with subtle top and bottom hairline borders without cards. |

### Core Content Slide Archetype Suite:
| # | Archetype Name | Primary Purpose & Key Components |
|---|---|---|
| **01** | **Core Concept with Key Idea** | Fundamental rule declaration with `.key-idea` banner and 2-column `.card` / `.card-glow` containers. |
| **02** | **Mathematical Derivation** | Split-view theory slide (`.columns .valign-center`) with `.definition` term and KaTeX tensor equations. |
| **03** | **Formula Card & Callouts** | Rigorous mathematical statement in `.formula-card` supported by `.info-box` and `.warning` callouts. |
| **04** | **3-Column Taxonomy Grid** | Architectural classification in `.grid-3` with modality badges (`.badge-image`, `.badge-video`, `.badge-unified`). |
| **05** | **WOW Frontier Model Card** | High-impact breakthrough showcase in `.wow-card` with 2x2 metadata grid and core takeaway banner. |
| **06** | **Quantitative KPI Dashboard** | Benchmark metric cards in `.metric-row` with gradient numerals, labels, and positive/negative delta pills. |
| **07** | **Split-View Comparison** | Architectural trade-off analysis in `.compare-container` with `.compare-pro` (green) and `.compare-con` (red). |
| **08** | **Step & Process Pipeline** | End-to-end multi-step workflow in `.step-flow` with numbered step badges and connecting line. |
| **09** | **macOS Terminal Code Window** | Syntax-highlighted code block with macOS 3-dot window header, JetBrains Mono font, and system insight card. |
| **10** | **Matrix Table & Data Grid** | Structured evaluation grid in `.matrix-container` (`table.matrix-table`) with row hover and badge tags. |
| **11** | **Interactive Checkpoint Quiz** | Audience comprehension check in `.checkpoint-box` with multiple-choice options and `.correct` answer styling. |
| **12** | **Synthesis & Key Takeaway** | Prominent conclusion banner in `.takeaway` with large-type core message for lecture close. |
| **13** | **Academic Bibliography** | Automatically generated Pandoc bibliographic reference list (`::: {#refs}`) linked to `references.bib`. |

---

## Design System & Component Reference

For full details on typography, color tokens, glassmorphism specs, and copy-pasteable markdown templates for all 15 slide archetypes, read:
👉 **[`AI_GUIDE.md`](AI_GUIDE.md)**

