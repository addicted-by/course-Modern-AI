# Modern AI

**Modern AI: Architectural Foundations, Mathematical Rigor & End-to-End Systems** (2026–2027)  
Author: Aleksey Ryabykin

This repository contains materials, lecture slides, and project documentation for the Modern AI course.

## Build the website

Requires Python 3 and Quarto (>= 1.4). From the repository root:

```sh
python3 raw/lectures/01_intro/project_pages/build.py
quarto render
```

For local preview, run the project-page generator first, then `quarto preview`.
GitHub Actions also regenerates the project pages before rendering the website.

## Project registration

The ten project pages share one Google Form, with the project preselected on each
page. Responses are stored in a private Google Sheet belonging to the course
owner. Public form configuration and setup instructions are in the
[project-page README](raw/lectures/01_intro/project_pages/README.md#project-registration).
Never commit response data or the form's editor URL.

## Community & Contacts

- 💬 **Telegram Group:** [Join Chat](https://t.me/+I-joDKs8iiIwOTQy) — official discussions, lecture Q&A, and announcements
- ✈️ **Instructor Telegram:** [@addicted_by](https://t.me/addicted_by) — direct contact with Aleksey Ryabykin
- 🐙 **GitHub Repository:** [course-Modern-AI](https://github.com/addicted-by/course-Modern-AI/tree/main)
