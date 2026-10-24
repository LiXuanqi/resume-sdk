import { lstat, stat as fileStat, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
export async function checkOutput(file: string, force: boolean, input: string) {
  if (resolve(file) === resolve(input))
    throw new Error("Output must not overwrite the input file.");
  const stat = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (stat?.isSymbolicLink() || (stat && !stat.isFile()))
    throw new Error(`Output is not a regular file: ${file}`);
  const source = await fileStat(input);
  if (stat && source.dev === stat.dev && source.ino === stat.ino)
    throw new Error("Output must not overwrite the input file.");
  if (stat && !force) throw new Error(`Output already exists: ${file}. Use --force to replace it.`);
}
export async function writeOutput(file: string, content: string | Uint8Array, force: boolean) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content, { flag: force ? "w" : "wx" });
}
