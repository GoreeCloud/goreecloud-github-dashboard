import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet } from "../functions/api/dashboard.js";
import {
  fetchAllRepositories,
  fetchRecentChanges,
  fetchReleases,
  fetchWorkflowHealth,
  githubRequest,
  normalizeRateLimit,
} from "../functions/lib/github.js";

const OWNER = "GoreeCloud";
const TOKEN = "edge-fixture-token";
const UPSTREAM_BODY_MARKER = "edge-upstream-body-marker";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function rawRepository(index, owner = OWNER) {
  const suffix = String(index).padStart(3, "0");
  return {
    name: `edge-repo-${suffix}`,
    full_name: `${owner}/edge-repo-${suffix}`,
    html_url: `https://github.com/${owner}/edge-repo-${suffix}`,
    description: `Edge fixture repository ${suffix}`,
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
    language: "JavaScript",
    default_branch: "main",
    open_issues_count: 0,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-08-22T00:00:00Z",
    updated_at: "2026-08-22T00:00:00Z",
    owner: { login: owner },
  };
}

function rankedRepository(name = "edge-repo") {
  return {
    name,
    fullName: `${OWNER}/${name}`,
    description: "Edge fixture ranked repository",
    url: `https://github.com/${OWNER}/${name}`,
    visibility: "private",
    private: true,
    archived: false,
    language: "JavaScript",
    defaultBranch: "main",
    openIssues: 0,
    stars: 0,
    forks: 0,
    updatedAt: "2026-08-22T00:00:00Z",
    activityScore: 108,
  };
}

async function withFixtureFetch(fetchImpl, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("repository pagination continues across full pages while filtering foreign owners", async () => {
  const pages = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => rawRepository(index + 1));
  firstPage[99] = rawRepository(100, "OutsideOrg");
  const secondPage = [rawRepository(101), rawRepository(102)];

  const repositories = await withFixtureFetch(async (input, options = {}) => {
    const url = new URL(String(input));
    assert.equal(options.headers?.Authorization, `Bearer ${TOKEN}`);
    assert.equal(url.pathname, "/user/repos");
    const page = Number(url.searchParams.get("page"));
    pages.push(page);
    if (page === 1) return jsonResponse(firstPage);
    if (page === 2) return jsonResponse(secondPage);
    throw new Error(`Unexpected pagination request for page ${page}`);
  }, () => fetchAllRepositories({ GITHUB_TOKEN: TOKEN }, OWNER));

  assert.deepEqual(pages, [1, 2]);
  assert.equal(repositories.length, 101);
  assert.ok(repositories.every((repo) => repo.owner.login === OWNER));
  assert.equal(repositories.at(-1).name, "edge-repo-102");
});

test("search rate-limit failure stays sanitized at the dashboard boundary", async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args.join(" "));

  try {
    const { response, payload } = await withFixtureFetch(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/user/repos") return jsonResponse([]);
      if (url.pathname === "/search/issues") {
        return jsonResponse(
          { message: UPSTREAM_BODY_MARKER },
          403,
          {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1787338800",
          },
        );
      }
      if (url.pathname === "/rate_limit") {
        return jsonResponse({
          resources: {
            core: { limit: 5000, used: 10, remaining: 4990, reset: 1787338800 },
            search: { limit: 30, used: 30, remaining: 0, reset: 1787338800 },
          },
        });
      }
      throw new Error(`Unexpected dashboard edge endpoint: ${url.pathname}`);
    }, async () => {
      const response = await onRequestGet({
        env: {
          GITHUB_TOKEN: TOKEN,
          GITHUB_OWNER: OWNER,
          ACCESS_GATE_CONFIRMED: "true",
        },
      });
      return { response, payload: await response.json() };
    });

    const serialized = JSON.stringify(payload);
    assert.equal(response.status, 502);
    assert.equal(payload.code, "github_aggregation_failed");
    assert.doesNotMatch(serialized, new RegExp(TOKEN));
    assert.doesNotMatch(serialized, new RegExp(UPSTREAM_BODY_MARKER));
    assert.doesNotMatch(logs.join(" "), new RegExp(TOKEN));
    assert.doesNotMatch(logs.join(" "), new RegExp(UPSTREAM_BODY_MARKER));
  } finally {
    console.error = originalError;
  }
});

