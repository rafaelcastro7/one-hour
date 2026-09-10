import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { duration, FFDIR } from "./ff.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DEMO_BASE || "https://onehour-vn98.onrender.com";
const RUN = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const VIDEO_DIR = path.join(HERE, "video", RUN);
mkdirSync(VIDEO_DIR, { recursive: true });
process.env.FFMPEG_DIR = FFDIR; // playwright recordVideo uses bundled ffmpeg; keep explicit

const CURSOR = readFileSync(path.join(HERE, "cursor.js"), "utf8");
const SPANISH_NEED =
  "Mi base de datos Postgres se queda sin conexiones cuando hay mucha carga y no sé cómo diagnosticarlo.";

const DUR = {};
for (const f of ["s1", "s2a", "s2b", "s2c", "s2d", "s3a", "s3b", "s3c", "s3d", "s4", "s5"]) {
  DUR[f] = duration(path.join(HERE, "audio", `${f}.mp3`));
}
console.log("narration durations:", JSON.stringify(DUR));

const only = new Set(process.argv.slice(2));
const events = [];
const scenes = {};

let browser;
let t0 = 0;

function log(scene, key) {
  const t = (Date.now() - t0) / 1000;
  events.push({ scene, key, t });
  console.log(`  [${scene}] cue "${key}" @ ${t.toFixed(2)}s`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function move(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(180);
}

async function recordScene(name, fn) {
  if (only.size && !only.has(name)) return;
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => console.error(`[${name}] pageerror:`, e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error(`[${name}] console.error:`, m.text());
  });
  t0 = Date.now();
  console.log(`-- recording scene ${name}`);
  try {
    await fn(page, ctx);
  } catch (err) {
    console.error(`SCENE ${name} FAILED:`, err);
    try { await ctx.close(); } catch {}
    throw err;
  }
  const video = page.video();
  try { await ctx.close(); } catch (e) { console.error("ctx close:", e.message); }
  const videoPath = video ? await video.path() : null;
  scenes[name] = {
    video: videoPath.replaceAll("\\", "/"),
    end: (Date.now() - t0) / 1000,
  };
  console.log(`++ scene ${name} done: ${scenes[name].end.toFixed(2)}s -> ${videoPath}`);
}

async function scene1(page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 60000 });
  await sleep(1200);
  log("s1", "s1");
  await move(page, page.locator("h1"));
  await sleep(DUR.s1 * 1000);
  await move(page, page.getByRole("link", { name: /need help|necesito ayuda/i }).first());
  await sleep(1200);
}

async function scene2(page) {
  await page.setDefaultTimeout(30000);
  const cta = page.getByRole("link", { name: /need help|necesito ayuda/i }).first();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 60000 });
  await sleep(800);
  await move(page, cta);
  await page.getByRole("link", { name: /need help|necesito ayuda/i }).first().click();
  await page.waitForSelector('input[type="checkbox"]', { timeout: 20000 });
  await sleep(600);
  const cb = page.locator('input[type="checkbox"]').first();
  await move(page, cb);
  await cb.click({ force: false });
  await sleep(250);
  const cont = page.getByRole("button", { name: /continue|continuar/i }).first();
  await move(page, cont);
  await cont.click();
  await page.waitForSelector("#intake-input", { timeout: 20000 });
  await sleep(600);
  log("s2", "s2a");
  await sleep(DUR.s2a * 1000);
  const input = page.locator("#intake-input");
  await move(page, input);
  await input.click();
  await page.keyboard.type(SPANISH_NEED, { delay: 42 });
  await sleep(400);
  await page.keyboard.press("Enter");
  const formSel = "#req-name";
  for (let turn = 0; turn < 4; turn++) {
    const gotForm = await page
      .waitForSelector(formSel, { state: "visible", timeout: 14000 })
      .then(() => true)
      .catch(() => false);
    if (gotForm) break;
    const stillChat = await page.locator("#intake-input").isVisible().catch(() => false);
    if (!stillChat) continue;
    const inp = page.locator("#intake-input");
    await move(page, inp);
    await inp.click();
    await page.keyboard.type("Sí, exactamente eso, necesito ayuda con eso.", { delay: 35 });
    await page.keyboard.press("Enter");
  }
  await page.waitForSelector(formSel, { state: "visible", timeout: 25000 });
  await sleep(500);
  const name = page.locator("#req-name");
  await move(page, name);
  await name.click();
  await page.keyboard.type("John Smith", { delay: 60 });
  const email = page.locator("#req-email");
  await move(page, email);
  await email.click();
  await page.keyboard.type(`john.${Date.now().toString(36)}@example.com`, { delay: 45 });
  await page.waitForTimeout(400);
  const submit = page.getByRole("button", { name: /find my match|buscar mi match/i });
  await move(page, submit);
  await submit.click();
  await page.waitForFunction(() => location.pathname.startsWith("/status"), { timeout: 60000 });
  log("s2", "s2b");
  const MATCH_RE = /we found a match|encontramos una coincidencia/i;
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => document.body.innerText);
    if (MATCH_RE.test(state)) break;
    const failureHint = /(didn't respond|did not respond|matching service|couldn't create|failed)/i.test(state);
    const retryHint = /(try again|volver a intentar|intentalo)/i.test(state);
    if (failureHint && retryHint) {
      const lines = state
        .split("\n")
        .filter((l) => /respond|failed|try again|volver/i.test(l))
        .slice(0, 4)
        .join(" | ");
      throw new Error(`Request reached a failure state: ${lines}`);
    }
    await sleep(1200);
  }
  await page.waitForSelector("text=/We found a match|Encontramos una coincidencia/i", { timeout: 15000 });
  await sleep(300);
  log("s2", "s2c");
  await page.waitForTimeout(5200);
  const confirm = page.getByRole("button", { name: /confirm and schedule|confirmar y agendar/i });
  await move(page, confirm);
  await confirm.click();
  await page.waitForSelector("a[target='_blank'] >> text=/Join the video call|Unirse a la videollamada/i", {
    timeout: 20000,
  });
  await sleep(200);
  log("s2", "s2d");
  const join = page.getByRole("link", { name: /join the video call|unirse a la videollamada/i });
  await move(page, join);
  await sleep(DUR.s2d * 1000 + 2200);
  await page.waitForTimeout(800);
  const confirmed = await page.evaluate(() => document.body.innerText);
  console.log("  [s2] confirmed-state:", /match confirmed|confirmado|confirmed/i.test(confirmed) ? "OK" : "MISSING");
}

