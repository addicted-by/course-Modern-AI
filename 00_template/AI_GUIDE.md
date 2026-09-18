# AI Authoring Guide: Modern AI Lecture Template System

> **Gold-Standard Authoring Specification & Design System Manual**  
> Designed for graduate-level technical courses in Deep Learning, Multimodal Systems, Large Language Models, and High-Performance Hardware Acceleration.

---

## 1. Core Pedagogical & Design Philosophy

Every presentation in this course must adhere to five non-negotiable principles:

1. **One Question Per Slide ("The Single-Focus Rule"):**
   - Every content slide title must be phrased as a specific question (e.g. `Why Factorize Spatial and Channel Convolutions?` or `How Does Frontier Reasoning Scale in DeepSeek-R1?`).
   - The slide body must provide the direct, intuitive answer to that question without unrelated tangents.
2. **Visual Anchor Dominance:**
   - 60–70% of slide area must be dedicated to a structured visual anchor: a comparison container, a math derivation card, a process flow, a code block, or a taxonomy matrix.
   - Text on slides must be concise (short phrases, bullets with bold prefixes), never full narrative paragraphs.
3. **Cognitive Load Minimization:**
   - The audience should comprehend the slide structure within 3–5 seconds.
   - Deep explanations, derivations, historical context, edge cases, and transition cues belong exclusively in **Speaker Notes** (`::: {.notes}`).
4. **Atmospheric Contrast & Pacing:**
   - Dark obsidian slides (`#0f172a`) are reserved for **Title Slides** and **Section Dividers** to reset visual attention.
   - Content slides utilize an off-white canvas (`#f8fafc`) with translucent glassmorphic cards for maximum daytime readability.
5. **Technical Rigor & Traceability:**
   - All formulas must use KaTeX with precise tensor notation and dimension definitions.
   - All benchmarks and claims must include traceable BibTeX citations (`[@citationKey]`).

---

## 2. Design System Tokens & Specs

### 2.1 Resolution & Grid Geometry
- **Aspect Ratio:** `16:9` widescreen.
- **Base Canvas Dimensions:** `1600 × 900 px` (configured in `_quarto.yaml`).
- **Slide Margin Buffer:** `0.05` (5% perimeter safety buffer).
- **Navigation:** Linear horizontal progression (`navigation-mode: linear`).
- **Transitions:** Instant (`transition: none`, `background-transition: none`) for zero visual jank.

### 2.2 Typography Scale
- **Primary Body & Display Font:** `Inter` (weights: 300, 400, 500, 600, 700, 800).
- **Monospace & Code Font:** `JetBrains Mono` (weights: 400, 500, 600, 700).
- **Root Font Size:** `28px` on `1600×900` canvas.

| Level | CSS Class / Tag | Sizing & Weight | Primary Usage |
|:---|:---|:---|:---|
| **Title Hero** | `.hero-title` | `2.8em` (78px), 800 bold | Lecture title on dark hero slides |
| **Section Title** | `.section-title` | `2.4em` (67px), 800 bold | Module name on dark divider slides |
| **Slide Header** | `## Slide Title` | `1.55em` (43px), 700 bold | Slide question / title |
| **Card Header** | `### Subheader` | `1.20em` (33px), 600 semi | Top of cards, columns, sections |
| **Overline Kicker**| `.kicker`, `h4.kicker` | `0.72em` (20px), 700 uppercase | Category tracker above slide title |
| **Body Text** | `p`, `li` | `1.00em` (28px), 400 regular | Descriptive text, list items |
| **Lead Text** | `.lead` | `1.15em` (32px), 400 regular | Introductory lead paragraphs |
| **Fine Print** | `.small` / `.smaller` | `0.74em` / `0.62em`, 500 | Metadata, captions, footnotes |
| **Code & Monospace**| `code`, `pre code` | `0.84em` / `0.78em`, 500 | Inline code tokens, code blocks |

### 2.3 Color Palette & Modality Taxonomy

```
Canvas & Text Tokens:
├── Canvas (Light): #f8fafc (Slate 50)
├── Canvas (Dark):  #0f172a (Slate 900)
├── Heading Text:   #0f172a (Pure Slate)
├── Body Text:      #334155 (Slate 700)
├── Muted Text:     #64748b (Slate 500)
└── Border Line:    #e2e8f0 (Slate 200)

Brand & Gradient Tokens:
├── Primary Brand:  #2563eb (Royal Blue)
├── Brand Gradient: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)
├── Dark Gradient:  linear-gradient(135deg, #0b0f19 0%, #0f172a 50%, #1e1b4b 100%)
└── Gold Accent:    linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)
```

#### Modality Taxonomy Badges:
| Modality | Badge Class | Hex Accent | Background / Border | Dot Color |
|:---|:---|:---|:---|:---|
| **Text / LLM** | `.badge-text` | `#2563eb` (Blue) | `#eff6ff` / `#bfdbfe` | `#2563eb` |
| **Vision / Image** | `.badge-image` | `#7c3aed` (Purple) | `#f5f3ff` / `#ddd6fe` | `#7c3aed` |
| **Audio / Speech** | `.badge-audio` | `#0d9488` (Teal) | `#f0fdfa` / `#99f6e4` | `#0d9488` |
| **Video / Diffusion** | `.badge-video` | `#e11d48` (Rose) | `#fff1f2` / `#fecdd3` | `#e11d48` |
| **Action / Robotics**| `.badge-action` | `#d97706` (Amber) | `#fffbeb` / `#fde68a` | `#d97706` |
| **Omni / Unified** | `.badge-unified`| `#059669` (Emerald)| `#ecfdf5` / `#a7f3d0` | `#059669` |

### 2.4 Glassmorphism System
Cards feature a multi-layer surface treatment:
```scss
background: var(--lecture-surface-glass);
backdrop-filter: blur(12px) saturate(180%);
-webkit-backdrop-filter: blur(12px) saturate(180%);
border: 1px solid var(--lecture-border-glass);
border-radius: var(--lecture-radius-lg);
box-shadow: var(--lecture-shadow-sm);
```

### 2.5 Preset Switcher & Aesthetic Variants

The lecture presentation framework includes **4 production-grade aesthetic presets**. All presets implement the unified `--lecture-*` CSS token system, ensuring that all 15 slide archetypes, KaTeX formulas, callouts, and code blocks adapt seamlessly with zero component markup modifications.

