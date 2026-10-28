import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const directories = [
  "packages/core",
  "packages/providers",
  "packages/templates",
  "packages/renderer",
  "packages/pdf",
  "apps/cli",
];
const manifests = directories.map((directory) =>
  JSON.parse(readFileSync(join(root, directory, "package.json"), "utf8")),
);
const version = manifests[0].version;
assert.match(version, /^\d+\.\d+\.\d+-beta\.\d+$/);
const license = readFileSync(join(root, "LICENSE"), "utf8");
for (const [index, manifest] of manifests.entries()) {
  assert.equal(manifest.version, version, "All packages must share the candidate version");
  assert.equal(manifest.private, true, "Preparation keeps publishing disabled");
  assert.equal(manifest.publishConfig.tag, "beta");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.publishConfig.registry, "https://registry.npmjs.org/");
  assert.equal(manifest.license, "MIT");
  assert.equal(readFileSync(join(root, directories[index], "LICENSE"), "utf8"), license);
  for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
    if (manifests.some((pkg) => pkg.name === name)) assert.equal(range, "workspace:*");
  }
}
const temporary = mkdtempSync(join(tmpdir(), "resume-sdk-release-"));
try {
  const artifacts = [];
  for (const [index, manifest] of manifests.entries()) {
    execFileSync("pnpm", ["pack", "--pack-destination", temporary, "--silent"], {
      cwd: join(root, directories[index]),
      stdio: "inherit",
    });
    const file = `${manifest.name.replace(/^@/, "").replaceAll("/", "-")}-${version}.tgz`;
    const sha256 = createHash("sha256")
      .update(readFileSync(join(temporary, file)))
      .digest("hex");
    artifacts.push({ name: manifest.name, version, file, sha256 });
  }
  const destination = join(root, "dist/release", version);
  mkdirSync(destination, { recursive: true });
  for (const artifact of artifacts)
    copyFileSync(join(temporary, artifact.file), join(destination, artifact.file));
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const dirty =
    execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim().length >
    0;
  writeFileSync(
    join(destination, "manifest.json"),
    JSON.stringify({ version, commit, dirty, published: false, artifacts }, null, 2) + "\n",
  );
  writeFileSync(
    join(destination, "SHA256SUMS"),
    artifacts.map(({ sha256, file }) => `${sha256}  ${file}`).join("\n") + "\n",
  );
  console.log(
    `Prepared ${artifacts.length} private candidate tarballs in ${destination}. Nothing published.`,
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
