import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet } from "../functions/api/dashboard.js";

const OWNER = "GoreeCloud";
const TOKEN = "fixture-token";
const REPOSITORY = "dashboard-fixture";
const RAW_REPOSITORY_MARKER = "raw-repository-only-marker";
const RAW_WORKFLOW_MARKER = "raw-workflow-only-marker";
const UPSTREAM_ERROR_MARKER = "upstream-body-only-marker";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function repositoryFixture(overrides = {}) {
  return {
    name: REPOSITORY,
    full_name: `${OWNER}/${REPOSITORY}`,
    html_url: `https://github.com/${OWNER}/${REPOSITORY}`,
    description: "Representative private dashboard fixture",
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
    language: "JavaScript",
    default_branch: "main",
    open_issues_count: 4,
    stargazers_count: 2,
    forks_count: 1,
    pushed_at: "2026-08-22T00:00:00Z",
    updated_at: "2026-08-22T00:00:00Z",
    owner: { login: OWNER },
    permissions: { admin: true, push: true, pull: true },
    private_marker: RAW_REPOSITORY_MARKER,
    ...overrides,
  };
}

function commitFixture() {
  return {
    sha: "abcdef1234567890",
    html_url: `https://github.com/${OWNER}/${REPOSITORY}/commit/abcdef1234567890`,
    commit: {
      message: "Fixture commit for deterministic aggregation",
      author: { name: "GoreeCloud", date: "2026-08-22T00:05:00Z" },
      committer: { date: "2026-08-22T00:05:00Z" },
    },
    author: { login: "GoreeCloud" },
  };
}

function openWorkFixture(kind) {
  const isPullRequest = kind === "pr";
  return {
    total_count: 1,
    items: [
      {
        title: isPullRequest ? "Fixture pull request" : "Fixture issue",
        repository_url: `https://api.github.com/repos/${OWNER}/${REPOSITORY}`,
        draft: isPullRequest,
        user: { login: "GoreeCloud" },
        updated_at: "2026-08-22T00:04:00Z",
        html_url: `https://github.com/${OWNER}/${REPOSITORY}/${isPullRequest ? "pull" : "issues"}/1`,
        body: isPullRequest ? "Fixture pull request body." : "Fixture issue body.",
      },
    ],
  };
}

function releaseFixture() {
  return {
    name: "Fixture release",
    tag_name: "v0.3.0-fixture",
    html_url: `https://github.com/${OWNER}/${REPOSITORY}/releases/tag/v0.3.0-fixture`,
    published_at: "2026-08-21T23:59:00Z",
    created_at: "2026-08-21T23:58:00Z",
    body: "Fixture release body.",
  };
}

function workflowFixture() {
  return {
    workflow_runs: [
      {
        name: "Validate fixture",
        status: "completed",
        conclusion: "success",
        event: "pull_request",
        head_branch: "agent/fixture",
        updated_at: "2026-08-22T00:03:00Z",
        html_url: `https://github.com/${OWNER}/${REPOSITORY}/actions/runs/1`,
        token: RAW_WORKFLOW_MARKER,
      },
    ],
  };
}

function rateLimitFixture() {
  return {
    resources: {
      core: { limit: 5000, used: 100, remaining: 4900, reset: 1787338800 },
      search: { limit: 30, used: 3, remaining: 27, reset: 1787335200 },
    },
  };
}