async function scene3(page) {
  await page.goto(BASE + "/eval", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=/accuracy|exactitud/i", { timeout: 30000 });
  await sleep(600);
  log("s3", "s3a");
  const mightHaveAdversarial = await page
    .waitForSelector("text=/Adversarial case|Ataque|adversarial/i", { timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  await sleep((DUR.s3a - 1) * 1000);
  await page.evaluate(() => window.scrollBy(0, 320));
  await sleep(300);
  log("s3", "s3b");
  if (mightHaveAdversarial) {
    await page.waitForTimeout(DUR.s3b * 1000 * 0.4);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(DUR.s3b * 1000 * 0.6);
  } else {
    await sleep(DUR.s3b * 1000);
  }
  await sleep(250);
  log("s3", "s3c");
  await sleep(DUR.s3c * 1000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(250);
  log("s3", "s3d");
  await sleep(DUR.s3d * 1000 + 1300);
}

async function scene4(page) {
  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  await sleep(600);
  const keyField = page.locator('input[type="password"]');
  await move(page, keyField);
  await keyField.click();
  const key = process.env.ADMIN_APPROVAL_KEY_DEMO;
  if (key) {
    await page.keyboard.type(key, { delay: 55 });
    await page
      .waitForSelector("text=/Quiz:|pending approval|pendiente de aprobación|LinkedIn|No LinkedIn/i", {
        timeout: 12000,
      })
      .catch(() => console.warn("[s4] no pending indicator seen"));
  }
  await sleep(400);
  log("s4", "s4");
  await sleep(DUR.s4 * 1000 - 1200);
  const firstCard = page.locator("main >> text=/Quiz:/i").first();
  await move(page, firstCard);
  await sleep(1500);
}

async function scene5(page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 60000 });
  await sleep(1000);
  log("s5", "s5");
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  await sleep(DUR.s5 * 1000 * 0.5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(DUR.s5 * 1000 * 0.6);
}

async function main() {
  const warm = await fetch(BASE + "/").catch(() => null);
  if (warm) console.log("warmed:", BASE, warm.status);
  browser = await chromium.launch();
  try {
    for (const [name, fn] of [
      ["s1", scene1],
      ["s2", scene2],
      ["s3", scene3],
      ["s4", scene4],
      ["s5", scene5],
    ]) {
      if (!only.size || only.has(name)) await recordScene(name, fn);
    }
  } finally {
    await browser.close();
  }
  const timeline = { run: RUN, base: BASE, events, scenes, narration: DUR };
  writeFileSync(path.join(HERE, "timeline.json"), JSON.stringify(timeline, null, 2));
  console.log("timeline written to demo/timeline.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});