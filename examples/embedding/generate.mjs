import { readFile, mkdir, writeFile } from "node:fs/promises";
import { renderFragment } from "../../packages/core/dist/renderer/index.js";
const resume = JSON.parse(await readFile(new URL("../resume.json", import.meta.url), "utf8"));
const fragment = renderFragment(resume, { paper: "letter", density: "compact" });
const out = new URL("./dist/", import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL("resume.html", out), fragment.html);
await writeFile(new URL("resume.css", out), fragment.css);
await writeFile(
  new URL("index.html", out),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resume embed example</title><link rel="stylesheet" href="resume.css"><style>body{font:16px/1.5 system-ui;max-width:900px;margin:32px auto;padding:0 20px}header,footer{padding:20px;background:#edf2f7}main{padding:24px;border:1px solid #ccd5df;margin:24px 0}</style></head><body><header><h1>Professional profile</h1><p>This header belongs to the host site.</p></header><main>${fragment.html}</main><footer>This footer is also a host component.</footer></body></html>`,
);
console.log("Open examples/embedding/dist/index.html");
