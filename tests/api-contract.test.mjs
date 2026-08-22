import test from "node:test";
import assert from "node:assert/strict";
import { onRequest, onRequestGet } from "../functions/api/dashboard.js";

async function readJson(response) {
  return response.json();
}

test("dashboard API fails closed when the GitHub credential is absent", async () => {
  const response = await onRequestGet({ env: {} });
  const payload = await readJson(response);

  assert.equal(response.status, 503);
  assert.equal(payload.code, "github_not_configured");
  assert.match(response.headers.get("cache-control") || "", /private/);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});

test("dashboard API fails closed until the private access interlock is confirmed", async () => {
  const response = await onRequestGet({
    env: {
      GITHUB_TOKEN: "test-only-placeholder",
      ACCESS_GATE_CONFIRMED: "false",
    },
  });
  const payload = await readJson(response);

  assert.equal(response.status, 503);
  assert.equal(payload.code, "private_access_gate_locked");
  assert.doesNotMatch(JSON.stringify(payload), /test-only-placeholder/);
});

test("dashboard API rejects mutation-style HTTP methods", async () => {
  const response = await onRequest({
    request: new Request("https://dashboard.invalid/api/dashboard", { method: "POST" }),
    env: {},
  });
  const payload = await readJson(response);

  assert.equal(response.status, 405);
  assert.equal(payload.code, "method_not_allowed");
});

test("dashboard API error responses retain JSON and no-store protections", async () => {
  const response = await onRequest({
    request: new Request("https://dashboard.invalid/api/dashboard", { method: "DELETE" }),
    env: {},
  });

  assert.match(response.headers.get("content-type") || "", /^application\/json/);
  assert.match(response.headers.get("cache-control") || "", /private, no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
