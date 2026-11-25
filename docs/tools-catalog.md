# Tools Showcase

`data/tools.sqlite3` — основное хранилище каталога инструментов. JSON-реестра нет.
Каталог использует оформление Model Showcase и тот же парсер презентаций.

## Исходники

Презентация: `raw/lectures/01_intro/lecture01_tools_showcase.qmd`.
Её include-файлы находятся в `final_parts/tools_showcase/`, изображения —
в `assets/tools_showcase/` рядом с презентацией. Все зависимости перенесены
в проект; для сборки исходная папка автора не нужна.

В презентации 34 слайда: оглавление, 13 карточек инструментов, 13 слайдов
применения и 7 технических схем. Группы взяты из презентации: Editor & IDE,
Terminal, Local & remote workspaces. Инструменты могут поддерживать несколько
сред; группа обозначает точку входа, указанную автором.

## Как обновлять

1. Изменить QMD презентации или её include-файл в проекте.
2. Выполнить `quarto render` из корня проекта.

Pre-render обновляет импортированное содержимое в SQLite, затем строит страницы
из БД. Post-render проверяет ID и порядковые номера слайдов в готовой презентации.
На страницах сохранены все связанные слайды, заметки, цитаты и ограничения.

Для проверки отдельных этапов:

```sh
python3 scripts/sync-tools.py
python3 scripts/build-tools-showcase.py --no-sync
python3 scripts/check-model-publication.py --catalog tools
python3 -m unittest discover -s tests -v
```

## Что хранится в БД

Редактируемые определения: `groups`, `presentations`, `tools`, `tool_sources`.
Привязка содержит ID презентации, постоянный ID слайда, роль `card`, `results`
или `evidence` и порядок. Синхронизация сохраняет определения и обновляет
производные таблицы `slides`, `tool_content` и хеши источников.

Файл БД входит в данные проекта и должен храниться в Git. При отсутствии БД
сборка завершается ошибкой и не пересоздаёт каталог. Ошибки источников
откатывают транзакцию. При перестановке слайдов меняется отображаемый номер;
привязка по ID остаётся прежней.

Открыть БД для редактирования:

```sh
sqlite3 data/tools.sqlite3
```

В каждой сессии включите внешние ключи:

```sql
PRAGMA foreign_keys = ON;
```

Не редактируйте генерируемые QMD вручную. Каталог находится в
`raw/tools-showcase.qmd`, карточки — в `raw/tools-showcase/`.
Схема: `scripts/tool_catalog_schema.sql`.

Локальные результаты сборки: `_site/raw/tools-showcase.html` и
`_site/raw/tools-showcase/<slug>.html`. Model Showcase сохраняет прежний адрес
`_site/raw/showcase.html`.
