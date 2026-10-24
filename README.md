# Resume SDK

One resume. Any source. Any format.

A pnpm + Node.js + TypeScript workspace for portable resume generation.

Implementation source of truth: [docs/SPEC.md](docs/SPEC.md).

## Status

Working vertical slice: YAML/JSON validation and normalization, a classic resume template, standalone offline HTML, and Playwright PDF export. Supports profile, work, education, projects, skills, restricted inline Markdown, section selection, and A4/Letter paper sizes. See [docs/schema.md](docs/schema.md) for the version-1 data contract.

This is a small MVP, not the full specification. Custom fonts/images and asset packaging, fragment export, other templates/providers, React slots, and LLM tailoring remain unimplemented. The built-in template uses system fonts; Chromium embeds the selected fonts in the PDF, but appearance can vary between hosts.

## Development

Use Node.js 24 LTS (`nvm use` if available) and pnpm 12.14.0.

```sh
pnpm install
pnpm check
node apps/cli/dist/index.js --help
node apps/cli/dist/index.js validate examples/resume.yaml
node apps/cli/dist/index.js normalize examples/resume.json
```

`pnpm build` builds workspace packages in dependency order. `pnpm typecheck` checks types; `pnpm test` runs Vitest. Build before invoking the CLI. Generated `dist/` files are ignored.

## Layout

```text
apps/cli/           CLI commands
packages/core/      Schema, validation, and contracts
packages/providers/ JSON and YAML adapters
packages/templates/ Classic template and safe rich text
packages/renderer/  Standalone HTML (fragments/assets planned)
packages/pdf/       Playwright PDF export
examples/           Fictional source data and future integration examples
tests/              Shared fixtures and future integration tests
docs/               Architecture notes
```

## Local resume workflow

Build the workspace first (`pnpm build`). Packages are not published yet; invoke the executable with `node /absolute/path/to/resume-sdk/apps/cli/dist/index.js` or `pnpm cli` from the workspace. The examples below use `resume-sdk` as shorthand for that executable.

```sh
resume-sdk init                         # Create ./resume.yaml; never overwrite
resume-sdk validate resume.yaml
resume-sdk preview resume.yaml --open   # Localhost:3000, automatic refresh
resume-sdk build resume.yaml            # HTML only → ./dist/resume.html
resume-sdk build resume.yaml --format pdf --force
resume-sdk build resume.yaml --format html,pdf --out artifacts --force --json
resume-sdk normalize resume.yaml --out resume.json
```

HTML builds need no Chromium. Before PDF export, run from this workspace:

```sh
pnpm --filter @resume-sdk/pdf exec playwright install chromium
```

Build and preview share `--template classic`, `--paper letter|a4`, and `--sections work,education,projects,skills` (selection/order). Preview supports `--port <number>` (default 3000, 0 chooses a free port) and `--open`. It keeps output in memory, watches editor saves, and shows validation errors without discarding the last valid preview. Stop with Ctrl+C. PDF export is the reference for pagination.

Build supports `--format html|pdf|html,pdf`, `--out <directory>` (default `dist`), `--force`, and `--json`. JSON mode writes a result report with `ok`, `files`, and `diagnostics` to stdout; progress and errors go to stderr. Existing outputs are protected by default. Input files are never overwritten. Exit codes: 0 success, 1 execution/validation failure, 2 usage error. Use `--debug` for stacks.

Exported HTML works offline without a server, React, or runtime JavaScript; preview adds development-only refresh code. Raw HTML in descriptions is escaped; Markdown emphasis and safe links are supported. All starter/example data is fictional. Config discovery, fragment export, and external imports are deferred.

`pnpm test` builds first and runs schema, safe-text, and CLI integration tests. `pnpm test:pdf` additionally requires installed Chromium and Poppler (`pdfinfo`, `pdftotext`, `pdffonts`) and checks multi-page A4/Letter exports, extracted content, fonts, and links. On Linux CI, browser installation uses `playwright install --with-deps chromium`.

All packages are private to prevent accidental publishing. Source repository: [LiXuanqi/resume-sdk](https://github.com/LiXuanqi/resume-sdk). No npm scope or package has been created or reserved. Choose a license before publishing.

## Linting, formatting, and commit hooks

- `pnpm lint`: Oxlint correctness rules for JavaScript/TypeScript; warnings fail.
- `pnpm lint:fix`: apply safe lint fixes.
- `pnpm format`: format supported source, configuration, and documentation files with Oxfmt.
- `pnpm format:check`: check formatting without modifying files.
- `pnpm check`: formatting, linting, build/type-checking, and tests.

Formatting uses two spaces, double quotes, semicolons, trailing commas, LF line endings, and a 100-column target. Generated output, dependencies, coverage, and the pnpm lockfile are excluded from formatting. TypeScript remains the type-checker; type-aware Oxlint rules are not enabled yet.

`pnpm install` installs Husky through the root `prepare` script. The pre-commit hook runs lint-staged: JavaScript/TypeScript files receive safe lint fixes followed by formatting; supported data, styles, and documentation files receive formatting. Remaining lint errors block the commit. lint-staged handles partially staged files and stages fixes automatically. Full builds and tests run in CI rather than on every commit.

CI sets `HUSKY=0` to skip hook installation and runs the same checks explicitly.
