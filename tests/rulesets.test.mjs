import test from "node:test";
import assert from "node:assert/strict";
import {
  RULESET_API_VERSION,
  buildRulesetCoverage,
  fetchRulesetCoverage,
  normalizeRulesetRule,
} from "../functions/lib/rulesets.js";

const OWNER = "GoreeCloud";
const TOKEN = "ruleset-fixture";

function repository(name, overrides = {}) {
  return {
    name,
    full_name: `${OWNER}/${name}`,
    html_url: `https://github.com/${OWNER}/${name}`,
    visibility: "private",
    private: true,
    archived: false,
    default_branch: "main",
    pushed_at: "2026-09-05T12:00:00Z",
    updated_at: "2026-09-05T12:00:00Z",
    owner: { login: OWNER },
    ...overrides,
  };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function rulesFor(name) {
  return [
    {
      type: "pull_request",
      ruleset_source_type: "Repository",
      ruleset_source: `${OWNER}/${name}`,
      ruleset_id: 42,
      parameters: { required_approving_review_count: 2 },
    },
    {
      type: "required_status_checks",
      ruleset_source_type: "Organization",
      ruleset_source: OWNER,
      ruleset_id: 73,
      parameters: { strict_required_status_checks_policy: true },
    },
  ];
}

test("ruleset rule normalization keeps only bounded identity and source metadata", () => {
  assert.deepEqual(
    normalizeRulesetRule({
      type: "pull_request",
      ruleset_source_type: "Organization",
      ruleset_source: OWNER,
      ruleset_id: 73,
      parameters: { secret_like_extra: "not-forwarded" },
    }),
    {
      type: "pull_request",
      rulesetId: 73,
      rulesetSourceType: "Organization",
      rulesetSource: OWNER,
    },
  );
});

test("ruleset observation targets the exact default branch and current rules API version", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedOptions = null;

  globalThis.fetch = async (input, options = {}) => {
    capturedUrl = String(input);
    capturedOptions = options;
    return response(rulesFor("alpha"));
  };

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [repository("alpha", { default_branch: "release/v1" })],
    );

    const url = new URL(capturedUrl);
    assert.equal(url.pathname, "/repos/GoreeCloud/alpha/rules/branches/release%2Fv1");
    assert.equal(url.searchParams.get("per_page"), "100");
    assert.equal(url.searchParams.get("page"), "1");
    assert.equal(capturedOptions.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(capturedOptions.headers["X-GitHub-Api-Version"], RULESET_API_VERSION);
    assert.equal(coverage.status, "complete");
    assert.equal(coverage.repositoriesWithActiveRules, 1);
    assert.equal(coverage.observedActiveRules, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("active rulesets preserve repository and organization sources without policy interpretation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response(rulesFor("alpha"));

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [repository("alpha")],
    );
    const observation = coverage.repositories[0];

    assert.equal(observation.available, true);
    assert.equal(observation.hasActiveRules, true);
    assert.equal(observation.activeRuleCount, 2);
    assert.deepEqual(observation.ruleTypes, ["pull_request", "required_status_checks"]);
    assert.deepEqual(observation.sources, [
      { rulesetId: 42, sourceType: "Repository", source: `${OWNER}/alpha` },
      { rulesetId: 73, sourceType: "Organization", source: OWNER },
    ]);
    assert.equal("parameters" in observation.rules[0], false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an empty active-rule response is valid observed evidence rather than unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([]);

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [repository("alpha")],
    );

    assert.equal(coverage.status, "complete");
    assert.equal(coverage.checkedRepositories, 1);
    assert.equal(coverage.repositoriesWithActiveRules, 0);
    assert.equal(coverage.repositoriesWithNoActiveRules, 1);
    assert.equal(coverage.repositories[0].available, true);
    assert.equal(coverage.repositories[0].hasActiveRules, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a full rules page remains unavailable because response-body-only pagination cannot prove completeness", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response(Array.from({ length: 100 }, (_, index) => ({
    type: `rule-${index}`,
    ruleset_source_type: "Repository",
    ruleset_source: `${OWNER}/alpha`,
    ruleset_id: 42,
  })));

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [repository("alpha")],
    );

    assert.equal(coverage.status, "unavailable");
    assert.equal(coverage.checkedRepositories, 0);
    assert.equal(coverage.repositoriesWithActiveRules, 0);
    assert.equal(coverage.repositoriesWithNoActiveRules, 0);
    assert.equal(coverage.unavailableRepositories, 1);
    assert.equal(coverage.repositories[0].available, false);
    assert.equal(coverage.repositories[0].hasActiveRules, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ruleset fan-out is bounded and preserves successful repository observations", async () => {
  const repositories = Array.from({ length: 9 }, (_, index) => repository(`repo-${index + 1}`));
  const originalFetch = globalThis.fetch;
  let inFlight = 0;
  let maxInFlight = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const parts = url.pathname.split("/");
    const repoName = parts[4];
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;

    if (repoName === "repo-5") return response({ message: "forbidden" }, 403);
    return response(repoName.endsWith("1") ? rulesFor(repoName) : []);
  };

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      repositories,
      { rulesetConcurrency: 3 },
    );

    assert.ok(maxInFlight <= 3);
    assert.equal(coverage.status, "partial");
    assert.equal(coverage.checkedRepositories, 8);
    assert.equal(coverage.unavailableRepositories, 1);
    assert.equal(coverage.repositoriesWithActiveRules, 1);
    assert.equal(coverage.repositories.find((item) => item.repository === "repo-5").available, false);
    assert.equal(coverage.repositories.find((item) => item.repository === "repo-1").hasActiveRules, true);
    assert.equal(coverage.repositories.find((item) => item.repository === "repo-2").hasActiveRules, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ruleset coverage ignores repositories not owned by the configured owner", () => {
  const coverage = buildRulesetCoverage(
    [repository("alpha")],
    [{ repository: "alpha", available: true, defaultBranch: "main", activeRuleCount: 0, hasActiveRules: false, ruleTypes: [], sources: [], rules: [] }],
  );

  assert.equal(coverage.totalRepositories, 1);
  assert.equal(coverage.scope, "active-default-branch-rulesets");
  assert.equal(coverage.apiVersion, RULESET_API_VERSION);
});
