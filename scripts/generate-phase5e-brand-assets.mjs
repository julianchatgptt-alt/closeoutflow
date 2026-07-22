import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "apps", "web", "public", "brand");
await mkdir(output, { recursive: true });

const detailedPaths = `
  <path d="M8 14v26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="square"/>
  <path d="M16 8h13l9 9-7 7" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M8 31h14l8 8 12-15" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="square" stroke-linejoin="miter"/>`;
const compactPaths = `
  <path d="M9 14v26" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="square"/>
  <path d="M17 8h12l9 9-7 7" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M9 31h13l8 8 12-15" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="square" stroke-linejoin="miter"/>`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();

async function capture({ file, width, height, body, transparent = false }) {
  await page.setViewportSize({ width: Math.max(width, 320), height: Math.max(height, 240) });
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:${transparent ? "transparent" : "#fff"}}
    #asset{width:${width}px;height:${height}px;overflow:hidden}
  </style></head><body><div id="asset">${body}</div></body></html>`);
  await page.locator("#asset").screenshot({
    path: path.join(output, file),
    omitBackground: transparent
  });
}

for (const size of [16, 32, 48]) {
  await capture({
    file: `favicon-${size}.png`,
    width: size,
    height: size,
    transparent: true,
    body: `<svg width="${size}" height="${size}" viewBox="0 0 48 48" style="display:block;color:#1D5AA6">${compactPaths}</svg>`
  });
}

async function captureAppIcon(file, size, maskable = false) {
  const markSize = maskable ? size * 0.48 : size * 0.6;
  const inset = (size - markSize) / 2;
  await capture({
    file,
    width: size,
    height: size,
    body: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;background:#1D5AA6;color:white"><g transform="translate(${inset} ${inset}) scale(${markSize / 48})">${compactPaths}</g></svg>`
  });
}

await captureAppIcon("apple-touch-icon.png", 180);
await captureAppIcon("icon-192.png", 192);
await captureAppIcon("icon-512.png", 512);
await captureAppIcon("icon-maskable-512.png", 512, true);
await captureAppIcon("social-avatar.png", 512);

await capture({
  file: "email-header.png",
  width: 320,
  height: 80,
  transparent: true,
  body: `<div style="width:320px;height:80px;display:flex;align-items:center;gap:18px;color:#1D5AA6;font-family:Arial,sans-serif"><svg width="48" height="48" viewBox="0 0 48 48">${detailedPaths}</svg><span style="color:#111827;font-size:30px;font-weight:700;letter-spacing:-.8px">Closeout</span></div>`
});

await capture({
  file: "opengraph.png",
  width: 1200,
  height: 630,
  body: `<div style="width:1200px;height:630px;padding:76px 88px;background:#102238;color:white;font-family:Arial,sans-serif;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden">
    <div style="display:flex;align-items:center;gap:20px"><svg width="58" height="58" viewBox="0 0 48 48" style="color:#8BB6E8">${detailedPaths}</svg><span style="font-size:34px;font-weight:700;letter-spacing:-1px">Closeout</span></div>
    <div><div style="font-size:16px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:#9BB8D6">Construction closeout, organized</div><div style="margin-top:24px;max-width:820px;font-size:68px;line-height:1.05;font-weight:700;letter-spacing:-2.6px">Every record ready for handoff.</div><div style="margin-top:30px;font-size:22px;color:#C7D5E4">closeoutflow.com</div></div>
    <svg width="520" height="520" viewBox="0 0 48 48" style="position:absolute;right:-120px;bottom:-170px;color:rgba(255,255,255,.045)">${detailedPaths}</svg>
  </div>`
});

await context.close();
await browser.close();
console.log("Generated Phase 5E brand assets in", output);
