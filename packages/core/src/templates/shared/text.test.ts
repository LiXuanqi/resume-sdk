import { expect, it } from "vitest";
import { richText } from "./text.js";
it("renders emphasis and links while escaping source HTML", () => {
  const html = richText(
    "**Strong** and *emphasis* [safe](https://example.com) <script>alert(1)</script>",
  );
  expect(html).toContain("<strong>Strong</strong>");
  expect(html).toContain("<em>emphasis</em>");
  expect(html).toContain('href="https://example.com"');
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});
it("does not emit unsafe links or remote images", () => {
  for (const text of [
    "[bad](javascript:alert%281%29)",
    "[bad](data:text/html,bad)",
    "![tracking](https://example.com/a.png)",
  ]) {
    expect(richText(text)).not.toMatch(/<img|href="(?:javascript|data):/);
  }
});