| Preset Variant | Theme Entrypoint | SASS Defaults & Font Stack | Accent Palette | Primary Pedagogical Focus |
|:---|:---|:---|:---|:---|
| **Variant A: Swiss Editorial Minimal** *(Default)* | `theme-swiss.scss` | `Plus Jakarta Sans` + `Inter` (`#f8fafc` canvas, `#ffffff` card surface) | Royal Blue (`#2563eb`), Vermilion (`#ff3b00`), Terracotta (`#ea580c`) | Clean daylight lectures, general ML/DL curriculum, structured taxonomies. |
| **Variant B: Precision Dark Tech** | `theme-dark-tech.scss` | `Space Grotesk` + `Inter` (`#090a0f` obsidian canvas, `#111625` card surface) | Electric Cyan (`#38bdf8`), Cyber Violet (`#a855f7`) | Systems architecture, GPU kernels (CUDA/Triton), distributed training, and hardware acceleration. |
| **Variant C: Academic Monograph** | `theme-academic.scss` | `Newsreader` (Serif) + `Inter` (`#fbfbf9` warm canvas, `#fdfbf7` card surface) | Oxford Emerald (`#047857`), Antique Gold (`#b45309`), Ochre (`#d97706`), Indigo (`#1e1b4b`) | Mathematical proofs, optimization derivations, statistical foundations, and paper surveys. |
| **Variant D: Kinetic Monochrome** | `theme-monochrome.scss` | `Space Grotesk` + `Inter` (`#ffffff` stark white canvas, `#000000` structure) | Stark Black & White, Slate (`#475569`), High-Voltage Acid Lime (`#bef264`) | Executive overviews, bold taxonomy matrices, architectural breakthroughs, and high-impact conclusions. |
| **Variant E: Nordic Slate Minimal** | `theme-nordic-slate.scss` | `Plus Jakarta Sans` + `Inter` (`#f4f4f6` cold graphite canvas, `#ffffff` surface) | Understated Sage (`#059669`), Nordic Slate (`#475569`), Frost (`#0284c7`) | Restrained technical lectures, systems code reviews, and minimal architectural workflows. |
| **Variant F: Warm Editorial Sandstone** | `theme-warm-editorial.scss` | `Newsreader` (Serif) + `Inter` (`#faf7f2` sandstone canvas, `#fdfcf9` surface) | Terracotta / Rust (`#c2410c`), Amber (`#b45309`), Warm Stone (`#1c1917`) | Deep theoretical foundations, monograph series, bookish publications, and formal symposiums. |

#### Switching Presets:

1. **Global Theme Switch (`00_template/theme/theme.scss`):**
   Uncomment the target preset at the top of the master manifest:
   ```scss
   /* 1. Active Aesthetic Preset */
   @import "presets/preset-swiss-minimal"; // Variant A (default)
   // @import "presets/preset-nordic-slate";   // Variant E
   // @import "presets/preset-warm-editorial"; // Variant F
   // @import "presets/preset-academic";       // Variant C
   // @import "presets/preset-dark-tech";      // Variant B
   // @import "presets/preset-monochrome";     // Variant D
   ```

2. **Standalone Deck Theme Configuration (`_quarto.yaml`):**
   Specify the dedicated theme entrypoint in the lecture module's `_quarto.yaml`:
   ```yaml
   format:
     revealjs:
       theme:
         - default
         - ../00_template/theme/theme-dark-tech.scss # Dedicated dark tech theme
   ```

---

## 3. Fenced Div Syntax Rules & Standards

### 3.1 🚨 Strict Multi-Line Div Rule
Pandoc parses fenced divs as blocks only when the opening and closing tags are on their own separate lines.

```markdown
<!-- ✅ CORRECT: Multi-line fenced divs -->
::: {.key-idea}
::: {.key-idea-title}
💡 Fundamental Law
:::
Content goes here on its own line.
:::

<!-- ❌ INCORRECT: Single-line closures break Pandoc parsing -->
::: {.key-idea}
::: {.key-idea-title}💡 Fundamental Law:::
Content goes here.
:::
```

### 3.2 Heading Hierarchy Standard
- `# {background-color="#0f172a"}`: Level 1 headers are reserved exclusively for dark Hero and Section slides.
- `## Slide Question / Title`: Level 2 headers are used for every content slide.
- `### Card / Subheader`: Level 3 headers are used for sub-headings inside cards and column blocks.
- **Never** insert a rogue `---` directly between two `#` Level 1 headers, as Pandoc will create an empty slide.

---

## 4. Complete Component Reference & Copy-Paste Snippets

### 4.1 Title (Hero) Slide Archetype Suite

The presentation architecture provides **4 modular, class-switchable Hero archetypes**:

#### Hero Archetype 1: Modern Split / Grid Hero (`.hero-split` / `.hero-grid`)
Pairs high-impact title typography on the left with a structured module preview card on the right.

```markdown
## {background-color="#0f172a"}

::: {.hero-container .hero-split}

::: {.hero-main}
::: {.hero-badge}
Course Name • Semester 1
:::

<div class="hero-title">
  Lecture Title <span class="gradient-text">Highlight</span>
</div>

<div class="hero-subtitle">
  Comprehensive subtitle describing lecture scope, theoretical depth, and practical deliverables.
</div>

::: {.hero-footer}
<span>**Author:** Instructor Name</span>
<span>•</span>
<span>**Format:** 16:9 4K</span>
<span>•</span>
<span>**Release:** v2.0</span>
:::
:::

::: {.hero-side}
::: {.hero-side-card}
<div class="hero-side-title">⚡ Module Highlights</div>
<ul class="hero-side-list">
  <li>**Dense & Sparse Backbones:** ConvNets, Transformers, MoE</li>
  <li>**Mathematical Rigor:** KaTeX display proofs & derivations</li>
  <li>**Hardware Acceleration:** CUDA, FlashAttention, Quantization</li>
</ul>
::: {.hero-stat-grid}
::: {.hero-stat-item}
<span class="hero-stat-num">16:9</span>
<span class="hero-stat-lbl">Widescreen</span>
:::
::: {.hero-stat-item}
<span class="hero-stat-num">4 SOTA</span>
<span class="hero-stat-lbl">Architectures</span>
:::
:::
:::
:::

:::

::: {.notes}
Speaker notes welcoming audience and introducing key lecture themes.
:::
```

#### Hero Archetype 2: Atmospheric Dark / Glow Hero (`.hero-glow` / `.hero-atmospheric`)
Features a deep obsidian canvas with radial glow background aura, glowing badge, and illuminated accent dots.

```markdown
## {background-color="#090a0f"}

::: {.hero-container .hero-glow}

::: {.hero-badge}
Course Name • Systems Architecture
:::

<div class="hero-title">
  Atmospheric <span class="gradient-text">Glow Hero</span>
</div>

<div class="hero-subtitle">
  Deep obsidian canvas with dynamic radial glow backdrop, high-contrast typography, and illuminated accent highlights.
</div>

::: {.hero-footer}
<span><span class="hero-glow-dot"></span> **Status:** Active Release</span>
<span>•</span>
<span>**Domain:** GPU Hardware Acceleration</span>
:::

:::

::: {.notes}
Speaker notes for cybernetic / hardware architecture lectures.
:::
```

