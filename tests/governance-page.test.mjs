import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../public/governance.html", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../public/governance-bootstrap.js", import.meta.url), "utf8");
const renderer = fs.readFileSync(new URL("../public/governance.js", import.meta.url), "utf8");
const glaze = fs.readFileSync(new URL("../public/glaze-ui.js", import.meta.url), "utf8");

test("governance page keeps the same no-inline-script and no-inline-style boundary", () => {
  assert.doesNotMatch(html, /<script(?![^>]*src=)/i);
  assert.doesNotMatch(html, /<style\b/i);
  assert.match(html, /href="#main"/);
  assert.match(html, /id="governance-search"/);
  assert.match(html, /id="probe-list"/);
  assert.match(html, /id="documentation"/);
  assert.match(html, /id="documentation-list"/);
  assert.match(html, /id="documentation-boundary"/);
  assert.match(html, /id="stat-documentation-complete"/);
  assert.match(html, /id="stat-documentation-gaps"/);
  assert.match(html, /id="stat-documentation-applicable"/);
  assert.match(html, /id="stat-documentation-unclassified"/);
  assert.match(html, /Platform Contract component\.type/);
  assert.match(html, /id="classic-protection"/);
  assert.match(html, /id="classic-protection-list"/);
  assert.match(html, /id="stat-classic-protected"/);
  assert.match(html, /id="rulesets"/);
  assert.match(html, /id="rulesets-list"/);
  assert.match(html, /id="stat-rulesets-active"/);
  assert.match(html, /id="required-workflows"/);
  assert.match(html, /id="required-workflows-list"/);
  assert.match(html, /id="stat-required-workflows"/);
  assert.match(html, /id="governance-table-body"/);
  assert.match(html, /colspan="8"/);
  assert.match(html, /src="\/governance-bootstrap\.js"/);
});

test("governance bootstrap applies Glaze, shared appearance, refresh discipline, then the renderer", () => {
  const glazeIndex = bootstrap.indexOf('import "./glaze-ui.js"');
  const appearanceIndex = bootstrap.indexOf('import "./appearance-controller.js"');
  const refreshIndex = bootstrap.indexOf('import "./refresh-guard.js"');
  const governanceIndex = bootstrap.indexOf('import "./governance.js"');

  assert.ok(glazeIndex >= 0);
  assert.ok(appearanceIndex > glazeIndex);
  assert.ok(refreshIndex > appearanceIndex);
  assert.ok(governanceIndex > refreshIndex);
});

test("governance renderer exposes application/service applicability without weakening conservative evidence labels", () => {
  assert.match(renderer, /fetch\("\/api\/governance"/);
  assert.match(renderer, /No repository state was changed/);
  assert.match(renderer, /Unknown — observation unavailable/);
  assert.match(renderer, /None observed/);
  assert.match(renderer, /documentation evidence/i);
  assert.match(renderer, /Repository role\/type applicability is not evaluated by this view/);
  assert.match(renderer, /Platform Contract component\.type/);
  assert.match(renderer, /documentationClassifiedRepositories/);
  assert.match(renderer, /documentationUnclassifiedRepositories/);
  assert.match(renderer, /Applicability declared/);
  assert.match(renderer, /Role unclassified/);
  assert.match(renderer, /Presence or absence is evidence only/);
  assert.match(renderer, /not full manifest validation or policy satisfaction/);
  assert.match(renderer, /No matching rule/);
  assert.match(renderer, /Active rules/);
  assert.match(renderer, /No active rules/);
  assert.match(renderer, /evaluate\/disabled rulesets are outside this view/);
  assert.match(renderer, /Workflow rule observed/);
  assert.match(renderer, /policy satisfaction is not evaluated/i);
  assert.match(renderer, /not a policy-failure classification/);
  assert.doesNotMatch(renderer, /\bcompliant\b/i);
  assert.doesNotMatch(renderer, /\bnoncompliant\b/i);
});

test("main Glaze bootstrap exposes the governance control plane without duplicating its active page navigation", () => {
  assert.match(glaze, /href = "\/governance\.html"/);
  assert.match(glaze, /window\.location\.pathname\.endsWith\("\/governance\.html"\)/);
  assert.match(glaze, /!isGovernanceView/);
});
