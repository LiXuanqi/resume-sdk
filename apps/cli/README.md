# resume-sdk

Requires Node.js 24 or later. ESM only. Beta version `0.1.0-beta.2`.

Create, validate, preview, and export a resume from local YAML or JSON.

```sh
npm install --save-dev resume-sdk@0.1.0-beta.2
npx resume-sdk init
npx resume-sdk validate resume.yaml
npx resume-sdk preview resume.yaml --open
npx resume-sdk build resume.yaml
```

HTML is the default output. PDF requires the SDK's Chromium installation:

```sh
npx resume-sdk install-browser
npx resume-sdk build resume.yaml --format html,pdf --out dist --force
npx resume-sdk build resume.yaml --mode fragment --out dist/embed
```

On Linux, add `--with-deps` to the installer to install system libraries. This may require elevated privileges. HTML does not require Chromium.

Choose `--template classic|blog`, `--paper letter|a4`, and `--sections education,work`. Classic also supports `--density compact`. Fragment mode writes `resume.html` and scoped `resume.css`; it does not export PDF. Import the CSS and embed only trusted generated HTML in your site. Host styles can still affect the fragment.

Existing files are protected unless `--force` is supplied. `--json` on build provides a machine-readable report. Exit codes are 0 for success, 1 for execution or validation failure, and 2 for usage errors. Use `--help` for commands and options.

[Schema reference](https://github.com/LiXuanqi/resume-sdk/blob/main/docs/schema.md).

## PDF API

```js
import { exportPdf, installBrowser } from "resume-sdk/pdf";
await installBrowser();
const bytes = await exportPdf(html);
```

`html` is a trusted standalone resume document. Browser installation is a setup step, not required for each export. HTML-only consumers can install `@resume-sdk/core` without Playwright.

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](LICENSE).