#### Hero Archetype 3: Editorial Swiss / Academic Hero (`.hero-editorial` / `.hero-academic`)
Asymmetrical International Typographic Style with top metadata bar, left accent border, and 4-column structured footer grid.

```markdown
## {background-color="#0f172a"}

::: {.hero-container .hero-editorial}

::: {.hero-top-meta}
<span>Course CS-701 • Lecture 03</span>
<span class="hero-institution">Modern AI Institute</span>
:::

<div class="hero-title">
  Editorial Swiss <span class="gradient-text">& Academic Hero</span>
</div>

<div class="hero-subtitle">
  Rational international typographic style characterized by asymmetrical layout, fine architectural divider lines, and structured four-column metadata grids.
</div>

::: {.hero-footer-grid}
::: {.hero-footer-item}
<span class="hero-footer-label">Instructor</span>
<span class="hero-footer-val">Alexey Ryabykin</span>
:::
::: {.hero-footer-item}
<span class="hero-footer-label">Institution</span>
<span class="hero-footer-val">AI Graduate School</span>
:::
::: {.hero-footer-item}
<span class="hero-footer-label">Standard</span>
<span class="hero-footer-val">Swiss Neo-Grotesk</span>
:::
::: {.hero-footer-item}
<span class="hero-footer-label">Archetype</span>
<span class="hero-footer-val">`.hero-editorial`</span>
:::
:::

:::

::: {.notes}
Speaker notes for formal proofs, mathematical foundations, and monographs.
:::
```

#### Hero Archetype 4: Glass Card Hero (`.hero-card` / `.hero-glass`)
Encapsulates the hero content in a floating frosted-glass container with backdrop blur and gradient top accent.

```markdown
## {background-color="#0f172a"}

::: {.hero-container .hero-card}

::: {.hero-card-panel}

::: {.hero-badge}
Executive Masterclass • Deep Learning
:::

<div class="hero-title">
  Glass Card <span class="gradient-text">Hero Archetype</span>
</div>

<div class="hero-subtitle">
  Encapsulated within a floating frosted-glass container with multi-layered backdrop blur, subtle micro-border, and gradient top bar.
</div>

::: {.hero-footer}
<span>**Instructor:** Alexey Ryabykin</span>
<span>•</span>
<span>**Focus:** Production Systems</span>
:::

:::

:::

::: {.notes}
Speaker notes for executive overviews and standalone workshops.
:::
```

#### Hero Archetype 5: Swiss Pure Monograph (`.hero-swiss-pure`)
Clean asymmetric monograph layout, giant high-contrast title, 1px hairline horizontal rule, and inline small-caps metadata row on light or dark canvas.

```markdown
## {background-color="#f8fafc"}

::: {.hero-container .hero-swiss-pure}

<span class="hero-kicker">Monograph Series • Pure Minimalist</span>

<div class="hero-title">
  Swiss Pure <span class="gradient-text">Monograph Hero</span>
</div>

<div class="hero-subtitle">
  International Typographic Style focusing on asymmetric grid alignment, razor-sharp typography, generous whitespace, and pure hairline dividers.
</div>

<div class="hero-hairline"></div>

::: {.hero-meta-row}
<span class="meta-item">Author: <strong>Alexey Ryabykin</strong></span>
<span>•</span>
<span class="meta-item">Class: <strong>`.hero-swiss-pure`</strong></span>
<span>•</span>
<span class="meta-item">Canvas: <strong>16:9 Light / Dark Native</strong></span>
:::

:::

::: {.notes}
Speaker notes for clean monograph title introduction.
:::
```

#### Hero Archetype 6: Minimal Split Typography (`.hero-minimal-split`)
Left bold headline with generous line-height paired with an ultra-clean plain typographic metadata list on the right (zero heavy cards).

```markdown
## {background-color="#ffffff"}

::: {.hero-container .hero-minimal-split}

::: {.hero-left}
<span class="hero-kicker">Typography & Whitespace</span>

<div class="hero-title">
  Minimal Split <span class="gradient-text">Hero Structure</span>
</div>

<div class="hero-subtitle">
  Left-aligned bold headline paired with an ultra-clean, plain typographic metadata list on the right with zero heavy card containers.
</div>
:::

::: {.hero-right}
<ul class="hero-meta-list">
  <li class="hero-meta-entry">
    <span class="meta-label">Domain</span>
    <span class="meta-value">Modern Artificial Intelligence</span>
  </li>
  <li class="hero-meta-entry">
    <span class="meta-label">Lecture Code</span>
    <span class="meta-value">CS-701 • Advanced Foundations</span>
  </li>
  <li class="hero-meta-entry">
    <span class="meta-label">Archetype Class</span>
    <span class="meta-value">`.hero-minimal-split`</span>
  </li>
</ul>
:::

:::

::: {.notes}
Speaker notes for minimalist card-free title split layout.
:::
```

#### Hero Archetype 7: Warm Editorial Hero (`.hero-editorial-warm`)
Elegant serif/grotesk title pairing with understated author line and date stamp on warm sandstone/alabaster canvas.

```markdown
## {background-color="#faf7f2"}

::: {.hero-container .hero-editorial-warm}

::: {.hero-top-meta}
<span>Course CS-701 • Warm Monograph Edition</span>
<span class="hero-institution">Editorial Sandstone Standard</span>
:::

<div class="hero-title">
  Warm Editorial <span class="gradient-text">& Monograph Hero</span>
</div>

<div class="hero-subtitle">
  Sophisticated serif and grotesk typographic pairing on a warm alabaster sandstone canvas, featuring an understated author line and date stamp.
</div>

::: {.hero-author-stamp}
<span>Instructor: <strong>Alexey Ryabykin</strong></span>
<span>•</span>
<span>Institution: <strong>Modern AI Institute</strong></span>
<span>•</span>
<span>Class: <strong>`.hero-editorial-warm`</strong></span>
:::

:::

::: {.notes}
Speaker notes for bookish, literary editorial lectures.
:::
```

#### Hero Archetype 8: Deep Matte Dark Minimalist Hero (`.hero-dark-minimal`)
Deep matte dark background with pure crisp white typography, hairline divider, and single understated colored accent stripe.

```markdown
## {background-color="#0f172a"}

::: {.hero-container .hero-dark-minimal}

<div class="hero-accent-stripe"></div>

<div class="hero-title">
  Deep Matte Dark <span class="gradient-text">Minimal Hero</span>
</div>

<div class="hero-subtitle">
  Deep matte dark canvas with pure crisp white typography, hairline divider, and a single understated accent bar for focused technical authority.
</div>

::: {.hero-footer}
<span>Instructor: <strong>Alexey Ryabykin</strong></span>
<span>•</span>
<span>Class: <strong>`.hero-dark-minimal`</strong></span>
<span>•</span>
<span>Contrast: <strong>Pure White `#ffffff` on `#0f172a`</strong></span>
:::

