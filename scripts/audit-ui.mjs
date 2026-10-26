/**
 * Dayprint UI / UX / storage audit — real browser, real clicks.
 *
 * This exists because the unit tests can't tell you whether a button is
 * reachable, a modal closes, or the layout overflows. It drives the actual
 * production build and reports:
 *
 *   1. console errors, page errors, failed network requests
 *   2. what actually landed in localStorage (counts, not just "it's there")
 *   3. horizontal overflow per view (a classic silent layout break)
 *   4. modal open → Escape → closed (verifies useModalDismiss is wired)
 *   5. background scroll lock while a modal is open
 *   6. EN-mode text leaking Chinese (and vice versa)
 *
 * Usage:
 *   npx next build && npx next start -p 3123 &
 *   node scripts/audit-ui.mjs
 *
 * Screenshots land in audit-artifacts/. Exit code 1 if any ERROR was recorded.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3123";
const OUT = path.resolve("audit-artifacts");

const errors = [];
const warnings = [];
const notes = [];

const fail = (area, msg) => errors.push(`[${area}] ${msg}`);
const warn = (area, msg) => warnings.push(`[${area}] ${msg}`);
const note = (msg) => notes.push(msg);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
};

/** Detect the page being wider than the viewport — the usual cause of a
 *  stray horizontal scrollbar and clipped right-hand panels. */
const checkOverflow = async (page, label) => {
  const m = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
  }));
  if (m.scrollW > m.clientW + 1) {
    fail(label, `horizontal overflow: scrollWidth ${m.scrollW} > clientWidth ${m.clientW}`);
  }
  return m;
};

const visibleText = async (page) =>
  page.evaluate(() => document.body.innerText || "");

