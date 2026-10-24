import type { Command } from "commander";
import { resolve } from "node:path";
import { writeOutput } from "../output.js";

const starter = `# Resume SDK canonical schema v1. Replace this fictional content.
# Dates: YYYY, YYYY-MM, or YYYY-MM-DD. Use current: true for ongoing work.
# Descriptions support Markdown emphasis, bold, and links; raw HTML is escaped.
schemaVersion: "1"
basics:
  name: Alex Morgan
  label: Software Engineer
  email: alex@example.com
  location: San Francisco, CA
  summary: Building useful, reliable software.
work:
  - name: Example Company
    position: Software Engineer
    startDate: "2023-01"
    current: true
    highlights:
      - Built and maintained customer-facing applications.
education:
  - institution: Example University
    studyType: Bachelor of Science
    area: Computer Science
skills:
  - name: Languages
    keywords: [TypeScript, Python]
`;
export function addInit(program: Command) {
  program
    .command("init")
    .description("Create a documented starter resume.yaml in the current directory")
    .action(async () => {
      const file = resolve("resume.yaml");
      try {
        await writeOutput(file, starter, false);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST")
          throw new Error("resume.yaml already exists. Run init in an empty directory.");
        throw error;
      }
      console.error(`Created ${file}\nNext: resume-sdk preview resume.yaml`);
    });
}