:::

::: {.notes}
Speaker notes for matte dark minimal title introduction.
:::
```

---

### 4.2 Section Divider Slide Archetype Suite

The presentation architecture provides **4 distinct Section Divider archetypes**:

#### Section Archetype 1: Bold Numeral & Watermark Section (`.section-watermark` / `.section-numeral`)
Features a massive 15rem watermark numeral in the background behind crisp forefront typography.

```markdown
## {background-color="#0f172a"}

::: {.section-slide .section-watermark}

<div class="section-watermark-num">02</div>

<div class="section-number">Section 02</div>

<div class="section-title">
  Computational Efficiency <span class="gradient-text">& Benchmarks</span>
</div>

<div class="section-desc">
  Roofline analysis, memory bandwidth boundaries, low-precision FP8 quantization, and hardware execution bottlenecks.
</div>

:::

::: {.notes}
Speaker notes transitioning into the efficiency benchmark section.
:::
```

#### Section Archetype 2: Split Overview / Agenda Card Section (`.section-split` / `.section-agenda`)
2-column split with section title on the left and a structured agenda card previewing 2–4 bullet points on the right.

```markdown
## {background-color="#0f172a"}

::: {.section-slide .section-split}

::: {.section-main}
<div class="section-number">Section 01</div>

<div class="section-title">
  Architectural Foundations <span class="gradient-text">& Scaling</span>
</div>

<div class="section-desc">
  From dense computation to sub-quadratic attention, sparse mixture of experts, and unified multimodal tokenization.
</div>
:::

::: {.section-agenda-card}
<div class="agenda-header">📋 Section Agenda</div>
<ul class="agenda-list">
  <li class="agenda-item">
    <span class="agenda-num">1</span>
    <span class="agenda-tag">Single-Focus Slide Law & Cognitive Load</span>
  </li>
  <li class="agenda-item">
    <span class="agenda-num">2</span>
    <span class="agenda-tag">Depthwise Separable Convolution Factorization</span>
  </li>
  <li class="agenda-item">
    <span class="agenda-num">3</span>
    <span class="agenda-tag">Scaled Dot-Product Attention & IO Limits</span>
  </li>
  <li class="agenda-item">
    <span class="agenda-num">4</span>
    <span class="agenda-tag">Multimodal Fusion & Frontier MoE Models</span>
  </li>
</ul>
:::

:::

::: {.notes}
Speaker notes previewing the upcoming agenda topics.
:::
```

#### Section Archetype 3: Minimalist Accent Section (`.section-minimal` / `.section-line`)
Clean Swiss minimalist design with a horizontal accent pill bar, tracked kicker, and uncluttered layout.

```markdown
## {background-color="#0f172a"}

::: {.section-slide .section-minimal}

<div class="section-accent-line"></div>

<div class="section-number">Section 03</div>

<div class="section-title">
  Systems Architecture <span class="gradient-text">& Pipelines</span>
</div>

<div class="section-desc">
  End-to-end execution flow, PyTorch RMSNorm implementation, and course project taxonomy matrices.
</div>

:::

::: {.notes}
Speaker notes for minimalist phase transitions.
:::
```

#### Section Archetype 4: Centered Banner Section (`.section-banner` / `.section-centered`)
Centered alignment with pill badge and framed glass banner container.

```markdown
## {background-color="#0f172a"}

::: {.section-slide .section-banner}

::: {.section-banner-card}

<div class="section-badge">Section 04 • Synthesis</div>

<div class="section-title">
  Synthesis, Checkpoint <span class="gradient-text">& Conclusions</span>
</div>

<div class="section-desc">
  Interactive conceptual checkpoints, roofline memory bandwidth takeaways, and linked bibliographic citations.
</div>

:::

:::

::: {.notes}
Speaker notes for concluding synthesis section.
:::
```

#### Section Archetype 5: Hairline Agenda Section (`.section-hairline-agenda`)
Restrained two-column transition pairing section identity with a clean typographic agenda list with simple numerical markers (no glowing badges).

```markdown
## {background-color="#f8fafc"}

::: {.section-slide .section-hairline-agenda}

::: {.section-main}
<div class="section-number">Section 01</div>

<div class="section-title">
  Hairline Agenda <span class="gradient-text">Transition</span>
</div>

<div class="section-desc">
  Restrained two-column transition pairing section identity with a clean typographic agenda list with simple numerical markers.
</div>
:::

::: {.section-agenda-hairline}
<ul class="agenda-hairline-list">
  <li class="agenda-hairline-item">
    <span class="agenda-index">01</span>
    <span class="agenda-text">Mathematical Foundations & Tensor Ranks</span>
  </li>
  <li class="agenda-hairline-item">
    <span class="agenda-index">02</span>
    <span class="agenda-text">Sub-Quadratic Attention & Kernel Tiling</span>
  </li>
  <li class="agenda-hairline-item">
    <span class="agenda-index">03</span>
    <span class="agenda-text">Hardware Memory Roofline Benchmarks</span>
  </li>
</ul>
:::

:::

::: {.notes}
Speaker notes for hairline agenda phase transition.
:::
```

#### Section Archetype 6: Pure Numeral & Italic Abstract Section (`.section-pure-numeral`)
Large clean modern numeral paired with a high-contrast module headline and a single-sentence italic narrative scope.

```markdown
## {background-color="#f8fafc"}

::: {.section-slide .section-pure-numeral}

<div class="section-numeral-large">02</div>

<div class="section-title">
  Pure Numeral <span class="gradient-text">& Italic Abstract</span>
</div>

<div class="section-abstract">
  Large clean modern numeral paired with a high-contrast module headline and a single-sentence italic narrative scope.
</div>

:::

::: {.notes}
Speaker notes for numeral and abstract transition.
:::
```

#### Section Archetype 7: Minimal Line & Tracker Section (`.section-minimal-line`)
Understated 1px horizontal accent marker with small-caps monospace section tracker and high-contrast typography.

```markdown
## {background-color="#f8fafc"}

::: {.section-slide .section-minimal-line}

<div class="section-accent-line"></div>

<div class="section-tracker">Module Section 03</div>

<div class="section-title">
  Minimal Line <span class="gradient-text">& Section Tracker</span>
</div>

<div class="section-desc">
  Understated 1px horizontal accent marker with small-caps monospace section tracker and high-contrast typography.
</div>

:::

::: {.notes}
Speaker notes for clean minimal line transition.
:::
```

#### Section Archetype 8: Centered Modern Hairline Section (`.section-centered-modern`)
Symmetrical centered composition framed with subtle top and bottom hairline borders for balanced transition authority.

```markdown
## {background-color="#f8fafc"}

