"""Sync presentation content into the authoritative SQLite tools catalog."""
from __future__ import annotations

from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
from typing import Optional

from model_catalog import _digest, _id, _integrity, _local_path, _presentation_slides, _string
from showcase_html import Fragment, text

SCHEMA_VERSION = 1
SCHEMA = Path(__file__).with_name('tool_catalog_schema.sql')
ROLES = ('card', 'results', 'evidence')


def _connect(database: Path, mode='rw'):
    database = Path(database).resolve()
    if not database.is_file():
        raise FileNotFoundError(f'Tools database is missing: {database}. Restore it or explicitly create one with create_catalog().')
    db = sqlite3.connect(f'{database.as_uri()}?mode={mode}', uri=True, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db


def _schema(db):
    statement = ''
    for line in SCHEMA.read_text(encoding='utf-8').splitlines(keepends=True):
        statement += line
        if sqlite3.complete_statement(statement):
            db.execute(statement)
            statement = ''
    if statement.strip():
        raise ValueError('Incomplete tools catalog schema')


def create_catalog(database: Path):
    """Explicitly create an empty catalog; never overwrite an existing database."""
    database = Path(database).resolve()
    database.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(database, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o666)
    os.close(fd)
    try:
        with closing(_connect(database)) as db:
            db.execute('BEGIN IMMEDIATE')
            try:
                _schema(db)
                db.commit()
            except Exception:
                db.rollback()
                raise
    except Exception:
        database.unlink()
        raise
    return database


def _definitions(db):
    groups = [dict(row) for row in db.execute('SELECT * FROM groups ORDER BY sort_order,id')]
    presentations = [dict(row) for row in db.execute('''SELECT id,source_path AS source,html_path AS html,
        title,module,sort_order FROM presentations ORDER BY sort_order,id''')]
    tools = []
    for row in db.execute('SELECT id,slug,group_id,sort_order FROM tools ORDER BY sort_order,id'):
        tool = dict(row)
        tool['sources'] = [dict(ref) for ref in db.execute('''SELECT presentation_id AS presentation,
            slide_id AS slide,role,ordinal FROM tool_sources WHERE tool_id=? ORDER BY ordinal''',(tool['id'],))]
        tools.append(tool)
    return {'groups':groups,'presentations':presentations,'tools':tools}


def _extract_tool(card, ident):
    root = Fragment(card['html']).root
    line = root.find('ts-product-line')
    if line is None:
        raise ValueError(f'Missing product line in card slide: {ident}')
    name_node = line.find('ts-name')
    logo = line.find(tag='img')
    name = text(name_node) or (logo.attrs.get('alt','') if logo else '')
    name = _string(name, f'{ident} name')
    surface = _string(text(line.find('ts-surface')), f'{ident} surface')
    chart = root.find('ts-chart')
    summary = text(chart.find(tag='figcaption')) if chart else ''
    summary = summary or surface
    if logo is None:
        raise ValueError(f'Missing logo in card slide: {ident}')
    return {'name':name,'summary':summary,'surface':surface,
            'logo_src':_string(logo.attrs.get('src'),f'{ident} logo source'),
            'logo_alt':logo.attrs.get('alt','')}


def _snapshot(root, definitions):
    groups, presentations, slides, tools = [], [], [], []
    group_ids, presentation_ids, tool_ids, slugs = set(), set(), set(), set()
    for row in definitions['groups']:
        ident = _id(row['id'],'group ID',True)
        if ident in group_ids:
            raise ValueError(f'Duplicate group ID: {ident}')
        group_ids.add(ident)
        groups.append({'id':ident,'label':_string(row['label'],'group label'),'sort_order':row['sort_order']})
    for row in definitions['presentations']:
        ident = _id(row['id'],'presentation ID')
        if ident in presentation_ids:
            raise ValueError(f'Duplicate presentation ID: {ident}')
        presentation_ids.add(ident)
        source = _local_path(root,row['source'],'presentation source')
        html = _local_path(root,row['html'],'presentation HTML path',False)
        if html.suffix != '.html':
            raise ValueError('Presentation HTML path must end in .html')
        presentation = {'id':ident,'source_path':str(source.relative_to(root)),
                        'html_path':str(html.relative_to(root)),
                        'title':_string(row['title'],'presentation title'),
                        'module':_string(row['module'],'module'),'sort_order':row['sort_order']}
        slides.extend(_presentation_slides(root,presentation))
        presentations.append(presentation)
    by_slide = {(slide['presentation_id'],slide['id']):slide for slide in slides}
    for row in definitions['tools']:
        ident = _id(row['id'],'tool ID')
        slug = _id(row['slug'],'tool slug',True)
        if ident in tool_ids or slug in slugs:
            raise ValueError(f'Duplicate tool ID or slug: {ident}')
        tool_ids.add(ident); slugs.add(slug)
        if row['group_id'] not in group_ids:
            raise ValueError(f'Unknown group for {ident}: {row["group_id"]}')
        refs, seen, role_slides = [], set(), {role:[] for role in ROLES}
        for ref in row['sources']:
            key = (ref['presentation'],ref['slide'])
            slide = by_slide.get(key)
            if slide is None:
                raise ValueError(f'Missing source binding for {ident}: {key[0]}/{key[1]}')
            if not slide['html']:
                raise ValueError(f'Bound slide needs HTML content: {key[0]}/{key[1]}')
            role = ref['role']
            if role not in ROLES:
                raise ValueError(f'Unknown source role for {ident}: {role}')
            binding = (*key,role)
            if binding in seen:
                raise ValueError(f'Duplicate source binding for {ident}: {binding}')
            seen.add(binding); role_slides[role].append(slide)
            refs.append({'presentation_id':key[0],'id':key[1],
                         'role':role,'ordinal':ref['ordinal']})
        if not role_slides['card'] or not role_slides['results']:
            raise ValueError(f'Tool requires card and results slides: {ident}')
        tool = {'id':ident,'slug':slug,'group_id':row['group_id'],
                'sort_order':row['sort_order'],'sources':refs}
        tool.update(_extract_tool(role_slides['card'][0],ident))
        tools.append(tool)
    return {'schema_version':SCHEMA_VERSION,'groups':groups,'presentations':presentations,
            'slides':slides,'tools':tools}


def _refresh(db,snapshot):
    db.execute('DELETE FROM tool_content')
    db.execute('DELETE FROM slides')
    for presentation in snapshot['presentations']:
        db.execute('UPDATE presentations SET content_hash=? WHERE id=?',
                   (presentation['content_hash'],presentation['id']))
    for slide in snapshot['slides']:
        db.execute('INSERT INTO slides VALUES (?,?,?,?,?,?,?,?)',
                   tuple(slide[k] for k in ('presentation_id','id','title','html','notes','source_path','position','content_hash')))
    for tool in snapshot['tools']:
        db.execute('INSERT INTO tool_content VALUES (?,?,?,?,?,?)',
                   tuple(tool[k] for k in ('id','name','summary','surface','logo_src','logo_alt')))


def sync_catalog(root: Path, database: Optional[Path] = None):
    """Refresh derived slide and card content in one transaction."""
    root = Path(root).resolve()
    database = Path(database) if database is not None else root/'data/tools.sqlite3'
    if not database.is_absolute():
        database = root/database
    with closing(_connect(database)) as db:
        if db.execute('PRAGMA user_version').fetchone()[0] != SCHEMA_VERSION:
            raise ValueError('Unsupported tools catalog schema')
        db.execute('BEGIN IMMEDIATE')
        try:
            _integrity(db)
            definitions = _definitions(db)
            snapshot = _snapshot(root,definitions)
            digest, definitions_digest = _digest(snapshot), _digest(definitions)
            stats = {'changed':True,'digest':digest,**{key:len(snapshot[key]) for key in ('groups','presentations','slides','tools')}}
            previous = db.execute("SELECT value FROM catalog_meta WHERE key='source_digest'").fetchone()
            previous_definitions = db.execute("SELECT value FROM catalog_meta WHERE key='definitions_digest'").fetchone()
            if previous and previous[0] == digest and previous_definitions and previous_definitions[0] == definitions_digest:
                db.rollback()
                stats['changed'] = False
                return stats
            _refresh(db,snapshot)
            db.execute('INSERT OR REPLACE INTO catalog_meta VALUES (?,?)',('source_digest',digest))
            db.execute('INSERT OR REPLACE INTO catalog_meta VALUES (?,?)',('definitions_digest',definitions_digest))
            _integrity(db)
            db.commit()
            return stats
        except Exception:
            db.rollback()
            raise


def read_catalog(database: Path):
    """Read a synchronized render snapshot without presentation source files."""
    with closing(_connect(database,'ro')) as db:
        db.execute('BEGIN')
        if db.execute('PRAGMA user_version').fetchone()[0] != SCHEMA_VERSION:
            raise ValueError('Unsupported tools catalog schema; run sync-tools.py')
        expected = db.execute("SELECT value FROM catalog_meta WHERE key='definitions_digest'").fetchone()
        if not expected or expected[0] != _digest(_definitions(db)):
            raise ValueError('Catalog definitions changed or content is missing; run sync-tools.py before rendering')
        presentations = [dict(row) for row in db.execute('SELECT * FROM presentations ORDER BY sort_order,id')]
        groups = [dict(row) for row in db.execute('SELECT * FROM groups ORDER BY sort_order,id')]
        slides = [dict(row) for row in db.execute('''SELECT s.slide_id AS id,s.presentation_id,s.title,s.html,s.notes,
            s.source_path,s.position,s.content_hash,p.title AS presentation_title,
            p.html_path AS presentation_html,p.source_path AS presentation_source,p.module
            FROM slides s JOIN presentations p ON p.id=s.presentation_id ORDER BY p.sort_order,s.position''')]
        by_slide = {(slide['presentation_id'],slide['id']):slide for slide in slides}
        labels = {group['id']:group['label'] for group in groups}
        tools = []
        for row in db.execute('''SELECT t.*,c.name,c.summary,c.surface,c.logo_src,c.logo_alt
            FROM tools t LEFT JOIN tool_content c ON c.tool_id=t.id ORDER BY t.sort_order,t.id'''):
            tool = dict(row)
            if tool['name'] is None:
                raise ValueError(f'Tool content is missing for {tool["id"]}; run sync-tools.py')
            tool['group_label'] = labels[tool['group_id']]
            refs = db.execute('SELECT * FROM tool_sources WHERE tool_id=? ORDER BY ordinal',(tool['id'],)).fetchall()
            try:
                tool['sources'] = [{**by_slide[(ref['presentation_id'],ref['slide_id'])],
                                    'role':ref['role'],'ordinal':ref['ordinal']} for ref in refs]
            except KeyError as exc:
                raise ValueError(f'Source slide content is missing for {tool["id"]}; run sync-tools.py') from exc
            tools.append(tool)
        for group in groups:
            group['tools'] = [tool['id'] for tool in tools if tool['group_id'] == group['id']]
        return {'schema_version':SCHEMA_VERSION,'groups':groups,'presentations':presentations,
                'slides':slides,'tools':tools}
