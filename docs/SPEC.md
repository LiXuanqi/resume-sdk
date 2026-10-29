# Resume SDK — Implementation Specification

Status: target behavior; the current scaffold is not feature-complete. This document is the source of truth for implementation. Update it when a product contract changes; README examples and architecture notes must remain consistent with it.

## Purpose and scope

A local-first library and CLI that turns resume data from pluggable sources into portable documents. Users can upload a PDF, host standalone HTML, embed a fragment in an existing site, or render normalized JSON themselves. No website framework, hosted service, account, or LLM is required.

- **MVP:** YAML/JSON input, canonical schema, validation, one classic template, standalone HTML, PDF, and normalized JSON export.
- **Available:** HTML fragment + scoped CSS for asset-free templates; plain HTML and React embedding examples.
- **Next:** custom assets/fonts and additional templates.
- **Later:** Notion/LinkedIn providers, optional React composition API, job-specific tailoring.
- **Outside MVP:** editor UI, accounts/database, source synchronization/merging, plugin marketplace, DOCX export, ATS scoring, automatic job applications.

Source, template, and output are independent choices. A template must not depend on a particular provider or consumer website.

## Architecture and ownership

`source → provider → canonical validation → resume → template → HTML/CSS/assets → export`

| Package/module                | Owns                                        | Boundary                                     |
| ----------------------------- | ------------------------------------------- | -------------------------------------------- |
| `packages/core/src`           | Schema, validation, contracts               | Root entry does not import rendering modules |
| `packages/core/src/providers` | YAML/JSON parsing                           | No presentation or implicit source fetching  |
| `packages/core/src/templates` | React/TSX layout and CSS                    | Framework-neutral template contract          |
| `packages/core/src/renderer`  | HTML documents and scoped fragments         | No Playwright dependency                     |
| `apps/cli/src/pdf`            | Playwright PDF export and browser installer | Explicit browser setup                       |
| `apps/cli/src`                | CLI file I/O and orchestration              | Calls library APIs                           |

Publish exactly two packages. `@resume-sdk/core` exports the root schema/contracts plus `/providers`, `/templates`, and `/renderer`. `@resume-sdk/cli` exposes the CLI executable and `/pdf`. Installing core alone must not install Playwright. Both packages ship ESM JavaScript and declarations for every public entry. Internal module boundaries remain separate from npm package boundaries.

Use pnpm workspaces, Node.js 24 LTS baseline, TypeScript strict mode, and ESM. Publish JavaScript and type declarations. Built-in templates use React/TSX and `react-dom/server` static rendering; esbuild compiles separate CSS files into strings at package build time. React stays inside the template module; output consumers must not need React. Consumers can use any npm-compatible package manager. The repository and both packages use the MIT license, Copyright (c) 2026 Xuanqi Li. Each package includes a LICENSE file identical to the root license and declares `license: "MIT"`, author, description, repository location, homepage, and issue tracker metadata. Public package names/scopes must be settled before publishing.

## Canonical data

Use JSON Resume–aligned concepts, with an explicit `schemaVersion`; do not claim JSON Resume compatibility without a tested adapter. Zod is the authoritative runtime schema and source of inferred TypeScript types.

| Field           | Content                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `schemaVersion` | Required version string; initial version `"1"`                                                    |
| `basics`        | Required nonempty `name`; optional label, summary, email, phone, location, website, profile links |
| `work`          | Employer, position, location, dates, highlights                                                   |
| `education`     | Institution, qualification/area, dates, highlights                                                |
| `projects`      | Name, description, links, dates, highlights                                                       |
| `skills`        | Category/name and keywords                                                                        |

- Collections are optional and preserve input order. Final field names, optionality, and constraints must be captured in the schema and fixtures before template implementation.
- Dates use `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`, preserving source precision; reject impossible dates and reversed comparable ranges. Represent an ongoing entry explicitly, not with a localized date string.
- Normalize links to complete URLs; validate allowed protocols. Do not invent dates, credentials, metrics, or other facts to satisfy validation.
- Descriptive text supports a restricted Markdown subset: text, emphasis, strong emphasis, and links. Raw HTML is not supported; render escaped text or sanitized, allowlisted markup.
- Canonical unknown fields and unsupported schema versions fail validation. Provider mapping losses produce field-specific diagnostics rather than disappearing silently.
- Keep source provenance and future revision metadata outside the portable resume payload. Normalization never edits the input file.

The initial field contract is recorded in [schema.md](schema.md); the implementation remains a subset of this target specification. Convert legacy blog data through an explicit adapter; do not make its shape the universal format.

## Provider and template contracts

