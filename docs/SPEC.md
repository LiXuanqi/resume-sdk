# Resume SDK — Implementation Specification

Status: target behavior; the current scaffold is not feature-complete. This document is the source of truth for implementation. Update it when a product contract changes; README examples and architecture notes must remain consistent with it.

## Purpose and scope

A local-first library and CLI that turns resume data from pluggable sources into portable documents. Users can upload a PDF, host standalone HTML, embed a fragment in an existing site, or render normalized JSON themselves. No website framework, hosted service, account, or LLM is required.

- **MVP:** YAML/JSON input, canonical schema, validation, one classic template, standalone HTML, PDF, and normalized JSON export.
- **Next:** HTML fragment + scoped CSS/assets; additional templates and integration examples.
- **Later:** Notion/LinkedIn providers, optional React composition API, job-specific tailoring.
- **Outside MVP:** editor UI, accounts/database, source synchronization/merging, plugin marketplace, DOCX export, ATS scoring, automatic job applications.

Source, template, and output are independent choices. A template must not depend on a particular provider or consumer website.

## Architecture and ownership

`source → provider → canonical validation → resume → template → HTML/CSS/assets → export`

| Workspace            | Owns                                                                | Boundary                                                |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `packages/core`      | Schema, types, validation, diagnostics, provider/template contracts | No filesystem, network, React, or browser dependencies  |
| `packages/providers` | Source parsing and mapping into canonical data                      | No presentation; credentials supplied by caller         |
| `packages/templates` | Section layout, typography, scoped styling                          | Receives validated data and options; no source fetching |
| `packages/renderer`  | Standalone documents, fragments, asset packaging                    | Framework-neutral output; no Chromium dependency        |
| `packages/pdf`       | Playwright/Chromium export of rendered HTML                         | Browser installation and execution explicit             |
| `apps/cli`           | File I/O, selection, orchestration, diagnostics                     | Calls library APIs; no duplicated rendering logic       |

Use pnpm workspaces, Node.js 24 LTS baseline, TypeScript strict mode, and ESM. Publish JavaScript and type declarations. React may implement templates internally; output consumers must not need React. Consumers can use any npm-compatible package manager. Public package names/scopes and licensing must be settled before publishing.

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
- A template has a stable ID and renders validated data plus presentation options into `{ html, css, assets }`. The fragment is semantic body content, not a complete document.
- Options include paper (`a4` or `letter`), section selection/order, and supported theme tokens. Default to `classic`, `letter`, and all populated sections; do not silently truncate content to fit one page.
- Templates use semantic headings/lists, readable text, and meaningful links. Empty sections are omitted. Navigation, download buttons, and website CTAs belong to the host application.
- Start with explicit built-in registries; library callers may supply implementations of the contracts. Dynamic npm plugin loading is deferred.

## Output contracts

| Output               | Contract                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Normalized JSON      | Versioned, validated data; no template-specific markup or credentials                                                              |
| Standalone HTML      | Complete UTF-8 document, scoped CSS, embedded local assets; usable offline with no runtime JavaScript                              |
| PDF                  | Generated from the same template HTML with print CSS; selectable text, working links, embedded fonts, explicit paper size/margins  |
| HTML fragment (next) | Body-only `resume.html`, scoped `resume.css`, and relative `assets/`; no document shell, scripts, global reset, or site navigation |

One layer owns page dimensions and margins. Wait for fonts/assets before PDF export; preserve content across page breaks. Identical input/configuration/tool versions must produce equivalent content and layout; byte-identical PDFs are not required.

Resolve local assets relative to the input/configuration location, not incidental process state. Missing assets fail with actionable diagnostics. MVP does not fetch remote assets implicitly. Output paths must stay within the selected output directory.

Fragment styles use a dedicated root namespace and documented CSS variables. Scoping prevents outbound style leakage but does not guarantee isolation from host CSS. React users may wrap fragments with components; inserting components inside the resume requires the later optional component/slot API. An iframe remains an integration option for stronger style isolation.

## CLI and library surface

Target CLI (not all commands/options exist yet):

```sh
resume-sdk validate resume.yaml
resume-sdk normalize resume.yaml --out resume.json
resume-sdk build resume.yaml --template classic --format html,pdf --paper letter --out dist/
resume-sdk build resume.yaml --format html --mode fragment --out dist/embed/
```

- Infer YAML/JSON from file extension; reject unsupported input, template, format, or mode values.
- `normalize` writes JSON to stdout unless `--out` is supplied. Diagnostics go to stderr. Failures exit nonzero.
- `build` writes `resume.html` and/or `resume.pdf`; fragment mode is HTML-only and also writes CSS/assets. Create missing output directories; refuse overwrites unless `--force` is supplied.
- Library APIs expose validation, provider loading, template rendering, document assembly, and PDF export independently. Returning artifacts must not require writing files.
- No external provider or LLM calls during normal builds. A frozen input snapshot can be built offline once dependencies/browser/fonts are installed.

## Future extensions

- **External providers:** Notion and LinkedIn must map to the same contract. LinkedIn integration depends on actual permitted API/export access; a profile URL alone is not a promised import capability.
- **Tailoring:** job URL or pasted text → extracted requirements → proposed changes grounded in source facts → user review → separate resume variant → existing rendering pipeline. Preserve the original; never auto-publish or silently replace it. Schema validity does not establish factual accuracy.
- **React adapter:** optional components/slots for composition within the resume; no requirement for portable output users.

## Verification and completion

- Unit tests cover schema failures, normalization, provider mapping, and safe rich-text/link handling. Equivalent YAML/JSON fixtures normalize identically.
- Integration tests exercise the CLI and library against fictional fixtures, including invalid input, missing assets, and overwrite protection.
- HTML works offline; PDF text extraction retains expected content. Review screenshots/rendered PDF pages for A4/Letter, long resumes, page breaks, fonts, and links. Do not rely on binary PDF snapshots alone.
- When fragment output ships, demonstrate embedding in a plain HTML site and a React app with surrounding components.
- `pnpm check` runs formatting, linting, build/type-checking, and tests. CI also runs CLI smoke checks; PDF tests install Chromium explicitly when introduced.
- Pre-commit runs safe lint fixes and formatting on staged files only. Keep full builds/tests in CI.

MVP is complete when a fresh checkout can validate either supported source, export normalized JSON, and generate a usable standalone HTML resume and upload-ready PDF without blog-specific code or services.
