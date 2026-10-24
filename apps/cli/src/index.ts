#!/usr/bin/env node
import { CommanderError } from "commander";
import { createProgram } from "./program.js";
const program = createProgram();
try {
  if (process.argv.length === 2) program.outputHelp();
  else await program.parseAsync();
} catch (error) {
  if (!(error instanceof CommanderError && error.exitCode === 0)) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof CommanderError ? "CLI_USAGE" : "COMMAND_FAILED";
    const build = program.commands.find((command) => command.name() === "build");
    if (build?.opts().json)
      console.log(
        JSON.stringify({
          ok: false,
          files: [],
          diagnostics: [{ severity: "error", code, message }],
        }),
      );
    console.error(program.opts().debug && error instanceof Error ? error.stack : message);
    process.exitCode = error instanceof CommanderError ? 2 : 1;
  }
}
