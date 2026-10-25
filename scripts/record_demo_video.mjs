#!/usr/bin/env node
/**
 * Automated High-Definition Screen Recording for Dayprint Hackathon Demo Video.
 * Uses Playwright to drive the browser through all 7 choreographed scenes,
 * capturing every module requested (Settings sovereignty, Today's Canvas,
 * AI Polish, Weave Echo, Custom Types, Morandi colors, Today's Stream, Daily Summary,
 * Heatmap, Life Stubs thermal receipt anatomy, Force Graph, Cards Mode, Link Management,
 * and Weekly Digest), then merges with the master studio voiceover.
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
const MASTER_AUDIO = path.resolve('audio/dayprint_voiceover_paced.wav');

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
  console.log(" Dayprint Automated Master Screen Recording Studio");
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

  // Pre-set English & Demo mode with fresh dynamic seed memories
  await page.addInitScript(() => {
    localStorage.setItem('dayprint_language', 'en');
    localStorage.setItem('dayprint_user_mode', 'demo');
    localStorage.setItem('dayprint_app_mode', 'demo');
    localStorage.setItem('dayprint_onboarding_completed', 'true');
    localStorage.removeItem('dayprint_memories');
    localStorage.removeItem('dayprint_relationships');
    localStorage.removeItem('dayprint_collections');
  });

  console.log("Navigating to Dayprint (http://localhost:3000)...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(1500);
  const sessionStart = Date.now();

  // ----------------------------------------------------
  // SCENE 1: Data Sovereignty & Step 1 Setup
  // ----------------------------------------------------
  console.log(">>> [SCENE 1] Data Sovereignty & Step 1 - Connecting Private GitHub Repo");
  console.log("  - Opening GitHub Settings & Sovereignty modal to explain Step 1...");
  const ghInitBtn = page.locator('button:has(svg.lucide-git-branch), [data-testid="github-settings-btn"]').first();
  if (await ghInitBtn.isVisible()) {
    await ghInitBtn.click();
    await sleep(2000);

    // Hover over Step 1 (PAT Token input)
    console.log("  - Highlighting Step 1: GitHub PAT generation...");
    const patInputEl = page.locator('input[placeholder*="ghp_"]').first();
    if (await patInputEl.isVisible()) {
      await patInputEl.hover();
      await sleep(1500);
    }

    // Hover over Step 2 (Private repo)
    console.log("  - Highlighting Step 2: Private repository auto-creation...");
    const repoInputEl = page.locator('input[placeholder*="my-dayprint-vault"]').first();
    if (await repoInputEl.isVisible()) {
      await repoInputEl.hover();
      await sleep(1500);
    }

    // Demonstrate 1-click Demo Mode Simulation
    console.log("  - Triggering simulated demo GitHub sync...");
    const demoSyncBtn = page.locator('[data-testid="demo-sync-btn"]').first();
    if (await demoSyncBtn.isVisible()) {
      await demoSyncBtn.click();
      await sleep(3500); // Allow 3-step progress, commit SHA 886c5e9, and confetti
    }

    const closeGhBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeGhBtn.isVisible()) {
      await closeGhBtn.click();
      await sleep(1500);
    }
  }

  // ----------------------------------------------------
  // SCENE 2: Today's Canvas & Creation Ritual
  // ----------------------------------------------------
  console.log(">>> [SCENE 2] Today's Canvas, AI Polish, Weave Echo, Custom Types & Morandi Pigments");
  console.log("  - Clicking Today's Editor to expand writing desk...");
  const deskTrigger = page.locator('span:has-text("What\'s on your mind?"), input[placeholder*="Title"]').first();
  if (await deskTrigger.isVisible()) {
    await deskTrigger.click();
    await sleep(1000);
  }

  console.log("  - Typing Title: Async Actor Isolation Engine...");
  const titleInput = page.locator('input[placeholder*="Title"]').first();
  if (await titleInput.isVisible()) {
    await titleInput.click();
    await titleInput.type('Async Actor Isolation Engine', { delay: 25 });
    await sleep(500);
  }

  console.log("  - Typing Content: Implemented memory state locks for node synchronization...");
  const textarea = page.locator('textarea[placeholder*="mind"]').first();
  if (await textarea.isVisible()) {
    await textarea.click();
    await textarea.type('Implemented memory state locks for high-throughput node synchronization under distributed workloads.', { delay: 20 });
    await sleep(1000);
  }

  // AI Polish: Distill into STAR brag card
  console.log("  - Clicking AI Polish to extract STAR accomplishments...");
  const polishBtn = page.locator('button:has-text("AI Polish")').first();
  if (await polishBtn.isVisible()) {
    await polishBtn.click();
    await sleep(3000); // Allow STAR card to unfold
  }

  // Weave Echo: Temporal resonance
  console.log("  - Weaving temporal memory echo link...");
  const weaveBtn = page.locator('button:has-text("Weave Echo")').first();
  if (await weaveBtn.isVisible()) {
    await weaveBtn.click();
    await sleep(1500);
  }

  // Custom Type Creation
  console.log("  - Creating custom type 'Architecture'...");
  const newTypeBtn = page.locator('button:has-text("New Type")').first();
  if (await newTypeBtn.isVisible()) {
    await newTypeBtn.click();
    await sleep(600);
    const newTypeInput = page.locator('input[placeholder*="New type"]').first();
    if (await newTypeInput.isVisible()) {
      await newTypeInput.fill('Architecture');
      await page.keyboard.press('Enter');
      await sleep(1200);
    }
  }

  // Morandi Color Pigment Selection
  console.log("  - Selecting Morandi Pigment for custom type...");
  const typeColorBtn = page.locator('button:has-text("Type Color")').first();
  if (await typeColorBtn.isVisible()) {
    await typeColorBtn.click();
    await sleep(800);
    const fjordPigment = page.locator('button[title*="Fjord"], button[title*="Ice"]').first();
    if (await fjordPigment.isVisible()) {
      await fjordPigment.click();
      await sleep(800);
    }
  }

  // Topics / Tags
  console.log("  - Tagging topics: distributed-systems, actor-model...");
  const topicsInput = page.locator('input[placeholder*="topics"]').first();
  if (await topicsInput.isVisible()) {
    await topicsInput.click();
    await topicsInput.type('distributed-systems, actor-model', { delay: 20 });
    await sleep(800);
  }

  // Print / Save
  console.log("  - Pressing Meta+Enter to print thermal receipt onto canvas...");
  await page.keyboard.press('Meta+Enter');
  await sleep(4000); // Confetti burst and thermal paper tear

  // ----------------------------------------------------
  // SCENE 3: Companion Panel Anatomy (Stream, Summary & Heatmap)
  // ----------------------------------------------------
  console.log(">>> [SCENE 3] Companion Panel Anatomy: Today's Stream, Daily Summary & Activity Heatmap");
  // Select Daily Mood Wash
  console.log("  - Selecting Daily Mood Wash: Sage · Calm...");
  const sageMoodBtn = page.locator('button[title*="Sage"], button[title*="Calm"]').first();
  if (await sageMoodBtn.isVisible()) {
    await sageMoodBtn.click();
    await sleep(1000);
  }

  // Write Daily Closing Reflection
  console.log("  - Writing Daily Reflection in companion panel...");
  const reflectionTextarea = page.locator('textarea[placeholder*="reflection"]').first();
  if (await reflectionTextarea.isVisible()) {
    await reflectionTextarea.click();
    await reflectionTextarea.type('System clarity achieved through ruthless boundary isolation.', { delay: 20 });
    await sleep(2000); // Show green Synced indicator
  }

  // Hover over Today's Stream showing newly printed note
  console.log("  - Hovering over Today's Stream item...");
  const streamItem = page.locator('aside h5:has-text("Async Actor Isolation Engine")').first();
  if (await streamItem.isVisible()) {
    await streamItem.hover();
    await sleep(2000);
  }

  // Hover over Activity Heatmap
  console.log("  - Highlighting Memory Activity Heatmap streak and grid...");
  const heatmapEl = page.locator('aside').locator('text=Streak').first();
  if (await heatmapEl.isVisible()) {
    await heatmapEl.hover();
    await sleep(2500);
  }

  // ----------------------------------------------------
  // SCENE 4: Life Stubs & Anatomy of Daily Thermal Receipt
  // ----------------------------------------------------
  console.log(">>> [SCENE 4] Life Stubs & Anatomy of the Daily Thermal Receipt");
  console.log("  - Opening Life Stubs (Daily Thermal Receipt)...");
  const lifeStubsBtn = page.locator('button:has-text("Life Stubs")').first();
  if (await lifeStubsBtn.isVisible()) {
    await lifeStubsBtn.click();
    await sleep(2500);

    // Scroll through the thermal receipt to showcase its anatomy
    console.log("  - Exploring receipt components (Masthead, Mood wash, Slips, Wax stamp, Sawtooth edge)...");
    const receiptContainer = page.locator('.fixed.inset-0 .overflow-y-auto').first();
    if (await receiptContainer.isVisible()) {
      await receiptContainer.evaluate((el) => el.scrollBy({ top: 320, behavior: 'smooth' }));
      await sleep(2500);

      // Hover over wax stamp
      const waxStamp = page.locator('.font-mono-meta:has-text("ARCHIVED")').first();
      if (await waxStamp.isVisible()) {
        await waxStamp.hover();
        await sleep(1500);
      }

      await receiptContainer.evaluate((el) => el.scrollBy({ top: -320, behavior: 'smooth' }));
      await sleep(1500);
    }

    // Flip to previous day using left arrow
    console.log("  - Reliving yesterday via left arrow flip...");
    const prevDayBtn = page.locator('button:has(svg.lucide-chevron-left)').first();
    if (await prevDayBtn.isVisible()) {
      await prevDayBtn.click();
      await sleep(2500);
    }

    const closeReceiptBtn = page.locator('.fixed.inset-0 button:has(svg.lucide-x)').first();
    if (await closeReceiptBtn.isVisible()) {
      await closeReceiptBtn.click();
      await sleep(1500);
    }
  }

  // ----------------------------------------------------
  // SCENE 5: Knowledge Graph (Force Graph, Cards & Link Management)
  // ----------------------------------------------------
  console.log(">>> [SCENE 5] Knowledge Graph: Force Graph, Cards Mode & Link Management");
  console.log("  - Navigating to Knowledge Graph...");
  const graphNavBtn = page.locator('button:has-text("Knowledge Graph")').first();
  if (await graphNavBtn.isVisible()) {
    await graphNavBtn.click();
    await sleep(3500);
  }

  console.log("  - Demonstrating Force Graph spring physics...");
  await page.mouse.move(760, 480);
  await sleep(1200);
  await page.mouse.move(960, 500);
  await page.mouse.down();
  await page.mouse.move(860, 420, { steps: 15 });
  await page.mouse.up();
  await sleep(2500);

  // Switch to Cards Mode
  console.log("  - Switching to Cognitive Cards Mode (L0-L4 Hierarchy)...");
  const cardsModeBtn = page.locator('button:has-text("Cards")').first();
  if (await cardsModeBtn.isVisible()) {
    await cardsModeBtn.click();
    await sleep(3500); // Showcase structured cards across L0-L4 tiers
  }

  // Switch back to Force Graph
  console.log("  - Switching back to Force Graph Mode...");
  const forceModeBtn = page.locator('button:has-text("Force Graph")').first();
  if (await forceModeBtn.isVisible()) {
    await forceModeBtn.click();
    await sleep(2500);
  }

  // Link Management: Disconnect & Connect
  console.log("  - Selecting central node to open Link Node Manager...");
  await page.mouse.click(760, 480);
  await sleep(2000);

  const linkNodeBtn = page.locator('button:has-text("Link Node"), button:has-text("Link")').first();
  if (await linkNodeBtn.isVisible()) {
    await linkNodeBtn.click();
    await sleep(2500);

    // Disconnect existing link
    console.log("  - Demonstrating link disconnect...");
    const disconnectBtn = page.locator('button:has-text("Disconnect")').first();
    if (await disconnectBtn.isVisible()) {
      await disconnectBtn.click();
      await sleep(2000);
    }

    // Connect new link with causal reason
    console.log("  - Connecting new link with causal reason...");
    const selectEl = page.locator('.fixed.inset-0 select').first();
    if (await selectEl.isVisible()) {
      await selectEl.selectOption({ index: 1 });
      await sleep(800);
    }

    const reasonInput = page.locator('.fixed.inset-0 input[placeholder*="related"], .fixed.inset-0 input[type="text"]').last();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Direct architectural predecessor and state isolation foundation');
      await sleep(1200);
    }

    const submitLinkBtn = page.locator('.fixed.inset-0 button[type="submit"]').first();
    if (await submitLinkBtn.isVisible()) {
      await submitLinkBtn.click();
      await sleep(2500);
    }

    const closeConnBtn = page.locator('.fixed.inset-0 button:has(svg.lucide-x)').first();
    if (await closeConnBtn.isVisible()) {
      await closeConnBtn.click();
      await sleep(1500);
    }
  }

  // ----------------------------------------------------
  // SCENE 6: Weekly Digest & Autonomous Synthesis
  // ----------------------------------------------------
  console.log(">>> [SCENE 6] Weekly Digest & Autonomous Synthesis");
  console.log("  - Opening Weekly Digest modal...");
  const digestBtn = page.locator('button:has-text("Weekly Digest")').first();
  if (await digestBtn.isVisible()) {
    await digestBtn.click();
    await sleep(3000);

    // Scroll through the 9 milestones and STAR summary
    const digestModal = page.locator('.fixed.inset-0 .overflow-y-auto').first();
    if (await digestModal.isVisible()) {
      console.log("  - Scrolling through weekly milestones and STAR achievements...");
      await digestModal.evaluate((el) => el.scrollBy({ top: 380, behavior: 'smooth' }));
      await sleep(3000);
      await digestModal.evaluate((el) => el.scrollBy({ top: -380, behavior: 'smooth' }));
      await sleep(2000);
    }

    // Click Copy Markdown
    console.log("  - Clicking Copy Digest Markdown...");
    const copyBtn = page.locator('.fixed.inset-0 button:has-text("Copy")').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await sleep(1500);
    }

    const closeDigestBtn = page.locator('.fixed.inset-0 button:has(svg.lucide-x)').first();
    if (await closeDigestBtn.isVisible()) {
      await closeDigestBtn.click();
      await sleep(1500);
    }
  }

  // ----------------------------------------------------
  // SCENE 7: Eternal Memory & Closing
  // ----------------------------------------------------
  console.log(">>> [SCENE 7] Eternal Sovereignty & Closing");
  console.log("  - Returning to Daily Journal...");
  const dailyBtn = page.locator('button:has-text("Daily Journal")').first();
  if (await dailyBtn.isVisible()) {
    await dailyBtn.click();
    await sleep(2000);
  }

  console.log("  - Highlighting verified emerald GitHub sync badge in header...");
  const ghFinalBtn = page.locator('button:has(svg.lucide-git-branch)').first();
  if (await ghFinalBtn.isVisible()) {
    await ghFinalBtn.hover();
    await sleep(2500);
  }

  // Guarantee the video covers the full master voiceover (or at least 150s)
  const TARGET_RECORDING_MS = 172000;
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

  const finalMb = fs.statSync(OUTPUT_VIDEO).size / (1024 * 1024);
  console.log("==================================================");
  console.log(` Master Demo Video Export Complete: ${OUTPUT_VIDEO}`);
  console.log(` Final Video Size: ${finalMb.toFixed(2)} MB`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
