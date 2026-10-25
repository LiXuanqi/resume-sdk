# Architecture

See [SPEC.md](SPEC.md) for authoritative contracts, scope, and acceptance criteria. This file is a brief overview.

Source providers → validated canonical resume → selected template → portable HTML → PDF.

- core: versioned schema, validation, and contracts; no rendering or platform adapters.
- providers: parse source data and validate it; JSON and YAML initially.
- templates: layout and scoped styling; independent of host sites.
- renderer: standalone documents and scoped fragments; asset packaging is deferred.
- pdf: isolated Playwright dependency for browser-based export.
- cli: user-facing orchestration.

All packages are private during scaffolding. Package scopes are provisional and have not been reserved.
Built-in templates use React/TSX and separate CSS, compiled into static HTML/CSS artifacts. Core contracts remain framework-neutral; generated output requires no React runtime.
Add external providers, an optional React slot API, and reviewed LLM tailoring after the base pipeline works.
