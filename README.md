# resume-sdk

Generate HTML and PDF resumes from YAML or JSON. Use the CLI to export files, or embed a resume in your site with HTML and scoped CSS.

Two templates are included. `classic` supports compact spacing. `blog` uses a simpler layout. Both produce static output with no client-side JavaScript.

The first release, `0.1.0-beta.1`, is in preparation. Packages are not on npm yet.

## Try it locally

Requires Node.js 24 or later and pnpm 12.14.0.

```sh
git clone https://github.com/LiXuanqi/resume-sdk.git
cd resume-sdk
pnpm install
pnpm build
pnpm cli build examples/resume.yaml
```

Open `dist/resume.html` to see the sample resume.

To write your own, create a starter file and edit `resume.yaml`.

```sh
pnpm cli init
pnpm cli preview resume.yaml --open
```

The preview refreshes when you save. See the [data format](docs/schema.md) for supported fields.

## Export HTML and PDF

Install Chromium once for PDF export. HTML does not need it.

```sh
pnpm cli install-browser
pnpm cli build resume.yaml --format html,pdf --force
```

This writes `dist/resume.html` and `dist/resume.pdf`. `--force` replaces existing output files. On Linux, use `install-browser --with-deps` if browser system libraries are missing.

Choose a template, paper size, or tighter spacing with CLI options.

```sh
pnpm cli build resume.yaml --template classic --density compact --paper a4 --force
```

Run `pnpm cli build --help` for all options.

## Embed in your site

```sh
pnpm cli build resume.yaml --mode fragment --out dist/embed
```

This writes `resume.html` and `resume.css`. Load both in your page and add your own navigation, download button, or other components around the resume. The CSS is scoped to the resume, though your site's styles can still affect it.

See the [React, Next.js, and plain HTML examples](examples/embedding/README.md). For direct library use, see the [renderer API](packages/renderer/README.md).

## Contributing

Run `pnpm check` for formatting, linting, types, and tests. Run `pnpm test:package` to test the packages in a separate consumer project after installing Chromium.

The [specification](docs/SPEC.md) defines the supported behavior. See the [template guide](packages/templates/README.md) to add a template and the [release guide](docs/releasing.md) for packaging and publication.

## License

[MIT](LICENSE). Copyright (c) 2026 Xuanqi Li.
