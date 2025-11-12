const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const path = require("path");

const filename = "notification_card.html";
const outputFilename = filename.replace(".html", ".mp4");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.join(__dirname, filename)}`, {
    waitUntil: "networkidle0",
  });
  await page.setViewport({ width: 1080, height: 1920 });
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: true,
    fps: 30,
    videoCrf: 23, // Quality (lower = better)
    videoPreset: "ultrafast",
    videoCodec: "libx264",
  });
  await recorder.start(outputFilename);

  // Let animation run
  await new Promise(resolve => setTimeout(resolve, 13000));

  await recorder.stop();
  await browser.close();
})();
