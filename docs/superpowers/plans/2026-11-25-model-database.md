# Authoritative model database implementation plan

**Goal:** SQLite is the only source of model families, catalogue records and exact slide bindings. Presentation edits update imported content; the website reads SQLite.

**Architecture:** Authored records in `data/models.sqlite3` → presentation synchronization within a transaction → common Showcase templates → Quarto HTML. No JSON catalogue, seed manifest or automatic reconstruction of the database.

## Constraints

- Preserve 41 models, 28 families, 95 imported slides and all existing URLs.
- Preserve manually edited database definitions when synchronizing source content.
- Work in the main project; no deployment or push.
- Missing database is an error; initialization is explicit.

## Tasks

- [x] Back up the existing SQLite database and record generated page hashes.
- [x] Migrate schema1 to schema2 using SQLite alone, separating authored definitions and imported content.
- [x] Replace JSON import with transactional synchronization driven by database records.
- [x] Remove the model JSON registry and make SQLite eligible for version control.
- [x] Port tests to direct SQL fixtures; verify edits, additions, deletion, rollback and database-only generation.
- [x] Update maintenance documentation and validate a local build using a copy of the authoritative database.

## Verification

- 28 unit/integration tests passed.
- Migrated database: schema 2, integrity/FK checks pass; 41 models, 28 families, 95 slides and 82 bindings preserved.
- All 54 generated QMD pages are byte-identical to the previous output.
- A fresh temporary copy containing SQLite and QMD sources, with no JSON files, produces the same pages.
- No-op synchronization preserves database bytes and modification time.
- Local Quarto render passed; 95 slide IDs and positions match the rendered presentation.
- Independent review confirmed metadata preservation, rollback, missing-database failure and write locking.
- No deployment, push or commit.
