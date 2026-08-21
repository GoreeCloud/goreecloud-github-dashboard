import test from "node:test";
import assert from "node:assert/strict";
import {
  activityScore,
  firstMeaningfulChangelogSection,
  normalizeRepository,
  summarizeRepositories,
  topRepositories,
} from "../functions/lib/github.js";

const NOW = Date.parse("2026-08-21T18:00:00Z");

function repository(overrides = {}) {
  return {
    name: "example",
    full_name: "GoreeCloud/example",
    html_url: "https://github.com/GoreeCloud/example",
    description: "Example repository",
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
    language: "JavaScript",
    default_branch: "main",
    open_issues_count: 2,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-08-21T12:00:00Z",
    updated_at: "2026-08-21T12:00:00Z",
    ...overrides,
  };
}

test("recent repository activity outranks stale activity", () => {
  const recent = activityScore(repository(), NOW);
  const stale = activityScore(repository({ pushed_at: "2025-01-01T00:00:00Z" }), NOW);
  assert.ok(recent > stale);
});

test("archived repositories receive a strong ranking penalty", () => {
  const active = activityScore(repository(), NOW);
  const archived = activityScore(repository({ archived: true }), NOW);
  assert.ok(active > archived);
});

test("topRepositories omits archived and disabled repositories", () => {
  const ranked = topRepositories(
    [
      repository({ name: "active" }),
      repository({ name: "archived", archived: true }),
      repository({ name: "disabled", disabled: true }),
    ],
    10,
    NOW,
  );

  assert.deepEqual(ranked.map((item) => item.name), ["active"]);
});

test("repository normalization keeps only dashboard-safe fields", () => {
  const normalized = normalizeRepository(repository(), NOW);
  assert.equal(normalized.name, "example");
  assert.equal(normalized.visibility, "private");
  assert.equal(normalized.language, "JavaScript");
  assert.equal(typeof normalized.activityScore, "number");
  assert.equal(Object.hasOwn(normalized, "permissions"), false);
});

test("repository summary separates public and private counts", () => {
  const summary = summarizeRepositories(
    [repository(), repository({ name: "public", private: false, visibility: "public" })],
    3,
    4,
  );

  assert.equal(summary.totalRepositories, 2);
  assert.equal(summary.privateRepositories, 1);
  assert.equal(summary.publicRepositories, 1);
  assert.equal(summary.openPullRequests, 3);
  assert.equal(summary.openIssues, 4);
});

test("changelog summary extracts the first meaningful release section", () => {
  const summary = firstMeaningfulChangelogSection(`# Changelog\n\n## 0.2.0\n- Added dashboard ranking.\n- Hardened private access.\n\n## 0.1.0\n- Initial foundation.`);
  assert.match(summary, /0\.2\.0/);
  assert.match(summary, /dashboard ranking/);
  assert.doesNotMatch(summary, /0\.1\.0/);
});
