import { InvalidArgumentError, Option, type Command } from "commander";
import { resolve, join } from "node:path";
import { renderDocument, renderFragment, getTemplate } from "@resume-sdk/renderer";
import { presentationOptions, renderSettings, type PresentationOptions } from "../presentation.js";
import { loadResume } from "../load.js";
import { checkOutput, writeOutput } from "../output.js";
interface Options extends PresentationOptions {
  format: string;
  mode: "document" | "fragment";
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
    .addOption(
      new Option("--mode <mode>", "HTML output mode")
        .choices(["document", "fragment"])
        .default("document"),
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
      if (options.mode === "fragment" && (formats.length !== 1 || formats[0] !== "html"))
        throw new InvalidArgumentError(
          "Fragment mode supports only --format html. Export PDF separately with --mode document.",
        );
      const settings = renderSettings(options);
      const out = resolve(options.out);
      const outputFormats = options.mode === "fragment" ? ["html", "css"] : formats;
      for (const format of outputFormats)
        await checkOutput(join(out, `resume.${format}`), !!options.force, input);
      const { resume } = await loadResume(input);
      const template = getTemplate(options.template);
      const artifacts: { format: string; content: string | Uint8Array }[] = [];
      if (options.mode === "fragment") {
        const fragment = renderFragment(resume, settings, template);
        artifacts.push(
          { format: "html", content: fragment.html },
          { format: "css", content: fragment.css },
        );
      } else {
        const html = renderDocument(resume, settings, template);
        const pdf = formats.includes("pdf")
          ? await (await import("@resume-sdk/pdf")).exportPdf(html)
          : undefined;
        for (const format of formats)
          artifacts.push({ format, content: format === "html" ? html : pdf! });
      }
      // Generate all requested artifacts before writing any of them.
      const files: { format: string; path: string }[] = [];
      for (const artifact of artifacts) {
        const file = join(out, `resume.${artifact.format}`);
        await writeOutput(file, artifact.content, !!options.force);
        files.push({ format: artifact.format, path: file });
        console.error(`Created ${file}`);
      }
      if (options.json) console.log(JSON.stringify({ ok: true, files, diagnostics: [] }));
    });
}
