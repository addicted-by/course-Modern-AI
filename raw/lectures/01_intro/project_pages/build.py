#!/usr/bin/env python3
"""Build the static project pages linked from course_structure.qmd."""

import json
from html import escape
from pathlib import Path
from string import Template

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets" / "projects"


def main():
    projects = json.loads((HERE / "projects.json").read_text(encoding="utf-8"))
    template = Template((HERE / "template.html").read_text(encoding="utf-8"))
    images = []
    for manifest in sorted(ASSETS.glob("sources-*.json")):
        images.extend(json.loads(manifest.read_text(encoding="utf-8")))
    if sorted(project["number"] for project in projects) != list(range(1, 11)):
        raise ValueError("Expected projects 01 through 10 exactly once")
    projects.sort(key=lambda project: project["number"])
    for index, project in enumerate(projects):
        pictures = [image for image in images if image["project"] == project["number"]]
        if not 1 <= len(pictures) <= 2:
            raise ValueError(f"Expected 1–2 images for {project['id']}")
        for image in pictures:
            if not (ASSETS / image["file"]).is_file():
                raise FileNotFoundError(image["file"])
        for resource in ["README.md", "kaggle.ipynb"]:
            path = HERE.parent.parent / "projects" / project["id"] / resource
            if not path.is_file():
                raise FileNotFoundError(path)
        values = {key: escape(value, quote=True) for key, value in project.items() if isinstance(value, str)}
        values["number"] = f"{project['number']:02d}"
        values["catalog"] = "capstone-projects-1" if project["number"] <= 6 else "capstone-projects-2"
        values["figures"] = "\n".join(
            '<figure><a class="figure-link" href="../assets/projects/{file}" '
            'aria-label="Open full-size illustration: {alt}">'
            '<img src="../assets/projects/{file}" alt="{alt}" decoding="async"></a>'
            '<figcaption>{caption} <a href="{source_url}" target="_blank" rel="noopener noreferrer">Image source ↗</a>'
            '</figcaption></figure>'.format(**{key: escape(str(value), quote=True) for key, value in image.items()})
            for image in pictures
        )
        values["metrics"] = "\n".join(
            f"<dt>{escape(metric['name'])}</dt><dd>{escape(metric['meaning'])}</dd>"
            for metric in project["metrics"]
        )
        values["deliverables"] = "\n".join(f"<li>{escape(item)}</li>" for item in project["deliverables"])
        values["papers"] = "\n".join(
            f'<li><a href="{escape(paper["url"], quote=True)}" target="_blank" rel="noopener noreferrer">'
            f'{escape(paper["title"])} ↗</a></li>' for paper in project["papers"]
        )
        for direction, neighbor in [("previous", index - 1), ("next", index + 1)]:
            if 0 <= neighbor < len(projects):
                other = projects[neighbor]
                label = f"← Previous: {other['number']:02d}" if direction == "previous" else f"Next: {other['number']:02d} →"
                values[direction] = f'<a href="{escape(other["id"])}.html">{label}</a>'
            else:
                values[direction] = "<span></span>"
        (HERE / f"{project['id']}.html").write_text(template.substitute(values), encoding="utf-8")
    print(f"Built {len(projects)} project pages with {len(images)} local illustrations.")


if __name__ == "__main__":
    main()
