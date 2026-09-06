import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  APPEARANCE_MODES,
  appearanceIcon,
  appearanceLabel,
  nextAppearance,
  normalizeAppearance,
} from "../public/theme-policy.js";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("appearance policy exposes the governed four-state cycle", () => {
  assert.deepEqual(APPEARANCE_MODES, ["system", "light", "dark", "deep-dark"]);
  assert.equal(nextAppearance("system"), "light");
  assert.equal(nextAppearance("light"), "dark");
  assert.equal(nextAppearance("dark"), "deep-dark");
  assert.equal(nextAppearance("deep-dark"), "system");
});

test("appearance policy normalizes unknown or missing values to System", () => {
  assert.equal(normalizeAppearance(undefined), "system");
  assert.equal(normalizeAppearance(""), "system");
  assert.equal(normalizeAppearance("unexpected"), "system");
  assert.equal(normalizeAppearance(" DEEP-DARK "), "deep-dark");
});

test("appearance policy supplies accessible labels and stable icons", () => {
  assert.equal(appearanceLabel("system"), "System");
  assert.equal(appearanceLabel("deep-dark"), "Deep Dark");
  assert.equal(appearanceIcon("light"), "☀");
  assert.equal(appearanceIcon("deep-dark"), "●");
});

test("appearance guard loads before the legacy renderer and captures the control", () => {
  const bootstrap = read("public/bootstrap.js");
  const guard = read("public/appearance-guard.js");

  const glaze = bootstrap.indexOf('import "./glaze-ui.js"');
  const appearance = bootstrap.indexOf('import "./appearance-guard.js"');
  const refresh = bootstrap.indexOf('import "./refresh-guard.js"');
  const app = bootstrap.indexOf('import "./app.js"');

  assert.ok(glaze >= 0);
  assert.ok(appearance > glaze);
  assert.ok(refresh > appearance);
  assert.ok(app > refresh);
  assert.match(guard, /event\.stopImmediatePropagation\(\)/);
  assert.match(guard, /true,\s*\);/);
  assert.match(guard, /Appearance: \$\{appearanceLabel\(current\)\}/);
});

test("V1.1 appearance CSS includes system dark, explicit Deep Dark, and solid color-mix fallback", () => {
  const css = read("public/glaze-v1.1.css");

  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /:root:not\(\[data-theme\]\)/);
  assert.match(css, /:root\[data-theme="deep-dark"\]/);
  assert.match(css, /--canvas: #06090b/);
  assert.match(css, /\.panel-glaze \{[\s\S]*background: var\(--content-surface\);[\s\S]*color-mix/);
});
