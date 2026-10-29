# resume-sdk/pdf

Requires Node.js 24 or later. ESM only. Beta version `0.1.0-beta.2`.

Export trusted resume HTML to PDF using Playwright Chromium. The caller receives bytes and controls file storage.

```sh
npm install resume-sdk@0.1.0-beta.2
```

Install the matching browser once during setup:

```js
import { installBrowser } from "resume-sdk/pdf";
await installBrowser();
// On Linux, use { withDeps: true } if system libraries are missing.
```

Then generate a PDF:

```js
import { writeFile } from "node:fs/promises";
import { validateResume } from "@resume-sdk/core";
import { renderDocument } from "@resume-sdk/core/renderer";
import { exportPdf } from "resume-sdk/pdf";

const resume = validateResume({ schemaVersion: "1", basics: { name: "Alex Example" } });
const html = renderDocument(resume, { paper: "a4" });
await writeFile("resume.pdf", await exportPdf(html));
```

The separate `resume-sdk` CLI also provides `resume-sdk install-browser`. Installation is explicit and may need network access. Exports disable document scripts and network requests, wait for fonts, and use the document's print CSS. System fonts can produce different layouts on different hosts. Each export starts and closes its own browser.

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](../LICENSE).