function createFixtureFetch({
  repositoryStatus = 200,
  workflowStatus = 200,
  changelogStatus = 200,
  releaseStatus = 200,
  searchStatus = 200,
  rateLimitStatus = 200,
} = {}) {
  const seenAuthorizations = [];

  const fixtureFetch = async (input, options = {}) => {
    const url = new URL(String(input));
    seenAuthorizations.push(options.headers?.Authorization || null);

    if (url.pathname === "/user/repos") {
      if (repositoryStatus !== 200) {
        return jsonResponse({ message: UPSTREAM_ERROR_MARKER }, repositoryStatus);
      }
      return jsonResponse([
        repositoryFixture(),
        repositoryFixture({
          name: "foreign-fixture",
          full_name: "OutsideOrg/foreign-fixture",
          html_url: "https://github.com/OutsideOrg/foreign-fixture",
          owner: { login: "OutsideOrg" },
        }),
      ]);
    }

    if (url.pathname === "/search/issues") {
      if (searchStatus !== 200) {
        return jsonResponse(
          { message: UPSTREAM_ERROR_MARKER },
          searchStatus,
          {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1787338800",
          },
        );
      }
      const query = url.searchParams.get("q") || "";
      return jsonResponse(openWorkFixture(query.includes("is:pr") ? "pr" : "issue"));
    }

    if (url.pathname === `/repos/${OWNER}/${REPOSITORY}/commits`) {
      return jsonResponse([commitFixture()]);
    }

    if (url.pathname.startsWith(`/repos/${OWNER}/${REPOSITORY}/contents/`)) {
      if (changelogStatus !== 200) {
        return jsonResponse({ message: UPSTREAM_ERROR_MARKER }, changelogStatus);
      }
      if (url.pathname.endsWith("/CHANGELOG.md")) {
        return jsonResponse({
          type: "file",
          encoding: "base64",
          content: Buffer.from("# Changelog\n\n## 0.3.0-fixture\n- Deterministic fixture validation.\n").toString("base64"),
        });
      }
      return jsonResponse({ message: "Not Found" }, 404);
    }

    if (url.pathname === `/repos/${OWNER}/${REPOSITORY}/releases/latest`) {
      if (releaseStatus !== 200) return jsonResponse({ message: "Not Found" }, releaseStatus);
      return jsonResponse(releaseFixture());
    }

    if (url.pathname === `/repos/${OWNER}/${REPOSITORY}/actions/runs`) {
      if (workflowStatus !== 200) {
        return jsonResponse({ message: UPSTREAM_ERROR_MARKER }, workflowStatus);
      }
      return jsonResponse(workflowFixture());
    }

    if (url.pathname === "/rate_limit") {
      if (rateLimitStatus !== 200) {
        return jsonResponse({ message: UPSTREAM_ERROR_MARKER }, rateLimitStatus);
      }
      return jsonResponse(rateLimitFixture());
    }

    throw new Error(`Unhandled GitHub fixture endpoint: ${url.pathname}${url.search}`);
  };

  return { fixtureFetch, seenAuthorizations };
}

