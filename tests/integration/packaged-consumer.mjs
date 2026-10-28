import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const consumer = mkdtempSync(join(tmpdir(), "resume-sdk-consumer-"));
const archives = join(consumer, "vendor");
const env = { ...process.env, HUSKY: "0", NODE_PATH: "" };
const run = (command, args, cwd = consumer, extraEnv = {}) =>
  execFileSync(command, args, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
try {
  mkdirSync(archives);
  const packages = [
    "packages/core",
    "packages/providers",
    "packages/templates",
    "packages/renderer",
    "packages/pdf",
    "apps/cli",
  ];
  const dependencies = {};
  for (const directory of packages) {
    const manifest = json(join(root, directory, "package.json"));
    run("pnpm", ["pack", "--pack-destination", archives, "--silent"], join(root, directory));
    const filename = `${manifest.name.replace(/^@/, "").replaceAll("/", "-")}-${manifest.version}.tgz`;
    dependencies[manifest.name] = `file:vendor/${filename}`;
  }
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify(
      {
        name: "resume-sdk-packaged-consumer",
        private: true,
        type: "module",
        dependencies,
        devDependencies: {
          typescript: json(join(root, "node_modules/typescript/package.json")).version,
        },
      },
      null,
      2,
    ),
  );
  // Overrides substitute unpublished registry versions only. All SDK code comes from tarballs.
  writeFileSync(
    join(consumer, "pnpm-workspace.yaml"),
    `overrides:\n${Object.entries(dependencies)
      .map(([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value)}`)
      .join("\n")}\n`,
  );
  run("pnpm", ["install", "--ignore-scripts", "--no-frozen-lockfile"]);
  run("pnpm", ["install", "--ignore-scripts", "--frozen-lockfile", "--offline"]);
  for (const name of Object.keys(dependencies)) {
    const manifest = json(join(consumer, "node_modules", name, "package.json"));
    for (const value of Object.values(manifest.dependencies ?? {}))
      assert(!value.startsWith("workspace:"));
  }
  const cli = (...args) => run("pnpm", ["exec", "resume-sdk", ...args]);
  cli("--version");
  cli("install-browser", "--help");
  cli("init");
  cli("validate", "resume.yaml");
  cli("normalize", "resume.yaml", "--out", "resume.json");
  const noBrowser = { PLAYWRIGHT_BROWSERS_PATH: join(consumer, "empty-browser-cache") };
  run(
    "pnpm",
    ["exec", "resume-sdk", "build", "resume.yaml", "--out", "document"],
    consumer,
    noBrowser,
  );
  run(
    "pnpm",
    ["exec", "resume-sdk", "build", "resume.yaml", "--mode", "fragment", "--out", "fragment"],
    consumer,
    noBrowser,
  );
  assert(
    readFileSync(join(consumer, "document/resume.html"), "utf8").startsWith("<!doctype html>"),
  );
  assert(readFileSync(join(consumer, "fragment/resume.css"), "utf8").includes("[data-resume-sdk="));
  const missing = spawnSync(
    "pnpm",
    ["exec", "resume-sdk", "build", "resume.yaml", "--format", "pdf", "--out", "missing-browser"],
    { cwd: consumer, env: { ...env, ...noBrowser }, encoding: "utf8" },
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /resume-sdk install-browser/);
  cli("install-browser");
  cli("build", "resume.yaml", "--format", "html,pdf", "--out", "complete");
  assert.equal(
    readFileSync(join(consumer, "complete/resume.pdf")).subarray(0, 5).toString(),
    "%PDF-",
  );
  writeFileSync(
    join(consumer, "consumer.mts"),
    `
import { validateResume, type Resume, type ResumeTemplate } from "@resume-sdk/core";
import { yamlProvider, jsonProvider } from "@resume-sdk/providers";
import { classicTemplate, blogTemplate } from "@resume-sdk/templates";
import { renderDocument, renderFragment } from "@resume-sdk/renderer";
import { exportPdf, installBrowser, type InstallBrowserOptions } from "@resume-sdk/pdf";
const resume: Resume = validateResume({ schemaVersion: "1", basics: { name: "Package Test" } });
const templates: ResumeTemplate[] = [classicTemplate, blogTemplate];
const options: InstallBrowserOptions = { withDeps: false };
void options; void installBrowser; void yamlProvider; void jsonProvider;
for (const template of templates) {
  const fragment = renderFragment(resume, { paper: "letter" }, template);
  const pdf: Promise<Uint8Array> = exportPdf(renderDocument(resume, { paper: "letter" }, template));
  void fragment; void pdf;
}
`,
  );
  run("pnpm", [
    "exec",
    "tsc",
    "consumer.mts",
    "--noEmit",
    "--strict",
    "--module",
    "NodeNext",
    "--target",
    "ES2023",
  ]);
  writeFileSync(
    join(consumer, "verify.mjs"),
    `
import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateResume } from "@resume-sdk/core";
import { jsonProvider, yamlProvider } from "@resume-sdk/providers";
import { classicTemplate, blogTemplate } from "@resume-sdk/templates";
import { renderDocument, renderFragment } from "@resume-sdk/renderer";
import { exportPdf } from "@resume-sdk/pdf";
for (const name of ["core", "providers", "templates", "renderer", "pdf"]) {
  assert(realpathSync(fileURLToPath(import.meta.resolve("@resume-sdk/" + name))).startsWith(process.cwd() + "/node_modules/"));
}
const resume = validateResume({ schemaVersion: "1", basics: { name: "Package Test" } });
assert.deepEqual((await jsonProvider.load(JSON.stringify(resume))).resume, resume);
assert.deepEqual((await yamlProvider.load('schemaVersion: "1"\\nbasics:\\n  name: Package Test\\n')).resume, resume);
for (const template of [classicTemplate, blogTemplate]) {
  const fragment = renderFragment(resume, { paper: "letter" }, template);
  assert(fragment.html.includes("Package Test"));
  assert(!fragment.html.includes("<html"));
  assert(fragment.css.includes("[data-resume-sdk="));
  const pdf = await exportPdf(renderDocument(resume, { paper: "letter" }, template));
  assert.equal(Buffer.from(pdf).subarray(0, 5).toString(), "%PDF-");
}
`,
  );
  run(process.execPath, ["verify.mjs"]);
  console.log(
    "Packaged consumer passed: CLI, declarations, providers, both templates, HTML, fragments, installer, and PDF. Nothing published.",
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
