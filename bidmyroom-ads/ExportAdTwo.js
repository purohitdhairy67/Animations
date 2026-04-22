const puppeteer = require("puppeteer");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ============================================================
// AD 2 - LIFE JOURNEY EXPORT
// ============================================================

const CONFIG = {
  // Source files
  sourceVideo: "un-edited-videos/ad-two-life-journey-full-with-audio.mp4",
  sourceAudio: "un-edited-videos/video-2/audio.mp3",
  overlayHtml: "html/ad-two-life-journey-overlay.html",

  // Output
  outputVideo: "edited-videos/ad-two-life-journey.mp4",

  // Video settings
  fps: 30,
  width: 1920,
  height: 1080,

  // Timing
  clipsDuration: 6.96,      // Total duration of trimmed clips
  lifeMovesFastStart: 7.0,  // When "Life moves fast" starts
  lifeMovesFastEnd: 10.0,   // When captions resume
  audioResumeAt: 7.32,      // Audio timestamp for "and booking..."
  totalDuration: 19.0,      // Total ad duration

  // Trimmed clips (start, end in source video)
  clips: [
    { start: 0.00, end: 2.78 },
    { start: 7.70, end: 8.49 },
    { start: 11.58, end: 12.51 },
    { start: 15.31, end: 15.99 },
    { start: 20.35, end: 21.14 },
    { start: 27.26, end: 28.25 },
  ],

  // Temp files
  tempDir: "edited-videos/_temp_ad2",
  framesDir: "edited-videos/_frames_ad2",

  // Quality
  crf: 18,
  preset: "slow",
};

