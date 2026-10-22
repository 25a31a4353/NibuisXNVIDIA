const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

test("dashboard IDs are unique and static ID selectors resolve", () => {
  const ids = [...html.matchAll(/\bid="([^\"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 50); assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  const known = new Set(ids); const dynamicOnly = new Set(["copyPatch", "downloadPatch"]);
  const refs = [...js.matchAll(/\$\(['\"]#([A-Za-z][A-Za-z0-9_-]*)['\"]\)/g)].map(m => m[1]);
  assert.deepEqual([...new Set(refs.filter(id => !known.has(id) && !dynamicOnly.has(id)))], []);
});

test("core developer workflow and truthful model states remain visible", () => {
  for (const phrase of ["Task intake", "Nemotron inference", "Report validation", "Human verification", "NVIDIA Nemotron", "Nebius Token Factory"]) assert.ok(html.includes(phrase), "Missing: " + phrase);
  assert.match(js, /DEMO RESULT/);
  assert.doesNotMatch(html, /AGENT ORCHESTRATION/);
  assert.match(html, /One model request/);
  assert.match(html, /PIPELINE STEPS/);
  assert.doesNotMatch(html, /04 <small>agents<\/small>/);
  assert.match(html, /id="confidenceLabel"/);
  assert.match(html, /id="confidenceNote"/);
  assert.match(js, /DEMO PLACEHOLDER/);
  assert.match(js, /No live score in demo mode/);
  assert.match(html, /MODEL SELF-RATING/); assert.match(js, /LIVE INFERENCE/); assert.match(js, /SAMPLE/);
});

test("responsive and accessibility refinements are present", () => {
  assert.match(css, /@media\(max-width:740px\)/); assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/); assert.match(html, /aria-label="Engineering task"/);
  assert.match(html, /aria-modal="true"/); assert.match(html, /aria-live="polite"/);
});

test("Next App Router and Vercel deployment files are complete", () => {
  assert.ok(fs.existsSync(path.join(root, "app/page.tsx")));
  assert.ok(fs.existsSync(path.join(root, "app/api/run/route.ts")));
  assert.ok(fs.existsSync(path.join(root, "public/app.js")));
  assert.ok(fs.existsSync(path.join(root, "public/styles.css")));
  assert.equal(fs.readFileSync(path.join(root, "app.js"), "utf8"), fs.readFileSync(path.join(root, "public/app.js"), "utf8"));
  assert.equal(fs.readFileSync(path.join(root, "styles.css"), "utf8"), fs.readFileSync(path.join(root, "public/styles.css"), "utf8"));
  assert.ok(fs.existsSync(path.join(root, "scripts/sync-assets.cjs")));
  assert.ok(vercel.functions["api/run.js"]); assert.ok(vercel.functions["api/health.js"]);
  const headers = vercel.headers[0].headers.map(h => h.key.toLowerCase());
  for (const h of ["x-content-type-options", "referrer-policy", "x-frame-options"]) assert.ok(headers.includes(h));
});
