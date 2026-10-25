import {
  renderOptionsSchema,
  validateResume,
  type Resume,
  type ResumeTemplate,
  type RenderOptions,
} from "@resume-sdk/core";
import { classicTemplate } from "@resume-sdk/templates";
export function renderDocument(
  resume: Resume,
  options: RenderOptions = { paper: "letter" },
  template: ResumeTemplate = classicTemplate,
): string {
  const data = validateResume(resume);
  const parsed = renderOptionsSchema.parse(options);
  const fragment = template.render(data, parsed);
  if (fragment.assets.length)
    throw new Error("Custom assets are not supported in this MVP; use an asset-free template.");
  const title = data.basics.name.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const margin = fragment.document
    ? `${fragment.document.marginMm}mm`
    : parsed.density === "compact"
      ? "12mm"
      : "16mm";
  const width = parsed.paper === "a4" ? "210mm" : "8.5in";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Resume</title><style>
@page { size: ${parsed.paper === "a4" ? "A4" : "Letter"}; margin: ${margin}; }
body { margin: 0; background: white; }
@media screen { body { background: #e9edf0; padding: 24px 12px; } .resume-document { max-width: ${width}; margin: auto; background: white; padding: ${margin}; box-shadow: 0 2px 18px #0001; } }
@media screen and (max-width: 540px) { .resume-document { padding: 24px; } }
${fragment.css}\n${fragment.document?.css ?? ""}</style></head><body>${fragment.html}</body></html>`;
}
