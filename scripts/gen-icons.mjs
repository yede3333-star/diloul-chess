#!/usr/bin/env node
/**
 * Generates the PWA / home-screen PNG icons from the original logo drawing (public/brand/logo-mark.svg).
 * Run after changing the logo: node scripts/gen-icons.mjs  (uses Playwright's Chromium to rasterize).
 */
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const svg = await readFile(new URL("../public/brand/logo-mark.svg", import.meta.url), "utf8");
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

// Full-bleed variant (maskable / Apple): no rounded clip; sky and dunes fill the square, while the
// pawn and star (everything after the second dune) shrink toward the center so they stay inside
// the 80% safe circle that Android masks with.
const unclipped = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/, "").replace(' clip-path="url(#c)"', "");
const parts = unclipped.split(/(?=<circle )/);
const fullBleed = `${parts[0]}<g transform="translate(24 30) scale(0.82) translate(-24 -30)">${parts.slice(1).join("").replace("</g></svg>", "</g></g></svg>")}`;

const variants = [
  // "any" icons keep the rounded tile on a transparent background.
  { name: "icon-192.png", size: 192, html: svg, pad: 0 },
  { name: "icon-512.png", size: 512, html: svg, pad: 0 },
  // Maskable: full-bleed drawing; the pawn and star already sit inside the 80% safe circle.
  { name: "icon-maskable-512.png", size: 512, html: fullBleed, pad: 0, bg: true },
  // Apple touch icon: square, opaque (iOS adds its own rounding).
  { name: "apple-touch-icon.png", size: 180, html: fullBleed, pad: 0, bg: true },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const v of variants) {
  const inner = Math.round(v.size * (1 - 2 * v.pad));
  await page.setViewportSize({ width: v.size, height: v.size });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:${v.size}px;height:${v.size}px;display:grid;place-items:center;background:${v.bg ? "linear-gradient(#323b78,#141831)" : "transparent"}">
    <div style="width:${inner}px;height:${inner}px">${v.html.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: out(v.name), omitBackground: !v.bg });
  console.log("wrote", v.name);
}
await browser.close();