- A provider loads a caller-supplied input and returns validated resume data plus diagnostics. JSON and YAML represent the same canonical shape in MVP; a source format is not a separate resume schema.
- Diagnostics identify severity, code, message, and field path when applicable. Errors prevent rendering; warnings identify recoverable mapping issues.
- A template has a stable ID and renders validated data plus presentation options into `{ html, css, assets, document? }`. The synchronous contract contains no React types: plain functions and other precompiled authoring systems remain valid. `document`, when present, contains `{ marginMm, css }` for standalone shell layout only; fragment consumers omit it. The document renderer owns `@page` size/margins and applies this explicit margin override. The fragment is semantic body content, not a complete document.
- Options include paper (`a4` or `letter`), density (`comfortable` or `compact`), section selection/order, and future theme tokens. Density defaults to `comfortable` and changes presentation only; it is not part of canonical resume data. Default to `classic`, `letter`, and all populated sections; do not silently truncate content to fit one page.
- Templates use semantic headings/lists, readable text, and meaningful links. Empty sections are omitted. Navigation, download buttons, and website CTAs belong to the host application.
- Start with explicit built-in registries; library callers may supply implementations of the contracts. Dynamic npm plugin loading is deferred.

### Built-in template authoring

- Templates live under `packages/core/src/templates/<id>/`: `index.tsx`, `styles.css`, optional standalone `document.css`, and README. Shared components encapsulate safe rich text and repeated markup. Only allowlisted Markdown output reaches `dangerouslySetInnerHTML`; React escapes ordinary data.
- `renderToStaticMarkup` produces body-only HTML. No hooks, browser APIs, hydration, or network requests are required. CSS is bundled into the published JS entry, so callers need neither a CSS loader nor a JSX compiler.
- Register templates centrally; CLI build/preview select the same registry. Library callers can still supply a custom `ResumeTemplate` directly.
- `classic` preserves its pre-migration layout for both densities and papers.
- `blog` reproduces the reference blog resume document: system sans font, centered contact rows, company-first headings, right-aligned dates, ruled section headings, 14px screen/12px print body, and the source's screen/print padding. It has fixed responsive-media spacing; `compact` is rejected rather than ignored. To match the blog's visible content, use `--sections education,work`; other selected sections remain supported.
- Blog dates render from canonical precision as YYYY, MM/YYYY, or MM/DD/YYYY with an en-dash range separator. Original punctuation is not retained in canonical data. The host owns navigation such as Back to Home. System font/platform differences can affect cross-machine rendering; pixel matching is verified in the same browser/font environment.
- Contributor instructions and extension boundaries live in `docs/templates.md`. Template changes require validation/escaping tests and print checks. Personal comparison data remains outside the repository.

## Output contracts

| Output          | Contract                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Normalized JSON | Versioned, validated data; no template-specific markup or credentials                                                                                                                                        |
| Standalone HTML | Complete UTF-8 document, scoped CSS, embedded local assets; usable offline with no runtime JavaScript                                                                                                        |
| PDF             | Generated from the same template HTML with print CSS; selectable text, working links, embedded fonts, explicit paper size/margins                                                                            |
| HTML fragment   | Body-only `resume.html` plus scoped `resume.css`; no document shell, scripts, global reset, page margins, or site navigation. Built-ins are asset-free; nonempty assets fail until packaging is implemented. |

The document renderer owns page dimensions and margins: comfortable uses 16mm; compact uses 12mm, shared by screen document padding and print page margins. Classic is authored in React/TSX with separate scoped CSS, producing semantic static HTML. No client-side React or pagination runtime is shipped. The existing safe Markdown renderer handles inline text, and Chromium paginates PDF output.

Classic density presets are fixed and explicit: comfortable uses 10.5pt/1.45 body text and a 27pt name; compact uses 9pt/1.25 body text and a 20pt name with tighter section, paragraph, list, and entry spacing. Compact takes inspiration from traditional dense print resumes. Neither preset removes content, scales dynamically, or promises a one-page result.

Entries may split between bullets. Keep entry headings with the next content, avoid breaks inside headings and individual bullets, and apply widow/orphan protection to text. Oversized bullets may split when needed to fit a page. Section headings stay with following content. Both densities preserve the same section order, text, links, and semantics.

Wait for fonts/assets before PDF export; preserve content across page breaks. Identical input/configuration/tool versions must produce equivalent content and layout; byte-identical PDFs are not required.

Resolve local assets relative to the input/configuration location, not incidental process state. Missing assets fail with actionable diagnostics. MVP does not fetch remote assets implicitly. Output paths must stay within the selected output directory.

