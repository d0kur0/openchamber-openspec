# OpenSpec Studio

Русский интерфейс по умолчанию, переключение на English с сохранением в OpenChamber. Доска со
стадиями и компактный список, поиск по названию/ID/области, фильтр стадии и проблемных сводок,
сортировка по названию, выполнению и оставшимся задачам. Темы хоста, адаптивная панель, цели
карточек вместо технических имён.

Установка: Settings → Extensions → добавить `https://github.com/d0kur0/openchamber-openspec.git`.
Нужен OpenSpec CLI 1.15.0 в PATH и проект с `openspec/`. ID расширения прежний `openspec-board`; при
установленном оригинале используйте замену, а не вторую копию. Windows npm CLI запускается напрямую
через Node без shell.

Выбор языка возвращает на доску. Содержимое документов и цели не переводятся. Фильтры не меняют
файлы, статусы и не запускают агентов. «Проблемные» означает stale/unavailable сводки. Основное
действие готовит неотправленный запрос; запуск в отдельной копии и архивация имеют прежнюю семантику
OpenSpec.

Форк
[jaythomasonprojects/openchamber-openspec](https://github.com/jaythomasonprojects/openchamber-openspec),
MIT; исходная лицензия и авторство сохранены. Версия Studio 1.3.0. Это не официальный релиз upstream
и не npm-публикация.

Проверки Studio: lint, typecheck, build; model/resources/studio и Windows CLI regression. CI
выполняет эту выборку на Ubuntu/Windows. Полный upstream suite (включая браузерные тесты и Unix
helpers) отдельно не объявляется пройденным. Направление и условия приёмки: DESIGN.md.

---

# OpenSpec for OpenChamber

A kanban board for the OpenSpec changes in your OpenChamber project or worktree. See each change's
stage, artefacts and task progress in one place, create or delete changes, and kick start the next
workflow step.

![OpenSpec board grouping changes by stage, with task progress and workflow actions.](docs/images/board-view.jpg)
![OpenSpec change detail showing the selected Specs tab and its specification.](docs/images/change-view.jpg)

This extension is simply another way to use OpenSpec, without adding planning features or
conventions of its own. OpenSpec's own CLI and skills remain the core.

Contributions that keep this extension in step with OpenSpec or take advantage of it's additional
features are welcome.

## Get started

1. Install the [OpenSpec CLI](https://openspec.dev/docs/installation) on the OpenChamber server
   (tested with 1.13.1).
2. Run `openspec config profile`. Keep the core workflows, add **verify**, and choose skills
   delivery.
3. In your project, run `openspec init --tools opencode`.
4. In OpenChamber, open **Settings > Extensions** and add
   `https://github.com/jaythomasonprojects/openchamber-openspec.git`. Its service runs `openspec`
   with your user access, and the `sessions` permission lets it start sessions for worktree Apply
   and bulk archiving. If you trust that, choose **Allow and enable**.
5. Open the **OpenSpec** rail panel, or find it under **Extension pages**.

The board's help button opens the OpenSpec quickstart. For ~ x2 faster loads, run
`openspec config set telemetry.enabled false`, since telemetry can slow down every CLI call.

## Planning across worktrees

Commit your `openspec/` directory and worktrees pick up changes through Git like any other file.
**Run in new worktree** starts from your project's default base, so commit the change there first.

Optionally, to share uncommitted planning between worktrees, use your project's setup hook to link
each worktree's `openspec/` to the main checkout's. The board follows the link but does not create
or repair it.

## Develop

Requires Node 22.13+, npm and the OpenSpec CLI. Run `npm ci`, `npx playwright install chromium`,
then `npm run check`. OpenChamber does not build extensions on install, so rebuild, then disable and
re-enable the extension to restart its service. More detail is in `AGENTS.md`.
