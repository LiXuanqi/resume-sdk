# @resume-sdk/renderer

Requires Node.js 24 or later. ESM only. The `0.1.0-beta.1` candidate is not published yet; the registry installation commands below apply after publication.

Render canonical resume data into standalone HTML or body-only HTML with scoped CSS. Chromium is not required.

```sh
npm install @resume-sdk/core@0.1.0-beta.1 @resume-sdk/renderer@0.1.0-beta.1
```

```js
import { validateResume } from "@resume-sdk/core";
import { renderDocument, renderFragment, getTemplate } from "@resume-sdk/renderer";

const resume = validateResume({ schemaVersion: "1", basics: { name: "Alex Example" } });
const options = { paper: "letter", sections: ["education", "work"] };
const template = getTemplate("blog");
const document = renderDocument(resume, options, template);
const { html, css, assets } = renderFragment(resume, options, template);
```

Save the document as a complete HTML file, or import the fragment CSS once and insert the fragment into your page. Keep the generated scope wrapper intact. Components such as navigation and download buttons belong outside that wrapper.

Output needs no client-side React runtime. Scoping prevents outward style leakage, but host styles can affect the resume. Templates are trusted code, not sandboxed plugins. Custom assets and global fragment CSS at-rules are not supported in this beta.

[Website integration examples](https://github.com/LiXuanqi/resume-sdk/tree/main/examples/embedding).

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](LICENSE).
