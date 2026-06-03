#!/usr/bin/env node
/*
 * render.mjs -- Social Card standalone renderer
 *
 *   node scripts/render.mjs <task-dir> [--parallel N] [--board xhs|square|wide]
 *                                   [--device-scale 1|2] [--no-remote-fonts]
 *
 * Finds index.html in the task dir, screenshots every .poster section,
 * and saves PNGs to output/. Supports concurrent rendering.
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const args = process.argv.slice(2);
let taskDir = null;
let parallel = 1;
let boardFilter = null;
let deviceScale = 1;
let noRemoteFonts = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--parallel" && args[i + 1]) { parallel = parseInt(args[++i], 10) || 1; }
  else if (a === "--board" && args[i + 1]) { boardFilter = args[++i]; }
  else if (a === "--device-scale" && args[i + 1]) { deviceScale = parseFloat(args[++i]) || 1; }
  else if (a === "--no-remote-fonts") { noRemoteFonts = true; }
  else if (!taskDir) { taskDir = a; }
}

if (!taskDir) {
  console.error("usage: node scripts/render.mjs <task-dir> [--parallel N] [--board xhs|square|wide] [--device-scale 1|2] [--no-remote-fonts]");
  process.exit(2);
}

const absDir = path.resolve(taskDir);
const htmlPath = path.join(absDir, "index.html");
if (!fs.existsSync(htmlPath)) {
  console.error(`not found: ${htmlPath}`);
  process.exit(2);
}

const outputDir = path.join(absDir, "output");
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

// Discover posters
const probeCtx = await browser.newContext({ viewport: { width: 1400, height: 1700 } });
const probePage = await probeCtx.newPage();
await probePage.goto("file://" + htmlPath, { waitUntil: "networkidle", timeout: 30000 });
await probePage.waitForTimeout(noRemoteFonts ? 500 : 1500);

const posters = await probePage.evaluate((filter) => {
  const all = [...document.querySelectorAll("section.poster")].map(el => ({
    id: el.id || "",
    board: el.classList.contains("xhs") ? "xhs"
      : el.classList.contains("square") ? "square"
      : el.classList.contains("wide") ? "wide"
      : "unknown"
  }));
  return filter ? all.filter(p => p.board === filter) : all;
}, boardFilter);

await probeCtx.close();

if (posters.length === 0) {
  console.log("No posters found. Done.");
  await browser.close();
  process.exit(0);
}

console.log(`Task:    ${path.relative(process.cwd(), htmlPath)}`);
console.log(`Posters: ${posters.length}${boardFilter ? " (board=" + boardFilter + ")" : ""}`);
if (deviceScale !== 1) console.log(`Scale:   ${deviceScale}x`);
console.log(`Parallel: ${parallel}`);
console.log("");

async function renderPoster(contextFactory, poster, idx, total) {
  const ctx = await contextFactory();
  const page = await ctx.newPage();

  if (noRemoteFonts) {
    await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, route => route.abort());
  }

  const start = Date.now();
  await page.goto("file://" + htmlPath, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  const el = await page.$(`#${poster.id}`);
  if (!el) {
    console.log(`  [${idx}/${total}] SKIP  #${poster.id}`);
    await ctx.close();
    return { id: poster.id, ok: false, ms: Date.now() - start };
  }

  const outName = `${poster.id.replace(/[^a-zA-Z0-9_-]/g, "-")}.png`;
  const outPath = path.join(outputDir, outName);
  await el.screenshot({ path: outPath, type: "png" });
  const elapsed = Date.now() - start;
  console.log(`  [${idx}/${total}] OK    ${outName}  (${elapsed}ms)`);
  await ctx.close();
  return { id: poster.id, ok: true, ms: elapsed, path: outPath };
}

// Parallel rendering with browser contexts
const totalStart = Date.now();
let idx = 1;

for (let i = 0; i < posters.length; i += parallel) {
  const batch = posters.slice(i, i + parallel);
  const contexts = batch.map(() => browser.newContext({
    viewport: { width: 2200, height: 1600 },
    deviceScaleFactor: deviceScale,
  }));
  await Promise.all(batch.map((p, bi) => renderPoster(
    () => Promise.resolve(contexts[bi]), p, idx++, posters.length
  )));
  for (const c of contexts) await c.close();
}

const totalMs = Date.now() - totalStart;
const totalSec = (totalMs / 1000).toFixed(1);
console.log(`\nDone: ${posters.length} posters in ${totalSec}s`);
if (parallel > 1) console.log(`(${parallel}-way parallel)`);
console.log(`Output: ${outputDir}`);

await browser.close();
