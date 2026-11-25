"""Presentation → tools SQLite → website page checks."""
import importlib.util
import shutil
import sqlite3
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from tool_catalog import create_catalog, sync_catalog

spec = importlib.util.spec_from_file_location("tools_showcase_builder", ROOT / "scripts/build-tools-showcase.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def slide(ident, html, notes="Source note"):
    return f'## Slide title {{#{ident}}}\n\n```{{=html}}\n{html}\n```\n\n::: {{.notes}}\n{notes}\n:::\n'


def card():
    return ('<div class="ts-card"><div class="ts-product-line"><img class="ts-logo" src="assets/logo.svg" alt="Example logo">'
            '<strong class="ts-name">Example</strong><span class="ts-surface">IDE agent</span></div>'
            '<figure class="ts-chart"><figcaption>Repository edits</figcaption></figure>'
            '<div class="ts-sources"><a href="#/ts-example-uses">Use cases</a></div></div>')


class ToolsPipelineTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.deck = self.root / "decks/a/slides.qmd"
        self.deck.parent.mkdir(parents=True)
        self.deck.write_text(slide("ts-example", card()) + slide("ts-example-uses", '<div class="ts-card"><p>Reported result 10</p><img src="assets/result.svg" alt="Result"></div>'))
        self.database = self.root / "data/tools.sqlite3"
        create_catalog(self.database)
        self.sql("INSERT INTO groups VALUES ('ide','Editor & IDE',0)")
        self.sql("INSERT INTO presentations (id,source_path,html_path,title,module,sort_order) VALUES ('a','decks/a/slides.qmd','decks/a/slides.html','Tools lecture','M1',0)")
        self.sql("INSERT INTO tools VALUES ('ts-example','example','ide',0)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-example','a','ts-example','card',0)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-example','a','ts-example-uses','results',1)")
        self.page = self.root / "raw/tools-showcase/example.qmd"

    def sql(self, statement):
        with sqlite3.connect(self.database) as db:
            db.execute("PRAGMA foreign_keys=ON")
            db.execute(statement)

    def rebuild(self):
        sync_catalog(self.root)
        return builder.build_from_database(self.database, self.root)

    def test_database_only_render_retains_source_notes_links_and_media(self):
        self.rebuild()
        detail = self.page.read_text()
        self.assertIn('href="/raw/tools-showcase/example.html#use-cases"', detail)
        self.assertIn('/decks/a/slides.html#/ts-example', detail)
        self.assertIn('/decks/a/slides.html#/ts-example-uses', detail)
        self.assertIn('/decks/a/assets/result.svg', detail)
        self.assertIn('Source note', detail)
        self.assertNotIn('#technical-figures', detail)
        expected = self.page.read_bytes()
        shutil.rmtree(self.root / "decks")
        self.page.unlink()
        builder.build_from_database(self.database, self.root)
        self.assertEqual(self.page.read_bytes(), expected)

    def test_content_update_and_cross_deck_figure_links(self):
        second = self.root / "decks/b/slides.qmd"
        second.parent.mkdir(parents=True)
        second.write_text(slide("ts-evidence", '<div class="ts-card"><figure class="ts-evidence-figure"><img src="assets/figure.png" alt="Figure"></figure><a href="#/ts-example">Back</a></div>', 'Method detail'))
        self.sql("INSERT INTO presentations (id,source_path,html_path,title,module,sort_order) VALUES ('b','decks/b/slides.qmd','decks/b/slides.html','Evidence lecture','M2',1)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-example','b','ts-evidence','evidence',2)")
        self.rebuild()
        detail = self.page.read_text()
        self.assertIn('/decks/b/slides.html#/ts-evidence', detail)
        self.assertIn('href="/decks/b/assets/figure.png"', detail)
        self.assertIn('Open full-size figure', detail)
        self.assertIn('Method detail', detail)
        self.deck.write_text(slide("ts-example", card()) + slide("ts-example-uses", '<div class="ts-card"><p>Reported result 42</p></div>'))
        self.rebuild()
        detail = self.page.read_text()
        self.assertIn('Reported result 42', detail)
        self.assertNotIn('Reported result 10', detail)

    def test_removed_tool_cleans_only_generator_owned_pages(self):
        self.rebuild()
        manual = self.page.parent / "manual.qmd"
        manual.write_text("Keep this page")
        published = self.root / "_site/raw/tools-showcase/example.html"
        published.parent.mkdir(parents=True)
        published.write_text("Old output")
        self.sql("DELETE FROM tools WHERE id='ts-example'")
        self.rebuild()
        self.assertFalse(self.page.exists())
        self.assertFalse(published.exists())
        self.assertEqual(manual.read_text(), "Keep this page")


if __name__ == "__main__":
    unittest.main()
