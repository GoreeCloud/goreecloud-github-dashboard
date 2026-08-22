import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { githubRequest } from "../functions/lib/github.js";

const packageMetadata = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function jsonResponse(payload = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    async json() {
      return payload;
    },
  };
}

test("GitHub requests identify the current dashboard package version", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return jsonResponse({ resources: {} });
  };

  try {
    await githubRequest({ GITHUB_TOKEN: "synthetic-test-token" }, "/rate_limit");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(capturedUrl, "https://api.github.com/rate_limit");
  assert.equal(capturedOptions.headers.Accept, "application/vnd.github+json");
  assert.equal(capturedOptions.headers.Authorization, "Bearer synthetic-test-token");
  assert.equal(
    capturedOptions.headers["User-Agent"],
    `GoreeCloud-GitHub-Dashboard/${packageMetadata.version}`,
  );
  assert.equal(capturedOptions.headers["X-GitHub-Api-Version"], "2022-11-28");
});
