PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

CREATE TABLE catalog_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Authored catalog. These rows and exact slide bindings live only in SQLite.
CREATE TABLE groups (
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
CREATE TABLE tools (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    group_id TEXT NOT NULL REFERENCES groups(id),
    sort_order INTEGER NOT NULL UNIQUE
);
CREATE TABLE tool_sources (
    tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    presentation_id TEXT NOT NULL REFERENCES presentations(id),
    slide_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('card','results','evidence')),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (tool_id, ordinal),
    UNIQUE (tool_id, presentation_id, slide_id, role)
);

-- Derived content. Normal sync replaces only these rows and content hashes.
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
CREATE TABLE tool_content (
    tool_id TEXT PRIMARY KEY REFERENCES tools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    surface TEXT NOT NULL,
    logo_src TEXT NOT NULL,
    logo_alt TEXT NOT NULL
);
CREATE INDEX tool_sources_slide ON tool_sources(presentation_id, slide_id);
CREATE INDEX tools_group ON tools(group_id, sort_order);
