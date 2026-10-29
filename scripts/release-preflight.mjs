import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const registry = "https://registry.npmjs.org/";
const npm = (...args) =>
  execFileSync("npm", [...args, `--registry=${registry}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
const username = npm("whoami");
const members = JSON.parse(npm("org", "ls", "resume-sdk", "--json"));
assert.equal(members[username], "owner", "First-release preflight expects an organization owner");
console.log(`Authenticated npm account ${username} owns @resume-sdk.`);
let conflicts = false;
for (const directory of ["packages/core", "apps/cli"]) {
  const manifest = JSON.parse(readFileSync(join(root, directory, "package.json"), "utf8"));
  const response = await fetch(registry + encodeURIComponent(manifest.name), {
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) {
    console.log(
      `${manifest.name}@${manifest.version}: no public package found; acceptance is not guaranteed and the name is not reserved.`,
    );
    continue;
  }
  if (!response.ok)
    throw new Error(`Registry lookup failed for ${manifest.name}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.versions?.[manifest.version]) {
    console.error(
      `${manifest.name}@${manifest.version}: already exists. Inspect the published archive before any retry.`,
    );
    conflicts = true;
  } else if (!data.maintainers?.some((owner) => owner.name === username)) {
    console.error(
      `${manifest.name}: exists but ${username} is not listed as a maintainer. Verify package-specific access before publication.`,
    );
    conflicts = true;
  } else {
    console.log(
      `${manifest.name}: ${username} is a listed maintainer; candidate version not found.`,
    );
  }
}
console.log(
  "Read-only preflight complete. No package names reserved, registry data changed, or credentials printed.",
);
if (conflicts) process.exitCode = 1;
