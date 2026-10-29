import { InvalidArgumentError, type Command } from "commander";
import { createServer } from "node:http";
import { watchFile, unwatchFile } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { renderDocument, getTemplate } from "@resume-sdk/core/renderer";
import { loadResume } from "../load.js";
import { presentationOptions, renderSettings, type PresentationOptions } from "../presentation.js";

interface Options extends PresentationOptions {
  port: number;
  open?: boolean;
}
function port(value: string) {
  if (!/^\d+$/.test(value) || Number(value) > 65535)
    throw new InvalidArgumentError(
      "Port must be an integer from 0 to 65535 (0 selects an available port).",
    );
  return Number(value);
}
function openBrowser(url: string) {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "rundll32" : "xdg-open";
  const args = process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url];
  const child = spawn(command, args, { stdio: "ignore" });
  child.on("error", () => console.error(`Could not open browser. Visit ${url}`));
  child.on("exit", (code) => {
    if (code) console.error(`Could not open browser. Visit ${url}`);
  });
  child.unref();
}

export function addPreview(program: Command) {
  presentationOptions(
    program
      .command("preview")
      .argument("<input>")
      .description("Watch local data and serve a live HTML preview on localhost"),
  )
    .option("--port <number>", "Local port (0 selects an available port)", port, 3000)
    .option("--open", "Open the preview in your default browser")
    .action(async (input: string, options: Options) => {
      const settings = renderSettings(options);
      const file = resolve(input);
      // Initial errors fail immediately; later edit errors preserve the last good HTML.
      let html = renderDocument(
        (await loadResume(file)).resume,
        settings,
        getTemplate(options.template),
      );
      let revision = 0;
      let error = "";
      let queue = Promise.resolve();
      let closed = false;
      const changed = () => {
        queue = queue.then(async () => {
          if (closed) return;
          try {
            const next = renderDocument(
              (await loadResume(file)).resume,
              settings,
              getTemplate(options.template),
            );
            if (next !== html) {
              html = next;
              revision++;
            }
            error = "";
          } catch (cause) {
            error = cause instanceof Error ? cause.message : String(cause);
            console.error(error);
          }
        });
      };
      const server = createServer((request, response) => {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        if (request.url === "/_resume/status") {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ revision, error }));
        } else if (request.url === "/") {
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          const client = `<script>
const revision = ${revision};
const notice = document.createElement('pre');
notice.setAttribute('role', 'alert');
notice.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;margin:0;padding:16px;background:#fee;color:#700;white-space:pre-wrap;max-height:35vh;overflow:auto';
notice.hidden = true;
document.body.append(notice);
async function check() {
  try {
    const state = await (await fetch('/_resume/status', {cache:'no-store'})).json();
    if (state.revision !== revision) { location.reload(); return; }
    notice.textContent = state.error;
    notice.hidden = !state.error;
  } catch { notice.textContent = 'Preview disconnected. Restart resume-sdk preview.'; notice.hidden = false; }
  setTimeout(check, 500);
}
check();
</script>`;
          response.end(html.replace("</body>", `${client}</body>`));
        } else {
          response.statusCode = 404;
          response.end("Not found");
        }
      });
      await new Promise<void>((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(options.port, "127.0.0.1", () => {
          server.off("error", reject);
          resolveListen();
        });
      });
      // Poll the explicit file so editor atomic replacements and delete/recreate work.
      watchFile(file, { interval: 300 }, changed);
      changed();
      const stop = () => {
        closed = true;
        unwatchFile(file, changed);
        server.close();
        server.closeAllConnections();
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
      };
      process.on("SIGINT", stop);
      process.on("SIGTERM", stop);
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Could not determine preview address.");
      const url = `http://127.0.0.1:${address.port}/`;
      console.error(
        `Preview: ${url}\nWatching ${file}. Press Ctrl+C to stop.\nPDF export is the reference for pagination.`,
      );
      if (options.open) openBrowser(url);
    });
}