::: {.section-slide .section-centered-modern}

::: {.section-centered-frame}

<div class="section-tracker">Synthesis & Conclusion • Section 04</div>

<div class="section-title">
  Centered Modern <span class="gradient-text">Hairline Section</span>
</div>

<div class="section-subtitle">
  Symmetrical centered composition framed with subtle top and bottom hairline borders for balanced, understated transition authority.
</div>

:::

:::

::: {.notes}
Speaker notes for centered hairline divider transition.
:::
```

---

### 4.3 Content Slide Archetypes

### Archetype 3: Core Concept with Key Idea & 2-Column Cards

```markdown
## What Is the Fundamental Law of Slide Design?

<span class="kicker">Guiding Principle</span>

Every slide must answer **one specific question** with absolute visual clarity.

::: {.key-idea}
::: {.key-idea-title}
💡 Fundamental Design Law
:::
**High-impact default:** One primary question, one intuitive visual or equation anchor, and zero clutter. Explanations belong in speaker notes.
:::

::: {.columns}

::: {.column width="50%"}
::: {.card}
### 🎯 Cognitive Load Management
Dense text slides force the audience to choose between reading and listening. Clean slides allow the lecturer to lead the narrative.
:::
:::

::: {.column width="50%"}
::: {.card .card-glow}
### ⚡ Visual Anchor Dominance
A strong central figure or formatted equation card anchors the concept in memory 3× more effectively than bulleted text.
:::
:::

:::

::: {.notes}
Detailed speaker explanations and cognitive science references.
:::
```

---

### Archetype 4: Two-Column Math & Factorization Slide

```markdown
## Why Factorize Spatial and Channel Convolutions?

<span class="kicker">Computational Factorization</span>

::: {.columns .valign-center}

::: {.column width="52%"}

### Separating Space from Channels

Standard convolution couples spatial filtering with channel mixing. **Depthwise separable convolutions** [@howard2017mobilenets] factorize this into two steps:

1. **Depthwise:** Spatial filtering per channel ($K \times K \times 1$)
2. **Pointwise:** Linear combination across channels ($1 \times 1 \times C_{\text{in}} \times C_{\text{out}}$)

::: {.definition}
::: {.definition-term}
📐 Computational Factorization
:::
Decomposing multidimensional tensor operations into orthogonal rank-1 operators drastically cuts FLOPs with negligible accuracy loss.
:::

:::

::: {.column width="48%"}

$$
\mathrm{FLOPs}_{\text{standard}} = H \cdot W \cdot C_{\text{in}} \cdot C_{\text{out}} \cdot K^2
$$

$$
\mathrm{FLOPs}_{\text{separable}} = H \cdot W \cdot C_{\text{in}} \cdot K^2 + H \cdot W \cdot C_{\text{in}} \cdot C_{\text{out}}
$$

::: {.card .card-muted}
$$\text{Efficiency Gain} \approx \frac{1}{N} + \frac{1}{K^2} \approx \mathbf{8\text{–}9\times \text{ Reduction}}$$
:::

:::

:::

::: {.notes}
Step-by-step derivation notes explaining asymptotic savings as $C_{\text{out}} \to \infty$.
:::
```

---

### Archetype 5: Formal Definition & Formula Card Slide

```markdown
## How Is Scaled Dot-Product Attention Formulated?

<span class="kicker">Mathematical Formulation</span>

::: {.formula-card}
::: {.formula-header}
Core Attention Mechanism [@vaswani2017attention]
:::

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V
$$

::: {.formula-legend}
Where $Q, K \in \mathbb{R}^{N \times d_k}$ and $V \in \mathbb{R}^{N \times d_v}$ denote query, key, and value matrices, and $\sqrt{d_k}$ is the temperature scaling factor.
:::
:::

::: {.columns}

::: {.column width="50%"}
::: {.info-box}
::: {.info-box-title}
ℹ️ Scaling Rationale
:::
Dividing by $\sqrt{d_k}$ prevents large dot product magnitudes from saturating the softmax into regions with vanishing gradients.
:::
:::

::: {.column width="50%"}
::: {.warning}
::: {.warning-title}
⚠️ Memory IO Bottleneck
:::
Computing $Q K^T$ produces an $N \times N$ attention matrix, creating an $O(N^2)$ HBM memory IO bottleneck resolved by FlashAttention [@dao2022flashattention].
:::
:::

:::

::: {.notes}
Discussion of softmax temperature parameter and memory-bandwidth bound nature of attention.
:::
```

---

### Archetype 6: 3-Column Taxonomy / Feature Grid Slide

```markdown
## What Are the Primary Multimodal Fusion Paradigms?

<span class="kicker">Taxonomy Overview</span>

::: {.grid-3}

::: {.card}
[Early Fusion]{.badge .badge-image}

### Direct Concatenation

Raw or patch-level tokens are concatenated into a single sequence before the transformer backbone.

- **Pros:** Full bidirectional cross-modal attention at every layer.
- **Cons:** Quadratic compute scaling over long sequences.
:::

::: {.card .card-accent}
[Cross-Attention]{.badge .badge-video}

### Latent Cross-Fusion

Modalities are processed in dedicated backbones and cross-attended in intermediary layers.

- **Pros:** Modular pretraining and decoupled representations.
- **Cons:** Asymmetric flow and potential alignment bottlenecks.
:::

::: {.card}
[Native Omni]{.badge .badge-unified}

### Unified Token Stream

Universal token vocabulary interleaves text, vision patches, and audio frames in a single autoregressive stream.

- **Pros:** True omni-modal zero-shot reasoning.
- **Cons:** Complex multi-task loss balancing and high VRAM.
:::

:::

::: {.notes}
Comparison between early fusion, cross-attention encoders, and unified omni-modal token streams.
:::
```

---

### Archetype 7: WOW Frontier Model Card Slide

```markdown
## How Does Frontier Reasoning Scale in DeepSeek-R1?

<span class="kicker">Frontier Breakthrough</span>

::: {.wow-card}

::: {.wow-header}
<div>
  [Reasoning LLM]{.badge .badge-text}
  [DeepSeek-R1]{.badge .badge-accent}
</div>
<span class="small muted">Open Weights / MIT License [@deepseek2025r1]</span>
:::

::: {.wow-meta-grid}
::: {.wow-meta-item}
<span class="wow-meta-label">Architecture</span>
<span class="wow-meta-val">671B Total MoE (37B active per token, 128 routing experts)</span>
:::
::: {.wow-meta-item}
<span class="wow-meta-label">Training Recipe</span>
<span class="wow-meta-val">Pure RL (DeepSeek-R1-Zero) + Multi-stage SFT distillation</span>
:::
::: {.wow-meta-item}
<span class="wow-meta-label">Benchmark Result</span>
<span class="wow-meta-val">97.3% MATH-500 • 90.8% Pass@1 HumanEval • 79.8% AIME 2024</span>
:::
::: {.wow-meta-item}
<span class="wow-meta-label">Efficiency</span>
<span class="wow-meta-val">Multi-head Latent Attention (MLA) cuts KV-cache by 93%</span>
:::
:::

