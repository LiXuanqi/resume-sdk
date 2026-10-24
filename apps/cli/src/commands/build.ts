import type { Command } from "commander";
export function addBuild(program: Command) {
  program
    .command("build")
    .argument("<input>")
    .description("Reserved for HTML/PDF generation (not implemented yet)")
    .action(() => {
      throw new Error(
        "HTML/PDF rendering is not implemented yet. This repository is the initial scaffold.",
      );
    });
}
