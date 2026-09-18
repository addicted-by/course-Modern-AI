# Course project pages

Slides 16–17 of `../course_structure.qmd` link to these static pages. The pages open
directly from disk or from the same web server as the deck. Each page links back to
the appropriate catalog slide and includes 1–2 local research illustrations.

Edit `projects.json` for project content, `template.html` for markup and
`projects.css` for appearance. Image files and attribution manifests are in
`../assets/projects/`. Captions describe reference research, not student results.

Rebuild from the course directory:

```sh
python3 01_intro/project_pages/build.py
quarto render 01_intro/course_structure.qmd
```

Keep `project_pages/`, `assets/projects/`, `vendor/katex/`, and the deck's generated
`course_structure_files/` directory together when distributing the presentation.
The README and notebook links additionally use the course's `projects/` directory.
