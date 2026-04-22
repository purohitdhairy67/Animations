const puppeteer = require("puppeteer");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ============================================================
// CONFIGURATION
// ============================================================
// Usage: node ExportFrames.js [ad-name]
// Example: node ExportFrames.js ad-one-whatever-group
//
// If no argument provided, uses the default below:
const AD_NAME = process.argv[2] || "ad-one-whatever-group";

const CONFIG = {
  // Input files
  overlayHtml: `html/${AD_NAME}-overlay.html`,
  sourceVideo: `un-edited-videos/${AD_NAME}.mp4`,

  // Output
  outputVideo: `edited-videos/${AD_NAME}.mp4`,

  // Video settings
  fps: 30,
  duration: 15.0,  // seconds - should match source video
  width: 1080,
  height: 1920,

  // Quality settings
  crf: 18,          // Lower = better quality, bigger file (18-23 recommended)
  preset: "slow",   // slower = better compression (ultrafast, fast, medium, slow, veryslow)

  // Temp files (auto-cleaned)
  framesDir: "edited-videos/_frames",
  overlayVideo: "edited-videos/_overlay.mov",
};

// ============================================================
// EXPORT SCRIPT - Usually no need to modify below
// ============================================================

async function exportAd() {
  const startTime = Date.now();
  const framesDir = path.join(__dirname, CONFIG.framesDir);

  // Header
  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║        BidMyRoom Ad Export - Frame Perfect       ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Ad:         ${AD_NAME}`);
  console.log(`  Resolution: ${CONFIG.width}x${CONFIG.height}`);
  console.log(`  FPS:        ${CONFIG.fps}`);
  console.log(`  Duration:   ${CONFIG.duration}s`);
  console.log(`  Quality:    CRF ${CONFIG.crf}, preset ${CONFIG.preset}`);
  console.log("");

  // Validate input files exist
  const overlayPath = path.join(__dirname, CONFIG.overlayHtml);
  const sourcePath = path.join(__dirname, CONFIG.sourceVideo);

  if (!fs.existsSync(overlayPath)) {
    console.error(`❌ Overlay HTML not found: ${CONFIG.overlayHtml}`);
    process.exit(1);
  }
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source video not found: ${CONFIG.sourceVideo}`);
    process.exit(1);
  }

  // Clean up and create frames directory
  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true });
  }
  fs.mkdirSync(framesDir, { recursive: true });

  // Launch Puppeteer
  console.log("📦 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--hide-scrollbars",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: CONFIG.width,
    height: CONFIG.height,
    deviceScaleFactor: 1,
  });

  // Load the overlay HTML
  await page.goto(`file://${overlayPath}`, {
    waitUntil: "networkidle0",
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));

  // Calculate total frames
  const totalFrames = Math.ceil(CONFIG.duration * CONFIG.fps);
  const frameDuration = 1 / CONFIG.fps;

  console.log(`📸 Capturing ${totalFrames} frames...`);
  console.log("");

  // Capture frames with progress bar
  for (let i = 0; i < totalFrames; i++) {
    const currentTime = i * frameDuration;

    // Update animation state
    await page.evaluate((t) => window.setTime(t), currentTime);

    // Small delay to let CSS animations update
    await new Promise((r) => setTimeout(r, 16));

    // Capture frame as PNG with transparency
    const frameNum = String(i).padStart(5, "0");
    const framePath = path.join(framesDir, `frame_${frameNum}.png`);

    await page.screenshot({
      path: framePath,
      type: "png",
      omitBackground: true,
    });

    // Progress bar
    const percent = Math.round((i / totalFrames) * 100);
    const filled = Math.floor(percent / 2);
    const empty = 50 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(`\r  [${bar}] ${percent}% (${elapsed}s)`);
  }

  console.log("\n");
  await browser.close();

  // Create overlay video from frames using FFmpeg (ProRes 4444 for alpha)
  console.log("🎞️  Creating overlay video from frames...");
  const tempOverlayPath = path.join(__dirname, CONFIG.overlayVideo);

  execSync(
    `ffmpeg -y -framerate ${CONFIG.fps} -i "${framesDir}/frame_%05d.png" ` +
    `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le "${tempOverlayPath}"`,
    { stdio: "pipe" }
  );

  // Composite overlay onto source video with audio
  // Apply blur to video starting at 13.7s for logo scene
  console.log("🔀 Compositing overlay onto video (with blur effect)...");
  const outputPath = path.join(__dirname, CONFIG.outputVideo);

  // Filter explanation:
  // 1. Split source video into two streams
  // 2. Apply blur+scale to one stream
  // 3. Blend between original and blurred based on time (fade from 13.7s to 14.2s)
  // 4. Overlay the transparent text/graphics on top
  const blurStart = 13.4;
  const blurFade = 0.5; // fade duration

  execSync(
    `ffmpeg -y -i "${sourcePath}" -i "${tempOverlayPath}" ` +
    `-filter_complex "` +
    `[0:v]split=2[orig][toblur];` +
    `[toblur]gblur=sigma=25,scale=1080:1920:flags=lanczos[blurred];` +
    `[orig][blurred]blend=all_expr='if(gte(T,${blurStart}),min((T-${blurStart})/${blurFade},1)*B+(1-min((T-${blurStart})/${blurFade},1))*A,A)'[blendv];` +
    `[blendv][1:v]overlay=0:0:shortest=1[outv]` +
    `" ` +
    `-map "[outv]" -map 0:a? ` +
    `-c:v libx264 -preset ${CONFIG.preset} -crf ${CONFIG.crf} ` +
    `-c:a aac -b:a 192k "${outputPath}"`,
    { stdio: "pipe" }
  );

  // Cleanup temp files
  console.log("🧹 Cleaning up...");
  fs.rmSync(framesDir, { recursive: true });
  fs.unlinkSync(tempOverlayPath);

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║                  Export Complete                 ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  ✅ Output: ${CONFIG.outputVideo}`);
  console.log(`  📊 Size:   ${sizeMB} MB`);
  console.log(`  ⏱️  Time:   ${totalTime}s`);
  console.log("");
}

// Run export
exportAd().catch((err) => {
  console.error("");
  console.error("❌ Export failed:", err.message);
  console.error("");
  process.exit(1);
});
