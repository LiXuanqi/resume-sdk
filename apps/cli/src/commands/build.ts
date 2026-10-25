import { InvalidArgumentError, type Command } from "commander";
import { resolve, join } from "node:path";
import { renderDocument, getTemplate } from "@resume-sdk/renderer";
import { presentationOptions, renderSettings, type PresentationOptions } from "../presentation.js";
import { loadResume } from "../load.js";
import { checkOutput, writeOutput } from "../output.js";
interface Options extends PresentationOptions {
  format: string;
  out: string;
  force?: boolean;
  json?: boolean;
}
export function addBuild(program: Command) {
  presentationOptions(
    program
      .command("build")
      .argument("<input>")
      .description("Generate standalone HTML (default) and/or PDF"),
  )
    .option("--format <formats>", "Comma-separated html,pdf", "html")
    .option("--json", "Write a machine-readable result report to stdout")
    .option("--out <directory>", "Output directory", "dist")
    .option("--force", "Replace existing outputs")
    .action(async (input: string, options: Options) => {
      const formats = options.format.split(",");
      if (
        formats.some((f) => !["html", "pdf"].includes(f)) ||
        new Set(formats).size !== formats.length
      )
        throw new InvalidArgumentError(
          "Expected --format html, pdf, or html,pdf without duplicates.",
        );
      const settings = renderSettings(options);
      const out = resolve(options.out);
      for (const format of formats)
        await checkOutput(join(out, `resume.${format}`), !!options.force, input);
      const { resume } = await loadResume(input);
      const html = renderDocument(resume, settings, getTemplate(options.template));
      // Generate all requested artifacts before writing any of them.
      const pdf = formats.includes("pdf")
        ? await (await import("@resume-sdk/pdf")).exportPdf(html)
        : undefined;
      const files: { format: string; path: string }[] = [];
      for (const format of formats) {
        const file = join(out, `resume.${format}`);
        await writeOutput(file, format === "html" ? html : pdf!, !!options.force);
        files.push({ format, path: file });
        console.error(`Created ${file}`);
      }
      if (options.json) console.log(JSON.stringify({ ok: true, files, diagnostics: [] }));
    });
}
