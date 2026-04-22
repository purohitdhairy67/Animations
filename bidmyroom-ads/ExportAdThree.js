const puppeteer = require("puppeteer");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ============================================================
// AD 3 - ROOM? BIDMYROOM EXPORT
// Simple approach: video plays, then solid background with text
// ============================================================

const CONFIG = {
  sourceVideo: "un-edited-videos/video-3.MOV",
  overlayHtml: "html/ad-three-overlay.html",
  outputVideo: "edited-videos/ad-three-room-bidmyroom.mp4",

  fps: 30,
  width: 1080,
  height: 1920,

  // Timing
  videoEnd: 14.8,       // Video ends, solid background starts
  logoStart: 16.3,      // Logo appears
  totalDuration: 19.0,

  tempDir: "edited-videos/_temp_ad3",
  framesDir: "edited-videos/_frames_ad3",

  crf: 18,
  preset: "slow",
};

async function exportAd() {
  const startTime = Date.now();
  const tempDir = path.join(__dirname, CONFIG.tempDir);
  const framesDir = path.join(__dirname, CONFIG.framesDir);

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      Ad 3 - Room? BidMyRoom - Export             ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const sourcePath = path.join(__dirname, CONFIG.sourceVideo);
  const scale = `scale=${CONFIG.width}:${CONFIG.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.width}:${CONFIG.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

  // ============================================================
  // STEP 1: Extract video portion (0 to videoEnd)
  // ============================================================
  console.log("📹 Step 1: Extracting video...");

  const videoClip = path.join(tempDir, "video_clip.mp4");
  // Force 30fps and consistent format for concatenation
  execSync(
    `ffmpeg -y -i "${sourcePath}" -t ${CONFIG.videoEnd} -vf "${scale}" ` +
    `-c:v libx264 -preset ultrafast -r ${CONFIG.fps} -pix_fmt yuv420p -an "${videoClip}"`,
    { stdio: "pipe" }
  );
  console.log("  Video extracted (0 - " + CONFIG.videoEnd + "s)");

  // ============================================================
  // STEP 2: Create cream gradient background for ending
  // ============================================================
  console.log("🎨 Step 2: Creating gradient background...");

  // Create solid cream color (close to gradient effect)
  const gradientDuration = CONFIG.totalDuration - CONFIG.videoEnd;
  const gradientVideo = path.join(tempDir, "gradient_video.mp4");
  execSync(
    `ffmpeg -y -f lavfi -i "color=c=#f0e6d3:s=${CONFIG.width}x${CONFIG.height}:d=${gradientDuration}:r=${CONFIG.fps}" ` +
    `-c:v libx264 -preset ultrafast -pix_fmt yuv420p "${gradientVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Gradient background created");

  // ============================================================
  // STEP 3: Concatenate video + gradient
  // ============================================================
  console.log("🔗 Step 3: Concatenating segments...");

  const concatFile = path.join(tempDir, "concat.txt");
  fs.writeFileSync(concatFile, `file '${videoClip}'\nfile '${gradientVideo}'`);

  const baseVideo = path.join(tempDir, "base_video.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset ultrafast "${baseVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Base video created");

  // ============================================================
  // STEP 4: Create overlay HTML
  // ============================================================
  console.log("🎨 Step 4: Creating text overlay...");

  const overlayPath = path.join(__dirname, CONFIG.overlayHtml);
  await createOverlayHtml(overlayPath);
  console.log("  Overlay HTML created");

  // ============================================================
  // STEP 5: Capture overlay frames
  // ============================================================
  console.log("📸 Step 5: Capturing overlay frames...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: CONFIG.width,
    height: CONFIG.height,
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${overlayPath}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 500));

  const totalFrames = Math.ceil(CONFIG.totalDuration * CONFIG.fps);
  const frameDuration = 1 / CONFIG.fps;

  for (let i = 0; i < totalFrames; i++) {
    const currentTime = i * frameDuration;
    await page.evaluate((t) => window.setTime(t), currentTime);
    await new Promise(r => setTimeout(r, 20));

    const frameNum = String(i).padStart(5, "0");
    const framePath = path.join(framesDir, `frame_${frameNum}.png`);
    await page.screenshot({ path: framePath, type: "png", omitBackground: true });

    const percent = Math.round((i / totalFrames) * 100);
    const filled = Math.floor(percent / 2);
    const bar = "█".repeat(filled) + "░".repeat(50 - filled);
    process.stdout.write(`\r  [${bar}] ${percent}%`);
  }

  console.log("\n  Frames captured");
  await browser.close();

  // ============================================================
  // STEP 6: Create overlay video
  // ============================================================
  console.log("🎞️  Step 6: Creating overlay video...");

  const overlayVideo = path.join(tempDir, "overlay.mov");
  execSync(
    `ffmpeg -y -framerate ${CONFIG.fps} -i "${framesDir}/frame_%05d.png" ` +
    `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le "${overlayVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Overlay video created");

  // ============================================================
  // STEP 7: Extract audio
  // ============================================================
  console.log("🎵 Step 7: Preparing audio...");

  const audioFile = path.join(tempDir, "audio.m4a");
  execSync(
    `ffmpeg -y -i "${sourcePath}" -t ${CONFIG.totalDuration} ` +
    `-af "apad=whole_dur=${CONFIG.totalDuration}" ` +
    `-c:a aac -b:a 192k "${audioFile}"`,
    { stdio: "pipe" }
  );
  console.log("  Audio prepared");

  // ============================================================
  // STEP 8: Composite final video
  // ============================================================
  console.log("🔀 Step 8: Compositing final video...");

  const outputPath = path.join(__dirname, CONFIG.outputVideo);

  execSync(
    `ffmpeg -y -i "${baseVideo}" -i "${overlayVideo}" -i "${audioFile}" ` +
    `-filter_complex "[0:v][1:v]overlay=0:0:shortest=1[outv]" ` +
    `-map "[outv]" -map 2:a ` +
    `-c:v libx264 -preset ${CONFIG.preset} -crf ${CONFIG.crf} ` +
    `-c:a aac -b:a 192k -t ${CONFIG.totalDuration} "${outputPath}"`,
    { stdio: "pipe" }
  );
  console.log("  Final video created");

  // ============================================================
  // STEP 9: Cleanup
  // ============================================================
  console.log("🧹 Step 9: Cleaning up...");
  fs.rmSync(tempDir, { recursive: true });
  fs.rmSync(framesDir, { recursive: true });

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

async function createOverlayHtml(outputPath) {
  // Text overlay with Room? and BidMyRoom logo
  // Background is handled by FFmpeg (gradient), this is just text
  const overlayHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap");

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: transparent;
    }

    .stage {
      position: relative;
      width: 1080px;
      height: 1920px;
      background: transparent;
    }

    /* Room? text - blue on cream background */
    .room-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .room-q {
      font-family: "Poppins", sans-serif;
      font-size: 160px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f81c0;
      display: inline-flex;
      align-items: baseline;
    }

    .room-q .rl {
      display: inline-block;
      opacity: 0;
      transform: translateY(-110%) scale(1.1);
    }

    .room-q .qmark {
      display: inline-block;
      opacity: 0;
      transform: scale(0.3) rotate(-20deg);
      margin-left: 0.05em;
    }

    /* Logo scene */
    .logo-scene {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .lockup {
      display: flex;
      align-items: center;
      gap: 30px;
    }

    .logo-icon {
      width: 150px;
      height: 150px;
      opacity: 0;
      transform: translateX(-200px) rotate(-25deg) scale(0.6);
    }

    .logo-icon img {
      width: 100%;
      height: 100%;
      border-radius: 22%;
    }

    .wordmark {
      font-family: "Poppins", sans-serif;
      font-size: 110px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f81c0;
      display: flex;
    }

    .wordmark .letter {
      display: inline-block;
      opacity: 0;
      transform: translateY(100%);
    }

    .tag-small {
      font-family: "Poppins", sans-serif;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: 0.1em;
      color: rgba(15, 129, 192, 0.65);
      opacity: 0;
      transform: translateY(16px);
      margin-top: -4px;
      padding-left: 180px;
    }
  </style>
</head>
<body>
  <div class="stage">
    <div class="room-text" id="roomText">
      <h1 class="room-q">
        <span class="rl" id="r1">R</span>
        <span class="rl" id="r2">o</span>
        <span class="rl" id="r3">o</span>
        <span class="rl" id="r4">m</span>
        <span class="qmark" id="qmark">?</span>
      </h1>
    </div>

    <div class="logo-scene" id="logoScene">
      <div class="logo-container">
        <div class="lockup">
          <div class="logo-icon" id="logoIcon">
            <img src="../assets/logo-icon.svg" alt="BidMyRoom">
          </div>
          <div class="wordmark" id="wordmark">
            <span class="letter">B</span>
            <span class="letter">i</span>
            <span class="letter">d</span>
            <span class="letter">M</span>
            <span class="letter">y</span>
            <span class="letter">R</span>
            <span class="letter">o</span>
            <span class="letter">o</span>
            <span class="letter">m</span>
          </div>
        </div>
        <p class="tag-small" id="tagSmall">Let hotels come to you</p>
      </div>
    </div>
  </div>

  <script>
    const r1 = document.getElementById('r1');
    const r2 = document.getElementById('r2');
    const r3 = document.getElementById('r3');
    const r4 = document.getElementById('r4');
    const qmark = document.getElementById('qmark');
    const roomText = document.getElementById('roomText');
    const logoIcon = document.getElementById('logoIcon');
    const wordmark = document.getElementById('wordmark');
    const tagSmall = document.getElementById('tagSmall');
    const logoScene = document.getElementById('logoScene');
    const letters = wordmark.querySelectorAll('.letter');

    const VIDEO_END = 14.8;
    const LOGO_START = 16.3;

    function easeBack(t) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    window.setTime = function(t) {
      // ========== PHASE: VIDEO (before 14.8s) ==========
      if (t < VIDEO_END) {
        roomText.style.opacity = 0;
        logoScene.style.opacity = 0;
        return;
      }

      // ========== PHASE: ROOM? (14.8s to 16.3s) ==========
      if (t >= VIDEO_END && t < LOGO_START) {
        roomText.style.opacity = 1;
        logoScene.style.opacity = 0;

        const rt = t - VIDEO_END;

        // Letter drops (R-o-o-m)
        const letterEls = [r1, r2, r3, r4];
        letterEls.forEach((el, i) => {
          const delay = 0.05 + i * 0.1;
          const duration = 0.6;
          if (rt >= delay) {
            const progress = Math.min(1, (rt - delay) / duration);
            const p = easeBack(progress);
            el.style.opacity = p;
            el.style.transform = 'translateY(' + (-110 * (1 - p)) + '%) scale(' + (1.1 - 0.1 * p) + ')';
          } else {
            el.style.opacity = 0;
            el.style.transform = 'translateY(-110%) scale(1.1)';
          }
        });

        // ? punch
        const qDelay = 0.4;
        const qDuration = 0.5;
        if (rt >= qDelay) {
          const progress = Math.min(1, (rt - qDelay) / qDuration);
          const p = easeBack(progress);
          qmark.style.opacity = p;
          qmark.style.transform = 'scale(' + (0.3 + 0.7 * p) + ') rotate(' + (-20 * (1 - p)) + 'deg)';
        } else {
          qmark.style.opacity = 0;
          qmark.style.transform = 'scale(0.3) rotate(-20deg)';
        }

        // Fade out near end (last 0.2s before logo)
        if (rt > 1.3) {
          const fadeProgress = Math.min(1, (rt - 1.3) / 0.2);
          roomText.style.opacity = 1 - fadeProgress;
        }

        return;
      }

      // ========== PHASE: LOGO (16.3s onwards) ==========
      if (t >= LOGO_START) {
        roomText.style.opacity = 0;
        logoScene.style.opacity = 1;

        const lt = t - LOGO_START;

        // Icon swoop
        if (lt < 0.75) {
          const p = easeOut(lt / 0.75);
          logoIcon.style.opacity = p;
          const rotate = lt < 0.5 ? -25 + 29 * (lt / 0.5) : 4 - 4 * ((lt - 0.5) / 0.25);
          const scale = lt < 0.5 ? 0.6 + 0.48 * (lt / 0.5) : 1.08 - 0.08 * ((lt - 0.5) / 0.25);
          logoIcon.style.transform = 'translateX(' + (-200 * (1 - p)) + 'px) rotate(' + rotate + 'deg) scale(' + scale + ')';
        } else {
          logoIcon.style.opacity = 1;
          logoIcon.style.transform = 'translateX(0) rotate(0) scale(1)';
        }

        // Letters
        letters.forEach((letter, i) => {
          const delay = 0.4 + i * 0.05;
          const duration = 0.35;
          if (lt >= delay) {
            const progress = Math.min(1, (lt - delay) / duration);
            const p = easeOut(progress);
            letter.style.opacity = p;
            letter.style.transform = 'translateY(' + (100 * (1 - p)) + '%)';
          } else {
            letter.style.opacity = 0;
            letter.style.transform = 'translateY(100%)';
          }
        });

        // Tagline
        const tagDelay = 1.0;
        const tagDuration = 0.5;
        if (lt >= tagDelay) {
          const progress = Math.min(1, (lt - tagDelay) / tagDuration);
          const p = easeOut(progress);
          tagSmall.style.opacity = p;
          tagSmall.style.transform = 'translateY(' + (16 * (1 - p)) + 'px)';
        } else {
          tagSmall.style.opacity = 0;
          tagSmall.style.transform = 'translateY(16px)';
        }
      }
    };

    // Initialize
    window.setTime(0);
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, overlayHtml);
}

// Run
exportAd().catch(err => {
  console.error("");
  console.error("❌ Export failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
