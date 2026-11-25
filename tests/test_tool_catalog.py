"""Tools catalog synchronization keeps SQLite definitions authoritative."""
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from tool_catalog import create_catalog, read_catalog, sync_catalog


def slide(ident, html, notes='Speaker note'):
    return f'## Prompt {{#{ident}}}\n\n```{{=html}}\n{html}\n```\n\n::: {{.notes}}\n{notes}\n:::\n'


def card(name='Example', surface='IDE agent'):
    return (f'<div class="ts-card"><div class="ts-product-line"><img class="ts-logo" '
            f'src="logo.svg" alt="{name} logo"><strong class="ts-name">{name}</strong>'
            f'<span class="ts-surface">{surface}</span></div>'
            '<figure class="ts-chart"><figcaption>Edits across a repository</figcaption></figure></div>')


class ToolCatalogTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.deck = self.root / 'deck.qmd'
        self.deck.write_text(slide('ts-example', card()) + slide('ts-example-uses', '<p>Result 10</p>'))
        self.database = self.root / 'data/tools.sqlite3'
        create_catalog(self.database)
        self.sql("INSERT INTO groups VALUES ('ide','Editor & IDE',0)")
        self.sql("INSERT INTO presentations (id,source_path,html_path,title,module,sort_order) VALUES ('intro-tools','deck.qmd','deck.html','Tools Showcase','M1',0)")
        self.sql("INSERT INTO tools VALUES ('ts-example','example','ide',0)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-example','intro-tools','ts-example','card',0)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-example','intro-tools','ts-example-uses','results',1)")

    def sql(self, statement):
        with sqlite3.connect(self.database) as db:
            db.execute('PRAGMA foreign_keys=ON')
            return db.execute(statement).fetchall()

    def test_sync_updates_content_and_preserves_authored_bindings(self):
        sync_catalog(self.root)
        first = read_catalog(self.database)['tools'][0]
        self.assertEqual((first['name'], first['summary'], first['surface'], first['logo_src'], first['logo_alt']),
                         ('Example','Edits across a repository','IDE agent','logo.svg','Example logo'))
        self.deck.write_text(slide('ts-example', card('New name', 'Terminal agent'), 'New note') +
                             slide('ts-example-uses','<p>Result 42</p>'))
        sync_catalog(self.root)
        tool = read_catalog(self.database)['tools'][0]
        self.assertEqual(tool['name'], 'New name')
        self.assertEqual(tool['surface'], 'Terminal agent')
        self.assertEqual(tool['sources'][0]['notes'], 'New note')
        self.assertIn('Result 42', tool['sources'][1]['html'])
        self.assertEqual([s['role'] for s in tool['sources']], ['card','results'])

    def test_noop_preserves_file_bytes_and_mtime(self):
        sync_catalog(self.root)
        before = self.database.read_bytes(), self.database.stat().st_mtime_ns
        self.assertFalse(sync_catalog(self.root)['changed'])
        self.assertEqual((self.database.read_bytes(), self.database.stat().st_mtime_ns), before)

    def test_bad_binding_rolls_back_and_read_rejects_unsynced_edit(self):
        sync_catalog(self.root)
        self.sql("UPDATE tool_sources SET slide_id='wrong' WHERE role='results'")
        before = self.database.read_bytes()
        with self.assertRaisesRegex(ValueError, 'Missing source binding'):
            sync_catalog(self.root)
        self.assertEqual(self.database.read_bytes(), before)
        with self.assertRaisesRegex(ValueError, 'sync-tools'):
            read_catalog(self.database)

    def test_new_tool_and_sql_edits_are_respected(self):
        sync_catalog(self.root)
        self.deck.write_text(self.deck.read_text() + slide('ts-second',card('Second')) + slide('ts-second-uses','<p>Second result</p>'))
        self.sql("INSERT INTO tools VALUES ('ts-second','second','ide',1)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-second','intro-tools','ts-second','card',0)")
        self.sql("INSERT INTO tool_sources VALUES ('ts-second','intro-tools','ts-second-uses','results',1)")
        self.sql("UPDATE groups SET label='Renamed' WHERE id='ide'")
        sync_catalog(self.root)
        snapshot = read_catalog(self.database)
        self.assertEqual(snapshot['groups'][0]['tools'], ['ts-example','ts-second'])
        self.assertEqual(snapshot['tools'][1]['group_label'], 'Renamed')

    def test_sql_binding_edit_uses_new_exact_slide(self):
        sync_catalog(self.root)
        self.deck.write_text(self.deck.read_text() + slide('alternate-result','<p>Alternative result</p>'))
        self.sql("UPDATE tool_sources SET slide_id='alternate-result',ordinal=8 WHERE role='results'")
        sync_catalog(self.root)
        sources = read_catalog(self.database)['tools'][0]['sources']
        self.assertEqual([(source['id'],source['ordinal']) for source in sources],
                         [('ts-example',0),('alternate-result',8)])
        self.assertIn('Alternative result',sources[1]['html'])
        self.assertEqual(sources[1]['presentation_source'],'deck.qmd')

    def test_read_does_not_need_source_and_missing_database_fails(self):
        sync_catalog(self.root)
        self.deck.unlink()
        self.assertIn('Result 10', read_catalog(self.database)['tools'][0]['sources'][1]['html'])
        with self.assertRaises(FileNotFoundError):
            sync_catalog(self.root, self.root/'missing.sqlite3')
        with self.assertRaises(FileExistsError):
            create_catalog(self.database)
