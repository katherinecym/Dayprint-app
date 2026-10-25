#!/usr/bin/env node
/**
 * Automated High-Definition Screen Recording for Dayprint Hackathon Demo Video.
 * Uses Playwright to drive the browser through the choreographed 5 scenes,
 * then uses ffmpeg-static to combine the video with the studio voiceover.
 */

import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const RECORDINGS_DIR = path.resolve('recordings');
const OUTPUT_VIDEO = path.resolve('dayprint_demo_video.mp4');
const MASTER_AUDIO = path.resolve('audio/dayprint_voiceover_full.wav');

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Clean previous recordings
for (const f of fs.readdirSync(RECORDINGS_DIR)) {
  if (f.endsWith('.webm')) {
    fs.unlinkSync(path.join(RECORDINGS_DIR, f));
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + diff * ease);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
}

async function main() {
  console.log("==================================================");
  console.log(" Dayprint Automated Screen Recording Studio");
  console.log("==================================================");
  console.log(`FFmpeg Binary: ${ffmpeg}`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`[Dialog Accepted] ${dialog.message()}`);
    await dialog.accept();
  });

  // Pre-set English & Demo mode
  await page.addInitScript(() => {
    localStorage.setItem('dayprint_language', 'en');
    localStorage.setItem('dayprint_user_mode', 'demo');
  });

  console.log("Navigating to Dayprint (http://localhost:3000)...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(1000);
  const sessionStart = Date.now();

  console.log(">>> [00:00 - 00:32] SCENE 1: The Fragmentation of You (Target: 32.0s)");
  // Showcase daily stream and masonry layout
  console.log("  - Smoothly scrolling down masonry receipts...");
  await smoothScroll(page, 750, 7500);
  await sleep(2500);

  // Hover over an interesting receipt
  const cardA = page.locator('article, .group.relative.cursor-pointer').nth(2);
  if (await cardA.isVisible()) {
    await cardA.hover();
    await sleep(2500);
  }

  console.log("  - Smoothly scrolling further down...");
  await smoothScroll(page, 1450, 7500);
  await sleep(2500);

  console.log("  - Smoothly returning to top...");
  await smoothScroll(page, 0, 6000);
  await sleep(2000);

  const firstCard = page.locator('article, .group.relative.cursor-pointer').first();
  if (await firstCard.isVisible()) {
    await firstCard.hover();
    await sleep(2000);
  }

  console.log(">>> [00:32 - 00:58] SCENE 2: Sub-Second Capture & Tactile Ritual (Target: 26.2s)");
  console.log("  - Clicking bottom dock editor...");
  const dockSpan = page.locator('span:has-text("What\'s on your mind?")').first();
  if (await dockSpan.isVisible()) {
    await dockSpan.click();
    await sleep(1500);
  }

  console.log("  - Typing title and content...");
  const titleInput = page.locator('input[placeholder*="Title"]').first();
  if (await titleInput.isVisible()) {
    await titleInput.click();
    await titleInput.type('Living Sub-Myself & Unified Memory', { delay: 45 });
    await sleep(800);
  }

  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible()) {
    await textarea.click();
    await textarea.type('Unified cognitive sanctuary instead of fragmented apps across Slack, emails, and notes. Eternal cognitive twin.', { delay: 35 });
    await sleep(1500);
  }

  console.log("  - Selecting Morandi Pigment...");
  const typeColorBtn = page.locator('button:has-text("Type Color")').first();
  if (await typeColorBtn.isVisible()) {
    await typeColorBtn.click();
    await sleep(1000);
    const pigmentBtn = page.locator('button[title*="Sage"], button[title*="Almond"], button[title*="Kraft"]').first();
    if (await pigmentBtn.isVisible()) {
      await pigmentBtn.click();
      await sleep(1000);
    }
  }

  console.log("  - Pressing Meta+Enter to print thermal receipt...");
  await page.keyboard.press('Meta+Enter');
  await sleep(7000); // Wait for print animation, jagged tear, and receipt drop

  console.log(">>> [00:58 - 01:25] SCENE 3: Connect & Weave - The Living Constellation (Target: 26.6s)");
  // Hover over a slip to show resonance
  const cardB = page.locator('article, .group.relative.cursor-pointer').nth(1);
  if (await cardB.isVisible()) {
    await cardB.hover();
    await sleep(3500);
  }

  console.log("  - Navigating to Knowledge Graph...");
  const graphBtn = page.locator('button:has-text("Knowledge Graph")').first();
  if (await graphBtn.isVisible()) {
    await graphBtn.click();
    await sleep(4000);
  }

  console.log("  - Exploring knowledge graph nodes and connections...");
  await page.mouse.move(720, 480);
  await sleep(3000);
  await page.mouse.move(960, 520);
  await sleep(3500);
  await page.mouse.move(1120, 400);
  await sleep(3500);
  await page.mouse.move(860, 640);
  await sleep(4000);

  console.log("  - Switching back to Daily Journal...");
  const dailyBtn = page.locator('button:has-text("Daily Journal")').first();
  if (await dailyBtn.isVisible()) {
    await dailyBtn.click();
    await sleep(4500);
  }

  console.log(">>> [01:25 - 01:55] SCENE 4: Full CRUD, Evolution Logs & Distillation (Target: 30.1s)");
  console.log("  - Opening a memory card for detail & evolution view...");
  const memoryCard = page.locator('article, .group.relative.cursor-pointer').first();
  if (await memoryCard.isVisible()) {
    await memoryCard.click();
    await sleep(4500);

    const polishBtn = page.locator('button:has-text("AI Polish")').first();
    if (await polishBtn.isVisible()) {
      await polishBtn.hover();
      await sleep(3500);
    }

    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await sleep(2500);
    }
  }

  console.log("  - Opening Weekly Review / Digest modal...");
  const digestBtn = page.locator('button:has-text("Weekly Digest")').first();
  if (await digestBtn.isVisible()) {
    await digestBtn.click();
    await sleep(5000);

    // Scroll through weekly digest
    const digestModal = page.locator('.fixed.inset-0 .overflow-y-auto').first();
    if (await digestModal.isVisible()) {
      await digestModal.evaluate((el) => el.scrollBy({ top: 350, behavior: 'smooth' }));
      await sleep(4000);
      await digestModal.evaluate((el) => el.scrollBy({ top: -350, behavior: 'smooth' }));
      await sleep(3000);
    }

    const closeDigestBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeDigestBtn.isVisible()) {
      await closeDigestBtn.click();
      await sleep(2500);
    }
  }

  console.log(">>> [01:55 - 02:14] SCENE 5: Eternal Memory & Data Sovereignty (Target: 19.2s)");
  console.log("  - Opening GitHub Settings & Sovereignty modal...");
  const ghBtn = page.locator('button:has(svg.lucide-git-branch)').first();
  if (await ghBtn.isVisible()) {
    await ghBtn.click();
    await sleep(6000);

    const closeGhBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeGhBtn.isVisible()) {
      await closeGhBtn.click();
      await sleep(2500);
    }
  }

  console.log("  - Gentle hero overview at top...");
  await smoothScroll(page, 0, 1500);

  // Guarantee the video covers the full master voiceover (134.08s) + 1.5s padding
  const TARGET_RECORDING_MS = 136000;
  const elapsed = Date.now() - sessionStart;
  if (elapsed < TARGET_RECORDING_MS) {
    const remainingMs = TARGET_RECORDING_MS - elapsed;
    console.log(`  - Holding final hero screen for ${(remainingMs / 1000).toFixed(1)}s to complete voiceover...`);
    await sleep(remainingMs);
  }

  console.log("Finishing recording session...");
  await page.close();
  await context.close();
  await browser.close();

  // Find recorded WebM file
  const videoFiles = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error("No recorded video file found in recordings directory!");
  }
  const rawWebm = path.join(RECORDINGS_DIR, videoFiles[0]);
  console.log(`Raw screen capture saved: ${rawWebm}`);

  // Combine video with master audio track using ffmpeg-static
  console.log("==================================================");
  console.log(" Merging Video and Studio Voiceover Track...");
  console.log("==================================================");

  const ffmpegArgs = [
    '-y',
    '-i', rawWebm,
    '-i', MASTER_AUDIO,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    OUTPUT_VIDEO,
  ];

  console.log(`Executing: ${ffmpeg} ${ffmpegArgs.join(' ')}`);
  execFileSync(ffmpeg, ffmpegArgs, { stdio: 'inherit' });

  const finalStats = fs.statSync(OUTPUT_VIDEO);
  const sizeMb = (finalStats.size / (1024 * 1024)).toFixed(2);

  console.log("==================================================");
  console.log("🎉 SUCCESS! Video Production Complete!");
  console.log(` Output File: ${OUTPUT_VIDEO} (${sizeMb} MB)`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
