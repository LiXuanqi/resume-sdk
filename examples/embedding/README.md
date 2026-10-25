# Embed a resume

## Plain HTML (runnable)

From the repository root:

```sh
pnpm build
node examples/embedding/generate.mjs
```

Open `examples/embedding/dist/index.html`. It embeds fictional resume content with a linked stylesheet and a host header/footer. Generated files are ignored by Git.

## React / Next.js

Generate files during your site's build, before compiling the app:

```sh
resume-sdk build resume.yaml --mode fragment --template classic --out src/generated/resume --force
resume-sdk build resume.yaml --format pdf --out public --force
```

Copy `ResumePage.tsx` into your app, then in a Next.js server page:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import "@/generated/resume/resume.css";
import { ResumePage } from "@/components/ResumePage";

export default async function Page() {
  const html = await readFile(join(process.cwd(), "src/generated/resume/resume.html"), "utf8");
  return <ResumePage html={html} pdfUrl="/resume.pdf" />;
}
```

The generated HTML already contains its scope wrapper. Keep that wrapper, and load the matching CSS once. Host components can precede/follow the embed or sit beside it; React does not manage nodes inside `dangerouslySetInnerHTML`. Use only trusted generated template output, not arbitrary user-supplied HTML. Pure client apps can import the HTML as text with their bundler or fetch a hosted artifact; filesystem calls stay on the server/build side.

Optional variables on the host's resume container: `--resume-sdk-font-family`, `--resume-sdk-color` (body text), and `--resume-sdk-link-color`. Headings/subtitles retain template styling. Scoping prevents outbound style leakage, not incoming host resets or inherited styles. Use an iframe when stronger isolation is required. Printing the host page also prints its components unless the host hides them; use document-mode PDF export for standalone pagination.

Both built-ins are asset-free. Custom fonts/images, asset packaging, slots inside the resume, and untrusted-template sanitization are not part of this milestone.
