import type { Command } from "commander";
import { loadResume } from "../load.js";
export function addValidate(program: Command) {
  program
    .command("validate")
    .argument("<input>")
    .description("Validate a resume against the initial schema")
    .action(async (input: string) => {
      await loadResume(input);
      console.log("Resume is valid.");
    });
}
