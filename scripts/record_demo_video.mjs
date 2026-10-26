#!/usr/bin/env node
/**
 * Automated High-Definition Screen Recording for Dayprint Hackathon Demo Video.
 * Perfectly paced continuous browser automation synchronized with the 173-second studio voiceover.
 * All scene actions are micro-distributed so the screen moves continuously and matches narration in real time.
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
const MANIFEST_PATH = path.resolve('audio/audio_manifest.json');

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

let manifest = null;
if (fs.existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

async function waitSceneBudget(sceneIndex, sceneStartTime) {
  if (!manifest) return;
  const sceneMeta = manifest.scenes.find((s) => s.scene_index === sceneIndex);
  if (!sceneMeta) return;

  const targetMs = sceneMeta.budget_seconds * 1000;
  const elapsed = Date.now() - sceneStartTime;
  if (elapsed < targetMs) {
    const remain = targetMs - elapsed;
    console.log(`  [Scene ${sceneIndex} Sync] Actions took ${(elapsed / 1000).toFixed(1)}s. Natural buffer hold: ${(remain / 1000).toFixed(1)}s...`);
    await sleep(remain);
  } else {
    console.log(`  [Scene ${sceneIndex} Sync] Actions completed at ${(elapsed / 1000).toFixed(1)}s (budget: ${(targetMs / 1000).toFixed(1)}s)`);
  }
}

async function main() {
  console.log("==================================================");
  console.log(" Dayprint Automated Master Screen Recording Studio");
  console.log("==================================================");
  console.log(`FFmpeg Binary: ${ffmpeg}`);
  console.log(`Master Audio:  ${MASTER_AUDIO}`);

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
  await sleep(2500);

  // ----------------------------------------------------
  // SCENE 1: Data Sovereignty & Step 1 Setup (Budget: 26s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 1] Data Sovereignty & Step 1 - Connecting Private GitHub Repo (00:00 - 00:26)");
  const s1Start = Date.now();

  // 00:00 - 00:05: Camera hovers on clean canvas
  console.log("  - Gliding over clean Dayprint canvas...");
  await page.mouse.move(960, 400);
  await sleep(4500);

  // 00:05 - 00:10: Move to header and click Settings button
  console.log("  - Opening GitHub Settings & Sovereignty modal...");
  const ghInitBtn = page.locator('[data-testid="github-settings-btn"]').first();
  await ghInitBtn.waitFor({ state: 'visible', timeout: 5000 });
  await ghInitBtn.hover();
  await sleep(1500);
  await ghInitBtn.click();
  await sleep(1500);

  // Wait for settings modal
  const settingsModal = page.locator('div.z-\\[60\\]').first();
  await settingsModal.waitFor({ state: 'visible', timeout: 5000 });

  // 00:10 - 00:15: Highlight Step 1 (PAT Token input)
  console.log("  - Highlighting Step 1: GitHub PAT generation...");
  const patInputEl = page.locator('input[placeholder*="ghp_"]').first();
  if (await patInputEl.isVisible()) {
    await patInputEl.hover();
    await sleep(4500);
  }

  // 00:15 - 00:21: Highlight Step 2 (Private repository name & notice)
  console.log("  - Highlighting Step 2: Private repository auto-creation...");
  const repoInputEl = page.locator('input[placeholder*="my-dayprint-vault"]').first();
  if (await repoInputEl.isVisible()) {
    await repoInputEl.hover();
    await sleep(4000);
  }

  // 00:21 - 00:26: Highlight Demo Mode option and enter Demo Mode
  console.log("  - Highlighting Demo Mode option and entering Demo Mode...");
  const demoBtn = page.locator('[data-testid="switch-to-demo-btn"]').first();
  if (await demoBtn.isVisible()) {
    await demoBtn.hover();
    await sleep(1500);
    await demoBtn.click();
    await sleep(2500);
  } else {
    const closeGhBtn = page.locator('div.z-\\[60\\] button:has(svg.lucide-x)').first();
    if (await closeGhBtn.isVisible()) {
      await closeGhBtn.click();
      await sleep(1500);
    }
  }

  // Highlight emerald synced status badge in header
  console.log("  - Highlighting emerald status badge in header...");
  await page.mouse.move(960, 40);
  await sleep(2000);

  await waitSceneBudget(1, s1Start);

  // ----------------------------------------------------
  // SCENE 2: Today's Canvas & Creation Ritual (Budget: 39s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 2] Today's Canvas, Concrete Input & STAR AI Polish (00:26 - 01:05)");
  const s2Start = Date.now();

  // 00:00 - 00:04: Expand writing desk
  console.log("  - Clicking Today's Editor to expand writing desk...");
  const deskTrigger = page.locator('span:has-text("What\'s on your mind?"), input[placeholder*="Title"]').first();
  if (await deskTrigger.isVisible()) {
    await deskTrigger.click();
    await sleep(2500);
  }

  // 00:04 - 00:08: Type Title
  console.log("  - Typing Title: Distributed State Lock Engine...");
  const titleInput = page.locator('input[placeholder*="Title"]').first();
  if (await titleInput.isVisible()) {
    await titleInput.click();
    await titleInput.type('Distributed State Lock Engine', { delay: 45 });
    await sleep(1200);
  }

  // 00:08 - 00:14: Type Content
  console.log("  - Typing Content: Debugged high memory contention during multi-agent sync...");
  const textarea = page.locator('textarea[placeholder*="mind"]').first();
  if (await textarea.isVisible()) {
    await textarea.click();
    await textarea.type('Debugged high memory contention during multi-agent sync. Replaced global mutex locks with lock-free ring buffers to prevent request timeouts under heavy load.', { delay: 28 });
    await sleep(2000);
  }

  // 00:14 - 00:21: AI Polish (STAR framework)
  console.log("  - Clicking AI Polish to extract STAR accomplishments...");
  const polishBtn = page.locator('button:has-text("AI Polish")').first();
  if (await polishBtn.isVisible()) {
    await polishBtn.hover();
    await sleep(1000);
    await polishBtn.click();
    await sleep(5500); // Allow STAR card to unfold and show S, T, A, R breakdown
  }

  // 00:21 - 00:26: Weave Echo
  console.log("  - Weaving temporal memory echo link...");
  const weaveBtn = page.locator('button:has-text("Weave Echo")').first();
  if (await weaveBtn.isVisible()) {
    await weaveBtn.hover();
    await sleep(1200);
    await weaveBtn.click();
    await sleep(3500);
  }

  // 00:26 - 00:31: Custom Type Creation
  console.log("  - Creating custom type 'Architecture'...");
  const newTypeBtn = page.locator('button:has-text("New Type")').first();
  if (await newTypeBtn.isVisible()) {
    await newTypeBtn.click();
    await sleep(1000);
    const newTypeInput = page.locator('input[placeholder*="New type"]').first();
    if (await newTypeInput.isVisible()) {
      await newTypeInput.fill('Architecture');
      await page.keyboard.press('Enter');
      await sleep(3000);
    }
  }

  // 00:31 - 00:35: Morandi Pigment & Topics
  console.log("  - Selecting Morandi Pigment and tagging topics...");
  const typeColorBtn = page.locator('button:has-text("Type Color")').first();
  if (await typeColorBtn.isVisible()) {
    await typeColorBtn.click();
    await sleep(1000);
    const fjordPigment = page.locator('button[title*="Fjord"], button[title*="Ice"]').first();
    if (await fjordPigment.isVisible()) {
      await fjordPigment.click();
      await sleep(1200);
    }
  }

  const topicsInput = page.locator('input[placeholder*="topics"]').first();
  if (await topicsInput.isVisible()) {
    await topicsInput.click();
    await topicsInput.type('distributed-systems, actor-model', { delay: 35 });
    await sleep(1500);
  }

  // 00:35 - 00:39: Print / Save
  console.log("  - Pressing Meta+Enter to print thermal receipt onto canvas...");
  await page.keyboard.press('Meta+Enter');
  await sleep(3500); // Confetti burst and thermal paper tear

  await waitSceneBudget(2, s2Start);

  // ----------------------------------------------------
  // SCENE 3: Companion Panel Anatomy (Budget: 20s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 3] Companion Panel Anatomy: Today's Stream, Summary & Heatmap (01:05 - 01:25)");
  const s3Start = Date.now();

  // 00:00 - 00:04: Move over to Companion Panel
  console.log("  - Gliding to right-side Companion Panel...");
  await page.mouse.move(1750, 200);
  await sleep(3000);

  // 00:04 - 00:10: Select Daily Mood Wash and write Evening Reflection
  console.log("  - Selecting Daily Mood Wash: Sage · Calm...");
  const sageMoodBtn = page.locator('button[title*="Sage"], button[title*="Calm"]').first();
  if (await sageMoodBtn.isVisible()) {
    await sageMoodBtn.click();
    await sleep(1500);
  }

  console.log("  - Writing Daily Reflection in companion panel...");
  const reflectionTextarea = page.locator('textarea[placeholder*="reflection"]').first();
  if (await reflectionTextarea.isVisible()) {
    await reflectionTextarea.click();
    await reflectionTextarea.type('System clarity achieved through boundary isolation.', { delay: 35 });
    await sleep(2500);
  }

  // 00:10 - 00:15: Hover over Today's Stream showing newly printed note
  console.log("  - Hovering over Today's Stream item...");
  const streamItem = page.locator('aside h5:has-text("Distributed State Lock Engine")').first();
  if (await streamItem.isVisible()) {
    await streamItem.hover();
    await sleep(4000);
  }

  // 00:15 - 00:20: Hover over Activity Heatmap
  console.log("  - Highlighting Memory Activity Heatmap streak and grid...");
  const heatmapEl = page.locator('aside').locator('text=Streak').first();
  if (await heatmapEl.isVisible()) {
    await heatmapEl.hover();
    await sleep(4000);
  }

  await waitSceneBudget(3, s3Start);

  // ----------------------------------------------------
  // SCENE 4: Life Stubs & Anatomy of Daily Thermal Receipt (Budget: 25s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 4] Life Stubs & Anatomy of the Daily Thermal Receipt (01:25 - 01:50)");
  const s4Start = Date.now();

  // 00:00 - 00:05: Open Life Stubs
  console.log("  - Opening Life Stubs (Daily Thermal Receipt)...");
  const lifeStubsBtn = page.locator('button:has-text("Life Stubs")').first();
  if (await lifeStubsBtn.isVisible()) {
    await lifeStubsBtn.click();
    await sleep(4000);

    // 00:05 - 00:12: Scroll receipt down smoothly
    console.log("  - Exploring receipt components (Masthead, Mood wash, Slips, Wax stamp, Sawtooth edge)...");
    const receiptContainer = page.locator('div.z-\\[60\\] .overflow-y-auto').first();
    if (await receiptContainer.isVisible()) {
      await receiptContainer.evaluate((el) => el.scrollBy({ top: 340, behavior: 'smooth' }));
      await sleep(6000);

      // 00:12 - 00:17: View wax stamp and reflection
      console.log("  - Inspecting wax stamp and serif reflection...");
      await page.mouse.move(960, 600);
      await sleep(5000);

      await receiptContainer.evaluate((el) => el.scrollBy({ top: -340, behavior: 'smooth' }));
      await sleep(2000);
    }

    // 00:17 - 00:22: Flip to yesterday using right arrow
    console.log("  - Reliving yesterday via right arrow flip...");
    const nextDayBtn = page.locator('div.z-\\[60\\] button:has(svg.lucide-chevron-right)').first();
    if (await nextDayBtn.isVisible() && await nextDayBtn.isEnabled()) {
      await nextDayBtn.click();
      await sleep(4500);
    }

    // 00:22 - 00:25: Close receipt modal
    const closeReceiptBtn = page.locator('div.z-\\[60\\] button:has(svg.lucide-x)').first();
    if (await closeReceiptBtn.isVisible()) {
      await closeReceiptBtn.click();
      await sleep(2000);
    }
  }

  await waitSceneBudget(4, s4Start);

  // ----------------------------------------------------
  // SCENE 5: Knowledge Graph & Link Management (Budget: 34s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 5] Knowledge Graph: Force Graph, Cards Mode & Link Management (01:50 - 02:24)");
  const s5Start = Date.now();

  // 00:00 - 00:05: Navigate to Knowledge Graph
  console.log("  - Navigating to Knowledge Graph...");
  const graphNavBtn = page.locator('button:has-text("Knowledge Graph")').first();
  if (await graphNavBtn.isVisible()) {
    await graphNavBtn.click();
    await sleep(4000);
  }

  // 00:05 - 00:11: Demonstrate Force Graph spring physics & hover central hub
  console.log("  - Demonstrating Force Graph spring physics and hovering hub node...");
  await page.mouse.move(960, 500);
  await page.mouse.down();
  await page.mouse.move(860, 420, { steps: 25 });
  await page.mouse.up();
  await sleep(3000);
  await page.mouse.move(760, 480);
  await sleep(2500);

  // 00:11 - 00:17: Switch to Cards Mode
  console.log("  - Switching to Cognitive Cards Mode (L0-L4 Hierarchy)...");
  const cardsModeBtn = page.locator('button:has-text("Cards")').first();
  if (await cardsModeBtn.isVisible()) {
    await cardsModeBtn.click();
    await sleep(3500);

    // Select the high-degree central hub card: mem_demo_01 (AetherOS Architecture)
    console.log("  - Selecting high-degree central hub card (AetherOS Architecture)...");
    const hubCard = page.locator('div:has-text("AetherOS Cognitive Digital Sub-Myself Architecture")').first();
    if (await hubCard.isVisible()) {
      await hubCard.click();
      await sleep(2500);
    }
  }

  // 00:17 - 00:22: Switch back to Force Graph & open Link Node Manager
  console.log("  - Switching back to Force Graph Mode...");
  const forceModeBtn = page.locator('button:has-text("Force Graph")').first();
  if (await forceModeBtn.isVisible()) {
    await forceModeBtn.click();
    await sleep(3000); // Observe radiant indigo resonance network around the selected hub node
  }

  console.log("  - Opening Link Node Manager from inspector...");
  const linkNodeBtn = page.locator('button:has-text("Link Node"), button:has-text("Link")').first();
  if (await linkNodeBtn.isVisible()) {
    await linkNodeBtn.click();
    await sleep(2500);

    // 00:22 - 00:26: Disconnect existing link
    console.log("  - Demonstrating link disconnect...");
    const disconnectBtn = page.locator('div.z-\\[60\\] button:has-text("Disconnect")').first();
    if (await disconnectBtn.isVisible()) {
      await disconnectBtn.click();
      await sleep(3000);
    }

    // 00:26 - 00:32: Connect new link with causal reason
    console.log("  - Connecting new link with causal reason...");
    const selectEl = page.locator('div.z-\\[60\\] select').first();
    if (await selectEl.isVisible()) {
      await selectEl.selectOption({ index: 1 });
      await sleep(1200);
    }

    const reasonInput = page.locator('div.z-\\[60\\] input[placeholder*="related"], div.z-\\[60\\] input[type="text"]').last();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Direct predecessor and state isolation foundation');
      await sleep(1800);
    }

    const submitLinkBtn = page.locator('div.z-\\[60\\] button[type="submit"]').first();
    if (await submitLinkBtn.isVisible()) {
      await submitLinkBtn.click();
      await sleep(3000);
    }

    // 00:32 - 00:34: Close modal
    const closeConnBtn = page.locator('div.z-\\[60\\] button:has(svg.lucide-x)').first();
    if (await closeConnBtn.isVisible()) {
      await closeConnBtn.click();
      await sleep(1500);
    }
  }

  await waitSceneBudget(5, s5Start);

  // ----------------------------------------------------
  // SCENE 6: Weekly Digest & Autonomous Synthesis (Budget: 18s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 6] Weekly Digest & Autonomous Synthesis (02:24 - 02:42)");
  const s6Start = Date.now();

  // 00:00 - 00:05: Open Weekly Digest modal
  console.log("  - Opening Weekly Digest modal (Monday defaults to Last Week Oct 19~25)...");
  const digestBtn = page.locator('button:has-text("Weekly Digest")').first();
  if (await digestBtn.isVisible()) {
    await digestBtn.click();
    await sleep(4000);

    // 00:05 - 00:12: Scroll through 9 milestones and STAR summary
    const digestModal = page.locator('div.z-\\[60\\] .overflow-y-auto').first();
    if (await digestModal.isVisible()) {
      console.log("  - Scrolling through weekly milestones and STAR achievements...");
      await digestModal.evaluate((el) => el.scrollBy({ top: 380, behavior: 'smooth' }));
      await sleep(4500);
      await digestModal.evaluate((el) => el.scrollBy({ top: -380, behavior: 'smooth' }));
      await sleep(2500);
    }

    // 00:12 - 00:16: Click Copy Markdown
    console.log("  - Clicking Copy Digest Markdown...");
    const copyBtn = page.locator('div.z-\\[60\\] button:has-text("Copy")').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await sleep(2500);
    }

    // 00:16 - 00:18: Close modal
    const closeDigestBtn = page.locator('div.z-\\[60\\] button:has(svg.lucide-x)').first();
    if (await closeDigestBtn.isVisible()) {
      await closeDigestBtn.click();
      await sleep(1500);
    }
  }

  await waitSceneBudget(6, s6Start);

  // ----------------------------------------------------
  // SCENE 7: Eternal Sovereignty & Closing (Budget: 11s)
  // ----------------------------------------------------
  console.log(">>> [SCENE 7] Eternal Sovereignty & Closing (02:42 - 02:53)");
  const s7Start = Date.now();

  // 00:00 - 00:05: Return to Daily Journal & hover on green sync badge
  console.log("  - Returning to Daily Journal...");
  const dailyBtn = page.locator('button:has-text("Daily Journal")').first();
  if (await dailyBtn.isVisible()) {
    await dailyBtn.click();
    await sleep(3000);
  }

  console.log("  - Highlighting verified emerald GitHub sync badge in header...");
  const ghFinalBtn = page.locator('button:has(svg.lucide-git-branch)').first();
  if (await ghFinalBtn.isVisible()) {
    await ghFinalBtn.hover();
    await sleep(3000);
  }

  // 00:05 - 00:11: Camera rests on serene canvas
  console.log("  - Resting on clean hero canvas for closing statement...");
  await page.mouse.move(960, 540);

  await waitSceneBudget(7, s7Start);

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
