# @resume-sdk/providers

Requires Node.js 24 or later. ESM only. The beta version is `0.1.0-beta.1`.

Parse canonical resume data from JSON or YAML text. File access remains the caller's responsibility.

```sh
npm install @resume-sdk/providers@0.1.0-beta.1
```

```js
import { readFile } from "node:fs/promises";
import { yamlProvider, jsonProvider } from "@resume-sdk/providers";

const { resume, diagnostics } = await yamlProvider.load(await readFile("resume.yaml", "utf8"));
const roundTrip = await jsonProvider.load(JSON.stringify(resume));
```

Both providers validate the same versioned schema and reject invalid input. They do not convert arbitrary legacy YAML formats. Notion and LinkedIn imports are not implemented.

[Schema reference](https://github.com/LiXuanqi/resume-sdk/blob/main/docs/schema.md).

## License

MIT. Copyright (c) 2026 Xuanqi Li. See [LICENSE](LICENSE).
