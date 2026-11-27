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
  css += (await res.text()) + "\n";
}

const page = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
${external.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n")}
<style>
:root{color-scheme:dark}
${css}
</style>
${body}
`;

await writeFile(out, page);
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB, ${local.length} CSS files inlined)`);
