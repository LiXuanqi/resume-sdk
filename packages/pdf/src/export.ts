import { chromium } from "playwright";
/** Export trusted template output; disable scripts and network in the document. */
export async function exportPdf(html: string): Promise<Uint8Array> {
  const browser = await chromium.launch().catch((error: unknown) => {
    throw new Error(
      `Could not start Chromium. Install it with: resume-sdk install-browser (or call installBrowser() from @resume-sdk/pdf). Browser error: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
    return await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  } finally {
    await browser.close();
  }
}
