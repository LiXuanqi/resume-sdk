import { Option, type Command } from "commander";
import { resolve, join } from "node:path";
import { renderDocument } from "@resume-sdk/renderer";
import { renderOptionsSchema } from "@resume-sdk/core";
import { loadResume } from "../load.js";
import { checkOutput, writeOutput } from "../output.js";
interface Options {
  template: string;
  format: string;
  paper: "a4" | "letter";
  out: string;
  force?: boolean;
  sections?: string;
}
export function addBuild(program: Command) {
  program
    .command("build")
    .argument("<input>")
    .description("Generate a standalone HTML resume and/or PDF")
    .addOption(new Option("--template <id>", "Template").choices(["classic"]).default("classic"))
    .option("--format <formats>", "Comma-separated html,pdf", "html")
    .addOption(
      new Option("--paper <size>", "Paper size").choices(["a4", "letter"]).default("letter"),
    )
    .option("--sections <sections>", "Comma-separated section selection/order")
    .option("--out <directory>", "Output directory", "dist")
    .option("--force", "Replace existing outputs")
    .action(async (input: string, options: Options) => {
      const formats = options.format.split(",");
      if (
        formats.some((f) => !["html", "pdf"].includes(f)) ||
        new Set(formats).size !== formats.length
      )
        throw new Error("Expected --format html, pdf, or html,pdf without duplicates.");
      const settings = renderOptionsSchema.parse({
        paper: options.paper,
        ...(options.sections ? { sections: options.sections.split(",") } : {}),
      });
      const out = resolve(options.out);
      for (const format of formats)
        await checkOutput(join(out, `resume.${format}`), !!options.force, input);
      const { resume } = await loadResume(input);
      const html = renderDocument(resume, settings);
      // Generate all requested artifacts before writing any of them.
      const pdf = formats.includes("pdf")
        ? await (await import("@resume-sdk/pdf")).exportPdf(html)
        : undefined;
      for (const format of formats) {
        const file = join(out, `resume.${format}`);
        await writeOutput(file, format === "html" ? html : pdf!, !!options.force);
        console.error(`Created ${file}`);
      }
    });
}
