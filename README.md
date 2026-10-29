# resume-sdk

Generate HTML and PDF resumes from YAML or JSON. Use the CLI to export files, or embed a resume in your site with HTML and scoped CSS.

Two templates are included. `classic` supports compact spacing. `blog` uses a simpler layout. Both produce static output with no client-side JavaScript.

## Get started

Requires Node.js 24 or later. Install the beta CLI in your project.

```sh
npm install --save-dev @resume-sdk/cli@0.1.0-beta.2
npx resume-sdk init
```

Edit the generated `resume.yaml`, then preview it.

```sh
npx resume-sdk preview resume.yaml --open
```

The preview refreshes when you save. See the [data format](docs/schema.md) for supported fields.

## Export HTML and PDF

Install Chromium once for PDF export. HTML does not need it.

```sh
npx resume-sdk install-browser
npx resume-sdk build resume.yaml --format html,pdf --force
```

This writes `dist/resume.html` and `dist/resume.pdf`. `--force` replaces existing output files. On Linux, use `install-browser --with-deps` if browser system libraries are missing.

Choose a template, paper size, or tighter spacing with CLI options.

```sh
npx resume-sdk build resume.yaml --template classic --density compact --paper a4 --force
```

Run `npx resume-sdk build --help` for all options.

## Embed in your site

```sh
npx resume-sdk build resume.yaml --mode fragment --out dist/embed
```

This writes `resume.html` and `resume.css`. Load both in your page and add your own navigation, download button, or other components around the resume. The CSS is scoped to the resume, though your site's styles can still affect it.

See the [React, Next.js, and plain HTML examples](examples/embedding/README.md). For direct library use, see the [renderer API](docs/renderer.md).

## Packages

- `@resume-sdk/core` contains validation, providers, templates, and HTML rendering. Import modules through `/providers`, `/templates`, and `/renderer`.
- `@resume-sdk/cli` contains the CLI and the `@resume-sdk/cli/pdf` API. It adds Playwright for PDF generation.

## Contributing

Clone the repository and use pnpm 12.14.0 for development.

```sh
git clone https://github.com/LiXuanqi/resume-sdk.git
cd resume-sdk
pnpm install
pnpm build
```

Run `pnpm check` for formatting, linting, types, and tests. Run `pnpm test:package` to test the packages in a separate consumer project after installing Chromium.

The [specification](docs/SPEC.md) defines the supported behavior. See the [template guide](docs/templates.md) to add a template and the [release guide](docs/releasing.md) for packaging and publication.

## License

[MIT](LICENSE). Copyright (c) 2026 Xuanqi Li.
