import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("GLAZE UI V1.1 migration is explicit and acceptance remains pending", () => {
  const runtime = read("public/glaze-ui.js");
  const mapping = read("docs/GLAZE_UI_CONFORMANCE.md");

  assert.match(runtime, /GLAZE_UI_VERSION = "1\.1\.0"/);
  assert.match(runtime, /GLAZE_UI_ACCEPTANCE = "pending"/);
  assert.match(mapping, /v1\.1\.0/);
  assert.match(mapping, /15cc76d2bcd4065552dc31c77145b63f34d9e7b2/);
  assert.match(mapping, /rendered and production acceptance pending/i);
  assert.doesNotMatch(mapping, /fully conformant/i);
});

test("GLAZE UI migration layer preserves the V1.1 material and touch boundaries", () => {
  const css = read("public/glaze-v1.1.css");

  assert.match(css, /--accent: #0f6f6a/);
  assert.match(css, /--aura-warm:/);
  assert.match(css, /\.panel,[\s\S]*backdrop-filter: none/);
  assert.match(css, /min-height: 48px/);
  assert.match(css, /@media \(min-width: 600px\) and \(max-width: 1023px\)/);
  assert.match(css, /writing-mode: horizontal-tb/);
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
});

test("GLAZE UI migration loads before refresh and application behavior", () => {
  const bootstrap = read("public/bootstrap.js");
  const glaze = bootstrap.indexOf('import "./glaze-ui.js"');
  const refresh = bootstrap.indexOf('import "./refresh-guard.js"');
  const app = bootstrap.indexOf('import "./app.js"');

  assert.ok(glaze >= 0);
  assert.ok(refresh > glaze);
  assert.ok(app > refresh);
});

test("required product truth records distinguish current capability from pending work", () => {
  const features = read("FEATURES.md");
  const benefits = read("BENEFITS.md");
  const objectives = read("COMPETITIVE-OBJECTIVES.md");
  const platform = read("docs/PLATFORM_CONFORMANCE.md");

  assert.match(features, /Implemented in Development source/);
  assert.match(features, /Partial or acceptance-gated/);
  assert.match(features, /Not currently implemented or approved/);
  assert.match(benefits, /Benefits not yet claimed/);
  assert.match(objectives, /does not become a second repository-state authority/);

  for (const system of [
    "GoreeCloud Manager",
    "Privacy Shield",
    "Wardveil Security",
    "Everkeep",
    "Glaze UI",
    "GoreeCloud Mesh",
    "GoreeCloud Identity",
  ]) {
    assert.match(platform, new RegExp(system));
  }
});