async function exportAd() {
  const startTime = Date.now();
  const tempDir = path.join(__dirname, CONFIG.tempDir);
  const framesDir = path.join(__dirname, CONFIG.framesDir);

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      Ad 2 - Life Journey - Export                ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  // Clean up and create temp directories
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const sourcePath = path.join(__dirname, CONFIG.sourceVideo);
  const audioPath = path.join(__dirname, CONFIG.sourceAudio);

  // ============================================================
  // STEP 1: Trim and concatenate video clips
  // ============================================================
  console.log("📹 Step 1: Trimming and concatenating clips...");

  // Trim each clip
  const clipFiles = [];
  for (let i = 0; i < CONFIG.clips.length; i++) {
    const clip = CONFIG.clips[i];
    const clipFile = path.join(tempDir, `clip_${i}.mp4`);
    clipFiles.push(clipFile);

    execSync(
      `ffmpeg -y -ss ${clip.start} -i "${sourcePath}" -t ${clip.end - clip.start} ` +
      `-c:v libx264 -preset ultrafast -an "${clipFile}"`,
      { stdio: "pipe" }
    );
    process.stdout.write(`  Clip ${i + 1}/6 trimmed\r`);
  }
  console.log("  All clips trimmed      ");

  // Create concat file
  const concatFile = path.join(tempDir, "concat.txt");
  fs.writeFileSync(concatFile, clipFiles.map(f => `file '${f}'`).join("\n"));

  // Concatenate clips
  const clipsVideo = path.join(tempDir, "clips_concat.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset ultrafast "${clipsVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Clips concatenated");

  // ============================================================
  // STEP 2: Create blue background video for text phases
  // ============================================================
  console.log("📘 Step 2: Creating blue background segment...");

  const blueDuration = CONFIG.totalDuration - CONFIG.clipsDuration;
  const blueVideo = path.join(tempDir, "blue_bg.mp4");

  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0f81c0:s=${CONFIG.width}x${CONFIG.height}:d=${blueDuration} ` +
    `-c:v libx264 -preset ultrafast "${blueVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Blue background created");

  // ============================================================
  // STEP 3: Combine clips video + blue background
  // ============================================================
  console.log("🔗 Step 3: Combining video segments...");

  // First scale clips to target resolution
  const clipsScaled = path.join(tempDir, "clips_scaled.mp4");
  execSync(
    `ffmpeg -y -i "${clipsVideo}" -vf "scale=${CONFIG.width}:${CONFIG.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.width}:${CONFIG.height}:(ow-iw)/2:(oh-ih)/2" ` +
    `-c:v libx264 -preset ultrafast "${clipsScaled}"`,
    { stdio: "pipe" }
  );

  // Concat clips + blue
  const concatFile2 = path.join(tempDir, "concat2.txt");
  fs.writeFileSync(concatFile2, `file '${clipsScaled}'\nfile '${blueVideo}'`);

  const baseVideo = path.join(tempDir, "base_video.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile2}" -c:v libx264 -preset ultrafast "${baseVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Base video created");

  // ============================================================
  // STEP 4: Create edited audio track
  // ============================================================
  console.log("🎵 Step 4: Creating audio track...");

  // Audio structure:
  // 0 - 7.5s: Original audio (0 - 7.5s) - includes "grandkids" finishing
  // 7.5 - 10s: Silence (Life moves fast)
  // 10s - end: Audio from 7.32s onwards

  const silenceDuration = CONFIG.lifeMovesFastEnd - CONFIG.lifeMovesFastStart - 0.5; // ~2.5s
  const finalAudio = path.join(tempDir, "final_audio.m4a");

  // Use filter_complex to build the audio in one command
  // Structure: first 7.5s + silence + from 7.32s to end
  execSync(
    `ffmpeg -y -i "${audioPath}" -f lavfi -i anullsrc=r=44100:cl=mono ` +
    `-filter_complex "` +
    `[0:a]atrim=0:7.5,asetpts=PTS-STARTPTS[a1];` +
    `[1:a]atrim=0:${silenceDuration},asetpts=PTS-STARTPTS[silence];` +
    `[0:a]atrim=${CONFIG.audioResumeAt},asetpts=PTS-STARTPTS[a2];` +
    `[a1][silence][a2]concat=n=3:v=0:a=1[out]" ` +
    `-map "[out]" -c:a aac -b:a 192k "${finalAudio}"`,
    { stdio: "pipe" }
  );
  console.log("  Audio track created");

  // ============================================================
  // STEP 5: Create overlay HTML (if not exists)
  // ============================================================
  console.log("🎨 Step 5: Preparing overlay...");

  const overlayPath = path.join(__dirname, CONFIG.overlayHtml);
  if (!fs.existsSync(overlayPath)) {
    console.log("  Creating overlay HTML...");
    await createOverlayHtml(overlayPath);
  }
  console.log("  Overlay ready");

  // ============================================================
  // STEP 6: Capture overlay frames
  // ============================================================
  console.log("📸 Step 6: Capturing overlay frames...");

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
    await new Promise(r => setTimeout(r, 16));

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
  // STEP 7: Create overlay video from frames
  // ============================================================
  console.log("🎞️  Step 7: Creating overlay video...");

  const overlayVideo = path.join(tempDir, "overlay.mov");
  execSync(
    `ffmpeg -y -framerate ${CONFIG.fps} -i "${framesDir}/frame_%05d.png" ` +
    `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le "${overlayVideo}"`,
    { stdio: "pipe" }
  );
  console.log("  Overlay video created");

  // ============================================================
  // STEP 8: Composite final video
  // ============================================================
  console.log("🔀 Step 8: Compositing final video...");

  const outputPath = path.join(__dirname, CONFIG.outputVideo);

  execSync(
    `ffmpeg -y -i "${baseVideo}" -i "${overlayVideo}" -i "${finalAudio}" ` +
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

async function createOverlayHtml(outputPath) {
  // This creates the overlay HTML with transparent background
  // Copy from preview but remove video, make bg transparent, add setTime function

  const overlayHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap");
    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");

    :root {
      --brand: #0f81c0;
      --white: #ffffff;
      --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: "Poppins", sans-serif;
      background: transparent;
    }

    .stage {
      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: transparent;
    }

    /* "Life moves fast." text */
    .life-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .life-text.active { opacity: 1; }

    .life-text h1 {
      font-family: "Inter", sans-serif;
      font-size: 82px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.95);
      text-align: center;
    }

    .life-text .word {
      display: inline-block;
      opacity: 0;
      transform: translateY(30px);
      filter: blur(8px);
    }

    .life-text.active .word {
      animation: word-fade-in 0.8s var(--ease-out) forwards;
    }

    .life-text.active .word:nth-child(1) { animation-delay: 0.0s; }
    .life-text.active .word:nth-child(2) { animation-delay: 0.15s; }
    .life-text.active .word:nth-child(3) { animation-delay: 0.3s; }

    @keyframes word-fade-in {
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    .life-text.fade-out .word {
      animation: word-fade-out 0.5s var(--ease-smooth) forwards;
    }

    @keyframes word-fade-out {
      to { opacity: 0; transform: translateY(-20px); filter: blur(4px); }
    }

    /* Clip captions */
    .clip-caption-layer {
      position: absolute;
      bottom: 80px;
      left: 0;
      right: 0;
      text-align: center;
      opacity: 0;
    }

    .clip-caption-layer.active { opacity: 1; }

    .clip-caption {
      font-family: "Inter", sans-serif;
      font-size: 68px;
      font-weight: 500;
      color: var(--white);
      opacity: 0;
      transform: translateY(10px);
    }

    .clip-caption.active {
      animation: caption-in 0.3s var(--ease-out) forwards;
    }

    .clip-caption.exit {
      animation: caption-out 0.25s var(--ease-smooth) forwards;
    }

    @keyframes caption-in {
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes caption-out {
      to { opacity: 0; transform: translateY(-8px); }
    }

    .clip-caption .highlight-word {
      position: relative;
      color: var(--white);
      text-shadow: 0 2px 15px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9);
      padding: 1px 1px;
      margin: 0 1px;
      display: inline-block;
    }

    .clip-caption .highlight-word::before {
      content: '';
      position: absolute;
      inset: -1px -1px;
      background: #3ba3e0;
      border-radius: 6px;
      transform: scale(0);
      z-index: -1;
      transition: transform 0.2s ease-out;
    }

    .clip-caption .highlight-word.highlighted {
      text-shadow: none;
    }

    .clip-caption .highlight-word.highlighted::before {
      animation: box-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes box-pop-in {
      0% { transform: scale(0); }
      70% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }

    /* Phase 3 captions */
    .caption-layer {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .caption-layer.active { opacity: 1; }

    .caption {
      font-family: "Inter", sans-serif;
      font-size: 82px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.95);
      opacity: 0;
      transform: translateY(20px);
      filter: blur(6px);
    }

    .caption.active {
      animation: caption-in-blur 0.5s var(--ease-out) forwards;
    }

    .caption.exit {
      animation: caption-out-blur 0.4s var(--ease-smooth) forwards;
    }

    @keyframes caption-in-blur {
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    @keyframes caption-out-blur {
      to { opacity: 0; transform: translateY(-15px); filter: blur(4px); }
    }

    /* Logo scene */
    .logo-scene {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .logo-scene.active { opacity: 1; }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .logo-lockup {
      display: flex;
      align-items: center;
      gap: 34px;
    }

    .logo-icon {
      width: 153px;
      height: 153px;
      opacity: 0;
      transform: translateX(-50px) rotate(-20deg) scale(0.6);
    }

    .logo-icon img {
      width: 100%;
      height: 100%;
      border-radius: 34px;
      transform: scale(1.2);
    }

    .logo-scene.active .logo-icon {
      animation: icon-swoop 0.7s var(--ease-out) forwards;
    }

    @keyframes icon-swoop {
      60% { opacity: 1; transform: translateX(0) rotate(4deg) scale(1.05); }
      100% { opacity: 1; transform: translateX(0) rotate(0) scale(1); }
    }

    .wordmark {
      font-family: "Poppins", sans-serif;
      font-size: 122px;
      font-weight: 600;
      color: var(--white);
      letter-spacing: -0.02em;
      display: flex;
      overflow: hidden;
    }

    .wordmark .letter {
      display: inline-block;
      opacity: 0;
      transform: translateY(100%);
    }

    .logo-scene.active .wordmark .letter {
      animation: letter-up 0.35s var(--ease-out) forwards;
    }

    .logo-scene.active .wordmark .letter:nth-child(1) { animation-delay: 0.35s; }
    .logo-scene.active .wordmark .letter:nth-child(2) { animation-delay: 0.38s; }
    .logo-scene.active .wordmark .letter:nth-child(3) { animation-delay: 0.41s; }
    .logo-scene.active .wordmark .letter:nth-child(4) { animation-delay: 0.44s; }
    .logo-scene.active .wordmark .letter:nth-child(5) { animation-delay: 0.47s; }
    .logo-scene.active .wordmark .letter:nth-child(6) { animation-delay: 0.50s; }
    .logo-scene.active .wordmark .letter:nth-child(7) { animation-delay: 0.53s; }
    .logo-scene.active .wordmark .letter:nth-child(8) { animation-delay: 0.56s; }
    .logo-scene.active .wordmark .letter:nth-child(9) { animation-delay: 0.59s; }

    @keyframes letter-up {
      to { opacity: 1; transform: translateY(0); }
    }

    .tagline {
      font-family: "Poppins", sans-serif;
      margin-top: -6px;
      padding-left: 189px;
      font-size: 41px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      opacity: 0;
      transform: translateY(10px);
    }

    .logo-scene.active .tagline {
      animation: tag-in 0.5s var(--ease-out) 0.9s forwards;
    }

    @keyframes tag-in {
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="stage">
    <div class="clip-caption-layer" id="clipCaptionLayer">
      <p class="clip-caption" id="clipCaption"></p>
    </div>

    <div class="life-text" id="lifeText">
      <h1>
        <span class="word">Life</span>
        <span class="word">moves</span>
        <span class="word">fast.</span>
      </h1>
    </div>

    <div class="caption-layer" id="captionLayer">
      <p class="caption" id="caption"></p>
    </div>

    <div class="logo-scene" id="logoScene">
      <div class="logo-container">
        <div class="logo-lockup">
          <div class="logo-icon">
            <img src="../assets/logo-icon-white.svg" alt="BidMyRoom">
          </div>
          <div class="wordmark">
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
        <p class="tagline">Let hotels come to you</p>
      </div>
    </div>
  </div>

  <script>
    const clipCaptionLayer = document.getElementById('clipCaptionLayer');
    const clipCaption = document.getElementById('clipCaption');
    const lifeText = document.getElementById('lifeText');
    const captionLayer = document.getElementById('captionLayer');
    const caption = document.getElementById('caption');
    const logoScene = document.getElementById('logoScene');

    // Clip duration total: ~6.96s
    const CLIPS_END = 6.96;
    const AUDIO_PAUSE = 7.5;
    const LIFE_TEXT_END = 10.0;
    const AUDIO_RESUME = 7.32;
    const AUDIO_END = 14.46;

    const clipCaptions = [
      {
        start: 0.0, end: 2.3,
        words: [
          { text: "Life", highlightAt: 0.0 },
          { text: "is", highlightAt: 0.36 },
          { text: "made", highlightAt: 0.72 },
          { text: "of", highlightAt: 0.94 },
          { text: "moments", highlightAt: 1.12 },
          { text: "that", highlightAt: 1.40 },
          { text: "matter", highlightAt: 1.68 }
        ],
        separator: " "
      },
      { start: 2.5, end: 3.5, text: "childhood", highlight: true },
      { start: 3.6, end: 4.4, text: "growing up", highlight: true },
      { start: 4.5, end: 5.4, text: "college", highlight: true },
      { start: 5.5, end: 6.0, text: "marriage", highlight: true },
      { start: 6.35, end: 7.2, text: "grandkids", highlight: true },
    ];

    const captions = [
      { audioStart: 7.32, audioEnd: 8.66, text: "and booking a hotel" },
      { audioStart: 8.66, audioEnd: 10.18, text: "shouldn't take you away from them." },
      { audioStart: 10.86, audioEnd: 12.30, text: "Post your stay on BidMyRoom" },
      { audioStart: 12.98, audioEnd: 14.46, text: "and let hotels bid for you." },
    ];

    let triggered = {};

    window.setTime = function(t) {
      // Phase 1: Clip captions (0 to ~7s)
      if (t < CLIPS_END) {
        if (!triggered.clipCaptions) {
          triggered.clipCaptions = true;
          clipCaptionLayer.classList.add('active');
        }
        updateClipCaptions(t);
      }
      // Phase 2: Life moves fast (7 to 10s)
      else if (t < LIFE_TEXT_END) {
        if (!triggered.clipCaptionsHide) {
          triggered.clipCaptionsHide = true;
          clipCaptionLayer.classList.remove('active');
        }

        if (t >= AUDIO_PAUSE && !triggered.lifeText) {
          triggered.lifeText = true;
          lifeText.classList.add('active');
        }

        if (t > LIFE_TEXT_END - 0.5 && !triggered.lifeTextOut) {
          triggered.lifeTextOut = true;
          lifeText.classList.add('fade-out');
        }
      }
      // Phase 3: Captions (10s to ~17s)
      else if (t < LIFE_TEXT_END + (AUDIO_END - AUDIO_RESUME)) {
        if (!triggered.lifeTextHide) {
          triggered.lifeTextHide = true;
          lifeText.style.display = 'none';
        }

        if (!triggered.captionLayer) {
          triggered.captionLayer = true;
          captionLayer.classList.add('active');
        }

        const audioTime = AUDIO_RESUME + (t - LIFE_TEXT_END);
        updateCaptions(audioTime);

        // Logo starts near end
        if (audioTime >= 13.5 && !triggered.logo) {
          triggered.logo = true;
          captionLayer.classList.remove('active');
          logoScene.classList.add('active');
        }
      }
      // Phase 4: Logo (17s+)
      else {
        if (!triggered.logo) {
          triggered.logo = true;
          captionLayer.classList.remove('active');
          logoScene.classList.add('active');
        }
      }
    };

    function updateClipCaptions(adTime) {
      let found = false;
      let currentCapId = clipCaption.dataset.capId;

      for (let i = 0; i < clipCaptions.length; i++) {
        const cap = clipCaptions[i];
        if (adTime >= cap.start && adTime < cap.end) {
          found = true;

          if (currentCapId !== String(i)) {
            clipCaption.classList.remove('active', 'exit');
            void clipCaption.offsetWidth;
            clipCaption.dataset.capId = String(i);

            if (cap.words) {
              const sep = cap.separator !== undefined ? cap.separator : ', ';
              const html = cap.words.map((w, idx) => {
                const separator = idx < cap.words.length - 1 ? sep : '';
                return \`<span class="highlight-word" data-highlight="\${w.highlightAt}">\${w.text}</span>\${separator}\`;
              }).join('');
              clipCaption.innerHTML = html;
            } else if (cap.highlight) {
              clipCaption.innerHTML = \`<span class="highlight-word highlighted">\${cap.text}</span>\`;
            } else {
              clipCaption.innerHTML = cap.text;
            }

            clipCaption.classList.add('active');
          }

          // Update highlights - only one at a time
          const highlightWords = clipCaption.querySelectorAll('.highlight-word[data-highlight]');
          let activeWord = null;
          highlightWords.forEach(word => {
            const highlightAt = parseFloat(word.dataset.highlight);
            if (adTime >= highlightAt) activeWord = word;
          });
          highlightWords.forEach(word => {
            if (word === activeWord) word.classList.add('highlighted');
            else word.classList.remove('highlighted');
          });

          break;
        }
      }

      if (!found && clipCaption.innerHTML && !clipCaption.classList.contains('exit')) {
        clipCaption.classList.add('exit');
        clipCaption.dataset.capId = '';
      }
    }

    function updateCaptions(audioTime) {
      let found = false;
      for (const cap of captions) {
        if (audioTime >= cap.audioStart && audioTime < cap.audioEnd) {
          if (caption.textContent !== cap.text) {
            caption.classList.remove('active', 'exit');
            void caption.offsetWidth;
            caption.textContent = cap.text;
            caption.classList.add('active');
          }
          found = true;
          break;
        }
      }
      if (!found && caption.textContent && !caption.classList.contains('exit')) {
        caption.classList.add('exit');
      }
    }
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
