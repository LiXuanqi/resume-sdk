import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = mkdtempSync(join(tmpdir(), "resume-sdk-pdf-"));
const source = JSON.parse(readFileSync("examples/resume.json", "utf8"));
try {
  for (const paper of ["letter", "a4"]) {
    for (const density of ["comfortable", "compact"]) {
      const resume = structuredClone(source);
      resume.work = Array.from({ length: 12 }, (_, i) => ({
        ...resume.work[0],
        position: `Role ${i + 1}`,
        highlights: [`Unique entry ${i + 1} preserved.`, ...resume.work[0].highlights],
      }));
      // One entry longer than a page exercises splitting inside an entry.
      resume.work[3].highlights = Array.from(
        { length: 60 },
        (_, i) =>
          `Longbullet${i + 1} Built reliable customer applications with careful testing and accessible interfaces. Maintained documentation and reviewed changes across the team.`,
      );
      resume.work[3].highlights.unshift("Unique entry 4 preserved.");
      const input = join(directory, `${paper}.json`);
      writeFileSync(input, JSON.stringify(resume));
      const out = join(directory, `${paper}-${density}`);
      execFileSync(process.execPath, [
        "apps/cli/dist/index.js",
        "build",
        input,
        "--format",
        "html,pdf",
        "--density",
        density,
        "--paper",
        paper,
        "--out",
        out,
      ]);
      const file = join(out, "resume.pdf");
      const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
      const size = info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts/);
      assert.ok(size);
      const expected = paper === "letter" ? [612, 792] : [595.28, 841.89];
      assert.ok(Math.abs(Number(size[1]) - expected[0]) < 1);
      assert.ok(Math.abs(Number(size[2]) - expected[1]) < 1);
      assert.ok(Number(info.match(/Pages:\s+(\d+)/)?.[1]) > 1);
      const text = execFileSync("pdftotext", [file, "-"], { encoding: "utf8" });
      assert.ok(text.includes(source.basics.name));
      for (let i = 1; i <= 12; i++) assert.ok(text.includes(`Unique entry ${i} preserved.`));
      const pages = text.split("\f");
      for (let i = 1; i <= 60; i++) {
        const marker = `Longbullet${i} `;
        assert.ok(
          pages.some((page) => page.includes(marker)),
          `Missing ${marker}`,
        );
      }
      assert.ok(
        pages.filter((page) => page.includes("Longbullet")).length > 1,
        "Long entry must span pages",
      );
      // A heading must share a page with its first bullet, not hang at the bottom.
      for (let i = 1; i <= 12; i++) {
        const page = pages.find((page) => new RegExp(`Role ${i}\\s`).test(page));
        assert.ok(page?.includes(`Unique entry ${i} preserved.`), `Orphaned Role ${i}`);
      }
      const bounds = execFileSync("pdftotext", ["-bbox", file, "-"], { encoding: "utf8" });
      const margin = ((density === "compact" ? 12 : 16) * 72) / 25.4;
      // Font glyph bounding boxes can extend slightly beyond their CSS line boxes.
      for (const match of bounds.matchAll(
        /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)"/g,
      )) {
        assert.ok(
          Number(match[1]) >= margin - 1 && Number(match[3]) <= expected[0] - margin + 1,
          "Horizontal clipping",
        );
        assert.ok(
          Number(match[2]) >= margin - 2 && Number(match[4]) <= expected[1] - margin + 2,
          `Vertical bounds: ${match[2]}..${match[4]} expected ${margin}..${expected[1] - margin}`,
        );
      }
      const fonts = execFileSync("pdffonts", [file], { encoding: "utf8" });
      assert.match(fonts, /yes\s+yes/);
      const urls = execFileSync("pdfinfo", ["-url", file], { encoding: "utf8" });
      assert.ok(urls.includes("https://example.com"));
      console.log(
        `PASS ${paper}/${density}: long-entry splits, attached headings, bounds, text, fonts, and links`,
      );
    }
  }
  for (const paper of ["letter", "a4"]) {
    const input = join(directory, "blog.json");
    writeFileSync(input, JSON.stringify(source));
    const out = join(directory, `blog-${paper}`);
    execFileSync(process.execPath, [
      "apps/cli/dist/index.js",
      "build",
      input,
      "--template",
      "blog",
      "--paper",
      paper,
      "--format",
      "html,pdf",
      "--out",
      out,
    ]);
    const file = join(out, "resume.pdf");
    const text = execFileSync("pdftotext", [file, "-"], { encoding: "utf8" });
    assert.ok(text.includes(source.basics.name));
    assert.ok(text.includes("WORK EXPERIENCE"));
    const urls = execFileSync("pdfinfo", ["-url", file], { encoding: "utf8" });
    assert.ok(urls.includes("https://example.com"));
    console.log(`PASS blog/${paper}: text and links`);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
