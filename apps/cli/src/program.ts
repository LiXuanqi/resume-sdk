import { Command } from "commander";
import { readFileSync } from "node:fs";
import { addValidate } from "./commands/validate.js";
import { addNormalize } from "./commands/normalize.js";
import { addBuild } from "./commands/build.js";
import { addInit } from "./commands/init.js";
import { addInstallBrowser } from "./commands/install-browser.js";
import { addPreview } from "./commands/preview.js";

export function createProgram() {
  const { version } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string };
  const program = new Command()
    .name("resume-sdk")
    .description("Portable resume data and document generation")
    .version(version)
    .option("--debug", "Include error stack traces")
    .exitOverride()
    .configureOutput({ outputError: () => {} })
    .addHelpText(
      "after",
      `
Examples:
  resume-sdk init
  resume-sdk preview resume.yaml
  resume-sdk build resume.yaml --format html,pdf
`,
    );
  addInstallBrowser(program);
  addInit(program);
  addValidate(program);
  addNormalize(program);
  addBuild(program);
  addPreview(program);
  return program;
}