test("recent commit optional 404 and permission 403 remain distinct", async () => {
  const candidate = rankedRepository("commit-edge");

  const absent = await withFixtureFetch(
    async () => jsonResponse({ message: "Not Found" }, 404),
    () => fetchRecentChanges({ GITHUB_TOKEN: TOKEN }, OWNER, [candidate]),
  );
  assert.equal(absent.checked, 1);
  assert.equal(absent.unavailable, 0);
  assert.deepEqual(absent.items, []);

  const denied = await withFixtureFetch(
    async () => jsonResponse({ message: UPSTREAM_BODY_MARKER }, 403),
    () => fetchRecentChanges({ GITHUB_TOKEN: TOKEN }, OWNER, [candidate]),
  );
  assert.equal(denied.checked, 1);
  assert.equal(denied.unavailable, 1);
  assert.deepEqual(denied.unavailableRepositories, [candidate.name]);
  assert.deepEqual(denied.items, []);
});

test("release optional 404 and permission 403 remain distinct", async () => {
  const candidate = rankedRepository("release-edge");

  const absent = await withFixtureFetch(
    async () => jsonResponse({ message: "Not Found" }, 404),
    () => fetchReleases({ GITHUB_TOKEN: TOKEN }, OWNER, [candidate]),
  );
  assert.equal(absent.checked, 1);
  assert.equal(absent.unavailable, 0);
  assert.deepEqual(absent.items, []);

  const denied = await withFixtureFetch(
    async () => jsonResponse({ message: UPSTREAM_BODY_MARKER }, 403),
    () => fetchReleases({ GITHUB_TOKEN: TOKEN }, OWNER, [candidate]),
  );
  assert.equal(denied.checked, 1);
  assert.equal(denied.unavailable, 1);
  assert.deepEqual(denied.unavailableRepositories, [candidate.name]);
  assert.deepEqual(denied.items, []);
});

test("workflow no-run response remains available coverage", async () => {
  const candidate = rankedRepository("workflow-edge");
  const result = await withFixtureFetch(
    async () => jsonResponse({ workflow_runs: [] }),
    () => fetchWorkflowHealth({ GITHUB_TOKEN: TOKEN }, OWNER, [candidate]),
  );

  assert.equal(result.checked, 1);
  assert.equal(result.unavailable, 0);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].repository, candidate.name);
  assert.equal(result.items[0].status, "none");
  assert.equal(result.items[0].conclusion, null);
  assert.equal(result.items[0].url, `${candidate.url}/actions`);
});

test("rate-limit normalization tolerates missing resource fields", () => {
  const normalized = normalizeRateLimit({
    resources: {
      core: { limit: 5000, remaining: 4980 },
    },
  });

  assert.equal(normalized.core.limit, 5000);
  assert.equal(normalized.core.used, 0);
  assert.equal(normalized.core.remaining, 4980);
  assert.equal(normalized.core.resetAt, null);
  assert.equal(normalized.search, null);
});

test("upstream abort stays distinct from request timeout", async () => {
  const controller = new AbortController();
  controller.abort();

  const error = await withFixtureFetch(async (_input, options = {}) => {
    assert.equal(options.signal?.aborted, true);
    const abortError = new Error("upstream abort fixture");
    abortError.name = "AbortError";
    throw abortError;
  }, async () => {
    try {
      await githubRequest(
        { GITHUB_TOKEN: TOKEN },
        "/rate_limit",
        { signal: controller.signal, timeoutMs: 5_000 },
      );
      assert.fail("Expected an upstream abort rejection.");
    } catch (caught) {
      return caught;
    }
  });

  assert.equal(error.name, "AbortError");
  assert.match(error.message, /upstream abort fixture/);
  assert.doesNotMatch(error.message, /timed out/i);
});
