import type { Command } from "commander";
import { loadResume } from "../load.js";
import { checkOutput, writeOutput } from "../output.js";
export function addNormalize(program: Command) {
  program
    .command("normalize")
    .argument("<input>")
    .description("Export validated canonical resume JSON")
    .option("--out <file>", "Output JSON file (default: stdout)")
    .option("--force", "Replace an existing output")
    .action(async (input: string, options: { out?: string; force?: boolean }) => {
      const json = JSON.stringify((await loadResume(input)).resume, null, 2) + "\n";
      if (options.out) {
        await checkOutput(options.out, !!options.force, input);
        await writeOutput(options.out, json, !!options.force);
      } else process.stdout.write(json);
    });
}
