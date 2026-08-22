import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchAllRepositories,
  fetchChangelogs,
  fetchRecentChanges,
  fetchWorkflowHealth,
} from "../functions/lib/github.js";

const OWNER = "GoreeCloud";
const TOKEN = "boundary-fixture-token";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function rawRepository(index) {
  const suffix = String(index).padStart(3, "0");
  return {
    name: `boundary-repo-${suffix}`,
    full_name: `${OWNER}/boundary-repo-${suffix}`,
    html_url: `https://github.com/${OWNER}/boundary-repo-${suffix}`,
    description: `Boundary fixture repository ${suffix}`,
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
    owner: { login: OWNER },
  };
}

function rankedRepository(name) {
  return {
    name,
    fullName: `${OWNER}/${name}`,
    description: `${name} boundary fixture`,
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

function commitFixture(repository, index = 1) {
  return {
    sha: `${repository}-${index}`,
    html_url: `https://github.com/${OWNER}/${repository}/commit/${index}`,
    commit: {
      message: `${repository} boundary commit ${index}`,
      author: { name: "GoreeCloud", date: `2026-08-22T00:0${index}:00Z` },
      committer: { date: `2026-08-22T00:0${index}:00Z` },
    },
    author: { login: "GoreeCloud" },
  };
}

function workflowFixture(repository) {
  return {
    workflow_runs: [
      {
        name: `${repository} validation`,
        status: "completed",
        conclusion: "success",
        event: "pull_request",
        head_branch: "agent/boundary-fixture",
        updated_at: "2026-08-22T00:03:00Z",
        html_url: `https://github.com/${OWNER}/${repository}/actions/runs/1`,
      },
    ],
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

test("repository enumeration stops at the five-page safety bound", async () => {
  const requestedPages = [];

  const repositories = await withFixtureFetch(async (input, options = {}) => {
    const url = new URL(String(input));
    assert.equal(options.headers?.Authorization, `Bearer ${TOKEN}`);
    assert.equal(url.pathname, "/user/repos");
    const page = Number(url.searchParams.get("page"));
    requestedPages.push(page);
    const start = (page - 1) * 100 + 1;
    return jsonResponse(Array.from({ length: 100 }, (_, index) => rawRepository(start + index)));
  }, () => fetchAllRepositories({ GITHUB_TOKEN: TOKEN }, OWNER));

  assert.deepEqual(requestedPages, [1, 2, 3, 4, 5]);
  assert.equal(repositories.length, 500);
  assert.equal(repositories[0].name, "boundary-repo-001");
  assert.equal(repositories.at(-1).name, "boundary-repo-500");
});

test("mixed recent-change coverage preserves successes, confirmed absence, and one unavailable repository", async () => {
  const candidates = [
    rankedRepository("recent-success"),
    rankedRepository("recent-denied"),
    rankedRepository("recent-absent"),
  ];

  const result = await withFixtureFetch(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.includes("/recent-success/commits")) {
      return jsonResponse([commitFixture("recent-success")]);
    }
    if (url.pathname.includes("/recent-denied/commits")) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    if (url.pathname.includes("/recent-absent/commits")) {
      return jsonResponse({ message: "Not Found" }, 404);
    }
    throw new Error(`Unexpected recent-change boundary endpoint: ${url.pathname}`);
  }, () => fetchRecentChanges({ GITHUB_TOKEN: TOKEN }, OWNER, candidates));

  assert.equal(result.checked, 3);
  assert.equal(result.unavailable, 1);
  assert.deepEqual(result.unavailableRepositories, ["recent-denied"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].repository, "recent-success");
});

test("mixed changelog coverage preserves fallback discovery without turning 404 into unavailability", async () => {
  const candidates = [
    rankedRepository("changelog-fallback"),
    rankedRepository("changelog-denied"),
    rankedRepository("changelog-absent"),
  ];

  const result = await withFixtureFetch(async (input) => {
    const url = new URL(String(input));
    const path = decodeURIComponent(url.pathname);

    if (path.includes("/changelog-fallback/contents/CHANGELOG.md")) {
      return jsonResponse({ message: "Not Found" }, 404);
    }
    if (path.includes("/changelog-fallback/contents/docs/CHANGELOG.md")) {
      return jsonResponse({
        type: "file",
        encoding: "base64",
        content: Buffer.from("# Changelog\n\n## Boundary fixture\n- Fallback changelog found.\n").toString("base64"),
      });
    }
    if (path.includes("/changelog-denied/contents/")) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    if (path.includes("/changelog-absent/contents/")) {
      return jsonResponse({ message: "Not Found" }, 404);
    }
    throw new Error(`Unexpected changelog boundary endpoint: ${path}`);
  }, () => fetchChangelogs({ GITHUB_TOKEN: TOKEN }, OWNER, candidates));

  assert.equal(result.checked, 3);
  assert.equal(result.unavailable, 1);
  assert.deepEqual(result.unavailableRepositories, ["changelog-denied"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].repository, "changelog-fallback");
  assert.equal(result.items[0].path, "docs/CHANGELOG.md");
  assert.match(result.items[0].summary, /Boundary fixture/);
});

test("mixed workflow coverage keeps successful and no-run repositories while isolating one permission failure", async () => {
  const candidates = [
    rankedRepository("workflow-success"),
    rankedRepository("workflow-none"),
    rankedRepository("workflow-denied"),
  ];

  const result = await withFixtureFetch(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.includes("/workflow-success/actions/runs")) {
      return jsonResponse(workflowFixture("workflow-success"));
    }
    if (url.pathname.includes("/workflow-none/actions/runs")) {
      return jsonResponse({ workflow_runs: [] });
    }
    if (url.pathname.includes("/workflow-denied/actions/runs")) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    throw new Error(`Unexpected workflow boundary endpoint: ${url.pathname}`);
  }, () => fetchWorkflowHealth({ GITHUB_TOKEN: TOKEN }, OWNER, candidates));

  assert.equal(result.checked, 3);
  assert.equal(result.unavailable, 1);
  assert.deepEqual(result.unavailableRepositories, ["workflow-denied"]);
  assert.equal(result.items.length, 2);

  const byRepository = new Map(result.items.map((item) => [item.repository, item]));
  assert.equal(byRepository.get("workflow-success").conclusion, "success");
  assert.equal(byRepository.get("workflow-none").status, "none");
});
