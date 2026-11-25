"""Synchronize presentation sources into a validated SQLite model catalog.

SQLite is the authoritative store of families, models and exact slide bindings.
Synchronization updates only derived presentation content in one transaction.
The renderer reads the database without needing presentation source files.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import sqlite3
import subprocess
from typing import Optional
from contextlib import closing

from showcase_html import Fragment, text

SCHEMA_VERSION = 2
CATEGORIES = ('llm', 't2i', 't2v', 'tts', 'music')
DISCLOSURES = ('Architecture', 'Data', 'Training', 'Inference', 'Tools')
IDENTIFIER = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.-]*$')
SLUG = re.compile(r'^[a-z0-9][a-z0-9-]*$')
INCLUDE = re.compile(r'^\s*\{\{<\s*include\s+(.+?)\s*>\}\}\s*$')
HEADING = re.compile(r'^##\s+(.+?)\s+\{#([^\s}]+)[^}]*\}\s*$')
FENCE = re.compile(r'^\s{0,3}(`{3,}|~{3,})')
SCHEMA = Path(__file__).with_name('model_catalog_schema.sql')
RAW_HTML = re.compile(r'^```\{=html\}[ \t]*\n(.*?)\n```[ \t]*$', re.M | re.S)


def _hash(value):
    if isinstance(value, str):
        value = value.encode('utf-8')
    return hashlib.sha256(value).hexdigest()


def _string(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{label} must be a nonempty string')
    return value


def _id(value, label, slug=False):
    value = _string(value, label)
    if not (SLUG if slug else IDENTIFIER).fullmatch(value):
        raise ValueError(f'{label} has an invalid identifier: {value!r}')
    return value


def _local_path(root, value, label, exists=True):
    value = _string(value, label)
    path = Path(value)
    if path.is_absolute() or '\\' in value or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', value):
        raise ValueError(f'{label} must be relative to the project')
    resolved = (root / path).resolve()
    try:
        resolved.relative_to(root)
    except ValueError:
        raise ValueError(f'{label} must stay inside the project: {value}') from None
    if exists and not resolved.is_file():
        raise ValueError(f'{label} is missing: {value}')
    return resolved


def _rows(definitions, key):
    rows = definitions.get(key)
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise ValueError(f'{key} must be a list of objects')
    return rows


def _expand(root, path, stack, files):
    if path in stack:
        chain = ' → '.join(str(p.relative_to(root)) for p in stack + [path])
        raise ValueError(f'Include cycle: {chain}')
    content = path.read_text(encoding='utf-8')
    files[str(path.relative_to(root))] = _hash(content)
    fence = None
    for number, line in enumerate(content.splitlines(keepends=True), 1):
        marker = FENCE.match(line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence) and not line.strip().strip(token[0]):
                fence = None
            yield line, path, number
            continue
        include = INCLUDE.match(line) if fence is None else None
        if include:
            try:
                arguments = shlex.split(include.group(1))
            except ValueError as exc:
                raise ValueError(f'Invalid include in {path.relative_to(root)}:{number}: {exc}') from exc
            if len(arguments) != 1:
                raise ValueError(f'Include needs one filename in {path.relative_to(root)}:{number}')
            relative = path.parent.relative_to(root) / arguments[0]
            included = _local_path(root, str(relative), 'included source')
            yield from _expand(root, included, stack + [path], files)
            yield '\n', path, number
        else:
            yield line, path, number


def _visible_and_notes(body, location):
    """Separate notes wherever they occur, preserving subsequent visible content."""
    visible, notes, current_notes = [], [], []
    depth, fence = 0, None
    # The first line is the source slide heading, rendered by the page template.
    for line in body.splitlines(keepends=True)[1:]:
        marker = FENCE.match(line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence) and not line.strip().strip(token[0]):
                fence = None
            (current_notes if depth else visible).append(line)
            continue
        div = re.match(r'^\s*:{3,}\s*(.*?)\s*$', line) if fence is None else None
        if div:
            if depth:
                depth += 1 if div.group(1) else -1
                if not depth:
                    notes.append(''.join(current_notes).strip())
                    current_notes = []
                    continue
            elif re.search(r'\{[^}]*\.notes(?:\s|\})', div.group(1)):
                depth = 1
                continue
        (current_notes if depth else visible).append(line)
    if depth:
        raise ValueError(f'Unclosed speaker notes block: {location}')
    return ''.join(visible), '\n\n'.join(notes)


def _visible_html(visible, notes, directory, location):
    if re.search(r'\{\{[<%]', visible + notes):
        raise ValueError(f'Unsupported unresolved shortcode in {location}; only source includes are imported')
    blocks = RAW_HTML.findall(visible)
    remaining = RAW_HTML.sub('', visible)
    if not remaining.strip():
        return '\n'.join(blocks)  # Existing raw-HTML slides remain byte-preserving.
    try:
        result = subprocess.run(
            ['quarto','pandoc','--from=markdown','--to=html','--wrap=none','--mathml'],
            input=visible, text=True, capture_output=True, cwd=directory, timeout=60,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ValueError(f'Cannot preserve visible Markdown in {location}: Quarto Pandoc is required ({exc})') from exc
    if result.returncode:
        raise ValueError(f'Cannot convert visible Markdown in {location}: {result.stderr.strip()}')
    return result.stdout.rstrip('\n')


def _presentation_slides(root, presentation):
    entry = _local_path(root, presentation['source_path'], 'presentation source')
    if entry.suffix != '.qmd':
        raise ValueError(f'Presentation source must be .qmd: {presentation["source_path"]}')
    files = {}
    lines = list(_expand(root, entry, [], files))
    headings, fence, notes_depth = [], None, 0
    for index, (line, path, number) in enumerate(lines):
        marker = FENCE.match(line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence) and not line.strip().strip(token[0]):
                fence = None
            continue
        if fence is not None:
            continue
        div = re.match(r'^\s*:{3,}\s*(.*?)\s*$', line)
        if div:
            if notes_depth:
                notes_depth += 1 if div.group(1) else -1
                continue
            if re.search(r'\{[^}]*\.notes(?:\s|\})', div.group(1)):
                notes_depth = 1
                continue
        if notes_depth:
            continue
        match = HEADING.match(line.rstrip('\r\n'))
        if match:
            headings.append((index, match.group(1), _id(match.group(2), 'slide ID'), path))
        elif re.match(r'^##\s+', line):
            raise ValueError(f'Slide needs an explicit stable ID: {path.relative_to(root)}:{number}')
    slides, seen = [], set()
    for position, (start, title, ident, source) in enumerate(headings, 1):
        if ident in seen:
            raise ValueError(f'Duplicate slide ID in {presentation["id"]}: {ident}')
        seen.add(ident)
        end = headings[position][0] if position < len(headings) else len(lines)
        body = ''.join(line for line, _, _ in lines[start:end])
        visible, notes = _visible_and_notes(body,f'{presentation["id"]}/{ident}')
        html = _visible_html(visible,notes,entry.parent,f'{presentation["id"]}/{ident}')
        slides.append({'presentation_id':presentation['id'], 'id':ident, 'title':title,
                       'html':html, 'notes':notes,
                       'source_path':str(source.relative_to(root)), 'position':position,
                       'content_hash':_hash(body)})
    if not slides:
        raise ValueError(f'No explicit slides found in {presentation["source_path"]}')
    presentation['content_hash'] = _hash(json.dumps(files, ensure_ascii=False, sort_keys=True))
    return slides


def _status(node, label):
    pip = node.find('sc-pip')
    matches = [state for state in ('k','p','n') if pip is not None and pip.has(state)]
    if len(matches) != 1:
        raise ValueError(f'Missing or ambiguous disclosure status for {label}')
    return matches[0]


def _extract_model(card_slide, result_slide):
    card = Fragment(card_slide['html']).root
    result = Fragment(result_slide['html']).root
    model_heading = card.find('bn-model')
    name_node = model_heading.find(tag='h3') if model_heading else card.find('ds-name')
    if name_node is None:
        result_heading = result.find('sr-model')
        name_node = result_heading.find(tag='h3') if result_heading else None
    name = _string(text(name_node), 'model name in referenced slides')
    summary = _string(text(card.find('fv-takeaway')), f'{name} takeaway')
    company_node = result.find('sc-company') or card.find('sc-company')
    company = company_node.attrs.get('aria-label', text(company_node)) if company_node else ''
    company = _string(company, f'{name} company')
    statuses = {}
    aliases = {'voice and control':'Tools', 'voice & control':'Tools', 'voice control':'Tools',
               'talking-video corpus':'Data', **{name.casefold():name for name in DISCLOSURES}}
    for node in card.walk():
        if not any(node.has(cls) for cls in ('bn-head','bn-cell','ds-feat')):
            continue
        label = text(node.find(tag='h4')).split('·')[0].strip()
        label = aliases.get(label.casefold(), label)
        if label not in DISCLOSURES:
            continue
        value = _status(node, f'{name}/{label}')
        if label in statuses and statuses[label] != value:
            raise ValueError(f'Conflicting disclosure statuses: {name}/{label}')
        statuses[label] = value
    missing = set(DISCLOSURES) - statuses.keys()
    if missing:
        raise ValueError(f'Missing disclosure fields in {card_slide["id"]}: {", ".join(sorted(missing))}')
    facts = card.find('bn-facts')
    weight = None
    if facts:
        for node in facts.walk():
            if node.tag == 'p' and text(node.find(tag='span')).casefold() == 'weights':
                weight = text(node.find(tag='b')).casefold()
                break
    if weight is None:
        weight = text(card.find('ds-r')).casefold()
    if weight in ('open', 'open weights', 'open weights + api', '[dev] weights + api'):
        opened = True
    elif weight in ('closed', 'closed weights', 'api only', 'api', 'not released', 'unreleased',
                    'not found', 'hosted at launch', 'hosted api', 'api preview', 'closed · gemini api'):
        opened = False
    else:
        raise ValueError(f'Unrecognized weights status for {name}: {weight!r}')
    return {'name':name, 'summary':summary, 'company':company, 'open':opened, 'weights_text':weight,
            'statuses':[statuses[label] for label in DISCLOSURES]}


def _snapshot(root, definitions):
    families, presentations, slides, models, comparisons = [], [], [], [], []
    family_ids, presentation_ids, model_ids, page_slugs, comparison_ids = set(), set(), set(), set(), set()
    for order, row in enumerate(_rows(definitions,'families')):
        ident = _id(row.get('id'),'family ID',True)
        if ident in family_ids:
            raise ValueError('Duplicate family ID: '+ident)
        family_ids.add(ident)
        families.append({'id':ident,'label':_string(row.get('label'),'family label'),'sort_order':row['sort_order']})
    for order, row in enumerate(_rows(definitions,'presentations')):
        ident = _id(row.get('id'),'presentation ID')
        if ident in presentation_ids:
            raise ValueError('Duplicate presentation ID: '+ident)
        presentation_ids.add(ident)
        source = _local_path(root,row.get('source'),'presentation source')
        html = _local_path(root,row.get('html'),'presentation HTML path',False)
        if html.suffix != '.html':
            raise ValueError('Presentation HTML path must end in .html')
        present = {'id':ident,'source_path':str(source.relative_to(root)), 'html_path':str(html.relative_to(root)),
                   'title':_string(row.get('title'),'presentation title'), 'module':_string(row.get('module'),'module'), 'sort_order':row['sort_order']}
        slides.extend(_presentation_slides(root,present))
        presentations.append(present)
    lookup = {(s['presentation_id'],s['id']):s for s in slides}

    def binding(row):
        if not isinstance(row,dict):
            raise ValueError('Source binding must be an object')
        key = (row.get('presentation'),row.get('slide'))
        if key not in lookup:
            raise ValueError(f'Missing source binding: presentation={key[0]!r}, slide={key[1]!r}')
        source = lookup[key]
        if not source['html']:
            raise ValueError(f'Bound slide needs a raw HTML content block: {key[0]}/{key[1]}')
        return source

    for order, row in enumerate(_rows(definitions,'models')):
        ident = _id(row.get('id'),'model ID')
        slug = _id(row.get('slug'),'model slug',True)
        if ident in model_ids or slug in page_slugs:
            raise ValueError('Duplicate model ID or page slug: '+ident)
        model_ids.add(ident);page_slugs.add(slug)
        family = row.get('family');category=row.get('category')
        if family not in family_ids:
            raise ValueError(f'Unknown family for {ident}: {family!r}')
        if category not in CATEGORIES:
            raise ValueError(f'Unknown category for {ident}: {category!r}')
        sources = row.get('sources')
        if not isinstance(sources,list) or not sources:
            raise ValueError(f'Model sources must be a nonempty list: {ident}')
        refs, seen_refs, by_role = [], set(), {'card':[], 'results':[]}
        for ordinal, ref in enumerate(sources):
            slide = binding(ref)
            role = ref.get('role')
            if role not in by_role:
                raise ValueError(f'Unknown model source role: {role!r}')
            key = (slide['presentation_id'],slide['id'],role)
            if key in seen_refs:
                raise ValueError(f'Duplicate source binding for {ident}: {key}')
            seen_refs.add(key);by_role[role].append(slide)
            refs.append({'presentation_id':slide['presentation_id'],'id':slide['id'],'role':role,'ordinal':ref['ordinal']})
        if not all(by_role.values()):
            raise ValueError(f'Model requires both card and results slides: {ident}')
        model = {'id':ident,'slug':slug,'family':family,'category':category,'sort_order':row['sort_order'],'sources':refs}
        model.update(_extract_model(by_role['card'][0],by_role['results'][0]))
        models.append(model)
    for order, row in enumerate(_rows(definitions,'comparisons')):
        ident = _id(row.get('id'),'comparison ID');slug = _id(row.get('slug'),'comparison slug',True)
        if ident in comparison_ids or slug in page_slugs:
            raise ValueError('Duplicate comparison ID or page slug: '+ident)
        comparison_ids.add(ident);page_slugs.add(slug)
        source = binding(row.get('source'))
        if row.get('category') not in CATEGORIES:
            raise ValueError(f'Unknown comparison category: {row.get("category")!r}')
        comparisons.append({'id':ident,'slug':slug,'label':_string(row.get('label'),'comparison label'),
                            'category':row['category'],'presentation_id':source['presentation_id'],'slide_id':source['id'],'sort_order':row['sort_order']})
    return {'schema_version':SCHEMA_VERSION,'families':families,'presentations':presentations,'slides':slides,'models':models,'comparisons':comparisons}


def _existing_connection(database):
    database = Path(database).resolve()
    if not database.is_file():
        raise FileNotFoundError(f'Model database is missing: {database}. Restore the catalog or explicitly create one with create_catalog().')
    db = sqlite3.connect(f'{database.as_uri()}?mode=rw',uri=True,isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db


def _execute_schema(db):
    statement = ''
    for line in SCHEMA.read_text(encoding='utf-8').splitlines(keepends=True):
        statement += line
        if sqlite3.complete_statement(statement):
            db.execute(statement)
            statement = ''
    if statement.strip():
        raise ValueError('Incomplete model catalog schema')


def create_catalog(database: Path):
    """Explicitly create an empty authoritative catalog, refusing any overwrite."""
    database = Path(database).resolve()
    database.parent.mkdir(parents=True,exist_ok=True)
    fd = os.open(database,os.O_CREAT | os.O_EXCL | os.O_WRONLY,0o666)
    os.close(fd)
    try:
        with closing(_existing_connection(database)) as db:
            db.execute('BEGIN IMMEDIATE')
            try:
                _execute_schema(db)
                db.commit()
            except Exception:
                db.rollback()
                raise
    except Exception:
        database.unlink()
        raise
    return database


def _definitions(db):
    """Read authored records only. No external manifest or cached content is used."""
    families = [dict(row) for row in db.execute('SELECT * FROM families ORDER BY sort_order')]
    presentations = [dict(row) for row in db.execute('SELECT id,source_path AS source,html_path AS html,title,module,sort_order FROM presentations ORDER BY sort_order')]
    models = []
    for row in db.execute('SELECT id,slug,category,family_id AS family,sort_order FROM models ORDER BY sort_order'):
        model = dict(row)
        model['sources'] = [dict(ref) for ref in db.execute('SELECT presentation_id AS presentation,slide_id AS slide,role,ordinal FROM model_sources WHERE model_id=? ORDER BY ordinal',(model['id'],))]
        models.append(model)
    comparisons = []
    for row in db.execute('SELECT * FROM comparisons ORDER BY sort_order'):
        comparison = dict(row)
        comparison['source'] = {'presentation':comparison.pop('presentation_id'),'slide':comparison.pop('slide_id')}
        comparisons.append(comparison)
    return {'families':families,'presentations':presentations,'models':models,'comparisons':comparisons}


def _digest(value):
    return _hash(json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')))


def _integrity(db):
    if db.execute('PRAGMA foreign_key_check').fetchall():
        raise ValueError('Catalog foreign key integrity check failed')
    if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
        raise ValueError('Catalog SQLite integrity check failed')


def migrate_catalog(database: Path):
    """Atomically migrate v1 SQLite alone, preserving authored data and cached content.

    DDL and row migration share a SQLite transaction. Any error rolls the entire
    migration back; the database file is never replaced from an external source.
    """
    with closing(_existing_connection(database)) as db:
        version = db.execute('PRAGMA user_version').fetchone()[0]
        if version == SCHEMA_VERSION:
            return False
        if version != 1:
            raise ValueError(f'Unsupported model catalog schema {version}')
        db.execute('BEGIN IMMEDIATE')
        try:
            tables = {name:[dict(row) for row in db.execute(f'SELECT * FROM {name}')] for name in
                      ('catalog_meta','families','presentations','slides','models','model_sources','comparisons')}
            for model in tables['models']:
                values = json.loads(model['statuses_json'])
                if not isinstance(values,list) or len(values) != len(DISCLOSURES) or any(v not in ('k','p','n') for v in values):
                    raise ValueError(f'Invalid legacy disclosure values for {model["id"]}')
                model['statuses'] = values
            for name in ('model_sources','comparisons','models','slides','presentations','families','catalog_meta'):
                db.execute(f'DROP TABLE {name}')
            _execute_schema(db)
            for row in tables['families']:
                db.execute('INSERT INTO families VALUES (?,?,?)',tuple(row[k] for k in ('id','label','sort_order')))
            for row in tables['presentations']:
                db.execute('INSERT INTO presentations VALUES (?,?,?,?,?,?,?)',tuple(row[k] for k in ('id','source_path','html_path','title','module','content_hash','sort_order')))
            for row in tables['models']:
                db.execute('INSERT INTO models VALUES (?,?,?,?,?)',tuple(row[k] for k in ('id','slug','category','family_id','sort_order')))
                db.execute('INSERT INTO model_content VALUES (?,?,?,?,?,?)',tuple(row[k] for k in ('id','name','open_weights','summary','company','weights_text')))
                db.executemany('INSERT INTO model_disclosures VALUES (?,?,?)',[(row['id'],field,status) for field,status in zip(DISCLOSURES,row['statuses'])])
            for row in tables['model_sources']:
                db.execute('INSERT INTO model_sources VALUES (?,?,?,?,?)',tuple(row[k] for k in ('model_id','presentation_id','slide_id','role','ordinal')))
            for row in tables['slides']:
                db.execute('INSERT INTO slides VALUES (?,?,?,?,?,?,?,?)',tuple(row[k] for k in ('presentation_id','slide_id','title','html','notes','source_path','position','content_hash')))
            for row in tables['comparisons']:
                db.execute('INSERT INTO comparisons VALUES (?,?,?,?,?,?,?)',tuple(row[k] for k in ('id','slug','label','category','presentation_id','slide_id','sort_order')))
            for row in tables['catalog_meta']:
                if row['key'] != 'definitions_digest':
                    db.execute('INSERT INTO catalog_meta VALUES (?,?)',(row['key'],row['value']))
            db.execute('INSERT INTO catalog_meta VALUES (?,?)',('definitions_digest',_digest(_definitions(db))))
            _integrity(db)
            db.commit()
        except Exception:
            db.rollback()
            raise
    return True


def _refresh_content(db, snapshot):
    # Authored families, presentations metadata, models, bindings and comparisons
    # are never deleted or reinserted during regular synchronization.
    db.execute('DELETE FROM model_disclosures')
    db.execute('DELETE FROM model_content')
    db.execute('DELETE FROM slides')
    for p in snapshot['presentations']:
        db.execute('UPDATE presentations SET content_hash=? WHERE id=?',(p['content_hash'],p['id']))
    for s in snapshot['slides']:
        db.execute('INSERT INTO slides VALUES (?,?,?,?,?,?,?,?)',tuple(s[k] for k in ('presentation_id','id','title','html','notes','source_path','position','content_hash')))
    for m in snapshot['models']:
        db.execute('INSERT INTO model_content VALUES (?,?,?,?,?,?)',(m['id'],m['name'],int(m['open']),m['summary'],m['company'],m['weights_text']))
        db.executemany('INSERT INTO model_disclosures VALUES (?,?,?)',[(m['id'],field,status) for field,status in zip(DISCLOSURES,m['statuses'])])


def sync_catalog(root: Path, database: Optional[Path] = None):
    """Refresh derived content transactionally, preserving all authored DB records."""
    root = Path(root).resolve()
    database = Path(database) if database else root/'data/models.sqlite3'
    if not database.is_absolute():
        database = root/database
    migrate_catalog(database)
    with closing(_existing_connection(database)) as db:
        db.execute('BEGIN IMMEDIATE')
        try:
            _integrity(db)
            definitions = _definitions(db)
            snapshot = _snapshot(root,definitions)
            digest = _digest(snapshot)
            stats = {'changed':True,'digest':digest,**{key:len(snapshot[key]) for key in ('models','families','slides','presentations')}}
            previous = db.execute("SELECT value FROM catalog_meta WHERE key='source_digest'").fetchone()
            definitions_digest = _digest(definitions)
            previous_definitions = db.execute("SELECT value FROM catalog_meta WHERE key='definitions_digest'").fetchone()
            if previous and previous[0] == digest and previous_definitions and previous_definitions[0] == definitions_digest:
                db.rollback()
                stats['changed'] = False
                return stats
            _refresh_content(db,snapshot)
            db.execute('INSERT OR REPLACE INTO catalog_meta VALUES (?,?)',('source_digest',digest))
            db.execute('INSERT OR REPLACE INTO catalog_meta VALUES (?,?)',('definitions_digest',definitions_digest))
            _integrity(db)
            db.commit()
            return stats
        except Exception:
            db.rollback()
            raise


def read_catalog(database: Path):
    """Read synchronized render-ready records, with exact presentation provenance."""
    database = Path(database).resolve()
    if not database.is_file():
        raise FileNotFoundError(f'Model database is missing: {database}')
    with closing(sqlite3.connect(f'{database.as_uri()}?mode=ro',uri=True)) as db:
        db.row_factory = sqlite3.Row
        db.execute('BEGIN')
        if db.execute('PRAGMA user_version').fetchone()[0] != SCHEMA_VERSION:
            raise ValueError('Unsupported model catalog schema; run sync-models.py')
        expected = db.execute("SELECT value FROM catalog_meta WHERE key='definitions_digest'").fetchone()
        if not expected or expected[0] != _digest(_definitions(db)):
            raise ValueError('Catalog definitions changed or content is missing; run sync-models.py before rendering')
        presentations = [dict(row) for row in db.execute('SELECT * FROM presentations ORDER BY sort_order')]
        families = [dict(row) for row in db.execute('SELECT * FROM families ORDER BY sort_order')]
        slides = [dict(row) for row in db.execute('''SELECT s.slide_id AS id, s.presentation_id, s.title, s.html, s.notes,
            s.source_path, s.position, s.content_hash, p.title AS presentation_title,
            p.html_path AS presentation_html, p.source_path AS presentation_source, p.module
            FROM slides s JOIN presentations p ON p.id=s.presentation_id ORDER BY p.sort_order,s.position''')]
        by_slide = {(s['presentation_id'],s['id']):s for s in slides}
        labels = {f['id']:f['label'] for f in families}
        models = []
        for row in db.execute('SELECT m.*, c.name, c.open_weights, c.summary, c.company, c.weights_text FROM models m LEFT JOIN model_content c ON c.model_id=m.id ORDER BY m.sort_order'):
            m=dict(row)
            if m['name'] is None:
                raise ValueError(f'Model content is missing for {m["id"]}; run sync-models.py')
            m['family']=m.pop('family_id');m['family_label']=labels[m['family']]
            m['open']=bool(m.pop('open_weights'))
            statuses = dict(db.execute('SELECT field,status FROM model_disclosures WHERE model_id=?',(m['id'],)))
            if set(statuses) != set(DISCLOSURES):
                raise ValueError(f'Model disclosure content is incomplete for {m["id"]}; run sync-models.py')
            m['statuses']=[statuses[field] for field in DISCLOSURES]
            refs = db.execute('SELECT * FROM model_sources WHERE model_id=? ORDER BY ordinal',(m['id'],)).fetchall()
            try:
                m['sources']=[{**by_slide[(s['presentation_id'],s['slide_id'])],'role':s['role'],'ordinal':s['ordinal']} for s in refs]
            except KeyError as exc:
                raise ValueError(f'Source slide content is missing for {m["id"]}; run sync-models.py') from exc
            models.append(m)
        for family in families:
            family['models']=[m['id'] for m in models if m['family']==family['id']]
        comparisons=[]
        for row in db.execute('SELECT * FROM comparisons ORDER BY sort_order'):
            c=dict(row)
            try:
                c['source']=by_slide[(c.pop('presentation_id'),c.pop('slide_id'))]
            except KeyError as exc:
                raise ValueError(f'Comparison content is missing for {c["id"]}; run sync-models.py') from exc
            comparisons.append(c)
        return {'schema_version':SCHEMA_VERSION,'families':families,'presentations':presentations,'slides':slides,'models':models,'comparisons':comparisons}
