import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { renderFragment, getTemplate } from "../../packages/renderer/dist/index.js";
const { chromium } = createRequire(new URL("../../packages/pdf/package.json", import.meta.url))(
  "playwright",
);
const resume = JSON.parse(
  await readFile(new URL("../../examples/resume.json", import.meta.url), "utf8"),
);
const classic = renderFragment(resume, { paper: "letter", density: "compact" });
const blog = renderFragment(resume, { paper: "letter" }, getTemplate("blog"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><style>body{background:rgb(230,240,250);font:16px system-ui}h1{font-size:40px}main{max-width:760px}article{border:0}</style><header id="host"><h1>Host profile</h1><p>Host introduction</p><a href="#footer">Jump to footer</a><article class="resume-document">Unrelated host card</article></header><main><div id="classic">${classic.html}</div><div id="blog">${blog.html}</div></main><footer id="footer">Host footer</footer>`,
  );
  const styles = (selector) =>
    page.locator(selector).evaluateAll((elements) =>
      elements.map((el) => {
        const css = getComputedStyle(el);
        return {
          font: css.font,
          color: css.color,
          background: css.backgroundColor,
          margin: css.margin,
          padding: css.padding,
          minHeight: css.minHeight,
        };
      }),
    );
  const host = "body,#host,#host *,#footer";
  const before = await styles(host);
  await (
    await page.addStyleTag({ content: classic.css })
  ).evaluate((el) => {
    el.id = "classic-css";
  });
  const aloneClassic = await styles("#classic h1,#classic p,#classic a");
  await page.addStyleTag({ content: blog.css });
  assert.deepEqual(await styles(host), before, "Fragment CSS leaked onto the host");
  assert.deepEqual(
    await styles("#classic h1,#classic p,#classic a"),
    aloneClassic,
    "Blog CSS changed classic",
  );
  assert.equal(
    await page.locator("#blog .blog-sheet").evaluate((el) => getComputedStyle(el).minHeight),
    "0px",
  );
  assert.equal(
    await page.locator("#blog .blog-sheet").evaluate((el) => getComputedStyle(el).padding),
    "0px",
  );
  for (const media of ["screen", "print"]) {
    await page.emulateMedia({ media });
    const combinedBlog = await styles("#blog h1,#blog p,#blog a");
    // Remove classic's stylesheet to compare blog in isolation.
    const classicStyle = page.locator("#classic-css");
    await classicStyle.evaluate((el) => el.remove());
    assert.deepEqual(
      await styles("#blog h1,#blog p,#blog a"),
      combinedBlog,
      `Classic CSS changed blog (${media})`,
    );
    await (
      await page.addStyleTag({ content: classic.css })
    ).evaluate((el) => {
      el.id = "classic-css";
    });
  }
  await page.emulateMedia({ media: "screen" });
  await page.locator("#classic").evaluate((el) => {
    el.style.setProperty("--resume-sdk-color", "rgb(1, 2, 3)");
    el.style.setProperty("--resume-sdk-font-family", "monospace");
    el.style.setProperty("--resume-sdk-link-color", "rgb(4, 5, 6)");
  });
  assert.equal(
    await page.locator("#classic article").evaluate((el) => getComputedStyle(el).color),
    "rgb(1, 2, 3)",
  );
  assert.equal(
    await page.locator("#classic article").evaluate((el) => getComputedStyle(el).fontFamily),
    "monospace",
  );
  assert.equal(
    await page
      .locator("#classic a")
      .first()
      .evaluate((el) => getComputedStyle(el).color),
    "rgb(4, 5, 6)",
  );
  console.log(
    "PASS embedding: host isolation, two templates, natural height, screen/print, theme variables",
  );
} finally {
  await browser.close();
}
