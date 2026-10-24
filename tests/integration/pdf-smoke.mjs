import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = mkdtempSync(join(tmpdir(), "resume-sdk-pdf-"));
const source = JSON.parse(readFileSync("examples/resume.json", "utf8"));
try {
  for (const paper of ["letter", "a4"]) {
    const resume = structuredClone(source);
    resume.work = Array.from({ length: 12 }, (_, i) => ({
      ...resume.work[0],
      position: `Role ${i + 1}`,
      highlights: [`Unique entry ${i + 1} preserved.`, ...resume.work[0].highlights],
    }));
    const input = join(directory, `${paper}.json`);
    writeFileSync(input, JSON.stringify(resume));
    const out = join(directory, paper);
    execFileSync(process.execPath, [
      "apps/cli/dist/index.js",
      "build",
      input,
      "--format",
      "html,pdf",
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
    const fonts = execFileSync("pdffonts", [file], { encoding: "utf8" });
    assert.match(fonts, /yes\s+yes/);
    const urls = execFileSync("pdfinfo", ["-url", file], { encoding: "utf8" });
    assert.ok(urls.includes("https://example.com"));
    console.log(`PASS ${paper}: multi-page text, page size, embedded fonts, and links`);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
