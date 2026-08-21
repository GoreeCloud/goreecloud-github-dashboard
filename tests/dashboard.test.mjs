import test from "node:test";
import assert from "node:assert/strict";
import {
  activityScore,
  buildRepositoryAttention,
  fetchRateLimit,
  fetchRecentChanges,
  firstMeaningfulChangelogSection,
  normalizeRateLimit,
  normalizeRepository,
  normalizeWorkflowRun,
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

test("workflow normalization keeps only dashboard-safe run fields", () => {
  const normalizedRepo = normalizeRepository(repository(), NOW);
  const workflow = normalizeWorkflowRun(
    {
      name: "Validate",
      status: "completed",
      conclusion: "success",
      event: "pull_request",
      head_branch: "agent/example",
      updated_at: "2026-08-21T17:30:00Z",
      html_url: "https://github.com/GoreeCloud/example/actions/runs/1",
      token: "must-not-pass-through",
    },
    normalizedRepo,
  );

  assert.equal(workflow.repository, "example");
  assert.equal(workflow.conclusion, "success");
  assert.equal(workflow.branch, "agent/example");
  assert.equal(Object.hasOwn(workflow, "token"), false);
});

test("rate-limit normalization exposes bounded resource metadata", () => {
  const normalized = normalizeRateLimit({
    resources: {
      core: { limit: 5000, used: 123, remaining: 4877, reset: 1787338800 },
      search: { limit: 30, used: 2, remaining: 28, reset: 1787335200 },
    },
  });

  assert.equal(normalized.core.limit, 5000);
  assert.equal(normalized.core.remaining, 4877);
  assert.equal(normalized.search.remaining, 28);
  assert.match(normalized.core.resetAt, /^2026-/);
});

test("repository attention prioritizes failing CI over informational signals", () => {
  const failingRepo = normalizeRepository(repository({ name: "failing" }), NOW);
  const quietRepo = normalizeRepository(repository({ name: "quiet", open_issues_count: 0 }), NOW);
  const attention = buildRepositoryAttention(
    [quietRepo, failingRepo],
    [{ repository: "quiet" }],
    [
      { repository: "quiet", conclusion: "success" },
      { repository: "failing", conclusion: "failure" },
    ],
    NOW,
  );

  assert.equal(attention[0].repository, "failing");
  assert.equal(attention[0].severity, "critical");
  assert.match(attention[0].reasons.join(" "), /Latest CI concluded failure/);
});

test("stale ranked repositories surface a review signal", () => {
  const staleRepo = normalizeRepository(
    repository({ name: "stale", pushed_at: "2026-01-01T00:00:00Z", open_issues_count: 0 }),
    NOW,
  );
  const attention = buildRepositoryAttention(
    [staleRepo],
    [{ repository: "stale" }],
    [{ repository: "stale", conclusion: "success" }],
    NOW,
  );

  assert.equal(attention.length, 1);
  assert.equal(attention[0].severity, "warning");
  assert.match(attention[0].reasons.join(" "), /No repository push/);
});

test("attention distinguishes unavailable changelog coverage from a confirmed missing changelog", () => {
  const normalizedRepo = normalizeRepository(repository({ name: "coverage-gap", open_issues_count: 0 }), NOW);
  const attention = buildRepositoryAttention(
    [normalizedRepo],
    [],
    [],
    NOW,
    {
      changelogUnavailable: ["coverage-gap"],
      workflowUnavailable: ["coverage-gap"],
    },
  );

  assert.equal(attention.length, 1);
  assert.match(attention[0].reasons.join(" "), /Changelog status is unavailable/);
  assert.match(attention[0].reasons.join(" "), /Latest CI status is unavailable/);
  assert.doesNotMatch(attention[0].reasons.join(" "), /No repository-local changelog detected/);
});

test("recent-change aggregation reports per-repository partial failures", async () => {
  const originalFetch = globalThis.fetch;
  const ranked = [
    normalizeRepository(repository({ name: "good" }), NOW),
    normalizeRepository(repository({ name: "unavailable" }), NOW),
  ];

  globalThis.fetch = async (url) => {
    if (String(url).includes("/good/commits")) {
      return new Response(JSON.stringify([
        {
          sha: "abcdef123456",
          html_url: "https://github.com/GoreeCloud/good/commit/abcdef1",
          commit: {
            message: "Validated commit",
            author: { name: "GoreeCloud", date: "2026-08-21T17:00:00Z" },
            committer: { date: "2026-08-21T17:00:00Z" },
          },
          author: { login: "GoreeCloud" },
        },
      ]), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ message: "temporary upstream error" }), { status: 503 });
  };

  try {
    const result = await fetchRecentChanges({ GITHUB_TOKEN: "test-token" }, "GoreeCloud", ranked);
    assert.equal(result.checked, 2);
    assert.equal(result.unavailable, 1);
    assert.deepEqual(result.unavailableRepositories, ["unavailable"]);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].repository, "good");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rate-limit visibility fails soft without breaking the dashboard", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "unavailable" }), { status: 503 });

  try {
    const result = await fetchRateLimit({ GITHUB_TOKEN: "test-token" });
    assert.equal(result, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