`renderFragment(resume, options?, template?)` returns `{ html, css, assets }` without filesystem writes or standalone `document` metadata. It validates canonical data/options, wraps template body markup in a div with a deterministic `data-resume-sdk` scope (derived from template ID/CSS), and prefixes every CSS selector via PostCSS. Keep the returned wrapper and its matching stylesheet together. Different template styles can coexist as sibling embeds without cross-styling. Identical template CSS can share a scope; this is a style namespace, not an HTML ID.

Fragment CSS permits ordinary rules and conditional `@media`/`@supports`; unsupported global at-rules (including `@page`, `@import`, `@font-face`, keyframes) and CSS nesting fail explicitly. This is style isolation for trusted templates, not an HTML/CSS sanitizer or sandbox. Templates are trusted executable code and must emit semantic body-only markup without scripts/styles/event handlers. Nonempty assets fail rather than disappearing silently. Font/image packaging and path rewriting remain deferred.

Standalone paper dimensions, backgrounds, shadows, padding, and minimum heights belong to `document` CSS; embedded blog content has natural height and host-controlled spacing. `paper` remains a validated shared option but does not set page size or wrapper width in fragment mode. Scoped print typography remains available; printing the host page is controlled by the host.

Supported CSS variables, with template defaults: `--resume-sdk-font-family`, `--resume-sdk-color` (body text), and `--resume-sdk-link-color`. Heading/subtitle colors remain template-specific. Set variables on a host container around the fragment. Scoping prevents outbound style leakage but does not guarantee isolation from host CSS. React users may wrap fragments with components; inserting components inside the resume requires the later optional component/slot API. An iframe remains an integration option for stronger style isolation.

## CLI and library surface

### Local CLI workflow

Implemented commands (input is explicit; no config discovery or interactive prompts):

```sh
resume-sdk install-browser
resume-sdk init
resume-sdk validate resume.yaml
resume-sdk preview resume.yaml --open
resume-sdk build resume.yaml
resume-sdk build resume.yaml --format html,pdf --out dist/ --force --json
resume-sdk normalize resume.yaml --out resume.json
```

- `install-browser` installs Chromium through the Playwright CLI resolved from the installed `@resume-sdk/cli/pdf` package. `--with-deps` additionally installs system libraries and may require elevated privileges on Linux. It inherits Playwright cache/proxy environment variables and streams installer output. Successful installation exits 0; launch, nonzero child exit, or signal failure exits 1. Unknown options are CLI usage errors. No browser download occurs during package installation or ordinary builds.
- Library callers may use `installBrowser(options?: { withDeps?: boolean }): Promise<void>` from `@resume-sdk/cli/pdf`. Failures reject the promise. Missing-browser errors identify the public installer command and library API.
- `init` writes documented, fictional starter data to `./resume.yaml`. Never overwrites, including symlinks; no `--force` option.
- `validate <input>` checks canonical data and reports field-specific failures.
- `build <input>` defaults to standalone HTML, classic template, Letter paper, all populated sections, and `./dist`. `--format` accepts `html`, `pdf`, or comma-separated `html,pdf` without duplicates. HTML-only builds do not load/start Chromium.
- Build and preview share `--template classic|blog`, `--paper letter|a4`, `--density comfortable|compact`, and `--sections <comma-separated-selection/order>`. Unknown/duplicate sections fail.
- `build --mode document|fragment` defaults to document. Fragment mode only accepts `--format html` and writes `resume.html` plus `resume.css` with JSON report entries for both; it rejects PDF/combined formats before writing anything. Export PDF in a separate document-mode build. Both output paths are checked for collisions before either is written; `--force` replaces both.
- Document build writes `resume.html` and/or `resume.pdf`; creates missing directories and refuses overwrites unless `--force`. Never overwrites its input. Prepare all requested artifacts before writing files; multi-file writes are not transactional.
- `build --json` emits one report on stdout: success `{ ok: true, files: [{ format, path }], diagnostics: [] }`; execution failure `{ ok: false, files: [], diagnostics: [{ severity, code, message }] }`. Paths are absolute. `files` on failure does not guarantee rollback of filesystem writes. Progress/errors go to stderr. Parser failures may occur before JSON mode is established.
- `preview <input>` starts a server bound to `127.0.0.1`, default port 3000; `--port 0` selects an available port. `--open` opens the default browser. Port conflicts fail clearly; no automatic port switching.
- Preview watches the explicit input, including atomic replacement/deletion/recreation. Initial invalid input fails; subsequent errors appear in the browser and stderr while retaining the last valid rendering. Recovery clears errors; valid changed HTML refreshes automatically. The server holds output in memory, writes no artifacts, and closes its watcher/server on Ctrl+C or SIGTERM.
- Preview adds development-only polling JavaScript. Exported HTML remains script-free. PDF export is the pagination reference; preview does not export PDF.
- `normalize` writes canonical JSON to stdout unless `--out` is supplied; `--force` permits replacement. It remains an auxiliary utility.
- Infer YAML/JSON from extension; reject unsupported files/options. No arguments shows help/examples. `--help` and `--version` succeed; version comes from package metadata. `--debug` includes error stacks.
- Exit codes: 0 success/help, 1 input/validation/I/O/render failure, 2 CLI usage errors. Commands never prompt, making them usable in CI. Missing Chromium errors include the installation command.
- Configuration files, interactive setup, external `import`/authentication, and template discovery are deferred. Fragment invocation: `resume-sdk build resume.yaml --format html --mode fragment --out dist/embed/`.
- Library APIs expose validation, provider loading, template rendering, document assembly, and PDF export independently. Returning artifacts must not require writing files.
- No external provider or LLM calls during normal builds. A frozen input snapshot can be built offline once dependencies/browser/fonts are installed.

