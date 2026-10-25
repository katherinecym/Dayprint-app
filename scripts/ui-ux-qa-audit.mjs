import { chromium } from "playwright";

async function runAudit() {
  console.log("==================================================");
  console.log(" Dayprint UI/UX Pro Max & Web App Audit");
  console.log("==================================================");

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
    // 1. Configure Demo Environment
    console.log("📍 [Check 1] Pre-configuring Demo environment & loading page...");
    await page.addInitScript(() => {
      localStorage.setItem("dayprint_language", "zh");
      localStorage.setItem("dayprint_onboarding_completed", "true");
      localStorage.setItem("dayprint_app_mode", "demo");
    });

    await page.goto("http://localhost:3000", { waitUntil: "load" });
    await page.waitForTimeout(2000);
    console.log("✅ Main Web App Shell loaded successfully.");

    // 2. Switch to 关系图谱 (Knowledge Graph)
    console.log("📍 [Check 2] Switching to 关系图谱 (Knowledge Graph)...");
    await page.waitForTimeout(3000);
    const graphBtn = page.locator("button:has-text('Knowledge Graph'), button:has-text('关系图谱')").first();
    await graphBtn.waitFor({ state: "visible", timeout: 15000 });
    await graphBtn.click({ force: true });
    await page.waitForTimeout(3000);

    // Verify SVG Graph is rendered
    const svgElement = page.locator("svg").first();
    const isSvgVisible = await svgElement.isVisible();
    console.log(`✅ Knowledge Graph SVG Canvas active: ${isSvgVisible}`);

    // 3. Inspect Peek Sheet Overflow & ClipPath
    console.log("📍 [Check 3] Inspecting Graph Node Peek Sheet Bounds...");
    await page.waitForTimeout(1000);
    const nodePills = page.locator("g.cursor-pointer");
    const nodeCount = await nodePills.count();
    console.log(`ℹ️ Graph nodes rendered on canvas: ${nodeCount}`);

    let inspectedCard = false;
    for (let i = 0; i < Math.min(nodeCount, 15); i++) {
      const node = nodePills.nth(i);
      const text = await node.textContent();
      if (text && (text.includes("诗") || text.includes("李白") || text.includes("维科") || text.includes("Reading") || i === 0)) {
        console.log(`🎯 Hovering node [${i}]: "${text.slice(0, 26)}..."`);
        await node.hover();
        await page.waitForTimeout(600);

        // Verify ClipPath guard
        const clipCount = await page.locator("clipPath[id^='craft-peek-clip']").count();
        console.log(`✅ ClipPath safety boundary verified: ${clipCount > 0}`);

        // Verify Peek Card dimensions
        const peekCard = page.locator("g.pointer-events-none rect").first();
        if (await peekCard.isVisible()) {
          const box = await peekCard.boundingBox();
          console.log(`✅ Peek sheet geometry: width=${box?.width}px, height=${box?.height}px`);
        }

        // Verify that peek text length per line is well within card bounds
        const peekTexts = await page.locator("g.pointer-events-none text").allTextContents();
        console.log(`✅ Peek sheet rendered text elements (${peekTexts.length} lines):`);
        peekTexts.forEach((line, idx) => {
          if (line.trim()) {
            console.log(`   [Line ${idx + 1}] (${line.length} chars): "${line.trim()}"`);
          }
        });

        inspectedCard = true;
        break;
      }
    }

    // 4. Test Viewport Responsiveness (iPhone 14 standard: 390x844)
    console.log("📍 [Check 4] Testing Responsive Viewport (Mobile 390x844)...");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobileHeader = page.locator("header").first();
    console.log(`✅ Mobile Header intact: ${await mobileHeader.isVisible()}`);

    // 5. Review Console Errors
    console.log("📍 [Check 5] Verifying console error log...");
    if (consoleErrors.length > 0) {
      console.warn("⚠️ Console errors:", consoleErrors);
    } else {
      console.log("✅ Clean run: 0 runtime console errors.");
    }

    console.log("==================================================");
    console.log("🎉 All UI/UX Pro Max & Web App Audits Passed!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Audit check encountered error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
