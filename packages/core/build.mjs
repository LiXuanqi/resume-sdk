import { rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { build } from "esbuild";
const require = createRequire(import.meta.url);
rmSync("dist", { recursive: true, force: true });
execFileSync(
  process.execPath,
  [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.json", "--emitDeclarationOnly"],
  { stdio: "inherit" },
);
await build({
  entryPoints: [
    "src/index.ts",
    "src/providers/index.ts",
    "src/templates/index.ts",
    "src/renderer/index.ts",
  ],
  outdir: "dist",
  outbase: "src",
  bundle: true,
  splitting: true,
  platform: "node",
  format: "esm",
  packages: "external",
  loader: { ".css": "text" },
  sourcemap: true,
});
