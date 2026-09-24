#!/usr/bin/env python3
"""Build the static project pages linked from course_structure.qmd."""

import argparse
import json
import re
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlencode, urlsplit, urlunsplit

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets" / "projects"


def load_registration(require_enabled=False):
    config = json.loads((HERE / "registration.json").read_text(encoding="utf-8"))
    if not isinstance(config.get("enabled"), bool):
        raise ValueError("registration.enabled must be true or false")
    if not config["enabled"]:
        if require_enabled:
            raise ValueError("Registration is disabled: configure a published Google Form first")
        return None
    form_url = config.get("form_url", "")
    entry_id = config.get("project_entry_id", "")
    if not isinstance(form_url, str) or not isinstance(entry_id, str):
        raise ValueError("Registration URL and project entry ID must be strings")
    parsed = urlsplit(form_url)
    if (parsed.scheme != "https" or parsed.netloc != "docs.google.com"
            or not re.fullmatch(r"/forms/d/e/[A-Za-z0-9_-]+/viewform/?", parsed.path)):
        raise ValueError("form_url must be a published https://docs.google.com/forms/d/e/.../viewform URL")
    if not re.fullmatch(r"entry\.\d+", entry_id):
        raise ValueError("project_entry_id must use the public entry.<digits> format")
    return {
        "form_url": urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", "")),
        "project_entry_id": entry_id,
    }


def registration_markup(config, project_title):
    if config is None:
        return {"registration_cta": "", "registration_section": ""}
    query = {"usp": "pp_url", "hl": "en", config["project_entry_id"]: project_title}
    form_url = escape(config["form_url"] + "?" + urlencode(query), quote=True)
    embedded_url = escape(config["form_url"] + "?" + urlencode({**query, "embedded": "true"}), quote=True)
    title = escape(project_title, quote=True)
    return {
        "registration_cta": '<a class="registration-cta" href="#registration" aria-controls="registration" aria-expanded="false" onclick="document.getElementById(\'registration\').open = true;">Sign up for this project</a>',
        "registration_section": f'''<details id="registration" class="registration" ontoggle="document.querySelector('.registration-cta').setAttribute('aria-expanded', this.open);">
      <summary><h2>Project registration</h2></summary>
      <p>The project “{title}” is already selected. Enter your first name, last name, and Telegram username, then submit the form.</p>
      <p><a href="{form_url}" target="_blank" rel="noopener noreferrer">Open the form in a new tab ↗</a></p>
      <iframe class="registration-frame" src="{embedded_url}" title="Registration form for {title}" loading="lazy" onload="if (this.dataset.loaded &amp;&amp; this.closest('details').open) this.closest('details').scrollIntoView(); this.dataset.loaded = 'true';"></iframe>
    </details>''',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-registration", action="store_true", help="Fail if registration is not configured and enabled")
    args = parser.parse_args()
    registration = load_registration(require_enabled=args.require_registration)
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
        values = {key: escape(value, quote=True) for key, value in project.items() if isinstance(value, str)}
        values["number"] = f"{project['number']:02d}"
        values["catalog"] = "capstone-projects-1" if project["number"] <= 6 else "capstone-projects-2"
        values.update(registration_markup(registration, project["title"]))
        resources = []
        for filename, label, download in [
            ("README.md", "Project README ↗", ""),
            ("kaggle.ipynb", "Kaggle notebook ↓", " download"),
        ]:
            if (HERE.parent.parent / "projects" / project["id"] / filename).is_file():
                resources.append(f'<a href="../../projects/{values["id"]}/{filename}"{download}>{label}</a>')
        values["project_resources"] = '<div class="project-resources">' + "\n".join(resources) + '</div>' if resources else ""
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
        rendered = "\n".join(line.rstrip() for line in template.substitute(values).splitlines()) + "\n"
        (HERE / f"{project['id']}.html").write_text(rendered, encoding="utf-8")
    print(f"Built {len(projects)} project pages with {len(images)} local illustrations.")


if __name__ == "__main__":
    main()
