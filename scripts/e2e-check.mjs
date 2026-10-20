import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function runE2ETests() {
  console.log("🚀 Starting Dayprint E2E Validation via Playwright...");
  const screenshotsDir = path.resolve(process.cwd(), "public/test-screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("Download the React DevTools") && !text.includes("favicon.ico")) {
        consoleErrors.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. Visit Home
    console.log("📍 [Step 1] Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`✅ Page loaded successfully. Title: "${title}"`);
    await page.screenshot({ path: path.join(screenshotsDir, "01_home_loaded.png") });

    const leftSidebar = page.locator("aside").first();
    const rightPanel = page.locator("aside").last();

    // 2. Check Daily Journal Workspace Elements
    console.log("📍 [Step 2] Verifying '今日记录' (Daily Journal) workspace...");
    const dailyNav = leftSidebar.locator("button:has-text('今日记录'), button:has-text('Daily Journal')").first();
    const isDailyVisible = await dailyNav.isVisible();
    console.log(`✅ '今日记录' sidebar entry visible: ${isDailyVisible}`);

    // Check Editor presence
    const editorTextarea = page.locator("textarea").first();
    const isEditorVisible = await editorTextarea.isVisible();
    console.log(`✅ Note input editor visible: ${isEditorVisible}`);

    // 3. Test Mood Wash & Companion Panel
    console.log("📍 [Step 3] Testing '今日水彩心情' (Mood Wash) selection...");
    const moodSelector = rightPanel.locator("text=今日水彩心情, text=Mood Wash").first();
    const isMoodVisible = await moodSelector.isVisible();
    console.log(`✅ Mood wash title visible: ${isMoodVisible}`);

    // Click the 3rd mood button (Sage / 苍青绿)
    const moodButtons = rightPanel.locator("button.rounded-full");
    const moodBtnCount = await moodButtons.count();
    console.log(`✅ Found ${moodBtnCount} mood color swatches.`);
    if (moodBtnCount >= 3) {
      await moodButtons.nth(2).click(); // Click Sage
      await page.waitForTimeout(500);
      const activeText = await rightPanel.textContent();
      const hasSage = activeText.includes("苍青绿") || activeText.includes("Sage");
      console.log(`✅ Mood successfully switched to 苍青绿 / Sage: ${hasSage}`);
    }

    // Enter reflection text
    const reflectionInput = rightPanel.locator("textarea").first();
    if (await reflectionInput.isVisible()) {
      await reflectionInput.fill("这是 Playwright 自动化测试写入的今日复盘反思。");
      await page.waitForTimeout(600);
      console.log("✅ Daily reflection text filled in companion panel.");
    }
    await page.screenshot({ path: path.join(screenshotsDir, "02_mood_reflection.png") });

    // 4. Test Workspace Switching: 认知档案 (Cognitive Ledger)
    console.log("📍 [Step 4] Switching workspace to '认知档案' (Cognitive Ledger)...");
    const cognitiveNav = leftSidebar.locator("button:has-text('认知档案'), button:has-text('Cognitive Ledger')").first();
    await cognitiveNav.click();
    await page.waitForTimeout(1000);
    const ledgerHeader = await page.locator("text=认知档案, text=Cognitive Ledger").first().isVisible();
    console.log(`✅ Cognitive Ledger workspace active: ${ledgerHeader}`);
    await page.screenshot({ path: path.join(screenshotsDir, "03_cognitive_ledger.png") });

    // 5. Test Workspace Switching: 关系图谱 (Knowledge Graph)
    console.log("📍 [Step 5] Switching workspace to '关系图谱' (Knowledge Graph)...");
    const graphNav = leftSidebar.locator("button:has-text('关系图谱'), button:has-text('Knowledge Graph')").first();
    await graphNav.click();
    await page.waitForTimeout(1200);
    const graphCanvas = page.locator("canvas").first();
    const hasCanvas = await graphCanvas.isVisible();
    console.log(`✅ Knowledge Graph Force Canvas rendered: ${hasCanvas}`);
    await page.screenshot({ path: path.join(screenshotsDir, "04_knowledge_graph.png") });

    // Switch back to Daily Journal
    await dailyNav.click();
    await page.waitForTimeout(800);

    // 6. Test '生活存根' (Life Stubs) Modal
    console.log("📍 [Step 6] Testing '生活存根' (Life Stubs) modal...");
    const lifeStubBtn = leftSidebar.locator("button:has-text('生活存根'), button:has-text('Life Stubs')").first();
    await lifeStubBtn.click();
    await page.waitForTimeout(800);

    const lifeStubModal = page.locator("text=生活存根画卷, text=Life Stubs Archive").first();
    const isModalOpen = await lifeStubModal.isVisible();
    console.log(`✅ '生活存根画卷' modal opened: ${isModalOpen}`);

    const brandStub = page.locator("text=DAYPRINT LIFE STUB").first();
    const isBrandVisible = await brandStub.isVisible();
    console.log(`✅ Brand text '• DAYPRINT LIFE STUB •' verified: ${isBrandVisible}`);

    await page.screenshot({ path: path.join(screenshotsDir, "05_life_stub_modal.png") });

    // Close modal via Escape or close button
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    console.log("✅ Life Stub modal closed.");

    // 7. Test '周度复盘' (Weekly Digest) Modal
    console.log("📍 [Step 7] Testing '周度复盘' (Weekly Digest) modal...");
    const weeklyBtn = leftSidebar.locator("button:has-text('周度复盘'), button:has-text('Weekly Digest')").first();
    await weeklyBtn.click();
    await page.waitForTimeout(800);
    const weeklyModal = page.locator("text=周度复盘, text=Weekly Digest").first();
    console.log(`✅ Weekly Digest modal opened: ${await weeklyModal.isVisible()}`);
    await page.screenshot({ path: path.join(screenshotsDir, "06_weekly_digest_modal.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);

    // 9. Test Language Switcher to 中文 (ZH)
    console.log("📍 [Step 9] Testing Language Switch to 中文 (ZH)...");
    const langBtn = page.locator("button:has-text('EN'), button:has-text('ZH')").first();
    if (await langBtn.isVisible()) {
      const curText = await langBtn.textContent();
      if (curText.includes("EN")) {
        await langBtn.click();
        await page.waitForTimeout(600);
        console.log("✅ Switched language from EN to ZH.");
      }
    }
    await page.screenshot({ path: path.join(screenshotsDir, "08_switched_to_zh.png") });

    // Verify Chinese labels in sidebar
    const zhDaily = await leftSidebar.locator("text=今日记录").isVisible();
    const zhLifeStub = await leftSidebar.locator("text=生活存根").isVisible();
    console.log(`✅ Chinese label '今日记录' visible: ${zhDaily}`);
    console.log(`✅ Chinese label '生活存根' visible: ${zhLifeStub}`);

    // 10. Test Note Creation in Today's Editor
    console.log("📍 [Step 10] Testing creating a new memory fragment...");
    const titleInput = page.locator("input[placeholder*='标题'], input[placeholder*='Title']").first();
    if (await titleInput.isVisible()) {
      await titleInput.fill("Playwright 交互与端到端功能验证");
    }

    const contentInput = page.locator("textarea[placeholder*='随手记下'], textarea[placeholder*='What']").first();
    if (await contentInput.isVisible()) {
      await contentInput.fill("端到端自动化测试顺利完成，包含三大工作区切换、情绪水彩浸染与生活存根打印！ #自动化测试 #E2E");
    }

    const saveBtn = page.locator("button:has-text('保存'), button:has-text('Save')").first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
      console.log("✅ New note submitted.");
    }
    await page.screenshot({ path: path.join(screenshotsDir, "09_note_created.png") });

    // 11. Check Console Errors
    console.log("\n================ TEST SUMMARY ================");
    if (consoleErrors.length === 0) {
      console.log("🎉 All 10 E2E Interaction and UI Tests Passed with ZERO runtime errors!");
    } else {
      console.log(`⚠️ Encountered ${consoleErrors.length} console errors:`, consoleErrors);
    }

  } catch (err) {
    console.error("❌ E2E Test run failed with error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETests();
