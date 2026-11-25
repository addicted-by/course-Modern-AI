"""Shared HTML and provenance helpers for the two Showcase generators."""
from __future__ import annotations

import copy
import json
from html import escape
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from showcase_html import Fragment, Node


def slide_url(slide):
    return "/" + slide["presentation_html"] + "#/" + slide["id"]


def asset_base(slide):
    return "/" + str(Path(slide["presentation_source"]).parent) + "/"


def rewrite(dom, destinations, slide):
    for node in dom.walk():
        for key in ("src", "poster", "href"):
            value = node.attrs.get(key)
            if not value:
                continue
            if value.startswith("#/"):
                node.attrs[key] = destinations.get((slide["presentation_id"], value[2:]), "/" + slide["presentation_html"] + value)
            elif not value.startswith(("/", "#")) and not urlsplit(value).scheme:
                node.attrs[key] = urljoin(asset_base(slide), value)
        if node.tag == "img":
            node.attrs.setdefault("loading", "lazy")
        if node.tag in ("audio", "video"):
            node.attrs["preload"] = "none"
            node.attrs.pop("autoplay", None)
    return dom


def hydrate(source):
    return {**source, "dom": Fragment(source["html"]).root}


def frontmatter(title, detail=False, *, css="styles/course-showcase.css", marker=""):
    prefix = "../../" if detail else "../"
    styles = [css] if isinstance(css, str) else css
    css_yaml = "    css: " + prefix + styles[0] if len(styles) == 1 else "    css:\n" + "\n".join("      - " + prefix + style for style in styles)
    return "\n".join(("---", 'title: ""', "pagetitle: " + json.dumps(title + " — Modern AI", ensure_ascii=False), "toc: false", "page-layout: full", "format:", "  html:", css_yaml, "---", marker, ""))


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text() != content:
        path.write_text(content)


def raw(html):
    return "\n```{=html}\n" + html + "\n```\n"


def notes_block(slide, label):
    return f'\n<details class="showcase-notes">\n<summary>{escape(label)}</summary>\n\n' + slide["notes"] + "\n\n</details>\n"


def source_caption(slide):
    label = f'{slide["presentation_title"]} · slide {slide["position"]}'
    return f'<a href="{escape(slide_url(slide))}" title="Slide ID: {escape(slide["id"])}">{escape(label)}</a>'
