import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { onRequest as healthRequest, onRequestGet as healthGet } from "../functions/api/health.js";
import { onRequest as readyRequest, onRequestGet as readyGet } from "../functions/api/ready.js";

const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

async function body(response) {
  return JSON.parse(await response.text());
}

test("health endpoint reports only safe process metadata", async () => {
  const response = healthGet();
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "goreecloud-github-dashboard");
  assert.equal(payload.version, packageJson.version);
  assert.equal(payload.lifecycle, "development");
  assert.equal(payload.mode, "read-only");
  assert.equal(payload.scope, "process");
});

test("health endpoint rejects mutation-style methods", async () => {
  const response = healthRequest({ request: { method: "POST" } });
  assert.equal(response.status, 405);
  assert.deepEqual(await body(response), { error: "Method not allowed.", code: "method_not_allowed" });
});

test("readiness fails closed until both private-access gate and credential are configured", async () => {
  for (const env of [
    {},
    { GITHUB_TOKEN: "synthetic-test-token" },
    { ACCESS_GATE_CONFIRMED: "true" },
    { GITHUB_TOKEN: "synthetic-test-token", ACCESS_GATE_CONFIRMED: "false" },
  ]) {
    const response = readyGet({ env });
    const payload = await body(response);
    assert.equal(response.status, 503);
    assert.equal(payload.status, "not-ready");
    assert.equal(payload.code, "deployment_not_ready");
    assert.equal(JSON.stringify(payload).includes("synthetic-test-token"), false);
    assert.equal(JSON.stringify(payload).includes("GITHUB_TOKEN"), false);
    assert.equal(JSON.stringify(payload).includes("ACCESS_GATE_CONFIRMED"), false);
  }
});

test("readiness reports configuration-ready without probing or exposing GitHub", async () => {
  const response = readyGet({
    env: {
      GITHUB_TOKEN: "synthetic-test-token",
      ACCESS_GATE_CONFIRMED: "TRUE",
    },
  });
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(payload.status, "ready");
  assert.equal(payload.version, packageJson.version);
  assert.equal(payload.scope, "configuration");
  assert.equal(JSON.stringify(payload).includes("synthetic-test-token"), false);
});

test("readiness endpoint rejects mutation-style methods", async () => {
  const response = readyRequest({ request: { method: "PUT" }, env: {} });
  assert.equal(response.status, 405);
  assert.deepEqual(await body(response), { error: "Method not allowed.", code: "method_not_allowed" });
});
