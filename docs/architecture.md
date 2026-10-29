# Architecture

See [SPEC.md](SPEC.md) for contracts and acceptance criteria.

Providers parse source data into a validated resume. Templates turn it into HTML and CSS. The renderer produces a standalone document or a scoped fragment. The PDF exporter prints a standalone document with Chromium.

Two npm packages contain these modules.

| Package            | Source              | Public entry points                                            |
| ------------------ | ------------------- | -------------------------------------------------------------- |
| `@resume-sdk/core` | `packages/core/src` | Root schema/contracts, `/providers`, `/templates`, `/renderer` |
| `@resume-sdk/cli`  | `apps/cli/src`      | CLI executable and `/pdf`                                      |

Core has no Playwright dependency. Its templates use React/TSX and separate CSS internally; generated HTML requires no client-side React. Module contracts remain framework-neutral. The schema entry does not import rendering modules.

The CLI depends on core and owns Playwright. PDF installation and execution remain explicit. Internal modules use relative imports; consumers use public package exports.

The next candidate is `0.1.0-beta.2`. The earlier six-package beta publication was interrupted. Existing npm versions cannot be replaced. No consolidated package has been published yet.
