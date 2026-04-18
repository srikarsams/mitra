#!/usr/bin/env node
// Parser regression harness.
//
// Extracts all inline <script> blocks from index.html, stubs browser globals,
// evaluates the bundle, then invokes runParserFixtures(). Exits non-zero on
// fixture failure so CI fails loudly.
//
// Run: `node scripts/test-parser.js` (from apps/mithra/).
//
// CommonJS on purpose — ESM forces strict mode, and strict-mode `eval` doesn't
// hoist function declarations to globalThis, which we need for runParserFixtures
// to be callable after eval'ing index.html's inline scripts.

const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const blocks = [];
let m;
while ((m = scriptRe.exec(html))) blocks.push(m[1]);

if (!blocks.length) {
  console.error('No inline <script> blocks found in index.html');
  process.exit(2);
}

const bundle = blocks.join('\n;\n');

// Minimal browser stubs — enough for the parser code to evaluate at top level.
// The fixtures never touch pdf.js / IndexedDB / Alpine / the DOM.
globalThis.window = { pdfjsLib: null };
globalThis.document = {
  addEventListener: () => {},
  createElement: () => ({ click: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  head: { appendChild: () => {} },
};
globalThis.location = { search: '' };
globalThis.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
globalThis.Blob = class {};
globalThis.Dexie = function () {
  return { version: () => ({ stores: () => this }), transaction: async () => {} };
};
globalThis.Alpine = { store: () => {}, data: () => {} };
globalThis.tailwind = { config: {} };
globalThis.fetch = () => Promise.reject(new Error('fetch disabled in tests'));
globalThis.indexedDB = {};

// eslint-disable-next-line no-eval
eval(bundle);

if (typeof runParserFixtures !== 'function') {
  console.error('runParserFixtures is not defined after evaluating index.html');
  process.exit(2);
}

const result = runParserFixtures();
if (!result || typeof result.passed !== 'number') {
  console.error('runParserFixtures returned an unexpected value:', result);
  process.exit(2);
}

// Sidecar: replay every sanitised diagnostic JSON in ./fixtures/ through the
// parser and check the output still matches the recorded funds + metadata.
// This lets you regression-test against a real CAS you imported once — without
// ever running the dev server or committing a PDF.
//
// Workflow:
//   1. Import your CAS in the browser.
//   2. Settings → About → Export Diagnostic. Save the downloaded JSON into
//      `fixtures/`. Rename to something descriptive (e.g. `my-cams-2026.json`).
//   3. Run `node scripts/test-parser.js` — this replay is added to the suite.
//
// The fixtures folder is gitignored by default. If the diagnostic is clean
// enough to share, un-ignore it and it becomes a CI regression test for
// everyone.
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
let realPassed = 0;
let realTotal = 0;
let realFailures = [];
if (fs.existsSync(fixturesDir)) {
  const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    realTotal++;
    const full = path.join(fixturesDir, file);
    try {
      const diag = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (!Array.isArray(diag.lines) || !Array.isArray(diag.funds)) {
        throw new Error('not a Mitra diagnostic (missing lines[] or funds[])');
      }
      const pageCount = diag.parseMetadata?.pageCount || 1;
      const res = parseCASFromLines(diag.lines, pageCount);
      const diffs = [];
      if (res.funds.length !== diag.funds.length) {
        diffs.push(`fund count changed: expected ${diag.funds.length}, got ${res.funds.length}`);
      }
      // Match by ISIN (or scheme name as fallback) and compare totals.
      for (const expected of diag.funds) {
        const key = expected.isin || expected.schemeName;
        const actual = res.funds.find(f => (f.isin || f.schemeName) === key);
        if (!actual) {
          diffs.push(`missing fund: ${key}`);
          continue;
        }
        if (expected.totalInvested != null && Math.abs((actual.totalInvested || 0) - expected.totalInvested) > 0.01) {
          diffs.push(`${key}: totalInvested drift — expected ${expected.totalInvested}, got ${actual.totalInvested}`);
        }
        if (expected.totalUnits != null && Math.abs((actual.totalUnits || 0) - expected.totalUnits) > 0.001) {
          diffs.push(`${key}: totalUnits drift — expected ${expected.totalUnits}, got ${actual.totalUnits}`);
        }
      }
      if (diffs.length) {
        realFailures.push({ file, diffs });
      } else {
        realPassed++;
      }
    } catch (e) {
      realFailures.push({ file, diffs: [`load/parse failed: ${e.message}`] });
    }
  }
  if (realTotal > 0) {
    console.log(`[Mitra diagnostics] ${realPassed}/${realTotal} passed`);
    for (const f of realFailures) {
      console.error(`  ${f.file}:`);
      for (const d of f.diffs) console.error(`    - ${d}`);
    }
  }
}

const synthFailed = result.total - result.passed;
const realFailed = realTotal - realPassed;
if (synthFailed > 0 || realFailed > 0) {
  console.error(`\n${synthFailed + realFailed} fixture(s) failed`);
  process.exit(1);
}
console.log(`OK — ${result.passed}/${result.total} synthetic${realTotal ? `, ${realPassed}/${realTotal} diagnostic` : ''} fixtures passed`);
process.exit(0);
