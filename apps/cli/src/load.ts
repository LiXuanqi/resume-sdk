import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { jsonProvider, yamlProvider } from "@resume-sdk/providers";

export async function loadResume(file: string) {
  const ext = extname(file).toLowerCase();
  const provider =
    ext === ".json" ? jsonProvider : [".yaml", ".yml"].includes(ext) ? yamlProvider : undefined;
  if (!provider) throw new Error("Expected a .json, .yaml, or .yml file");
  return provider.load(await readFile(file, "utf8"));
}
