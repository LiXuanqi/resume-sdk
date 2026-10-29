# Changelog

## 0.1.0-beta.2 - Unreleased

- Consolidate into `@resume-sdk/core` and `@resume-sdk/cli`.
- Move providers, templates, and rendering to core subpath exports.
- Move PDF export and browser installation to `@resume-sdk/cli/pdf`.
- Keep Playwright out of core-only installations.

## 0.1.0-beta.1 - Partial publication

The six-package release was interrupted. Use the beta.2 candidate for the new package layout.

- Validate and normalize canonical resume data from YAML and JSON.
- Initialize resumes and preview local changes with the CLI.
- Render classic and blog templates as standalone HTML or scoped HTML fragments.
- Export Letter and A4 PDFs. Use compact spacing with the classic template.
- Install the PDF exporter's Chromium version through `resume-sdk install-browser`.
- Verify packed consumer installations and include the MIT license in each package.

Requires Node.js 24 or later. Packages use ESM. Custom assets, external providers, React composition slots, and LLM tailoring remain outside this beta.
