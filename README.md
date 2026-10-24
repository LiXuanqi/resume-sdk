# Resume SDK

One resume. Any source. Any format.

A pnpm + Node.js + TypeScript workspace for portable resume generation.

## Status

Initial scaffold. YAML/JSON parsing, strict validation of a minimal versioned schema, and JSON normalization work. Templates, HTML rendering, asset packaging, and PDF export are planned interfaces/directories, not implemented features. The initial schema supports only `schemaVersion` and `basics` (name and optional label); unknown fields fail validation to prevent accidental data loss. Do not use it with a full existing resume yet.

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
packages/templates/ Template implementations (planned)
packages/renderer/  HTML documents, fragments, and assets (planned)
packages/pdf/       Playwright PDF export (planned)
examples/           Fictional source data and future integration examples
tests/              Shared fixtures and future integration tests
docs/               Architecture notes
```

## Next milestone

Expand the resume schema, implement a classic template, and export standalone HTML and PDF. Then add fragment + CSS output and framework integrations.

Chromium is not installed by dependency installation. When implementing PDF export, install it explicitly with `pnpm --filter @resume-sdk/pdf exec playwright install chromium` (CI may also need `--with-deps`).

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
