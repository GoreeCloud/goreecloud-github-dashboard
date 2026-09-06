import test from "node:test";
import assert from "node:assert/strict";
import {
  RULESET_API_VERSION,
  fetchRulesetCoverage,
  normalizeRequiredWorkflow,
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

function workflowRule(workflowRepositoryId = 202) {
  return {
    type: "workflows",
    ruleset_source_type: "Organization",
    ruleset_source: OWNER,
    ruleset_id: 99,
    parameters: {
      do_not_enforce_on_create: false,
      workflows: [
        {
          path: ".github/workflows/platform-contract.yml",
          ref: "refs/heads/main",
          repository_id: workflowRepositoryId,
          sha: "0123456789abcdef0123456789abcdef01234567",
          ignored_extra: "not-forwarded",
        },
      ],
    },
  };
}

test("ruleset rule normalization keeps only bounded identity, source, and workflow-reference metadata", () => {
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
      requiredWorkflows: [],
    },
  );
});

test("required workflow normalization preserves only path, defining repository, ref, and sha", () => {
  const names = new Map([[202, "goreecloud-platform-workflows"]]);
  assert.deepEqual(
    normalizeRequiredWorkflow({
      path: ".github/workflows/platform-contract.yml",
      repository_id: 202,
      ref: "refs/heads/main",
      sha: "0123456789abcdef0123456789abcdef01234567",
      extra: "not-forwarded",
    }, names),
    {
      path: ".github/workflows/platform-contract.yml",
      repositoryId: 202,
      repository: "goreecloud-platform-workflows",
      ref: "refs/heads/main",
      sha: "0123456789abcdef0123456789abcdef01234567",
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
    assert.equal(observation.hasRequiredWorkflowRule, false);
    assert.deepEqual(observation.requiredWorkflows, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("active workflow rules expose bounded references and resolve accessible defining repositories", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const repoName = new URL(String(input)).pathname.split("/")[3];
    if (repoName === "alpha") return response([workflowRule(202)]);
    return response([]);
  };

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [
        repository("alpha", { id: 101 }),
        repository("goreecloud-platform-workflows", { id: 202 }),
      ],
    );
    const alpha = coverage.repositories.find((item) => item.repository === "alpha");

    assert.equal(alpha.hasRequiredWorkflowRule, true);
    assert.equal(alpha.requiredWorkflowCount, 1);
    assert.deepEqual(alpha.requiredWorkflows, [{
      path: ".github/workflows/platform-contract.yml",
      repositoryId: 202,
      repository: "goreecloud-platform-workflows",
      ref: "refs/heads/main",
      sha: "0123456789abcdef0123456789abcdef01234567",
    }]);
    assert.equal("parameters" in alpha.rules[0], false);
    assert.equal(alpha.rules[0].requiredWorkflows[0].repository, "goreecloud-platform-workflows");
    assert.equal(coverage.repositoriesWithRequiredWorkflowRules, 1);
    assert.equal(coverage.observedRequiredWorkflowReferences, 1);
    assert.equal(coverage.workflowObservationModel, "active-ruleset-required-workflow-references");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unknown required-workflow repository ids remain observable without inventing a repository name", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([workflowRule(999999)]);

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [repository("alpha", { id: 101 })],
    );

    assert.equal(coverage.repositories[0].requiredWorkflows[0].repositoryId, 999999);
    assert.equal(coverage.repositories[0].requiredWorkflows[0].repository, null);
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
    assert.equal(coverage.repositoriesWithRequiredWorkflowRules, 0);
    assert.equal(coverage.repositories[0].available, true);
    assert.equal(coverage.repositories[0].hasActiveRules, false);
    assert.equal(coverage.repositories[0].hasRequiredWorkflowRule, false);
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
    assert.equal(coverage.repositoriesWithRequiredWorkflowRules, 0);
    assert.equal(coverage.unavailableRepositories, 1);
    assert.equal(coverage.repositories[0].available, false);
    assert.equal(coverage.repositories[0].hasActiveRules, null);
    assert.equal(coverage.repositories[0].hasRequiredWorkflowRule, null);
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
    const repoName = parts[3];
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

test("ruleset fetch ignores repositories not owned by the configured owner", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return response([]);
  };

  try {
    const coverage = await fetchRulesetCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      [
        repository("alpha"),
        repository("foreign", { owner: { login: "OtherOwner" } }),
      ],
    );

    assert.equal(requests, 1);
    assert.equal(coverage.totalRepositories, 1);
    assert.equal(coverage.checkedRepositories, 1);
    assert.equal(coverage.repositories[0].repository, "alpha");
    assert.equal(coverage.scope, "active-default-branch-rulesets");
    assert.equal(coverage.apiVersion, RULESET_API_VERSION);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
