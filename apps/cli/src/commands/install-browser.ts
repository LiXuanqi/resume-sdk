import type { Command } from "commander";

export function addInstallBrowser(program: Command) {
  program
    .command("install-browser")
    .description("Install Chromium for PDF export using the SDK's Playwright version")
    .option(
      "--with-deps",
      "Also install system libraries (may require elevated privileges on Linux)",
    )
    .action(async (options: { withDeps?: boolean }) => {
      const { installBrowser } = await import("../pdf/index.js");
      await installBrowser(options);
    });
}