::: {.wow-breakthrough}
🚀 **Core Breakthrough:** Large-scale reinforcement learning directly incentivizes reasoning chains (Chain-of-Thought) and self-correction behaviors without human supervised warm-up.
:::

:::

::: {.notes}
Key innovations: Pure RL reasoning emergence, MLA KV cache compression, and distillation to small edge models.
:::
```

---

### Archetype 8: Quantitative Impact & Metric Counters

```markdown
## What Are the Real-World Gains of FP8 Quantization?

<span class="kicker">Performance Benchmarks</span>

::: {.metric-row}

::: {.metric-card}
<div class="metric-value">4.2×</div>
<div class="metric-label">Inference Speedup</div>
<span class="metric-delta positive">+320% Token/s</span>
:::

::: {.metric-card}
<div class="metric-value">75%</div>
<div class="metric-label">VRAM Reduction</div>
<span class="metric-delta positive">4-bit AWQ Quant</span>
:::

::: {.metric-card}
<div class="metric-value">−0.2%</div>
<div class="metric-label">MMLU Accuracy Delta</div>
<span class="metric-delta negative">Negligible Loss</span>
:::

::: {.metric-card}
<div class="metric-value">128k</div>
<div class="metric-label">Context Window</div>
<span class="metric-delta positive">FlashAttention-3</span>
:::

:::

::: {.warning}
::: {.warning-title}
⚠️ Memory Bandwidth Constraint
:::
Theoretical FLOP reductions only translate to wall-clock latency gains when the kernel is compute-bound. In autoregressive token generation with small batch sizes, latency is strictly bound by High-Bandwidth Memory (HBM) bandwidth.
:::

::: {.notes}
Explanation of arithmetic intensity and roofline limits.
:::
```

---

### Archetype 9: 2-Column Side-by-Side Comparison Slide

```markdown
## Dense vs Sparse: How Do MoE Models Compare?

<span class="kicker">Architectural Trade-Offs</span>

::: {.compare-container}

::: {.compare-card .compare-con}
::: {.compare-header}
<span>Dense Transformer Baseline</span>
[Standard]{.badge .badge-video}
:::

- Every parameter is active for every input token
- Fixed computational cost proportional to total parameter count $P_{\text{total}}$
- Compute-bound at large batch sizes, but excessive FLOP waste on simple tokens
- Higher energy footprint per output token

$$C_{\text{dense}} = 2 \cdot N \cdot P_{\text{total}}$$
:::

::: {.compare-card .compare-pro}
::: {.compare-header}
<span>Sparse Mixture of Experts (MoE)</span>
[Efficient]{.badge .badge-unified}
:::

- Top-$k$ gating dynamically routes tokens to specialized feedforward experts
- Constant computational budget with massive capacity: $P_{\text{active}} \ll P_{\text{total}}$
- Higher throughput per watt and superior scaling laws
- Expert parallelism requires high inter-GPU interconnect bandwidth

$$C_{\text{MoE}} = 2 \cdot N \cdot P_{\text{active}}$$
:::

:::

::: {.notes}
Trade-offs between parameter scaling, memory requirements, and expert parallelism communication overhead.
:::
```

---

### Archetype 10: Step & Process Pipeline Flow Slide

```markdown
## What Is the End-to-End Multimodal Execution Flow?

<span class="kicker">Execution Pipeline</span>

::: {.step-flow}

::: {.step-flow-item}
<div class="step-number">Step 01</div>
<div class="step-title">Tokenization</div>
<div class="step-desc">Discretize audio waveforms, visual patches, and text into discrete token IDs.</div>
:::

::: {.step-flow-item}
<div class="step-number">Step 02</div>
<div class="step-title">Alignment</div>
<div class="step-desc">Project modality latents into a shared embedding space via projection layers.</div>
:::

::: {.step-flow-item}
<div class="step-number">Step 03</div>
<div class="step-title">Transformer Core</div>
<div class="step-desc">Deep autoregressive processing with rotary embeddings and MoE routing.</div>
:::

::: {.step-flow-item}
<div class="step-number">Step 04</div>
<div class="step-title">Detokenization</div>
<div class="step-desc">Decode output tokens into waveforms, synthesized frames, or robotic actions.</div>
:::

:::

::: {.info-box}
::: {.info-box-title}
ℹ️ Continuous vs Discrete Tokenization
:::
Continuous signals require specialized neural audio codecs (DAC, EnCodec) or continuous diffusion decoders.
:::

::: {.notes}
Detailed walkthrough of tokenization pipelines and decoder architectures.
:::
```

---

### Archetype 11: Clean Terminal Code Window Slide

````markdown
## How Is RMSNorm Implemented in PyTorch?

<span class="kicker">Implementation Reference</span>

```python
import torch
import torch.nn as nn

