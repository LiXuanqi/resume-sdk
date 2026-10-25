import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, renameSync, existsSync } from "node:fs";
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

it("creates a valid starter without overwriting and defaults to HTML", () => {
  const cwd = temp();
  execFileSync(process.execPath, [cli, "init"], { cwd, stdio: "pipe" });
  const input = join(cwd, "resume.yaml");
  const starter = readFileSync(input, "utf8");
  expect(run("validate", input)).toContain("valid");
  expect(spawnSync(process.execPath, [cli, "init"], { cwd }).status).toBe(1);
  expect(readFileSync(input, "utf8")).toBe(starter);
  const result = JSON.parse(
    execFileSync(process.execPath, [cli, "build", "resume.yaml", "--json"], {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    }),
  );
  expect(result).toEqual({
    ok: true,
    files: [{ format: "html", path: join(cwd, "dist/resume.html") }],
    diagnostics: [],
  });
  expect(existsSync(join(cwd, "dist/resume.pdf"))).toBe(false);
});
it("reports build failures as JSON and distinguishes usage errors", () => {
  const input = join(temp(), "invalid.yaml");
  writeFileSync(input, 'schemaVersion: "1"\nbasics: {}');
  const result = spawnSync(process.execPath, [cli, "build", input, "--json"], { encoding: "utf8" });
  expect(result.status).toBe(1);
  expect(JSON.parse(result.stdout)).toMatchObject({
    ok: false,
    files: [],
    diagnostics: [{ code: "COMMAND_FAILED", message: expect.stringContaining("basics.name") }],
  });
  for (const args of [
    ["build", input, "--format", "docx"],
    ["build", input, "--sections", "unknown"],
    ["preview", input, "--port", "-1"],
    ["preview"],
  ]) {
    expect(spawnSync(process.execPath, [cli, ...args]).status).toBe(2);
  }
  expect(run()).toContain("Examples:");
  expect(run("--help")).toContain("preview");
  expect(run("--version").trim()).toBe(
    JSON.parse(readFileSync("apps/cli/package.json", "utf8")).version,
  );
});
it("previews edits, preserves good output on errors, recovers, and stops cleanly", async () => {
  const cwd = temp();
  const input = join(cwd, "resume.yaml");
  const source = (name: string) => `schemaVersion: "1"\nbasics:\n  name: ${name}\n`;
  writeFileSync(input, source("Before"));
  const child = spawn(process.execPath, [cli, "preview", input, "--port", "0"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  const exited = new Promise<number | null>((resolveExit) => child.once("exit", resolveExit));
  async function until<T>(read: () => Promise<T>, accept: (value: T) => boolean): Promise<T> {
    const deadline = Date.now() + 7000;
    while (true) {
      const value = await read();
      if (accept(value)) return value;
      if (Date.now() > deadline) throw new Error(`Preview timeout: ${stderr}`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  }
  try {
    const url = await until(async () => stderr.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0], Boolean);
    const page = () => fetch(url!).then((response) => response.text());
    const status = () =>
      fetch(`${url}_resume/status`).then((response) => response.json()) as Promise<{
        revision: number;
        error: string;
      }>;
    expect(await page()).toContain("Before");
    expect((await fetch(`${url}arbitrary`)).status).toBe(404);
    // Atomic replacement is how many editors save files.
    writeFileSync(join(cwd, "next.yaml"), source("After"));
    renameSync(join(cwd, "next.yaml"), input);
    await until(status, (value) => value.revision === 1);
    expect(await page()).toContain("After");
    writeFileSync(input, 'schemaVersion: "1"\nbasics: {}');
    await until(status, (value) => value.error.includes("basics.name"));
    expect(await page()).toContain("After");
    writeFileSync(input, source("After"));
    await until(status, (value) => value.error === "");
    rmSync(input);
    await until(status, (value) => value.error.includes("ENOENT"));
    writeFileSync(input, source("Recovered"));
    await until(status, (value) => value.revision === 2 && !value.error);
    expect(await page()).toContain("Recovered");
    expect(existsSync(join(cwd, "dist"))).toBe(false);
  } finally {
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
    try {
      expect(await exited).toBe(0);
    } finally {
      clearTimeout(timer);
    }
  }
}, 20000);

it("supports compact density and rejects invalid densities", () => {
  const out = temp();
  run("build", "examples/resume.yaml", "--density", "compact", "--out", out);
  const html = readFileSync(join(out, "resume.html"), "utf8");
  expect(html).toContain("resume-document--compact");
  expect(html).toContain("margin: 12mm");
  expect(html).toContain("Alex Morgan");
  for (const command of ["build", "preview"])
    expect(
      spawnSync(process.execPath, [cli, command, "examples/resume.yaml", "--density", "tiny"])
        .status,
    ).toBe(2);
});

it("selects the blog template with packaged CSS and safe TSX text", () => {
  const dir = temp();
  const input = join(dir, "resume.json");
  writeFileSync(
    input,
    JSON.stringify({
      schemaVersion: "1",
      basics: {
        name: '<img src=x onerror="alert(1)">',
        location: "Example City",
        phone: "123",
        email: "alex@example.com",
      },
      education: [{ institution: "Example University", startDate: "2020-09", endDate: "2022-06" }],
      work: [
        {
          name: "Example Co",
          position: "Engineer",
          highlights: ["**Safe bold** and <script>alert(1)</script>"],
        },
      ],
    }),
  );
  const out = join(dir, "blog");
  run("build", input, "--template", "blog", "--sections", "education,work", "--out", out);
  const html = readFileSync(join(out, "resume.html"), "utf8");
  expect(html).toContain("resume-blog");
  expect(html).toContain("margin: 0mm");
  expect(html).toContain("ui-sans-serif");
  expect(html).toContain("Example Co, Engineer");
  expect(html).toContain("09/2020 – 06/2022");
  expect(html).toContain("<strong>Safe bold</strong>");
  expect(html).not.toMatch(/<script|<img|<link/);
  expect(html.indexOf("<h2>Education")).toBeLessThan(html.indexOf("<h2>Work Experience"));
  expect(() => run("build", input, "--template", "unknown")).toThrow(/Command failed/);
  expect(() => run("build", input, "--template", "blog", "--density", "compact")).toThrow(
    /Command failed/,
  );
});

it("writes fragment HTML/CSS together, reports both, and protects existing CSS", () => {
  const out = temp();
  writeFileSync(join(out, "resume.css"), "keep this");
  expect(() => run("build", "examples/resume.yaml", "--mode", "fragment", "--out", out)).toThrow(
    /Command failed/,
  );
  expect(existsSync(join(out, "resume.html"))).toBe(false);
  const report = JSON.parse(
    run("build", "examples/resume.yaml", "--mode", "fragment", "--out", out, "--force", "--json"),
  );
  expect(report.files.map((file: { format: string }) => file.format)).toEqual(["html", "css"]);
  expect(readFileSync(join(out, "resume.html"), "utf8")).not.toContain("<!doctype");
  expect(readFileSync(join(out, "resume.css"), "utf8")).toContain("[data-resume-sdk=");
  expect(existsSync(join(out, "resume.pdf"))).toBe(false);
  for (const format of ["pdf", "html,pdf"]) {
    expect(
      spawnSync(process.execPath, [
        cli,
        "build",
        "examples/resume.yaml",
        "--mode",
        "fragment",
        "--format",
        format,
      ]).status,
    ).toBe(2);
  }
});