async function runDashboardWithFixture(options = {}) {
  const originalFetch = globalThis.fetch;
  const { fixtureFetch, seenAuthorizations } = createFixtureFetch(options);
  globalThis.fetch = fixtureFetch;

  try {
    const response = await onRequestGet({
      env: {
        GITHUB_TOKEN: TOKEN,
        GITHUB_OWNER: OWNER,
        ACCESS_GATE_CONFIRMED: "true",
      },
    });
    const payload = await response.json();
    return { response, payload, seenAuthorizations };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("representative GitHub fixtures produce a complete normalized dashboard response", async () => {
  const { response, payload, seenAuthorizations } = await runDashboardWithFixture();
  const serialized = JSON.stringify(payload);

  assert.equal(response.status, 200);
  assert.equal(payload.owner, OWNER);
  assert.equal(payload.mode, "read-only");
  assert.equal(payload.summary.totalRepositories, 1);
  assert.equal(payload.summary.privateRepositories, 1);
  assert.equal(payload.summary.publicRepositories, 0);
  assert.equal(payload.summary.openPullRequests, 1);
  assert.equal(payload.summary.openIssues, 1);
  assert.equal(payload.dataHealth.status, "complete");
  assert.equal(payload.dataHealth.unavailableReads, 0);
  assert.equal(payload.rateLimit.core.remaining, 4900);
  assert.equal(payload.topRepositories[0].name, REPOSITORY);
  assert.equal(payload.repositories[0].name, REPOSITORY);
  assert.equal(payload.recentChanges[0].message, "Fixture commit for deterministic aggregation");
  assert.match(payload.changelogs[0].summary, /0\.3\.0-fixture/);
  assert.equal(payload.releases[0].tag, "v0.3.0-fixture");
  assert.equal(payload.workflowHealth[0].conclusion, "success");
  assert.equal(payload.pullRequests[0].state, "draft");
  assert.equal(payload.issues[0].state, "open");
  assert.ok(seenAuthorizations.length > 0);
  assert.ok(seenAuthorizations.every((value) => value === `Bearer ${TOKEN}`));
  assert.doesNotMatch(serialized, new RegExp(TOKEN));
  assert.doesNotMatch(serialized, new RegExp(RAW_REPOSITORY_MARKER));
  assert.doesNotMatch(serialized, new RegExp(RAW_WORKFLOW_MARKER));
  assert.doesNotMatch(serialized, /foreign-fixture/);
});

test("Actions permission denial becomes partial coverage while confirmed 404 absence stays non-error", async () => {
  const { response, payload } = await runDashboardWithFixture({
    workflowStatus: 403,
    changelogStatus: 404,
    releaseStatus: 404,
  });

  assert.equal(response.status, 200);
  assert.equal(payload.dataHealth.status, "partial");
  assert.equal(payload.dataHealth.unavailableReads, 1);
  assert.equal(payload.dataHealth.workflowRepositoriesUnavailable, 1);
  assert.equal(payload.dataHealth.changelogRepositoriesUnavailable, 0);
  assert.equal(payload.dataHealth.releaseRepositoriesUnavailable, 0);
  assert.equal(payload.changelogs.length, 0);
  assert.equal(payload.releases.length, 0);
  assert.equal(payload.workflowHealth.length, 0);
  assert.match(payload.repositoryAttention[0].reasons.join(" "), /Latest CI status is unavailable/);
  assert.match(payload.repositoryAttention[0].reasons.join(" "), /No repository-local changelog detected/);
});

test("changelog permission denial is not misreported as confirmed changelog absence", async () => {
  const { response, payload } = await runDashboardWithFixture({ changelogStatus: 403 });
  const reasons = payload.repositoryAttention[0].reasons.join(" ");

  assert.equal(response.status, 200);
  assert.equal(payload.dataHealth.status, "partial");
  assert.equal(payload.dataHealth.changelogRepositoriesUnavailable, 1);
  assert.match(reasons, /Changelog status is unavailable/);
  assert.doesNotMatch(reasons, /No repository-local changelog detected/);
});

test("rate-limit endpoint failure keeps primary data usable but marks coverage partial", async () => {
  const { response, payload } = await runDashboardWithFixture({ rateLimitStatus: 503 });

  assert.equal(response.status, 200);
  assert.equal(payload.dataHealth.status, "partial");
  assert.equal(payload.dataHealth.unavailableReads, 0);
  assert.equal(payload.dataHealth.rateLimitAvailable, false);
  assert.equal(payload.rateLimit, null);
  assert.equal(payload.repositories.length, 1);
});

test("core GitHub permission failure returns a sanitized aggregation error", async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args.join(" "));

  try {
    const { response, payload } = await runDashboardWithFixture({ repositoryStatus: 403 });
    const serialized = JSON.stringify(payload);

    assert.equal(response.status, 502);
    assert.equal(payload.code, "github_aggregation_failed");
    assert.doesNotMatch(serialized, new RegExp(TOKEN));
    assert.doesNotMatch(serialized, new RegExp(UPSTREAM_ERROR_MARKER));
    assert.doesNotMatch(logs.join(" "), new RegExp(TOKEN));
    assert.doesNotMatch(logs.join(" "), new RegExp(UPSTREAM_ERROR_MARKER));
  } finally {
    console.error = originalError;
  }
});
