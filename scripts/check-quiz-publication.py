"""Check the built quiz pages and prevent instructor files leaking into Pages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / '_site'
PRIVATE = {'Code.gs', 'questions.json', 'instructor_key.md', 'test_with_answers.md',
           'validation.txt', 'README.md'}

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])


def main():
    pages = [SITE / 'index.html', SITE / 'raw/quizzes.html']
    quizzes = list((ROOT / 'raw/quizzes').glob('*/index.qmd'))
    assert quizzes, 'No quiz pages found'
    for source in quizzes:
        public = SITE / source.relative_to(ROOT).with_suffix('.html')
        pages.append(public)
        assert (public.parent / 'student_test.md').is_file(), 'Missing student download'
    for page in pages:
        assert page.is_file(), f'Missing page: {page}'
        parser = Links()
        parser.feed(page.read_text())
        assert any('quizzes' in link for link in parser.links), f'No quiz navigation: {page}'
        for link in parser.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            path = unquote(url.path)
            target = SITE / path.lstrip('/') if path.startswith('/') else page.parent / path
            assert target.exists(), f'Broken link in {page.relative_to(SITE)}: {link}'
    leaks = [p.relative_to(SITE) for p in SITE.rglob('*')
             if 'quizzes' in p.parts and p.name in PRIVATE]
    assert not leaks, f'Instructor files published: {leaks}'
    for page in pages:
        content = page.read_text()
        assert 'correct_index' not in content, f'Answer data in {page}'
        assert 'site_libs/revealjs/' not in content, f'Quiz must be a website page, not slides: {page}'
    print(f'PASS: {len(quizzes)} quiz(s), student downloads and local links; no instructor files in quiz output.')

if __name__ == '__main__':
    main()
