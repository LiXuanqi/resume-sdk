import { expect, it } from "vitest";
import postcss from "postcss";
import { renderFragment } from "./fragment.js";
import { getTemplate } from "../templates/index.js";
import type { ResumeTemplate } from "../index.js";
const resume = { schemaVersion: "1" as const, basics: { name: "Example" } };
const custom = (css: string): ResumeTemplate => ({
  id: "custom",
  render: () => ({
    html: "<article><h1>Example</h1></article>",
    css,
    assets: [],
    document: { marginMm: 0, css: "body { color: red }" },
  }),
});
it.each(["classic", "blog"])("exports body-only %s content without the standalone shell", (id) => {
  const output = renderFragment(resume, { paper: "letter" }, getTemplate(id));
  expect(output.html).toContain("data-resume-sdk=");
  expect(output.html).not.toMatch(/<!doctype|<(html|head|body|script|style|link)\b/i);
  expect(output.css).not.toMatch(/@page|(^|\n)body\s*\{|100vh|297mm/);
  expect(output).not.toHaveProperty("document");
  expect(output.assets).toEqual([]);
  const prefix = `[data-resume-sdk="${output.html.match(/data-resume-sdk="([^"]+)"/)![1]}"] `;
  postcss.parse(output.css).walkRules((rule) => {
    expect(rule.selectors.every((selector) => selector.startsWith(prefix))).toBe(true);
  });
  expect(renderFragment(resume, { paper: "letter" }, getTemplate(id))).toEqual(output);
});
it("scopes comma selectors and nested media/supports without altering declarations", () => {
  const result = renderFragment(
    resume,
    { paper: "letter" },
    custom("@media print { @supports (display:grid) { h1, :is(p, li) { color: red; } } }"),
  );
  const selectors: string[] = [];
  postcss.parse(result.css).walkRules((rule) => {
    selectors.push(...rule.selectors);
  });
  expect(selectors).toHaveLength(2);
  expect(selectors[1]).toContain(" :is(p, li)");
  expect(result.css).toContain("color: red");
  const other = renderFragment(resume, { paper: "letter" }, custom("h1 {color:blue}"));
  expect(result.html).not.toBe(other.html);
});
it.each([
  "@page {margin:0}",
  '@import "remote.css";',
  "@font-face {font-family:Example}",
  "@keyframes flash {to {opacity:0}}",
  "h1 { & a { color:red } }",
])("rejects CSS with unsupported global effects or nesting: %s", (css) => {
  expect(() => renderFragment(resume, { paper: "letter" }, custom(css))).toThrow(/not support/);
});
it("does not silently discard template assets", () => {
  const template: ResumeTemplate = {
    id: "assets",
    render: () => ({
      html: "<article/>",
      css: "",
      assets: [{ path: "image.png", mediaType: "image/png", content: new Uint8Array() }],
    }),
  };
  expect(() => renderFragment(resume, { paper: "letter" }, template)).toThrow(/asset packaging/);
});
