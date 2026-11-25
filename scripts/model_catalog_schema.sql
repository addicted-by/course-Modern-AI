PRAGMA foreign_keys = ON;
PRAGMA user_version = 2;

CREATE TABLE catalog_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Authored catalog: edit these records directly in SQLite.
CREATE TABLE families (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL UNIQUE
);
CREATE TABLE presentations (
    id TEXT PRIMARY KEY,
    source_path TEXT NOT NULL UNIQUE,
    html_path TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    module TEXT NOT NULL,
    content_hash TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL UNIQUE
);
CREATE TABLE models (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('llm','t2i','t2v','tts','music')),
    family_id TEXT NOT NULL REFERENCES families(id),
    sort_order INTEGER NOT NULL UNIQUE
);
CREATE TABLE model_sources (
    model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    presentation_id TEXT NOT NULL REFERENCES presentations(id),
    slide_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('card','results')),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (model_id, ordinal),
    UNIQUE (model_id, presentation_id, slide_id, role)
);
CREATE TABLE comparisons (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('llm','t2i','t2v','tts','music')),
    presentation_id TEXT NOT NULL REFERENCES presentations(id),
    slide_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL UNIQUE
);

-- Derived presentation content: sync-models.py refreshes only these records.
CREATE TABLE slides (
    presentation_id TEXT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    slide_id TEXT NOT NULL,
    title TEXT NOT NULL,
    html TEXT NOT NULL,
    notes TEXT NOT NULL,
    source_path TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    content_hash TEXT NOT NULL,
    PRIMARY KEY (presentation_id, slide_id),
    UNIQUE (presentation_id, position)
);
CREATE TABLE model_content (
    model_id TEXT PRIMARY KEY REFERENCES models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    open_weights INTEGER NOT NULL CHECK (open_weights IN (0,1)),
    summary TEXT NOT NULL,
    company TEXT NOT NULL,
    weights_text TEXT NOT NULL
);
CREATE TABLE model_disclosures (
    model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    field TEXT NOT NULL CHECK (field IN ('Architecture','Data','Training','Inference','Tools')),
    status TEXT NOT NULL CHECK (status IN ('k','p','n')),
    PRIMARY KEY (model_id, field)
);
CREATE INDEX model_sources_slide ON model_sources(presentation_id, slide_id);
CREATE INDEX models_family ON models(family_id, sort_order);
