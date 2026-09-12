import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  detectSecretMarkers,
  isForbiddenPublicArtifact,
  validatePublicSource,
} from "../scripts/validate-public-source.mjs";

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function minimalFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "goreecloud-public-source-"));
  write(root, ".gitignore", ".dev.vars\n.env\n.env.*\n!.env.example\n");
  write(root, ".env.example", "GITHUB_OWNER=GoreeCloud\nACCESS_GATE_CONFIRMED=false\nGITHUB_TOKEN=\n");
  write(root, "package.json", JSON.stringify({ private: true }));
  write(root, "README.md", "Public/open-source repository with private authenticated deployment.\n");
  write(root, "docs/PUBLIC_SOURCE_BOUNDARY.md", "Public, open-source repository. Private, authenticated deployment.\n");
  write(root, "functions/api/dashboard.js", 'const ACCESS_GATE_CONFIRMED = true;\nconst h = { "Cache-Control": "private, no-store, max-age=0" };\n');
  write(root, "functions/api/governance.js", 'const ACCESS_GATE_CONFIRMED = true;\nconst h = { "Cache-Control": "private, no-store, max-age=0" };\n');
  write(root, "public/index.html", "<!doctype html><title>Dashboard</title>\n");
  return root;
}

test("public source validator accepts the intended public-source/private-deployment boundary", () => {
  const root = minimalFixture();
  try {
    assert.deepEqual(validatePublicSource(root), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("secret detection recognizes reusable credential and private-key signatures", () => {
  const githubToken = "ghp_" + "a".repeat(24);
  const cloudflareToken = "CF_API_TOKEN=" + "b".repeat(24);
  const privateKey = "-----BEGIN " + "PRIVATE KEY-----";

  assert.ok(detectSecretMarkers(githubToken).includes("GitHub classic token"));
  assert.ok(detectSecretMarkers(cloudflareToken).includes("Cloudflare API token assignment"));
  assert.ok(detectSecretMarkers(privateKey).includes("Private key"));
  assert.deepEqual(detectSecretMarkers("fixture-token and public documentation"), []);
});

test("public artifact policy rejects exported data and local secret files", () => {
  assert.equal(isForbiddenPublicArtifact("public/dashboard-data.json"), true);
  assert.equal(isForbiddenPublicArtifact("public/governance-export.ndjson"), true);
  assert.equal(isForbiddenPublicArtifact("public/.env"), true);
  assert.equal(isForbiddenPublicArtifact("public/app.js"), false);
  assert.equal(isForbiddenPublicArtifact("public/styles.css"), false);
});

test("browser assets cannot carry GitHub credentials or direct GitHub API logic", () => {
  const root = minimalFixture();
  try {
    write(root, "public/unsafe.js", 'const endpoint = "https://api.github.com/user/repos";\n');
    const failures = validatePublicSource(root);
    assert.ok(failures.some((failure) => failure.includes("Browser asset references GitHub API directly")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("public source validator fails closed when example configuration enables private data", () => {
  const root = minimalFixture();
  try {
    write(root, ".env.example", "GITHUB_OWNER=GoreeCloud\nACCESS_GATE_CONFIRMED=true\nGITHUB_TOKEN=\n");
    const failures = validatePublicSource(root);
    assert.ok(failures.some((failure) => failure.includes("ACCESS_GATE_CONFIRMED fail-closed")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
