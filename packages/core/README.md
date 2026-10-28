# @resume-sdk/core

Requires Node.js 24 or later. ESM only. The `0.1.0-beta.1` candidate is not published yet; the registry installation commands below apply after publication.

Canonical resume schema, runtime validation, and framework-neutral provider and template contracts. No filesystem or browser dependency.

```sh
npm install @resume-sdk/core@0.1.0-beta.1
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

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](LICENSE).
