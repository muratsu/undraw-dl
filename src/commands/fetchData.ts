import type { Arguments, CommandBuilder } from "yargs";
import { chromium } from "playwright";

export const command: string = "fetch";
export const desc: string = "Fetches all illustrations from undraw.co";

export const handler = async (): Promise<void> => {
  const pageUrl = "https://undraw.co/illustrations";
  const illustrationsPath = `${__dirname}/../../illustrations`;

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Inject console for debugging
  page.on("console", async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue());
    }
  });

  // Navigate to page
  await page.goto(pageUrl, { waitUntil: "networkidle" });

  // Wait a second
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Scroll to bottom of page to load all illustrations (infinity scroll)
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve(null);
        }
      }, 100);
    });
  });

  const illustrations = page.locator(".infinite-scroll-component > div > *");

  for (const illustration of await illustrations.all()) {
    // click on illustration
    await illustration.click();

    // wait for modal to open
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // extract illustration name
    let illustrationName = await illustration
      .locator('div[class^="ClassicGrid__Content"]')
      .innerText();

    // Remove whitespace and convert to lowercase
    illustrationName = illustrationName.replace(/\s/g, "-").toLowerCase();

    // In the modal, click on the download as png button
    const button = page.locator(
      'button[class^="DownloadModal__DownloadBtn"]:last-child'
    );

    // Start waiting for download before clicking.
    const downloadPromise = page.waitForEvent("download");
    await button.click();

    const download = await downloadPromise;

    // Save downloaded file somewhere
    await download.saveAs(`${illustrationsPath}/${illustrationName}.png`);
  }

  process.exit(0);
};