class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization (Zhang & Sennrich, 2019)."""
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Compute root mean square across last dimension without mean centering
        rms = torch.rsqrt(x.pow(2).mean(dim=-1, keepdim=True) + self.eps)
        return x * rms * self.weight
```

::: {.card .card-muted .card-compact}
<span class="small">**System Optimization Insight:** RMSNorm eliminates the mean subtraction pass required by standard LayerNorm ($O(2N)$ down to $O(N)$ reads), saving ~7% HBM bandwidth per transformer layer.</span>
:::

::: {.notes}
Kernel execution details and memory bandwidth savings on NVIDIA Tensor Cores.
:::
````

---

### Archetype 12: Taxonomy Matrix / Evaluation Table Slide

```markdown
## How Do Modalities Map Across Course Projects?

<span class="kicker">Taxonomy Matrix</span>

::: {.matrix-container}

| Project Domain | Architecture | Modality | Inference Baseline | Target Optimization |
|:---|:---:|:---:|:---:|:---:|
| **LLM Reasoning** | DeepSeek-R1-Distill | [Text]{.badge .badge-text} | Ollama / vLLM | AWQ 4-bit + Speculative Decoding |
| **Document Vision** | Qwen2-VL-7B | [Image]{.badge .badge-image} | HuggingFace | FlashAttention-2 + TensorRT-LLM |
| **Speech Generation** | CosyVoice-2 | [Audio]{.badge .badge-audio} | PyTorch Native | ONNX Runtime + C++ Runtime |
| **Video Synthesis** | HunyuanVideo Fast | [Video]{.badge .badge-video} | Diffusers | TeaCache + DiT Step Pruning |
| **Visual Agent** | UI-TARS 7B | [Action]{.badge .badge-action} | vLLM Engine | Prefix Caching + Fast ViT Backbone |
| **Omni Multimodal** | Mini-Omni-2 | [Omni]{.badge .badge-unified} | PyTorch | Streaming Chunked Cross-Attention |

:::

::: {.notes}
Overview of baseline architectures, profiling targets, and optimization assignments.
:::
```

---

### Archetype 13: Interactive Audience Checkpoint Slide

```markdown
## Checkpoint: What Dictates Real-World LLM Generation Speed?

::: {.checkpoint-box}

::: {.checkpoint-header}
❓ Checkpoint 01 • Memory vs Compute Bottlenecks
:::

::: {.checkpoint-question}
What is the primary hardware bottleneck during autoregressive token generation at batch size 1 on modern GPUs?
:::

::: {.checkpoint-options}

::: {.checkpoint-option}
A. Tensor Core peak FLOP/s compute throughput (Compute Bound)
:::

::: {.checkpoint-option .correct}
B. High-Bandwidth Memory (HBM) Transfer Rate (Memory Bandwidth Bound)
:::

::: {.checkpoint-option}
C. CPU-to-GPU PCIe host-device interconnect latency
:::

::: {.checkpoint-option}
D. KV-cache allocation fragmentation in PyTorch allocator
:::

:::

:::

::: {.notes}
**Correct Answer: B.**
Detailed arithmetic intensity derivation: $I = \frac{2P}{2P} = 1\text{ FLOP/byte} \ll I_{\text{ridge}} \approx 153\text{ FLOP/byte}$.
:::
```

---

### Archetype 14: Final Slide Takeaway Slide

```markdown
## What Is the Core Takeaway for System Optimization?

<span class="kicker">Synthesis & Key Takeaway</span>

::: {.takeaway}
<div class="takeaway-title">Final Synthesis</div>
<div class="takeaway-message">
FLOPs measure theoretical compute, but memory bandwidth dictates real-world latency. Always profile memory traffic before optimizing math operations.
</div>
:::

::: {.notes}
Summary remarks and transition to homework assignments or next topic.
:::
```

---

### Archetype 15: Academic References & Bibliography Slide

```markdown
## References

::: {#refs}
:::

::: {.notes}
Bibliographic references automatically generated by Pandoc from `references.bib`.
All citations throughout the presentation are linked and traceable.
:::
```

---

## 5. Comprehensive Container Class & CSS Utility Reference

The table below catalogs every Quarto container class and CSS utility provided by the design system:

### 5.1 Layout & Grid Engine (`_layout.scss`)

| Container / Class | Parent / Selector | Description & Visual Treatment |
|:---|:---|:---|
| `.hero-container` | `section` | Full-height flex container for title slides with centered content, title, and metadata bar. |
| `.hero-badge` | `.hero-container` | Floating pill badge at top of title slide with accent border and glass background. |
| `.hero-title` | `.hero-container` | Main lecture title (2.8em, 800-weight) with heading font binding and text gradient support. |
| `.hero-subtitle` | `.hero-container` | Subtitle description paragraph (1.15em) in muted high-contrast text. |
| `.hero-footer` | `.hero-container` | Horizontal metadata bar with author, format, typography, and release version pills. |
| `.section-slide` | `section` | Container for section divider slides with large section number and accent underline. |
| `.section-number` | `.section-slide` | Overline section indicator with dynamic accent pseudo-bar (`::before`). |
| `.section-title` | `.section-slide` | Major section header (2.4em, 800-weight) supporting `.gradient-text`. |
| `.section-desc` | `.section-slide` | Section summary text outlining key topics covered in the upcoming module. |
| `.columns` | `section` / `.card` | Flexbox multi-column layout wrapper with automatic column spacing and wrapping. |
| `.valign-center` | `.columns` | Vertically centers all child columns along their cross-axis. |
| `.valign-top` | `.columns` | Aligns all child columns to the top edge. |
| `.valign-bottom` | `.columns` | Aligns all child columns to the bottom edge. |
| `.column` | `.columns` | Individual column container (e.g. `::: {.column width="50%"}`). |
| `.grid-2` | `section` / `.card` | CSS Grid with 2 equal-width columns (`1fr 1fr`). |
| `.grid-3` / `.grid-1-1-1` | `section` / `.card` | CSS Grid with 3 equal-width columns (`1fr 1fr 1fr`). |
| `.grid-4` | `section` / `.card` | CSS Grid with 4 equal-width columns (`repeat(4, 1fr)`). |
| `.grid-5` | `section` / `.card` | CSS Grid with 5 equal-width columns (`repeat(5, 1fr)`). |
| `.grid-60-40` / `.grid-2-1` | `section` | Asymmetric 2-column grid with 60% left column and 40% right column. |
| `.grid-40-60` / `.grid-1-2` | `section` | Asymmetric 2-column grid with 40% left column and 60% right column. |
| `.grid-70-30` | `section` | Asymmetric 2-column grid with 70% left column and 30% right column. |
| `.grid-30-70` | `section` | Asymmetric 2-column grid with 30% left column and 70% right column. |
| `.card-grid` | `section` | Auto-fitting responsive card grid (`repeat(auto-fit, minmax(280px, 1fr))`). |

### 5.2 Card & Surface Suite (`_components.scss`)

| Container / Class | Description & Styling |
|:---|:---|
| `.card` | Base glassmorphic card container with `--lecture-surface-glass`, 1px border, and smooth elevation on hover. |
| `.glass-card` | Explicit frosted glass container with `backdrop-filter: blur(12px) saturate(180%)`. |
| `.card-accent` | Card featuring a 3px gradient top accent bar matching the active preset accent. |
| `.card-glow` | Card with a subtle radial glow drop shadow (`--lecture-glow-accent`). |
| `.card-muted` | Card with subtle desaturated background for secondary notes or system takeaways. |
| `.card-compact` | Card with reduced internal padding (`0.75rem 1rem`) for dense layouts. |
| `.card-title` / `.column-title` | Standard card header line (1.2em, 600 semi-bold) with bottom spacing. |

### 5.3 Editorial Callout Suite (`_components.scss`)

| Container / Class | Usage & Styling |
|:---|:---|
| `.key-idea` | Gold-accented callout box for core conceptual laws and primary takeaways. |
| `.key-idea-title` | Header for key idea box with bold font and icon. |
| `.definition` | Blue/Accent-bordered callout box for formal mathematical and algorithmic definitions. |
| `.definition-term` | Header for definition box with term name. |
| `.warning` | Crimson/Rose-bordered alert box for memory bottlenecks, anti-patterns, and hardware limits. |
| `.warning-title` | Header for warning box with alert icon. |
| `.info-box` / `.insight-box` | Teal/Cyan-bordered callout box for supplementary technical context. |
| `.info-box-title` | Header for info box with icon. |
| `.formula-card` | Specialized mathematical formula container with header bar, KaTeX formula, and legend. |
| `.formula-header` | Top label bar of formula card. |
| `.formula-legend` | Bottom variable explanation text in formula card. |
| `.takeaway` | Large-type synthesis container for the final slide of a lecture deck. |
| `.takeaway-title` | Title of takeaway banner. |
| `.takeaway-message` | Main takeaway sentence in prominent typographic scale. |

### 5.4 Specialized Visual Components (`_components.scss`)

| Container / Class | Usage & Styling |
|:---|:---|
| `.metric-row` | Horizontal flex row for KPI metric cards. |
| `.metric-card` / `.metric` | Glassmorphic KPI card with gradient numerals, uppercase label, and delta tag. |
| `.metric-value` | Large numeral (`2.2em`) styled with gradient text and tabular font numbers. |
| `.metric-label` | Uppercase descriptive label below the metric numeral. |
| `.metric-delta.positive` | Green pill badge indicating positive throughput or speedup gain. |
| `.metric-delta.negative` | Red/Amber pill badge indicating minimal loss or overhead metric. |
| `.compare-container` | Side-by-side comparison container (grid or flex). |
| `.compare-card` | Comparison card with color-coded top accent border and header. |
| `.compare-card.compare-pro` | Pro/Advantage card with emerald green top border and subtle green tint. |
| `.compare-card.compare-con` | Con/Baseline card with crimson red top border and subtle red tint. |
| `.compare-card.compare-neutral` | Neutral card with blue accent top border. |
| `.wow-card` | Frontier breakthrough model showcase card with top gradient bar, 2x2 meta grid, and breakthrough box. |
| `.wow-header` | Top bar of WOW card containing badges and paper citation. |
| `.wow-meta-grid` | 2x2 grid containing architecture, training, benchmark, and efficiency specs. |
| `.wow-breakthrough` | Accent box at bottom of WOW card highlighting the primary breakthrough. |
| `.step-flow` | Horizontal pipeline timeline with connecting line between steps. |
| `.step-flow-item` | Individual step card with numbered badge, title, and description. |
| `.step-number` | Number pill (`Step 01`) with accent background. |
| `.checkpoint-box` | Interactive audience quiz container. |
| `.checkpoint-header` | Quiz question header with category tag. |
| `.checkpoint-question` | Main quiz question text. |
| `.checkpoint-options` | 2-column grid of multiple-choice answer options. |
| `.checkpoint-option` | Individual answer option card. |
| `.checkpoint-option.correct` | Correct answer option card with green border and checkmark highlight. |
| `.matrix-container` | Wrapper for markdown tables with horizontal scroll protection. |
| `table.matrix-table` | Data table with dark slate header, highlighted first column, and row hover effect. |

### 5.5 Micro-Animations & Reveal Fragments (`_animations.scss`)

| Fragment Class | Effect |
|:---|:---|
| `.fade-up-subtle` | Slides element up by 12px while fading opacity from 0 to 1 with smooth cubic-bezier easing. |
| `.blur-focus` | Transitions element from 4px blur to crystal-clear focus upon reveal. |
| `.highlight-border` | Animates the border color to radiant accent glow upon activation. |
| `.scale-up-subtle` | Subtle 0.96 to 1.00 scale transformation on reveal. |

---

## 6. SCSS Architecture, Token Map, & Preset Customization

### 6.1 Two-Layer Token Architecture

The SCSS theme adheres to a strict two-layer token architecture:

1. **Compile-Time Defaults (`/*-- scss:defaults --*/`):**
   - Declares Sass variables with `!default` (e.g. `$body-bg`, `$body-color`, `$theme-color`, `$presentation-heading-font`).
   - Imports Google Fonts (`@import url(...)`).
   - Configures Reveal.js Sass compiler constants.

2. **Runtime CSS Custom Properties (`/*-- scss:rules --*/`):**
   - Declares `:root` CSS variables (e.g. `--lecture-bg`, `--lecture-surface`, `--lecture-accent`, `--lecture-border`).
   - All component and layout partials consume exclusively `--lecture-*` CSS custom properties, allowing dynamic runtime adaptation.

### 6.2 Design Token Dictionary

```scss
:root {
  /* Preset Identifier */
  --lecture-preset: "swiss-minimal";

  /* Canvas & Surfaces */
  --lecture-bg: #f8fafc;
  --lecture-surface: #ffffff;
  --lecture-surface-alt: #f1f5f9;
  --lecture-surface-glass: rgba(255, 255, 255, 0.85);

  /* Typography */
  --lecture-fg: #334155;
  --lecture-fg-heading: #0f172a;
  --lecture-fg-muted: #64748b;
  --lecture-font-sans: 'Inter', system-ui, sans-serif;
  --lecture-font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
  --lecture-font-mono: 'JetBrains Mono', monospace;

  /* Accent & Gradients */
  --lecture-accent: #2563eb;
  --lecture-accent-light: #eff6ff;
  --lecture-accent-gradient: linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);

  /* Borders & Shadows */
  --lecture-border: #e2e8f0;
  --lecture-border-glass: rgba(226, 232, 240, 0.8);
  --lecture-radius-sm: 6px;
  --lecture-radius-md: 10px;
  --lecture-radius-lg: 16px;
  --lecture-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --lecture-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --lecture-shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.12);
}
```

---

## 7. Authoring Checklist for New Lectures

Before submitting or publishing any new lecture module:

- [ ] **One Question Per Slide:** Does every slide title ask a clear, focused technical question ending with `?` (except title, section, and references)?
- [ ] **Speaker Notes Complete:** Does every single slide contain rich `::: {.notes}` with detailed instructor narration?
- [ ] **Multi-Line Div Syntax:** Are all `::: {.card}`, `::: {.key-idea}`, `::: {.column}`, and other container blocks written with multi-line delimiters?
- [ ] **Dark Slide Contrast:** Are Title and Section divider slides using `# {background-color="#0f172a"}` with `.hero-container` and `.section-slide`?
- [ ] **Visual Balance:** Is vertical space used efficiently without text clipping or horizontal scrolling on `1600×900`?
- [ ] **Mathematical Rigor:** Are all equations formatted with KaTeX and variable legends provided in `.formula-card` or `.formula-legend`?
- [ ] **Citations Traceable:** Are all cited papers referenced using `[@key]` and present in `references.bib`?
- [ ] **Zero Render Warnings:** Does `quarto render <file>.qmd` execute with 0 errors and 0 warnings?
- [ ] **Preset Compatibility:** Does the slide deck render cleanly when tested across the 4 aesthetic presets?

