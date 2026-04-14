const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const path = require("path");

const filename = "mobile_ending3.html";
const outputFilename = filename.replace(".html", ".mp4");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.join(__dirname, filename)}`, {
    waitUntil: "networkidle0",
  });
  // Mobile portrait (9:16) for the BidMyRoom mobile ending
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

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
    videoCrf: 20, // Quality (lower = better)
    videoPreset: "ultrafast",
    videoCodec: "libx264",
  });
  await recorder.start(outputFilename);

  // Let animation run (35s lead-in + ~6.5s scenes + ~1.5s tail hold)
  await new Promise((resolve) => setTimeout(resolve, 43000));

  await recorder.stop();
  await browser.close();
})();