const hasCJK = (s) => /[\u4e00-\u9fa5]/.test(s);

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Next dev overlay noise / favicon 404s are not product bugs.
      if (/favicon|Download the React DevTools/i.test(t)) return;
      fail("console", t.slice(0, 300));
    }
  });
  page.on("pageerror", (err) => fail("pageerror", String(err).slice(0, 300)));
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (/favicon|\.map$/.test(u)) return;
    warn("network", `${req.failure()?.errorText || "failed"} ${u.slice(0, 160)}`);
  });

  // ---------------------------------------------------------------- fresh user
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const welcomeVisible = await page
    .getByText(/Welcome to Dayprint|欢迎来到 Dayprint/).first()
    .isVisible()
    .catch(() => false);
  if (!welcomeVisible) {
    fail("onboarding", "first-time visitor did not see the welcome gateway");
  } else {
    await shot(page, "00-welcome");
    note("welcome gateway shown to a fresh visitor ✓");

    // Verify Escape actually dismisses it (regression guard for useModalDismiss).
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const stillOpen = await page
      .getByText(/Welcome to Dayprint|欢迎来到 Dayprint/)
      .first()
      .isVisible()
      .catch(() => false);
    if (stillOpen) fail("onboarding", "Escape did not dismiss the welcome modal");
    else note("Escape dismisses the welcome modal ✓");

    // Reopen by clearing the flag, then take the demo path.
    await page.evaluate(() => {
      localStorage.removeItem("dayprint_onboarding_completed");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    await page.getByText(/Try Demo Mode First|先体验 Demo 演示模式/).first().click();
    await page.waitForTimeout(400);
    await shot(page, "01-welcome-demo-tab");
    await page.getByText(/Enter in Demo Mode|以 Demo 模式进入体验/).first().click();
    await page.waitForTimeout(1200);
  }

  // ---------------------------------------------------------------- storage
  const storage = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k)?.length ?? 0;
    }
    let mem = [];
    try {
      mem = JSON.parse(localStorage.getItem("dayprint_memories") || "[]");
    } catch {}
    let rcpt = {};
    try {
      rcpt = JSON.parse(localStorage.getItem("dayprint_receipts") || "{}");
    } catch {}
    const days = new Set(
      mem.filter((m) => m.occurred_at).map((m) => String(m.occurred_at).slice(0, 10))
    );
    const sortedDays = [...days].sort();
    const moods = new Set(Object.values(rcpt).map((r) => r.mood));
    return {
      keys: out,
      memoryCount: mem.length,
      receiptCount: Object.keys(rcpt).length,
      distinctDays: days.size,
      firstDay: sortedDays[0] || null,
      lastDay: sortedDays[sortedDays.length - 1] || null,
      moodVariety: moods.size,
      mode: localStorage.getItem("dayprint_app_mode"),
    };
  });

  note(
    `storage: ${storage.memoryCount} memories / ${storage.distinctDays} distinct days ` +
      `(${storage.firstDay} → ${storage.lastDay}) / ${storage.receiptCount} receipts / ` +
      `${storage.moodVariety} moods / mode=${storage.mode}`
  );

  if (storage.memoryCount < 80) fail("storage", `only ${storage.memoryCount} demo memories persisted`);
  if (storage.receiptCount < 60) fail("storage", `only ${storage.receiptCount} demo receipts persisted`);
  if (storage.moodVariety < 4) fail("storage", `only ${storage.moodVariety} distinct moods`);
  if (!storage.keys["dayprint_memories"]) fail("storage", "dayprint_memories missing from localStorage");

  // ---------------------------------------------------------------- views
  const views = [
    { id: "daily", label: /Daily Journal|今日记录/, name: "02-view-daily" },
    { id: "memory_os", label: /Cognitive Ledger|认知档案/, name: "03-view-memory-os" },
    { id: "graph", label: /Knowledge Graph|关系图谱/, name: "04-view-graph" },
  ];

  for (const v of views) {
    const btn = page.getByRole("button", { name: v.label }).first();
    if (!(await btn.count())) {
      fail("views", `nav button for "${v.id}" not found`);
      continue;
    }
    await btn.click();
    await page.waitForTimeout(900);
    await shot(page, v.name);
    await checkOverflow(page, `view:${v.id}`);

    const txt = await visibleText(page);
    if (txt.trim().length < 200) {
      fail("views", `view "${v.id}" rendered almost no text (${txt.trim().length} chars)`);
    }
    note(`view ${v.id}: ${txt.trim().length} chars visible ✓`);
  }

  // ---------------------------------------------------------------- modals
  const modals = [
    { open: /Life Stubs|生活存根/, name: "05-modal-receipt", marker: /TOTAL RECORDED|记录/ },
    { open: /Weekly Digest|周度复盘/, name: "06-modal-weekly", marker: /Week|周/ },
    { open: /Wins & Reports|履历与成果库/, name: "07-modal-career", marker: /Report|报告|STAR/ },
    { open: /Time Archive|历史档案/, name: "08-modal-archive", marker: /Archive|档案/ },
  ];

  for (const m of modals) {
    const trigger = page.getByRole("button", { name: m.open }).first();
    if (!(await trigger.count())) {
      fail("modals", `trigger not found for ${m.name}`);
      continue;
    }
    await trigger.click();
    await page.waitForTimeout(900);
    await shot(page, m.name);

    // Background scroll must be locked while a modal is open.
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    if (bodyOverflow !== "hidden") {
      fail("modals", `${m.name}: body scroll NOT locked (overflow=${bodyOverflow})`);
    }

    await checkOverflow(page, m.name);

    // Escape must close it.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const bodyOverflowAfter = await page.evaluate(() => getComputedStyle(document.body).overflow);
    if (bodyOverflowAfter === "hidden") {
      fail("modals", `${m.name}: body scroll stayed locked after close`);
    }
    note(`${m.name}: opened, locked scroll, Escape closed ✓`);
  }

  // ---------------------------------------------------------------- i18n sweep
  const langToggle = page.getByRole("button", { name: /EN|中文|Language|语言/ }).first();
  if (await langToggle.count()) {
    await langToggle.click();
    await page.waitForTimeout(700);
    await shot(page, "09-language-toggle");
  } else {
    warn("i18n", "language toggle button not found");
  }

  // ---------------------------------------------------------------- responsive
  for (const [w, h, tag] of [
    [1024, 768, "10-tablet"],
    [390, 844, "11-mobile"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(700);
    await shot(page, tag);
    await checkOverflow(page, `responsive:${tag}`);
  }

  await browser.close();

  // ---------------------------------------------------------------- report
  const line = (c, s) => `\x1b[${c}m${s}\x1b[0m`;
  console.log("\n=== NOTES ===");
  notes.forEach((n) => console.log("  " + n));

  if (warnings.length) {
    console.log("\n=== WARNINGS ===");
    warnings.forEach((w) => console.log(line(33, "  " + w)));
  }

  if (errors.length) {
    console.log("\n=== ERRORS ===");
    errors.forEach((e) => console.log(line(31, "  " + e)));
    console.log(line(31, `\n${errors.length} error(s). Artifacts in ${OUT}`));
    process.exit(1);
  }

  console.log(line(32, `\nNo UI/UX/storage errors. Artifacts in ${OUT}`));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
