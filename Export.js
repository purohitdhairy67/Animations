const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const path = require("path");

const filename = "bidmyroom_search.html";
const outputFilename = filename.replace(".html", ".mp4");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.join(__dirname, filename)}`, {
    waitUntil: "networkidle0",
  });
  await page.setViewport({ width: 2000, height: 2000 });

  // // Wait for the Macbook skin image to load
  // await page.evaluate(() => {
  //   return new Promise((resolve) => {
  //     const img = document.querySelector(".macbook-img");
  //     if (img.complete) {
  //       resolve();
  //     } else {
  //       img.onload = resolve;
  //       img.onerror = () => resolve(); // Proceed even if error
  //     }
  //   });
  // });

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 60,
    videoCrf: 23, // Quality (lower = better)
    videoPreset: "ultrafast",
    videoCodec: "libx264",
  });
  await recorder.start(outputFilename);

  // Let animation run
  await new Promise((resolve) => setTimeout(resolve, 20000));

  await recorder.stop();
  await browser.close();
})();
