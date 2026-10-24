import { InvalidArgumentError, Option, type Command } from "commander";
import { renderOptionsSchema } from "@resume-sdk/core";

export interface PresentationOptions {
  template: string;
  paper: "a4" | "letter";
  sections?: string;
}
export function presentationOptions(command: Command) {
  return command
    .addOption(new Option("--template <id>", "Template").choices(["classic"]).default("classic"))
    .addOption(
      new Option("--paper <size>", "Paper size").choices(["letter", "a4"]).default("letter"),
    )
    .option("--sections <list>", "Comma-separated section selection and order");
}
export function renderSettings(options: PresentationOptions) {
  const result = renderOptionsSchema.safeParse({
    paper: options.paper,
    ...(options.sections !== undefined ? { sections: options.sections.split(",") } : {}),
  });
  if (!result.success)
    throw new InvalidArgumentError(
      result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"),
    );
  return result.data;
}
