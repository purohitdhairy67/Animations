const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const path = require("path");

const filename = "scene-end.html";
const outputFilename = filename.replace(".html", ".mp4");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.join(__dirname, filename)}`, {
    waitUntil: "networkidle0",
  });
  // await page.setViewport({ width: 2000, height: 2000 });
  await page.setViewport({ width: 1920, height: 1080 });

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

  // Let animation run
  await new Promise((resolve) => setTimeout(resolve, 12000));

  await recorder.stop();
  await browser.close();
})();
