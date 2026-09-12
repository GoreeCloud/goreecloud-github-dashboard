import test from "node:test";
import assert from "node:assert/strict";
import {
  DOCUMENTATION_PROBES,
  GOVERNANCE_PROBES,
  buildClassicBranchProtectionGraphqlQuery,
  buildGovernanceGraphqlQuery,
  fetchGovernanceCoverage,
} from "../functions/lib/governance.js";

const OWNER = "GoreeCloud";
const TOKEN = "governance-fixture-token";

function repository(name, overrides = {}) {
  return {
    name,
    full_name: `${OWNER}/${name}`,
    html_url: `https://github.com/${OWNER}/${name}`,
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
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

function completeNode(name, missing = []) {
  return {
    name,
    ...Object.fromEntries(
      [...GOVERNANCE_PROBES, ...DOCUMENTATION_PROBES].map((probe) => [
        probe.key,
        missing.includes(probe.key) ? null : { oid: `${name}-${probe.key}` },
      ]),
    ),
  };
}

function classicRule(defaultBranch, overrides = {}) {
  return {
    pattern: defaultBranch,
    allowsDeletions: false,
    allowsForcePushes: false,
    isAdminEnforced: true,
    requireLastPushApproval: true,
    requiredApprovingReviewCount: 2,
    requiredStatusCheckContexts: ["Validate GitHub dashboard foundation"],
    requiresApprovingReviews: true,
    requiresCodeOwnerReviews: true,
    requiresCommitSignatures: false,
    requiresConversationResolution: true,
    requiresLinearHistory: false,
    requiresStatusChecks: true,
    requiresStrictStatusChecks: true,
    matchingRefs: {
      pageInfo: { hasNextPage: false },
      nodes: [{ name: defaultBranch }],
    },
    ...overrides,
  };
}

function protectionNode(name, defaultBranch = "main", { protectedBranch = true, hasNextPage = false } = {}) {
  return {
    name,
    branchProtectionRules: {
      pageInfo: { hasNextPage },
      nodes: protectedBranch ? [classicRule(defaultBranch)] : [],
    },
  };
}

function queryFromOptions(options = {}) {
  return JSON.parse(options.body || "{}").query || "";
}

test("governance GraphQL query binds exact default branches, baseline paths, and documentation paths", () => {
  const query = buildGovernanceGraphqlQuery(OWNER, [
    repository("alpha", { default_branch: "master" }),
    repository("beta", { default_branch: "release/v1" }),
  ]);

  assert.match(query, /repository\(owner: "GoreeCloud", name: "alpha"\)/);
  assert.match(query, /master:goreecloud\.platform\.yaml/);
  assert.match(query, /master:SECURITY\.md/);
  assert.match(query, /master:CONTRIBUTING\.md/);
  assert.match(query, /master:\.github\/CODEOWNERS/);
  assert.match(query, /master:README\.md/);
  assert.match(query, /master:SPECIFICATIONS\.md/);
  assert.match(query, /master:FEATURES\.md/);
  assert.match(query, /master:BENEFITS\.md/);
  assert.match(query, /master:COMPETITIVE-OBJECTIVES\.md/);
  assert.match(query, /master:BRANDING\.md/);
  assert.match(query, /release\/v1:goreecloud\.platform\.yaml/);
  assert.match(query, /release\/v1:SPECIFICATIONS\.md/);
});

test("classic branch-protection GraphQL query asks GitHub which rules match each exact default branch", () => {
  const query = buildClassicBranchProtectionGraphqlQuery(OWNER, [
    repository("alpha", { default_branch: "main" }),
    repository("beta", { default_branch: "release/v1" }),
  ]);

  assert.match(query, /GoreeCloudClassicBranchProtectionObservation/);
  assert.match(query, /branchProtectionRules\(first: 100\)/);
  assert.match(query, /matchingRefs\(first: 10, query: "main"\)/);
  assert.match(query, /matchingRefs\(first: 10, query: "release\/v1"\)/);
  assert.match(query, /requiresApprovingReviews/);
  assert.match(query, /requiresCodeOwnerReviews/);
  assert.match(query, /requiresCommitSignatures/);
  assert.match(query, /requiresStatusChecks/);
  assert.match(query, /requiresStrictStatusChecks/);
});

test("governance coverage reports baseline, documentation, and classic protection as distinct observations", async () => {
  const repositories = [repository("alpha"), repository("beta", { visibility: "public", private: false })];
  const originalFetch = globalThis.fetch;
  let requests = 0;

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    const query = queryFromOptions(options);
    assert.equal(url.pathname, "/graphql");
    assert.equal(options.method, "POST");
    assert.equal(options.headers?.Authorization, `Bearer ${TOKEN}`);
    requests += 1;

    if (query.includes("GoreeCloudClassicBranchProtectionObservation")) {
      return response({
        data: {
          r0: protectionNode("alpha", "main", { protectedBranch: true }),
          r1: protectionNode("beta", "main", { protectedBranch: false }),
        },
      });
    }

    return response({
      data: {
        r0: completeNode("alpha", ["contributing", "specifications"]),
        r1: completeNode("beta"),
      },
    });
  };

  try {
    const coverage = await fetchGovernanceCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      repositories,
    );

    assert.equal(requests, 2);
    assert.equal(coverage.status, "complete");
    assert.equal(coverage.fileStatus, "complete");
    assert.equal(coverage.totalRepositories, 2);
    assert.equal(coverage.checkedRepositories, 2);
    assert.equal(coverage.unavailableRepositories, 0);
    assert.equal(coverage.repositoriesWithAllObservedFiles, 1);
    assert.equal(coverage.repositoriesWithObservedGaps, 1);

    const contributing = coverage.probes.find((probe) => probe.key === "contributing");
    assert.equal(contributing.present, 1);
    assert.equal(contributing.absent, 1);
    assert.equal(contributing.unavailable, 0);
    assert.equal(contributing.status, "complete");

    assert.equal(coverage.documentation.status, "complete");
    assert.equal(coverage.documentation.scope, "policy-defined-application-service-documentation-evidence");
    assert.equal(coverage.documentation.applicability, "repository-role-unclassified");
    assert.equal(coverage.documentation.checkedRepositories, 2);
    assert.equal(coverage.documentation.repositoriesWithAllObservedFiles, 1);
    assert.equal(coverage.documentation.repositoriesWithObservedGaps, 1);
    const specifications = coverage.documentation.probes.find((probe) => probe.key === "specifications");
    assert.equal(specifications.present, 1);
    assert.equal(specifications.absent, 1);

    assert.deepEqual(coverage.classicBranchProtection, {
      status: "complete",
      checkedRepositories: 2,
      protectedRepositories: 1,
      unprotectedRepositories: 1,
      unavailableRepositories: 0,
      scope: "classic-default-branch-rules",
    });

    const alpha = coverage.repositories.find((item) => item.name === "alpha");
    assert.equal(alpha.status, "gaps");
    assert.deepEqual(alpha.missingChecks, ["contributing"]);
    assert.equal(alpha.checksAvailable, true);
    assert.equal(alpha.documentation.available, true);
    assert.equal(alpha.documentation.status, "gaps");
    assert.deepEqual(alpha.documentation.missingChecks, ["specifications"]);
    assert.equal(alpha.classicBranchProtection.available, true);
    assert.equal(alpha.classicBranchProtection.defaultBranchProtected, true);
    assert.equal(alpha.classicBranchProtection.matchingRules.length, 1);
    assert.equal(alpha.classicBranchProtection.matchingRules[0].requiredApprovingReviewCount, 2);
    assert.equal(alpha.classicBranchProtection.matchingRules[0].requiresCodeOwnerReviews, true);
    assert.deepEqual(
      alpha.classicBranchProtection.matchingRules[0].requiredStatusCheckContexts,
      ["Validate GitHub dashboard foundation"],
    );

    const beta = coverage.repositories.find((item) => item.name === "beta");
    assert.equal(beta.status, "observed");
    assert.deepEqual(beta.missingChecks, []);
    assert.equal(beta.documentation.status, "observed");
    assert.deepEqual(beta.documentation.missingChecks, []);
    assert.equal(beta.classicBranchProtection.available, true);
    assert.equal(beta.classicBranchProtection.defaultBranchProtected, false);
    assert.deepEqual(beta.classicBranchProtection.matchingRules, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GraphQL errors remain unavailable instead of becoming false missing-file or documentation claims", async () => {
  const repositories = [repository("alpha"), repository("beta")];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => response({
    data: { r0: null, r1: null },
    errors: [{ message: "fixture unavailable" }],
  });

  try {
    const coverage = await fetchGovernanceCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      repositories,
    );

    assert.equal(coverage.status, "unavailable");
    assert.equal(coverage.fileStatus, "unavailable");
    assert.equal(coverage.checkedRepositories, 0);
    assert.equal(coverage.unavailableRepositories, 2);
    assert.equal(coverage.repositoriesWithObservedGaps, 0);
    assert.equal(coverage.documentation.status, "unavailable");
    assert.equal(coverage.documentation.checkedRepositories, 0);
    assert.equal(coverage.documentation.repositoriesWithObservedGaps, 0);
    assert.equal(coverage.classicBranchProtection.status, "unavailable");
    assert.equal(coverage.classicBranchProtection.checkedRepositories, 0);
    assert.equal(coverage.classicBranchProtection.unprotectedRepositories, 0);
    assert.equal(coverage.classicBranchProtection.unavailableRepositories, 2);
    assert.ok(coverage.repositories.every((item) => item.status === "unavailable"));
    assert.ok(coverage.repositories.every((item) => item.missingChecks.length === 0));
    assert.ok(coverage.repositories.every((item) => item.documentation.available === false));
    assert.ok(coverage.repositories.every((item) => item.documentation.missingChecks.length === 0));
    assert.ok(coverage.repositories.every((item) => item.classicBranchProtection.available === false));
    assert.ok(coverage.repositories.every((item) => item.classicBranchProtection.defaultBranchProtected === null));
    assert.ok(coverage.probes.every((probe) => probe.status === "unavailable"));
    assert.ok(coverage.probes.every((probe) => probe.absent === 0));
    assert.ok(coverage.documentation.probes.every((probe) => probe.status === "unavailable"));
    assert.ok(coverage.documentation.probes.every((probe) => probe.absent === 0));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("incomplete branch-protection pagination stays unavailable instead of becoming a false no-rule observation", async () => {
  const repositories = [repository("alpha")];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, options = {}) => {
    const query = queryFromOptions(options);
    if (query.includes("GoreeCloudClassicBranchProtectionObservation")) {
      return response({ data: { r0: protectionNode("alpha", "main", { protectedBranch: false, hasNextPage: true }) } });
    }
    return response({ data: { r0: completeNode("alpha") } });
  };

  try {
    const coverage = await fetchGovernanceCoverage({ GITHUB_TOKEN: TOKEN }, OWNER, repositories);
    assert.equal(coverage.fileStatus, "complete");
    assert.equal(coverage.documentation.status, "complete");
    assert.equal(coverage.classicBranchProtection.status, "unavailable");
    assert.equal(coverage.classicBranchProtection.unprotectedRepositories, 0);
    assert.equal(coverage.status, "partial");
    assert.equal(coverage.repositories[0].classicBranchProtection.available, false);
    assert.equal(coverage.repositories[0].classicBranchProtection.defaultBranchProtected, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("governance observation batches are bounded and preserve independent successful evidence channels", async () => {
  const repositories = Array.from({ length: 21 }, (_, index) => repository(`repo-${String(index + 1).padStart(2, "0")}`));
  const originalFetch = globalThis.fetch;
  let requests = 0;

  globalThis.fetch = async (input, options = {}) => {
    requests += 1;
    const query = queryFromOptions(options);
    const isSecondBatch = query.includes('name: "repo-21"') && !query.includes('name: "repo-01"');
    const isProtection = query.includes("GoreeCloudClassicBranchProtectionObservation");

    if (!isProtection && isSecondBatch) return response({ message: "fixture failure" }, 503);

    const batch = isSecondBatch ? repositories.slice(20) : repositories.slice(0, 20);
    return response({
      data: Object.fromEntries(
        batch.map((item, index) => [
          `r${index}`,
          isProtection ? protectionNode(item.name, item.default_branch, { protectedBranch: true }) : completeNode(item.name),
        ]),
      ),
    });
  };

  try {
    const coverage = await fetchGovernanceCoverage(
      { GITHUB_TOKEN: TOKEN },
      OWNER,
      repositories,
      { batchSize: 20 },
    );

    assert.equal(requests, 4);
    assert.equal(coverage.status, "partial");
    assert.equal(coverage.fileStatus, "partial");
    assert.equal(coverage.checkedRepositories, 20);
    assert.equal(coverage.unavailableRepositories, 1);
    assert.equal(coverage.repositoriesWithAllObservedFiles, 20);
    assert.equal(coverage.repositoriesWithObservedGaps, 0);
    assert.ok(coverage.probes.every((probe) => probe.status === "partial"));
    assert.equal(coverage.documentation.status, "partial");
    assert.equal(coverage.documentation.checkedRepositories, 20);
    assert.equal(coverage.documentation.unavailableRepositories, 1);
    assert.equal(coverage.documentation.repositoriesWithAllObservedFiles, 20);
    assert.ok(coverage.documentation.probes.every((probe) => probe.status === "partial"));
    assert.equal(coverage.classicBranchProtection.status, "complete");
    assert.equal(coverage.classicBranchProtection.checkedRepositories, 21);
    assert.equal(coverage.classicBranchProtection.protectedRepositories, 21);

    const repo21 = coverage.repositories.find((item) => item.name === "repo-21");
    assert.equal(repo21.status, "unavailable");
    assert.equal(repo21.documentation.available, false);
    assert.equal(repo21.classicBranchProtection.available, true);
    assert.equal(repo21.classicBranchProtection.defaultBranchProtected, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
