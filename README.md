# Resume SDK

One resume. Any source. Any format.

A pnpm + Node.js + TypeScript workspace for portable resume generation.

Implementation source of truth: [docs/SPEC.md](docs/SPEC.md).

## Status

Working vertical slice: YAML/JSON validation and normalization, classic and blog templates, standalone offline HTML, embeddable HTML/scoped CSS, and Playwright PDF export. Supports profile, work, education, projects, skills, restricted inline Markdown, section selection, and A4/Letter paper sizes. See [docs/schema.md](docs/schema.md) for the version-1 data contract.

This is a small MVP, not the full specification. Custom fonts/images and asset packaging, external providers, React slots, and LLM tailoring remain unimplemented. The built-in template uses system fonts; Chromium embeds the selected fonts in the PDF, but appearance can vary between hosts.

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
packages/templates/ React-authored classic/blog templates
packages/renderer/  Standalone HTML and scoped fragments
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
resume-sdk build resume.yaml --format pdf --density compact --force
resume-sdk build resume.yaml --format html,pdf --out artifacts --force --json
resume-sdk normalize resume.yaml --out resume.json
```

HTML builds need no Chromium. Before PDF export, run from this workspace:

```sh
pnpm cli install-browser
```

Installed consumers run `resume-sdk install-browser`. Add `--with-deps` on Linux to install system libraries, which may require elevated privileges. Library callers can use `installBrowser({ withDeps: false })` from `@resume-sdk/pdf`. The installer uses that package's Playwright version and inherits its cache/proxy environment. Builds never install browsers automatically.

Build and preview share `--template classic|blog`, `--paper letter|a4`, `--density comfortable|compact`, and `--sections work,education,projects,skills` (selection/order). Preview supports `--port <number>` (default 3000, 0 chooses a free port) and `--open`. It keeps output in memory, watches editor saves, and shows validation errors without discarding the last valid preview. Stop with Ctrl+C. PDF export is the reference for pagination.

Build supports `--format html|pdf|html,pdf`, `--out <directory>` (default `dist`), `--force`, and `--json`. JSON mode writes a result report with `ok`, `files`, and `diagnostics` to stdout; progress and errors go to stderr. Existing outputs are protected by default. Input files are never overwritten. Exit codes: 0 success, 1 execution/validation failure, 2 usage error. Use `--debug` for stacks.

Built-in templates use React/TSX and separate CSS; exported documents require no React runtime. See [the template contributor guide](packages/templates/README.md). The `blog` template reproduces the blog resume layout; use `--template blog --sections education,work` for the matching section selection. It uses fixed screen/print spacing (`compact` is unsupported).

Classic defaults to comfortable spacing (10.5pt body, 16mm margins). Compact uses fixed 9pt body text, 12mm margins, and tighter spacing. Both allow long entries to split between bullets while keeping headings with content. Compact preserves all selected content; it does not guarantee a single page.

Exported HTML works offline without a server, React, or runtime JavaScript; preview adds development-only refresh code. Raw HTML in descriptions is escaped; Markdown emphasis and safe links are supported. All starter/example data is fictional. Config discovery, and external imports are deferred.

## Embed in an existing site

```sh
pnpm cli build examples/resume.yaml --mode fragment --out dist/embed
```

This writes body-only `resume.html` and scoped `resume.css`. Import/link the CSS once, then insert the generated HTML inside your React component or HTML page. Keep the generated scope wrapper intact. Header, navigation, download actions, and footer remain ordinary host components.

```tsx
function ResumeSection({ html }: { html: string }) {
  return <section dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Pass only trusted SDK-generated HTML. See [runnable HTML and React examples](examples/embedding/README.md) for generation and Next.js wiring. Library callers use `renderFragment(resume, options, template)` to receive `{ html, css, assets }` without writing files. Built-ins need no assets; nonempty custom assets are rejected until packaging ships.

`--mode document` remains the default. Fragment mode is HTML-only; generate PDF separately. Styles are scoped outward, but host resets can still affect the resume. Variables `--resume-sdk-font-family`, `--resume-sdk-color`, and `--resume-sdk-link-color` support basic theming. Global CSS at-rules and CSS nesting are unsupported in fragments. Standalone page CSS is excluded.

`pnpm test` builds first and runs schema, safe-text, and CLI integration tests. `pnpm test:pdf` additionally requires installed Chromium and Poppler (`pdfinfo`, `pdftotext`, `pdffonts`) and checks multi-page A4/Letter exports, extracted content, fonts, and links. On Linux CI, browser installation uses `pnpm cli install-browser --with-deps`.

`pnpm test:embed` additionally checks both fragments together in Chromium, including host-style isolation and print rules. It uses the same installed browser as PDF tests.

All packages are private to prevent accidental publishing. Source repository: [LiXuanqi/resume-sdk](https://github.com/LiXuanqi/resume-sdk). The `@resume-sdk` organization is owned by npm account `1_x7`; individual packages remain unpublished, and the unscoped CLI name is not reserved. Licensed under [MIT](LICENSE), Copyright (c) 2026 Xuanqi Li. Each package includes the full license.

## Linting, formatting, and commit hooks

- `pnpm lint`: Oxlint correctness rules for JavaScript/TypeScript; warnings fail.
- `pnpm lint:fix`: apply safe lint fixes.
- `pnpm format`: format supported source, configuration, and documentation files with Oxfmt.
- `pnpm format:check`: check formatting without modifying files.
- `pnpm check`: formatting, linting, build/type-checking, and tests.

Formatting uses two spaces, double quotes, semicolons, trailing commas, LF line endings, and a 100-column target. Generated output, dependencies, coverage, and the pnpm lockfile are excluded from formatting. TypeScript remains the type-checker; type-aware Oxlint rules are not enabled yet.

`pnpm install` installs Husky through the root `prepare` script. The pre-commit hook runs lint-staged: JavaScript/TypeScript files receive safe lint fixes followed by formatting; supported data, styles, and documentation files receive formatting. Remaining lint errors block the commit. lint-staged handles partially staged files and stages fixes automatically. Full builds and tests run in CI rather than on every commit.

CI sets `HUSKY=0` to skip hook installation and runs the same checks explicitly.

## Packaged consumer checks

Run `pnpm test:package` to build and pack all six packages, then install them in a temporary project outside the workspace. The check verifies the installed CLI, public TypeScript declarations, providers, both templates, HTML, fragments, browser installation, and PDF export. Local overrides resolve unpublished SDK dependencies to the same tarball set. Third-party dependencies may require network access. The temporary project is removed afterward. CI runs this check after installing browser system libraries. This command does not publish packages or change their private status.

## Release preparation

The unpublished candidate version is `0.1.0-beta.1` across all six packages. Run `pnpm release:prepare` to build private candidate tarballs and checksums. The manual **Prepare release candidate** workflow runs validation and uploads these artifacts without publishing. See [the release guide](docs/releasing.md) and [release notes](CHANGELOG.md).
