import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
const cli = resolve("apps/cli/dist/index.js");
const temps: string[] = [];
const temp = () => {
  const path = mkdtempSync(join(tmpdir(), "resume-sdk-test-"));
  temps.push(path);
  return path;
};
const run = (...args: string[]) =>
  execFileSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
afterEach(() => {
  for (const path of temps.splice(0)) rmSync(path, { recursive: true, force: true });
});
it("normalizes YAML/JSON identically and writes JSON", () => {
  const yaml = run("normalize", "examples/resume.yaml");
  expect(yaml).toBe(run("normalize", "examples/resume.json"));
  const out = join(temp(), "nested", "resume.json");
  run("normalize", "examples/resume.yaml", "--out", out);
  expect(readFileSync(out, "utf8")).toBe(yaml);
});
it("builds offline HTML, selects sections, and protects outputs", () => {
  const out = temp();
  run("build", "examples/resume.yaml", "--out", out, "--sections", "skills,work");
  const html = readFileSync(join(out, "resume.html"), "utf8");
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("<strong>12 million events per day</strong>");
  expect(html.indexOf("<h2>Skills")).toBeLessThan(html.indexOf("<h2>Experience"));
  expect(html).not.toContain("<h2>Education");
  expect(html).not.toMatch(/<script|<link|<img/);
  expect(() => run("build", "examples/resume.yaml", "--out", out)).toThrow(/Command failed/);
  expect(readFileSync(join(out, "resume.html"), "utf8")).toBe(html);
  run("build", "examples/resume.yaml", "--out", out, "--force");
});
it("rejects invalid input and unsupported options", () => {
  const input = join(temp(), "invalid.json");
  writeFileSync(input, '{"schemaVersion":"1","basics":{}}');
  const invalid = spawnSync(process.execPath, [cli, "build", input], { encoding: "utf8" });
  expect(invalid.status).not.toBe(0);
  expect(invalid.stderr).toContain("basics.name");
  expect(() => run("build", "examples/resume.json", "--format", "docx")).toThrow(/Command failed/);
  expect(() => run("build", "examples/resume.json", "--paper", "legal")).toThrow(/Command failed/);
  expect(() =>
    run("normalize", "examples/resume.json", "--out", "examples/resume.json", "--force"),
  ).toThrow(/Command failed/);
});
