#!/usr/bin/env node
import { Command } from "commander";
import { addValidate } from "./commands/validate.js";
import { addNormalize } from "./commands/normalize.js";
import { addBuild } from "./commands/build.js";
const program = new Command()
  .name("resume-sdk")
  .description("Portable resume data and document generation")
  .version("0.0.0");
addValidate(program);
addNormalize(program);
addBuild(program);
try {
  await program.parseAsync();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
