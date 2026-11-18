# LoRA Research lecture

Build the final research lecture from the repository root with Quarto and Node.js
on `PATH`:

```sh
quarto render raw/lectures/02_linalg/lecture02_lora_research.qmd --to revealjs
```

A full website build (`quarto render` from the repository root) publishes
`_site/raw/lectures/02_linalg/lecture02_lora_research.html`. A standalone
render writes `lecture02_lora_research.html` beside the QMD source.
The entry point includes the four final `lora_parts` files. Its diagrams, local
fonts, navigation filter, speaker-math support and mobile layout are under
`assets/lora_research_short/`. The lecture reuses the unchanged local course theme,
offline KaTeX renderer and vendored runtime, and inherits the Baikal + CA header
from `_metadata.yml`.

No Python execution, npm installation or network access is needed to build the
slides. The linked `peft_merge_practice.py` is a separate optional demonstration;
external research links retain their original destinations. Edit the QMD slide
parts and rebuild; generated HTML and PDF are not source dependencies.
