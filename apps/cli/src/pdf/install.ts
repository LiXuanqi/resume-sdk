import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export interface InstallBrowserOptions {
  /** Also install operating-system libraries. May require elevated privileges on Linux. */
  withDeps?: boolean;
}

/** Install the Chromium revision required by this package's Playwright dependency. */
export async function installBrowser(options: InstallBrowserOptions = {}): Promise<void> {
  const require = createRequire(import.meta.url);
  const cli = join(dirname(require.resolve("playwright/package.json")), "cli.js");
  const args = [cli, "install", ...(options.withDeps ? ["--with-deps"] : []), "chromium"];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.once("error", (error) =>
      reject(new Error("Could not start the browser installer.", { cause: error })),
    );
    child.once("close", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `Browser installation failed (${signal ? `signal ${signal}` : `exit ${code}`}). See the installer output above.`,
          ),
        );
    });
  });
}
