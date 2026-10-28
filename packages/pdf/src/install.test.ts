import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { beforeEach, expect, it, vi } from "vitest";
import { installBrowser } from "./install.js";

vi.mock("node:child_process", () => ({ spawn: vi.fn<typeof spawn>() }));
let child: EventEmitter;
beforeEach(() => {
  child = new EventEmitter();
  vi.mocked(spawn)
    .mockReset()
    .mockReturnValue(child as ReturnType<typeof spawn>);
});
it("runs the installed Playwright CLI with Chromium only", async () => {
  const result = installBrowser();
  const [executable, args, options] = vi.mocked(spawn).mock.calls[0];
  expect(executable).toBe(process.execPath);
  expect(args?.[0]).toMatch(/playwright[/\\]cli\.js$/);
  expect(args?.slice(1)).toEqual(["install", "chromium"]);
  expect(options).toEqual({ stdio: "inherit" });
  child.emit("close", 0, null);
  await result;
});
it("forwards system-dependency installation and rejects unsuccessful exits", async () => {
  const result = installBrowser({ withDeps: true });
  expect(vi.mocked(spawn).mock.calls[0][1]?.slice(1)).toEqual([
    "install",
    "--with-deps",
    "chromium",
  ]);
  child.emit("close", 7, null);
  await expect(result).rejects.toThrow("exit 7");
});
it("reports interrupted and failed starts", async () => {
  const interrupted = installBrowser();
  child.emit("close", null, "SIGTERM");
  await expect(interrupted).rejects.toThrow("SIGTERM");
  const failed = installBrowser();
  child.emit("error", new Error("spawn failed"));
  await expect(failed).rejects.toThrow("Could not start");
});
