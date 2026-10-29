# @resume-sdk/core

Requires Node.js 24 or later. ESM only. Beta version `0.1.0-beta.2`.

Resume validation, YAML and JSON providers, built-in templates, and HTML rendering. No Playwright or Chromium dependency.

```sh
npm install @resume-sdk/core@0.1.0-beta.2
```

```ts
import { validateResume, type Resume } from "@resume-sdk/core";

const resume: Resume = validateResume({
  schemaVersion: "1",
  basics: { name: "Alex Example" },
});
```

Validation throws on invalid data, unsupported versions, or unknown fields. Optional sections include work, education, projects, and skills. Descriptive text supports restricted inline Markdown; raw HTML is escaped by built-in templates.

[Complete data schema](https://github.com/LiXuanqi/resume-sdk/blob/main/docs/schema.md).

## Modules

Install this package once and import the modules you need.

| Import                       | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `@resume-sdk/core`           | Schema, validation, and provider/template contracts |
| `@resume-sdk/core/providers` | YAML and JSON parsing                               |
| `@resume-sdk/core/templates` | Classic and blog templates                          |
| `@resume-sdk/core/renderer`  | HTML documents and scoped fragments                 |

```js
import { yamlProvider } from "@resume-sdk/core/providers";
import { renderFragment } from "@resume-sdk/core/renderer";
const { resume } = await yamlProvider.load('schemaVersion: "1"\nbasics:\n  name: Alex Example\n');
const { html, css } = renderFragment(resume);
```

React is used internally to render templates. Exported HTML needs no client-side React runtime. For PDF export, install `resume-sdk` and import `resume-sdk/pdf`.

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](LICENSE).
