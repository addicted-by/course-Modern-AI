"""The provenance shown on pages must match the actual rendered slide order."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('model_publication', Path(__file__).resolve().parents[1] / 'scripts/check-model-publication.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.site = Path(self.temp.name)
        self.page = self.site / 'deck.html'
        self.catalog = {'presentations': [{'id': 'a', 'html_path': 'deck.html'}], 'slides': [
            {'presentation_id': 'a', 'id': 'card', 'position': 1},
            {'presentation_id': 'a', 'id': 'results', 'position': 2}]}

    def test_exact_ids_and_order_match_rendered_deck(self):
        self.page.write_text('<div class="reveal"><div class="slides"><section id="card" class="slide level2"></section><section id="results" class="slide level2"></section></div></div>')
        self.assertEqual(checker.verify_presentations(self.catalog, self.site), 2)

    def test_automatic_title_slide_cannot_shift_provenance_silently(self):
        self.page.write_text('<div class="slides"><section id="title-slide" class="slide"></section><section id="card" class="slide"></section><section id="results" class="slide"></section></div>')
        with self.assertRaisesRegex(ValueError, 'position|number|order'):
            checker.verify_presentations(self.catalog, self.site)

    def test_missing_or_duplicate_rendered_slide_id_fails(self):
        for html in ['<section id="card" class="slide"></section>', '<section id="card" class="slide"></section><section id="card" class="slide"></section>']:
            self.page.write_text('<div class="slides">' + html + '</div>')
            with self.assertRaises(ValueError):
                checker.verify_presentations(self.catalog, self.site)
