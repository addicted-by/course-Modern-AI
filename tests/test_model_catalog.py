"""Behavioral checks for presentation → database synchronization."""
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from model_catalog import create_catalog, migrate_catalog, read_catalog, sync_catalog


def slide(ident, body, notes="Original notes", title=None):
    return f'## {title or ident} {{#{ident}}}\n\n```{{=html}}\n{body}\n```\n\n::: {{.notes}}\n{notes}\n:::\n'


def card(summary="Original takeaway"):
    return '<div class="bn-model"><h3>Example 1</h3><div class="bn-facts"><p><span>Weights</span><b class="bn-shut">closed</b></p></div></div>' + ''.join(f'<div class="bn-head"><h4>{name}</h4><span class="sc-status"><i class="sc-pip {state}"></i></span></div>' for name, state in zip(['Architecture','Data','Training','Inference','Tools'],'npkkp')) + f'<div class="fv-takeaway">{summary}</div>'


RESULT = '<div class="sr-model"><h3>Example 1</h3></div><div class="sc-company" aria-label="Example Co"></div><div class="sr-stage"><img src="assets/result.svg" alt="Example output"></div><p>Score: 10</p>'


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.deck = self.root / 'decks/a'
        (self.deck / 'parts').mkdir(parents=True)
        (self.deck / 'assets').mkdir()
        (self.deck / 'assets/result.svg').write_text('<svg></svg>')
        self.card = self.deck / 'parts/card.qmd'
        self.result = self.deck / 'parts/results.qmd'
        self.card.write_text(slide('model-card', card()))
        self.result.write_text(slide('model-results', RESULT))
        self.entry = self.deck / 'deck.qmd'
        self.entry.write_text('{{< include parts/card.qmd >}}\n\n{{< include parts/results.qmd >}}\n')
        self.database = self.root / 'data/models.sqlite3'
        create_catalog(self.database)
        self.sql("INSERT INTO families VALUES ('example','Example family',0)")
        self.sql("INSERT INTO presentations (id,source_path,html_path,title,module,sort_order) VALUES ('a','decks/a/deck.qmd','decks/a/deck.html','Deck A','M1',0)")
        self.sql("INSERT INTO models VALUES ('example-1','example-1','llm','example',0)")
        self.sql("INSERT INTO model_sources VALUES ('example-1','a','model-card','card',0)")
        self.sql("INSERT INTO model_sources VALUES ('example-1','a','model-results','results',1)")

    def sql(self, command, values=()):
        with sqlite3.connect(self.database) as db:
            db.execute('PRAGMA foreign_keys=ON')
            return db.execute(command,values).fetchall()

    def sync(self):
        return sync_catalog(self.root)

    def model(self):
        return read_catalog(self.database)['models'][0]

    def test_content_and_notes_update_database_without_changing_binding(self):
        self.sync()
        initial = self.model()
        self.assertEqual(initial['name'], 'Example 1')
        self.assertEqual(initial['statuses'], list('npkkp'))
        self.assertFalse(initial['open'])
        self.assertEqual(initial['company'], 'Example Co')
        self.card.write_text(slide('model-card', card('Updated takeaway'), notes='Updated note'))
        self.result.write_text(slide('model-results', RESULT.replace('Score: 10','Score: 42')))
        stats = self.sync()
        updated = self.model()
        self.assertTrue(stats['changed'])
        self.assertEqual(updated['summary'], 'Updated takeaway')
        self.assertEqual(updated['sources'][0]['notes'], 'Updated note')
        self.assertIn('Score: 42', updated['sources'][1]['html'])
        self.assertEqual(updated['sources'][0]['id'], initial['sources'][0]['id'])
        self.assertNotEqual(updated['sources'][0]['content_hash'], initial['sources'][0]['content_hash'])

    def test_reorder_updates_numbers_without_rebinding(self):
        self.sync()
        self.entry.write_text('{{< include parts/results.qmd >}}\n{{< include parts/card.qmd >}}\n')
        self.sync()
        sources = self.model()['sources']
        self.assertEqual([(s['id'],s['position']) for s in sources],[('model-card',2),('model-results',1)])
        self.assertEqual(sources[0]['source_path'],'decks/a/parts/card.qmd')
        self.assertEqual(sources[0]['presentation_source'],'decks/a/deck.qmd')
        self.assertEqual(sources[0]['presentation_html'],'decks/a/deck.html')

    def test_noop_keeps_database_bytes_and_mtime(self):
        self.sync()
        original = (self.database.read_bytes(),self.database.stat().st_mtime_ns)
        self.assertFalse(self.sync()['changed'])
        self.assertEqual((self.database.read_bytes(),self.database.stat().st_mtime_ns),original)

    def test_database_read_does_not_require_presentation_files(self):
        self.sync()
        self.entry.unlink();self.card.unlink();self.result.unlink()
        model=self.model()
        self.assertEqual(model['name'],'Example 1')
        self.assertIn('Score: 10',model['sources'][1]['html'])

    def test_comparison_has_exact_source_and_shared_slug_collision_is_rejected(self):
        self.entry.write_text(self.entry.read_text()+slide('comparison','<table><tr><td>42</td></tr></table>'))
        self.sql("INSERT INTO comparisons VALUES ('comparison','comparison','Compare','llm','a','comparison',0)")
        self.sync()
        comparison=read_catalog(self.database)['comparisons'][0]
        self.assertEqual(comparison['source']['position'],3)
        self.assertEqual(comparison['source']['id'],'comparison')
        self.sql("UPDATE comparisons SET slug='example-1'")
        original=self.database.read_bytes()
        with self.assertRaisesRegex(ValueError,'Duplicate'):
            self.sync()
        self.assertEqual(self.database.read_bytes(),original)

    def test_invalid_reference_does_not_replace_previous_database(self):
        self.sync()
        self.sql("UPDATE model_sources SET slide_id='missing' WHERE role='card'")
        original = self.database.read_bytes()
        with self.assertRaisesRegex(ValueError,'missing'):
            self.sync()
        self.assertEqual(self.database.read_bytes(),original)

    def test_duplicate_slide_ids_fail_without_replacing_database(self):
        self.sync()
        original = self.database.read_bytes()
        self.entry.write_text('{{< include parts/card.qmd >}}\n{{< include parts/card.qmd >}}\n{{< include parts/results.qmd >}}\n')
        with self.assertRaisesRegex(ValueError,'[Dd]uplicate'):
            self.sync()
        self.assertEqual(self.database.read_bytes(),original)

    def test_nested_includes_and_multiple_slides_keep_order_and_provenance(self):
        self.entry.write_text('{{< include parts/combined.qmd >}}\n')
        (self.deck/'parts/combined.qmd').write_text('{{< include card.qmd >}}\n'+slide('extra','<p>Unbound content</p>')+'\n{{< include results.qmd >}}\n')
        stats = self.sync()
        self.assertEqual(stats['slides'],3)
        self.assertEqual([s['position'] for s in self.model()['sources']],[1,3])
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT source_path FROM slides WHERE slide_id = ?',('extra',)).fetchone()[0], 'decks/a/parts/combined.qmd')

    def test_notes_headings_and_html_examples_do_not_become_slide_content(self):
        notes = '## Speaker-only heading\n\n```{=html}\n<p>Private speaking example</p>\n```'
        self.card.write_text(slide('model-card',card(),notes=notes))
        self.assertEqual(self.sync()['slides'],2)
        source=self.model()['sources'][0]
        self.assertEqual(source['notes'],notes)
        self.assertNotIn('Private speaking example',source['html'])

    def test_visible_markdown_before_and_after_notes_is_preserved(self):
        content=slide('model-card',card(),notes='Speaker-only note')
        content=content.replace('::: {.notes}', 'A **visible** update before notes.\n\n::: {.notes}')
        content+='\nA *visible* update after notes.\n'
        self.card.write_text(content)
        self.sync()
        source=self.model()['sources'][0]
        self.assertEqual(source['notes'],'Speaker-only note')
        self.assertIn('A <strong>visible</strong> update before notes.',source['html'])
        self.assertIn('A <em>visible</em> update after notes.',source['html'])
        self.assertNotIn('Speaker-only note',source['html'])

    def test_unresolved_shortcode_fails_without_replacing_database(self):
        self.sync();original=self.database.read_bytes()
        self.card.write_text(self.card.read_text()+'\n{{< video https://example.com/demo.mp4 >}}\n')
        with self.assertRaisesRegex(ValueError,'shortcode'):
            self.sync()
        self.assertEqual(self.database.read_bytes(),original)

    def test_two_decks_same_slide_ids_and_multiple_role_sources(self):
        deck2=self.root/'decks/b';deck2.mkdir()
        (deck2/'deck.qmd').write_text(slide('model-card',card('Second deck'))+slide('model-results',RESULT.replace('Score: 10','Score: 77')))
        self.sql("INSERT INTO presentations (id,source_path,html_path,title,module,sort_order) VALUES ('b','decks/b/deck.qmd','decks/b/deck.html','Deck B','M2',1)")
        self.sql("INSERT INTO model_sources VALUES ('example-1','b','model-card','card',2)")
        self.sql("INSERT INTO model_sources VALUES ('example-1','b','model-results','results',3)")
        self.sync()
        sources=self.model()['sources']
        self.assertEqual([(s['presentation_id'],s['id']) for s in sources],[('a','model-card'),('a','model-results'),('b','model-card'),('b','model-results')])
        self.assertIn('Score: 77',sources[-1]['html'])
        self.assertEqual(sources[-1]['presentation_title'],'Deck B')

    def test_removed_unbound_slide_and_removed_model_leave_no_stale_rows(self):
        self.entry.write_text(self.entry.read_text()+slide('extra','<p>Extra</p>'))
        self.sync()
        self.entry.write_text('{{< include parts/card.qmd >}}\n{{< include parts/results.qmd >}}\n')
        self.sql('DELETE FROM models'); self.sync()
        self.assertEqual(read_catalog(self.database)['models'],[])
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM slides').fetchone()[0],2)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM model_sources').fetchone()[0],0)

    def test_include_cycle_and_escape_are_rejected(self):
        self.entry.write_text('{{< include parts/loop.qmd >}}\n')
        (self.deck/'parts/loop.qmd').write_text('{{< include ../deck.qmd >}}\n')
        with self.assertRaisesRegex(ValueError,'[Cc]ycle'):
            self.sync()
        self.sql("UPDATE presentations SET source_path='../outside.qmd'")
        with self.assertRaisesRegex(ValueError,'outside|inside|relative'):
            self.sync()

    def test_authored_family_slug_order_and_source_binding_survive_sync(self):
        self.sync()
        self.sql("INSERT INTO families VALUES ('new-family','New label',5)")
        self.sql("UPDATE models SET family_id='new-family',slug='new-slug',sort_order=9")
        self.sql("UPDATE families SET label='Renamed original' WHERE id='example'")
        self.entry.write_text(self.entry.read_text()+slide('alternate-result',RESULT.replace('Score: 10','Score: 99')))
        self.sql("UPDATE model_sources SET slide_id='alternate-result',ordinal=8 WHERE role='results'")
        self.sync()
        model=self.model()
        self.assertEqual((model['family'],model['family_label'],model['slug'],model['sort_order']),('new-family','New label','new-slug',9))
        self.assertEqual(model['sources'][1]['ordinal'],8)
        self.assertIn('Score: 99',model['sources'][1]['html'])
        self.assertEqual(self.sql("SELECT label FROM families WHERE id='example'")[0][0],'Renamed original')

    def test_new_model_can_be_bound_in_sql_before_source_is_cached(self):
        self.sync()
        self.entry.write_text(self.entry.read_text()+slide('new-card',card().replace('Example 1','Example 2'))+slide('new-results',RESULT))
        self.sql("INSERT INTO models VALUES ('example-2','example-2','llm','example',1)")
        self.sql("INSERT INTO model_sources VALUES ('example-2','a','new-card','card',0)")
        self.sql("INSERT INTO model_sources VALUES ('example-2','a','new-results','results',1)")
        with self.assertRaisesRegex(ValueError,'sync|Sync|content'):
            read_catalog(self.database)
        self.sync()
        self.assertEqual([m['name'] for m in read_catalog(self.database)['models']],['Example 1','Example 2'])
        self.assertEqual(self.sql('SELECT COUNT(*) FROM model_disclosures')[0][0],10)

    def test_missing_database_is_not_implicitly_created(self):
        self.database.unlink()
        with self.assertRaisesRegex((ValueError,FileNotFoundError),'missing|Missing|exist'):
            self.sync()
        self.assertFalse(self.database.exists())

    def test_create_refuses_to_overwrite_existing_catalog(self):
        original=self.database.read_bytes()
        with self.assertRaises(FileExistsError):
            create_catalog(self.database)
        self.assertEqual(self.database.read_bytes(),original)

    def test_legacy_sqlite_migration_preserves_definitions_bindings_and_content(self):
        self.sql("UPDATE families SET label='Edited family' WHERE id='example'")
        self.sql("UPDATE models SET slug='edited-slug',sort_order=9")
        self.sync()
        expected=read_catalog(self.database)
        legacy=self.root/'data/legacy.sqlite3'
        with sqlite3.connect(legacy) as db:
            db.execute('ATTACH DATABASE ? AS current',(str(self.database),))
            for name in ('families','presentations','slides','model_sources','comparisons'):
                db.execute(f'CREATE TABLE {name} AS SELECT * FROM current.{name}')
            db.execute("CREATE TABLE catalog_meta AS SELECT * FROM current.catalog_meta WHERE key <> 'definitions_digest'")
            db.execute('CREATE TABLE models (id TEXT,slug TEXT,name TEXT,category TEXT,family_id TEXT,open_weights INTEGER,statuses_json TEXT,summary TEXT,company TEXT,weights_text TEXT,sort_order INTEGER)')
            for model in expected['models']:
                db.execute('INSERT INTO models VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                           (model['id'],model['slug'],model['name'],model['category'],model['family'],int(model['open']),json.dumps(model['statuses']),model['summary'],model['company'],model['weights_text'],model['sort_order']))
            db.execute('PRAGMA user_version=1')
        self.entry.unlink();self.card.unlink();self.result.unlink()
        self.assertTrue(migrate_catalog(legacy))
        self.assertFalse(migrate_catalog(legacy))
        self.assertEqual(read_catalog(legacy),expected)
        with sqlite3.connect(legacy) as db:
            self.assertEqual(db.execute('PRAGMA user_version').fetchone()[0],2)
            self.assertNotIn('statuses_json',[r[1] for r in db.execute('PRAGMA table_info(models)')])
            self.assertEqual(db.execute('SELECT COUNT(*) FROM model_disclosures').fetchone()[0],5)


if __name__ == '__main__':
    unittest.main()
