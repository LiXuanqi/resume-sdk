import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("accepts a plain JavaScript template and keeps document CSS out of its fragment", () => {
  const result = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import { renderDocument } from './packages/core/dist/renderer/index.js';
    import { blogTemplate } from './packages/core/dist/templates/index.js';
    const resume = {schemaVersion:'1', basics:{name:'Example'}};
    const custom = {id:'custom', render:() => ({html:'<article>Custom</article>', css:'article {color:black}', assets:[]})};
    const html = renderDocument(resume, {paper:'letter'}, custom);
    const fragment = blogTemplate.render(resume, {paper:'letter'});
    console.log(JSON.stringify({html, css:fragment.css, shell:fragment.document.css}));
  `,
    ],
    { encoding: "utf8" },
  );
  const { html, css, shell } = JSON.parse(result);
  expect(html).toContain("<article>Custom</article>");
  expect(css).not.toMatch(/(^|\n)body\s*\{/);
  expect(shell).toContain("body");
});
