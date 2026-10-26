#!/usr/bin/env node
/**
 * Dayprint i18n 一致性审计 / Language Consistency Audit
 *
 * 用途：把「语言一致性」从口头约定变成可执行的门禁。
 *
 * 用法：
 *   node scripts/audit-i18n.mjs                 # 审计并与基线对比，指标变差则 exit 1
 *   node scripts/audit-i18n.mjs --write-baseline # 首次建立 / 有意接受当前水位时重写基线
 *   node scripts/audit-i18n.mjs --json           # 机器可读输出
 *
 * 设计原则：**棘轮（ratchet）**。不要求立刻修好，只要求不再变差。
 * 每次重构把某个文件的三元改成 t() 之后，重跑 --write-baseline 把水位降下来。
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const BASELINE_PATH = join(ROOT, "scripts", "i18n-baseline.json");
const I18N_PATH = join(SRC, "lib", "i18n.ts");

const args = process.argv.slice(2);
const WRITE_BASELINE = args.includes("--write-baseline");
const JSON_OUT = args.includes("--json");

// ---------------------------------------------------------------- file walking

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(SRC);

// ---------------------------------------------------------------- i18n keys

function parseI18nKeys() {
  if (!existsSync(I18N_PATH)) return [];
  const src = readFileSync(I18N_PATH, "utf8");
  // 只取 en: { ... } 块内的 key
  const enStart = src.indexOf("en: {");
  if (enStart === -1) return [];
  const zhStart = src.indexOf("zh: {", enStart);
  const block = src.slice(enStart, zhStart === -1 ? undefined : zhStart);
  return [...block.matchAll(/^\s{4}([a-z][a-z0-9_]*)\s*:/gm)].map((m) => m[1]);
}

const I18N_KEYS = parseI18nKeys();

// ---------------------------------------------------------------- per-file scan

const RE = {
  // 内联三元：language === "zh" / language==='zh'
  trilingual: /language\s*===\s*["']zh["']/g,
  // t.key
  keyAccess: /\bt\.([a-z][a-z0-9_]*)\b/g,
  // t[`memory_type_${x}`] —— 动态访问，视为使用全部 memory_type_*
  dynamicKey: /\bt\[\s*`memory_type_\$\{/g,
  // 未指定 locale 的日期格式化
  localeBare: /toLocale(?:Date|Time)?String\s*\(\s*(?:\)|undefined)/g,
  // JSX 里直接读原始字段（未走 getLocalized*）
  rawField: /\{\s*(?:m|mem|memory|item|target|neighbor|res\.memory)\.(?:title|content)\s*\}/g,
  // 硬编码中文字符串字面量（含至少 2 个汉字）
  cjkLiteral: /"[^"]*[\u4e00-\u9fa5]{2,}[^"]*"/g,
};

const perFile = [];
const dynamicKeyFiles = new Set();
const usedKeys = new Set();
const KEY_SET = new Set(I18N_KEYS);

// 数据/提示词文件不是 UI 文案，不计入「中文字面量」债务
const DATA_FILES = new Set([
  "src/types/memory.ts",
  "src/lib/seed.ts",
  "src/lib/i18n.ts",
  "src/lib/translator.ts",
  "src/lib/vault-parser.ts",
]);

const isUI = (rel) => rel.startsWith("src/components/");

for (const file of files) {
  const rel = relative(ROOT, file);
  // 先去掉注释再扫。否则文档注释里写的 `toLocaleDateString()` 会被当成真实调用，
  // 于是「修复了这个问题」反而让数字变差，棘轮就变成了噪音。
  const src = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  const trilingual = (src.match(RE.trilingual) || []).length;
  const localeBare = (src.match(RE.localeBare) || []).length;
  // rawField / cjkLiteral 只在 UI 组件里才算问题
  const rawField = isUI(rel) ? (src.match(RE.rawField) || []).length : 0;
  const cjkLiteral = isUI(rel) && !DATA_FILES.has(rel) ? (src.match(RE.cjkLiteral) || []).length : 0;

  let keyAccess = 0;
  for (const m of src.matchAll(RE.keyAccess)) {
    // 过滤误报：循环变量 t 的 t.trim() / t.length 等
    if (!KEY_SET.has(m[1])) continue;
    keyAccess++;
    usedKeys.add(m[1]);
  }
  if (RE.dynamicKey.test(src)) {
    dynamicKeyFiles.add(rel);
    for (const k of I18N_KEYS) if (k.startsWith("memory_type_")) usedKeys.add(k);
  }

  if (trilingual || localeBare || rawField || keyAccess || cjkLiteral) {
    perFile.push({ file: rel, trilingual, localeBare, rawField, cjkLiteral, keyAccess });
  }
}

perFile.sort((a, b) => b.trilingual - a.trilingual || b.cjkLiteral - a.cjkLiteral);

const totals = perFile.reduce(
  (acc, f) => {
    acc.trilingual += f.trilingual;
    acc.localeBare += f.localeBare;
    acc.rawField += f.rawField;
    acc.cjkLiteral += f.cjkLiteral;
    acc.keyAccess += f.keyAccess;
    return acc;
  },
  { trilingual: 0, localeBare: 0, rawField: 0, cjkLiteral: 0, keyAccess: 0 }
);

const unusedKeys = I18N_KEYS.filter((k) => !usedKeys.has(k));

// <html lang> 是否为硬编码
const layoutPath = join(SRC, "app", "layout.tsx");
let htmlLang = null;
let htmlLangSynced = false;
if (existsSync(layoutPath)) {
  const layoutSrc = readFileSync(layoutPath, "utf8");
  const m = layoutSrc.match(/<html[^>]*\blang=["']([^"']+)["']/);
  htmlLang = m ? m[1] : null;
  // SSR 必须有一个静态默认值（否则 hydration 会不匹配），真正的语言在客户端补。
  // 只要 layout 挂载了 LocaleHtmlLang，这个默认值就是「首帧占位」而非缺陷。
  htmlLangSynced = /LocaleHtmlLang/.test(layoutSrc);
}

// ---------------------------------------------------------------- baseline

const current = {
  generatedAt: new Date().toISOString().slice(0, 10),
  totals,
  i18n: { totalKeys: I18N_KEYS.length, usedKeys: usedKeys.size, unusedKeys: unusedKeys.length },
  htmlLang,
  files: Object.fromEntries(
    perFile.map((f) => [f.file, { trilingual: f.trilingual, cjkLiteral: f.cjkLiteral, localeBare: f.localeBare }])
  ),
};

if (JSON_OUT) {
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

// ---------------------------------------------------------------- report

const pad = (s, n) => String(s).padEnd(n);
const num = (n, n2 = 6) => String(n).padStart(n2);

console.log("\n\x1b[1mDayprint i18n 一致性审计\x1b[0m\n");

console.log("\x1b[1m1. 内联三元 language === \"zh\"（应逐步下降）\x1b[0m");
console.log(`   ${pad("文件", 52)} ${pad("三元", 6)} ${pad("中文字面量", 10)} ${pad("裸 locale", 10)}`);
console.log("   " + "-".repeat(80));
for (const f of perFile.filter((f) => f.trilingual > 0)) {
  console.log(`   ${pad(f.file.replace("src/components/", ""), 52)} ${num(f.trilingual)} ${num(f.cjkLiteral, 10)} ${num(f.localeBare, 10)}`);
}
console.log("   " + "-".repeat(80));
console.log(`   ${pad("合计", 52)} ${num(totals.trilingual)} ${num(totals.cjkLiteral, 10)} ${num(totals.localeBare, 10)}\n`);

console.log("\x1b[1m2. i18n.ts 字典覆盖率\x1b[0m");
const cov = I18N_KEYS.length ? ((usedKeys.size / I18N_KEYS.length) * 100).toFixed(0) : "0";
console.log(`   总 key ${I18N_KEYS.length} ｜ 被消费 ${usedKeys.size}（${cov}%）｜ 从未被读 ${unusedKeys.length}\n`);

if (unusedKeys.length) {
  console.log("   \x1b[2m未被消费的 key：\x1b[0m");
  const lines = [];
  for (let i = 0; i < unusedKeys.length; i += 6) lines.push("   " + unusedKeys.slice(i, i + 6).join(", "));
  console.log(lines.join("\n") + "\n");
}

console.log("\x1b[1m3. 结构性缺陷\x1b[0m");
console.log(
  `   <html lang> = ${
    htmlLang === null
      ? "\x1b[33m未找到\x1b[0m"
      : `"${htmlLang}"` +
        (htmlLangSynced
          ? "  \x1b[32m← SSR 默认值，运行时由 LocaleHtmlLang 跟随语言切换\x1b[0m"
          : "  \x1b[31m← 硬编码，不随语言切换\x1b[0m")
  }`
);
const bareFiles = perFile.filter((f) => f.localeBare > 0);
if (bareFiles.length) {
  console.log(`   裸 toLocale*String() 共 ${totals.localeBare} 处 → 跟随系统语言而非 app 语言：`);
  for (const f of bareFiles) console.log(`     · ${f.file} (${f.localeBare})`);
}
const rawFiles = perFile.filter((f) => f.rawField > 0);
if (rawFiles.length) {
  console.log(`   JSX 直读原始 .title/.content 共 ${totals.rawField} 处 → 可能绕过 getLocalized*：`);
  for (const f of rawFiles) console.log(`     · ${f.file} (${f.rawField})`);
} else {
  console.log("   \x1b[32m✓\x1b[0m JSX 未发现直读原始 .title/.content（均走 getLocalized*）");
}
console.log();

// ---------------------------------------------------------------- ratchet

if (WRITE_BASELINE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + "\n");
  console.log(`\x1b[32m✓ 基线已写入 ${relative(ROOT, BASELINE_PATH)}\x1b[0m\n`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.log("\x1b[33m⚠ 尚无基线。首次运行请执行：node scripts/audit-i18n.mjs --write-baseline\x1b[0m\n");
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const regressions = [];

for (const key of ["trilingual", "cjkLiteral", "localeBare", "rawField"]) {
  const was = baseline.totals[key] ?? 0;
  const now = totals[key];
  if (now > was) regressions.push(`${key}: ${was} → ${now}  (+${now - was})`);
}

for (const [file, m] of Object.entries(current.files)) {
  const b = baseline.files[file];
  if (!b) {
    if (m.trilingual > 0) regressions.push(`新文件带 ${m.trilingual} 处三元: ${file}`);
    continue;
  }
  if (m.trilingual > b.trilingual) regressions.push(`${file}: 三元 ${b.trilingual} → ${m.trilingual}`);
}

const improvements = [];
for (const [file, b] of Object.entries(baseline.files)) {
  const m = current.files[file];
  if (!m) { improvements.push(`${file}: 已删除`); continue; }
  if (m.trilingual < b.trilingual) improvements.push(`${file}: 三元 ${b.trilingual} → ${m.trilingual}`);
}
if (totals.trilingual < (baseline.totals.trilingual ?? 0)) {
  improvements.push(`合计三元 ${baseline.totals.trilingual} → ${totals.trilingual}（-${baseline.totals.trilingual - totals.trilingual}）`);
}

if (improvements.length) {
  console.log("\x1b[32m\x1b[1m✓ 改善\x1b[0m");
  for (const i of improvements) console.log(`   ${i}`);
  console.log("   \x1b[2m→ 记得重跑 --write-baseline 把水位降下来\x1b[0m\n");
}

if (regressions.length) {
  console.log("\x1b[31m\x1b[1m✗ 退步（棘轮拒绝）\x1b[0m");
  for (const r of regressions) console.log(`   ${r}`);
  console.log("\n   新增文案请走 t()，不要新增 language === \"zh\" 三元。\n");
  process.exit(1);
}

console.log(`\x1b[32m✓ 无退步\x1b[0m（基线 ${baseline.generatedAt}）\n`);
