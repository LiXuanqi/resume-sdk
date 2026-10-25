import { InvalidArgumentError, Option, type Command } from "commander";
import { templateIds } from "@resume-sdk/renderer";
import { renderOptionsSchema } from "@resume-sdk/core";

export interface PresentationOptions {
  template: string;
  paper: "a4" | "letter";
  sections?: string;
  density: "comfortable" | "compact";
}
export function presentationOptions(command: Command) {
  return command
    .addOption(new Option("--template <id>", "Template").choices(templateIds).default("classic"))
    .addOption(
      new Option("--paper <size>", "Paper size").choices(["letter", "a4"]).default("letter"),
    )
    .addOption(
      new Option("--density <mode>", "Layout density")
        .choices(["comfortable", "compact"])
        .default("comfortable"),
    )
    .option("--sections <list>", "Comma-separated section selection and order");
}
export function renderSettings(options: PresentationOptions) {
  const result = renderOptionsSchema.safeParse({
    paper: options.paper,
    density: options.density,
    ...(options.sections !== undefined ? { sections: options.sections.split(",") } : {}),
  });
  if (!result.success)
    throw new InvalidArgumentError(
      result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"),
    );
  return result.data;
}