## Future extensions

- **External providers:** Notion and LinkedIn must map to the same contract. LinkedIn integration depends on actual permitted API/export access; a profile URL alone is not a promised import capability.
- **Tailoring:** job URL or pasted text → extracted requirements → proposed changes grounded in source facts → user review → separate resume variant → existing rendering pipeline. Preserve the original; never auto-publish or silently replace it. Schema validity does not establish factual accuracy.
- **React adapter:** optional components/slots for composition within the resume; no requirement for portable output users.

## Verification and completion

- Unit tests cover schema failures, normalization, provider mapping, and safe rich-text/link handling. Equivalent YAML/JSON fixtures normalize identically.
- Integration tests exercise the CLI and library against fictional fixtures, including invalid input, missing assets, and overwrite protection. PDF checks cover both densities on Letter/A4, entries longer than a page, headings attached to first bullets, text preservation, and content within printable bounds. Real personal resumes are tested locally, never added as public fixtures.
- HTML works offline; PDF text extraction retains expected content. Review screenshots/rendered PDF pages for A4/Letter, long resumes, page breaks, fonts, and links. Do not rely on binary PDF snapshots alone.
- Demonstrate fragments in a plain HTML site and a React app with surrounding components. `pnpm test:embed` uses Chromium to check host-style isolation, coexistence of classic/blog, theme variables, and screen/print styling. Examples live in `examples/embedding/`; consumer CSS may still affect an embed.
- `pnpm check` runs formatting, linting, build/type-checking, and tests. CI also runs CLI smoke checks; PDF tests install Chromium explicitly when introduced.
- `pnpm test:package` builds and packs both packages, installs tarballs into a temporary consumer outside the workspace, and first verifies core-only HTML rendering without Playwright, then checks CLI execution, public TypeScript declarations, provider loading, both templates, document/fragment rendering, browser installation, and PDF export. HTML and fragments must work with an empty browser cache; PDF must fail with installer guidance until Chromium is available. Tests use local overrides for unpublished internal versions, never workspace links. CI runs these checks; third-party installation may require network access. This test does not verify npm ownership or publish anything. The workspace root remains private; release packages are publishable.
- Pre-commit runs safe lint fixes and formatting on staged files only. Keep full builds/tests in CI.

MVP is complete when a fresh checkout can validate either supported source, export normalized JSON, and generate a usable standalone HTML resume and upload-ready PDF without blog-specific code or services.

## Release preparation

The next candidate version is `0.1.0-beta.2` for both SDK packages. Internal `workspace:*` dependencies pack to that exact version. Package metadata specifies public access, the `beta` tag, and the npm registry. Publication requires explicit authorization. The non-published workspace root stays private at `0.0.0`.

`pnpm release:prepare` builds and packs the candidate, checks coordinated versions and license/publication metadata, and writes tarballs with SHA-256 checksums and Git source state under `dist/release/<version>/`. The manual `release.yml` workflow runs the existing checks and uploads artifacts only. It has no publication command or credentials. Release archives contain publishable manifests. Publication uses an interactive npm owner login; subsequent per-package trusted publishing remains setup work. See [releasing.md](releasing.md).

Each candidate tarball includes a package-specific consumer README with installation, usage, requirements, and limitations. Packaged-consumer checks verify its inclusion. `pnpm release:preflight` performs read-only npm login, organization owner, public package-name, and candidate-version checks. A registry 404 does not reserve a name or prove publish authorization. The initial recommended publication uses an interactive owner login after explicit authorization. Subsequent OIDC publishing requires separate per-package and GitHub environment setup.
