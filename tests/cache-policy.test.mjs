import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onRequestGet } from "../functions/api/dashboard.js";

const apiSource = fs.readFileSync(new URL("../functions/api/dashboard.js", import.meta.url), "utf8");

test("dashboard API remains private no-store while authenticated cache isolation is unverified", async () => {
  const response = await onRequestGet({ env: {} });
  const cacheControl = response.headers.get("cache-control") || "";

  assert.equal(response.status, 503);
  assert.match(cacheControl, /private/);
  assert.match(cacheControl, /no-store/);
  assert.match(cacheControl, /max-age=0/);
  assert.doesNotMatch(cacheControl, /(?:^|,\s*)public(?:,|$)/i);
  assert.doesNotMatch(cacheControl, /s-maxage/i);
});

test("private dashboard function does not use shared edge-cache primitives", () => {
  assert.doesNotMatch(apiSource, /caches\.default/);
  assert.doesNotMatch(apiSource, /\bs-maxage\b/i);
  assert.doesNotMatch(apiSource, /["']ETag["']/i);
  assert.match(apiSource, /"Cache-Control": "private, no-store, max-age=0"/);
});
