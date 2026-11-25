"""End-to-end checks for presentation → SQLite → generated Showcase pages."""
import importlib.util
import sqlite3
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from model_catalog import create_catalog, sync_catalog
from test_model_catalog import card, slide, RESULT

spec = importlib.util.spec_from_file_location('showcase_builder', ROOT / 'scripts/build-showcase.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.deck = self.root / 'decks/a'
        self.deck.mkdir(parents=True)
        self.entry = self.deck / 'slides.qmd'
        self.entry.write_text(slide('exact-card', card()) + slide('exact-example', RESULT))
        self.db = self.root / 'data/models.sqlite3'
        self.page = self.root / 'raw/showcase/kept-url.qmd'
        create_catalog(self.db)
        self.sql("""
            INSERT INTO families VALUES ('example','Example family',0);
            INSERT INTO presentations(id,source_path,html_path,title,module,sort_order)
            VALUES ('a','decks/a/slides.qmd','decks/a/slides.html','Presentation A','M1',0);
            INSERT INTO models(id,slug,category,family_id,sort_order)
            VALUES ('stable-model','kept-url','llm','example',0);
            INSERT INTO model_sources VALUES ('stable-model','a','exact-card','card',0);
            INSERT INTO model_sources VALUES ('stable-model','a','exact-example','results',1);
        """)

    def sql(self, statement):
        with sqlite3.connect(self.db) as db:
            db.execute('PRAGMA foreign_keys=ON')
            db.executescript(statement)

    def rebuild(self):
        sync_catalog(self.root)
        builder.build_from_database(self.db, self.root)

    def test_edit_propagates_through_database_and_exact_source_links(self):
        self.rebuild()
        original = self.page.read_text()
        self.assertIn('Original takeaway', original)
        self.assertIn('/decks/a/slides.html#/exact-card', original)
        self.assertIn('/decks/a/slides.html#/exact-example', original)
        self.assertIn('Presentation A', original)
        self.entry.write_text(slide('exact-example', RESULT.replace('Score: 10', 'Score: 42'), notes='New evaluation notes') + slide('exact-card', card('Changed in presentation')))
        self.rebuild()
        updated = self.page.read_text()
        self.assertIn('Changed in presentation', updated)
        self.assertIn('Score: 42', updated)
        self.assertIn('New evaluation notes', updated)
        self.assertIn('slide 2', updated)
        self.assertNotIn('Original takeaway', updated)

    def test_pages_can_be_generated_from_database_without_reading_presentations(self):
        self.rebuild()
        expected = self.page.read_bytes()
        shutil.rmtree(self.root / 'decks')
        self.page.unlink()
        builder.build_from_database(self.db, self.root)
        self.assertEqual(self.page.read_bytes(), expected)

    def test_cross_deck_sources_keep_their_links_and_media_bases(self):
        second = self.root / 'decks/b'; second.mkdir()
        (second / 'slides.qmd').write_text(slide('exact-card', card('Second presentation card')) + slide('exact-example', RESULT.replace('Score: 10', 'Score: 77')))
        self.sql("""
            INSERT INTO presentations(id,source_path,html_path,title,module,sort_order)
            VALUES ('b','decks/b/slides.qmd','decks/b/slides.html','Presentation B','M2',1);
            INSERT INTO model_sources VALUES ('stable-model','b','exact-card','card',2);
            INSERT INTO model_sources VALUES ('stable-model','b','exact-example','results',3);
        """)
        self.rebuild()
        page = self.page.read_text()
        self.assertIn('Second presentation card', page)
        self.assertIn('Score: 77', page)
        for deck in ('a', 'b'):
            self.assertIn(f'/decks/{deck}/slides.html#/exact-card', page)
            self.assertIn(f'/decks/{deck}/slides.html#/exact-example', page)
            self.assertIn(f'/decks/{deck}/assets/result.svg', page)

    def test_cli_resolves_root_and_custom_database_once(self):
        custom = self.root / 'data/custom.sqlite3'
        self.db.rename(custom)
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/build-showcase.py'), '--root', str(self.root), '--database', 'data/custom.sqlite3'], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.root / 'data/custom.sqlite3').is_file())
        self.assertTrue(self.page.is_file())

    def test_catalog_edits_in_database_survive_content_sync(self):
        self.rebuild()
        self.sql("""
            INSERT INTO families VALUES ('new-family','Chosen family',1);
            UPDATE models SET family_id='new-family', slug='chosen-url' WHERE id='stable-model';
        """)
        self.entry.write_text(slide('exact-card', card('New slide content')) + slide('exact-example', RESULT))
        self.rebuild()
        changed_page = self.root / 'raw/showcase/chosen-url.qmd'
        self.assertIn('Chosen family', changed_page.read_text())
        self.assertIn('New slide content', changed_page.read_text())
        self.assertFalse(self.page.exists())
        self.assertFalse(list(self.root.rglob('*.json')))

    def test_removed_models_remove_owned_pages_and_keep_manual_pages(self):
        self.rebuild()
        manual = self.page.parent / 'hand-written.qmd'; manual.write_text('Keep this page')
        published = self.root / '_site/raw/showcase/kept-url.html'
        published.parent.mkdir(parents=True); published.write_text('Old generated output')
        self.sql("DELETE FROM models WHERE id='stable-model';")
        self.rebuild()
        self.assertFalse(self.page.exists())
        self.assertFalse(published.exists())
        self.assertEqual(manual.read_text(), 'Keep this page')


if __name__ == '__main__':
    unittest.main()
