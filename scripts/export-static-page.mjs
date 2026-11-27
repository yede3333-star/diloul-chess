#!/usr/bin/env node
/**
 * Exports a rendered page (one that needs no JavaScript, like /dev/design) as a single
 * self-contained HTML fragment: the page's own CSS is inlined and Next's scripts are dropped.
 * Used to share a quick preview link before Vercel is connected.
 *
 * Usage: node scripts/export-static-page.mjs <url> <out.html> "<title>"
 * Requires the app to be running (next start).
 */
import { writeFile } from "node:fs/promises";

const [url, out, title = "Diloul"] = process.argv.slice(2);
if (!url || !out) {
  console.error('Usage: node scripts/export-static-page.mjs <url> <out.html> "<title>"');
  process.exit(1);
}

const origin = new URL(url).origin;
const html = await (await fetch(url)).text();

const head = html.slice(0, html.indexOf("<body"));
const bodyStart = html.indexOf(">", html.indexOf("<body")) + 1;
let body = html.slice(bodyStart, html.lastIndexOf("</body>"));

// Drop Next's runtime: scripts and preload hints.
body = body.replace(/<script\b[\s\S]*?<\/script>/g, "").replace(/<link rel="preload"[^>]*>/g, "");

const links = [...head.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g)].map((m) => m[1].replaceAll("&amp;", "&"));
const external = links.filter((h) => h.startsWith("http"));
const local = links.filter((h) => h.startsWith("/"));

let css = "";
for (const href of local) {
  const res = await fetch(origin + href);
  if (!res.ok) throw new Error(`CSS ${href} → ${res.status}`);
  // Make url(...) references absolute (they are relative to the CSS file).
  const text = (await res.text()).replace(/url\((?!data:|https?:)([^)]+)\)/g, (_, u) => `url(${new URL(u, origin + href).pathname})`);
  css += text + "\n";
}

// Self-hosted fonts (next/font) and other local assets referenced from CSS become data: URIs.
const assetUrls = [...new Set([...css.matchAll(/url\((\/_next\/[^)]+)\)/g)].map((m) => m[1]))];
let inlinedBytes = 0;
for (const u of assetUrls) {
  const res = await fetch(origin + u);
  if (!res.ok) throw new Error(`Asset ${u} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  inlinedBytes += buf.length;
  const type = u.endsWith(".woff2") ? "font/woff2" : res.headers.get("content-type") ?? "application/octet-stream";
  css = css.replaceAll(`url(${u})`, `url(data:${type};base64,${buf.toString("base64")})`);
}
if (assetUrls.length) console.log(`Inlined ${assetUrls.length} assets (${(inlinedBytes / 1024).toFixed(0)} KB)`);

// Classes and attributes on <html> (next/font variables, lang, dir) are lost in a fragment:
// font-variable classes become :root, and lang/dir move to a wrapper.
const htmlTag = html.match(/<html[^>]*>/)?.[0] ?? "";
const htmlClasses = (htmlTag.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter(Boolean);
for (const c of htmlClasses) css = css.replaceAll(`.${c}{`, ":root{").replaceAll(`.${c} {`, ":root {");
const lang = htmlTag.match(/lang="([^"]*)"/)?.[1] ?? "ar";
const dir = htmlTag.match(/dir="([^"]*)"/)?.[1] ?? "rtl";

const page = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
${external.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n")}
<style>
:root{color-scheme:dark}
${css}
</style>
<div lang="${lang}" dir="${dir}">
${body}
</div>
`;

await writeFile(out, page);
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB, ${local.length} CSS files inlined)`);
