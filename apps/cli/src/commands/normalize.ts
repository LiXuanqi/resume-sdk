import type { Command } from "commander";
import { loadResume } from "../load.js";
export function addNormalize(program: Command) {
  program
    .command("normalize")
    .argument("<input>")
    .description("Write normalized resume JSON to stdout")
    .action(async (input: string) => {
      console.log(JSON.stringify((await loadResume(input)).resume, null, 2));
    });
}
