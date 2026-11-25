#!/usr/bin/env python3
"""Verify database slide identities and numbers against rendered presentations."""
import argparse
from html.parser import HTMLParser
from pathlib import Path

from model_catalog import read_catalog


class RenderedSlides(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.depth = 0
        self.ids = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if tag == 'div':
            if self.depth or 'slides' in classes:
                self.depth += 1
        if self.depth and tag == 'section' and 'slide' in classes:
            self.ids.append(attrs.get('id'))

    def handle_endtag(self, tag):
        if tag == 'div' and self.depth:
            self.depth -= 1


def verify_presentations(catalog, site_dir):
    verified = 0
    for presentation in catalog['presentations']:
        path = Path(site_dir) / presentation['html_path']
        if not path.is_file():
            raise ValueError(f'Render the source presentation before publishing: {path}')
        ids = RenderedSlides(path.read_text(encoding='utf-8')).ids
        if None in ids or len(set(ids)) != len(ids):
            raise ValueError(f'Missing or duplicate rendered slide ID: {presentation["html_path"]}')
        expected = [s for s in catalog['slides'] if s['presentation_id'] == presentation['id']]
        for slide in expected:
            if slide['id'] not in ids:
                raise ValueError(f'Missing rendered source slide: {presentation["id"]}/{slide["id"]}')
            actual = ids.index(slide['id']) + 1
            if slide['position'] != actual:
                raise ValueError(f'Slide position mismatch for {presentation["id"]}/{slide["id"]}: database {slide["position"]}, rendered {actual}. Rebuild the presentation; generated title slides require an importer adapter.')
            verified += 1
        if len(ids) != len(expected):
            raise ValueError(f'Slide order/count mismatch: {presentation["id"]}, database {len(expected)}, rendered {len(ids)}')
    return verified


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', choices=('models', 'tools'), default='models')
    parser.add_argument('--database', type=Path)
    parser.add_argument('--site-dir', type=Path, default=root / '_site')
    args = parser.parse_args()
    reader = read_catalog
    if args.catalog == 'tools':
        from tool_catalog import read_catalog as reader
    database = args.database or root / 'data' / (args.catalog + '.sqlite3')
    try:
        count = verify_presentations(reader(database), args.site_dir)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'{args.catalog.title()} source verification: {exc}\n')
    print(f'PASS: {count} database source slides match rendered IDs and positions.')


if __name__ == '__main__':
    main()
