# Repository Guidelines

## Project Structure & Module Organization

Little He Arithmetic is a buildless, Chinese-language arithmetic app. `index.html` loads ordinary browser scripts and works offline without a backend or CDN.

- `src/curriculum.js` defines semesters, topics, and research sources.
- `src/math.js` generates questions and grades exact numeric answers.
- `src/app.js` manages views, sessions, timers, and local storage.
- `src/styles.css` contains responsive and print styles.
- `assets/` holds the original SVG mascot.
- `tests/` contains Node tests and a mobile layout preview.
- `docs/curriculum-research.md` records curriculum evidence and version limits.

## Build, Test, and Development Commands

- `npm run dev` serves the repository at `http://127.0.0.1:4173`.
- `npm test` runs the Node built-in test suite; use Node.js 20 or later.
- `npm run check` checks application JavaScript syntax.

No installation or build step is required. Opening `index.html` directly also works; local storage behavior may differ under `file://`.

## Coding Style & Naming Conventions

Use two-space indentation in JavaScript and HTML, single-quoted JavaScript strings, and descriptive camelCase names. Match existing compact CSS conventions. No formatter or linter is configured. Keep dependencies optional and preserve direct-file operation. Escape dynamic text inserted into HTML; never evaluate answer input as code.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`, named `tests/*.test.js`. No numeric coverage threshold is established. Check generated arithmetic independently and test range constraints, equivalent fractions, timeout, pause, refresh recovery, and game completion. Add regression cases for behavior changes. Verify dialogs, mobile layout, and printing in a browser when changing UI.

## Commit & Pull Request Guidelines

No Git history is available to establish commit conventions. Use concise, imperative commit subjects, such as `Add arithmetic exercise generator`, and keep each commit focused.

Pull requests should explain the change, link relevant issues, and state verification performed. Include screenshots for visible interface changes. Identify any setup requirements or remaining limitations.

## Security & Configuration

Keep credentials and local configuration out of version control. Document required environment variables using placeholder values in an example configuration file.

Preserve local-only learning records. Curriculum changes must retain source links and distinguish verified references from provisional semester suggestions; never present an inferred plan as an official syllabus.
