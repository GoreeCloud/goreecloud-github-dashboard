import test from "node:test";
import assert from "node:assert/strict";
import { onRequest, onRequestGet } from "../functions/api/governance.js";

const OWNER = "GoreeCloud";
const TOKEN = "governance-api-fixture-token";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function repositoryFixture() {
  return {
    id: 1001,
    name: "governance-fixture",
    full_name: `${OWNER}/governance-fixture`,
    html_url: `https://github.com/${OWNER}/governance-fixture`,
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
    default_branch: "main",
    pushed_at: "2026-09-05T12:00:00Z",
    updated_at: "2026-09-05T12:00:00Z",
    owner: { login: OWNER },
  };
}

function graphqlQuery(options = {}) {
  return JSON.parse(options.body || "{}").query || "";
}

test("governance API fails closed when GitHub credentials are missing", async () => {
  const response = await onRequestGet({ env: { GITHUB_OWNER: OWNER, ACCESS_GATE_CONFIRMED: "true" } });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.code, "github_not_configured");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("governance API fails closed when the external access gate is unconfirmed", async () => {
  const response = await onRequestGet({
    env: { GITHUB_OWNER: OWNER, GITHUB_TOKEN: TOKEN, ACCESS_GATE_CONFIRMED: "false" },
  });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.code, "private_access_gate_locked");
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(TOKEN));
});

test("governance API returns normalized files, classic protection, active rulesets, and workflow references without credential leakage", async () => {
  const originalFetch = globalThis.fetch;
  const authorizations = [];
  const rulesetApiVersions = [];

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    authorizations.push(options.headers?.Authorization || null);

    if (url.pathname === "/user/repos") {
      return jsonResponse([repositoryFixture()]);
    }

    if (url.pathname === "/repos/GoreeCloud/governance-fixture/rules/branches/main") {
      rulesetApiVersions.push(options.headers?.["X-GitHub-Api-Version"] || null);
      return jsonResponse([
        {
          type: "pull_request",
          ruleset_source_type: "Repository",
          ruleset_source: `${OWNER}/governance-fixture`,
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
        {
          type: "workflows",
          ruleset_source_type: "Organization",
          ruleset_source: OWNER,
          ruleset_id: 99,
          parameters: {
            workflows: [{
              path: ".github/workflows/platform-contract.yml",
              ref: "refs/heads/main",
              repository_id: 1001,
              sha: "0123456789abcdef0123456789abcdef01234567",
            }],
          },
        },
      ]);
    }

    if (url.pathname === "/graphql") {
      const query = graphqlQuery(options);
      if (query.includes("GoreeCloudClassicBranchProtectionObservation")) {
        return jsonResponse({
          data: {
            r0: {
              name: "governance-fixture",
              branchProtectionRules: {
                pageInfo: { hasNextPage: false },
                nodes: [
                  {
                    pattern: "main",
                    allowsDeletions: false,
                    allowsForcePushes: false,
                    isAdminEnforced: true,
                    requireLastPushApproval: true,
                    requiredApprovingReviewCount: 1,
                    requiredStatusCheckContexts: ["validate"],
                    requiresApprovingReviews: true,
                    requiresCodeOwnerReviews: true,
                    requiresCommitSignatures: false,
                    requiresConversationResolution: true,
                    requiresLinearHistory: false,
                    requiresStatusChecks: true,
                    requiresStrictStatusChecks: true,
                    matchingRefs: {
                      pageInfo: { hasNextPage: false },
                      nodes: [{ name: "main" }],
                    },
                  },
                ],
              },
            },
          },
        });
      }

      return jsonResponse({
        data: {
          r0: {
            name: "governance-fixture",
            platformContract: { oid: "platform" },
            security: { oid: "security" },
            contributing: null,
            codeowners: { oid: "codeowners" },
          },
        },
      });
    }

    throw new Error(`Unhandled governance API fixture endpoint: ${url.pathname}`);
  };

  try {
    const response = await onRequestGet({
      env: { GITHUB_OWNER: OWNER, GITHUB_TOKEN: TOKEN, ACCESS_GATE_CONFIRMED: "true" },
    });
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    assert.equal(response.status, 200);
    assert.equal(payload.owner, OWNER);
    assert.equal(payload.mode, "read-only");
    assert.equal(payload.observationModel, "baseline-files-classic-protection-active-rulesets");
    assert.equal(payload.observationStatus, "complete");
    assert.equal(payload.summary.totalRepositories, 1);
    assert.equal(payload.summary.checkedRepositories, 1);
    assert.equal(payload.summary.repositoriesWithObservedGaps, 1);
    assert.equal(payload.summary.classicProtectionCheckedRepositories, 1);
    assert.equal(payload.summary.classicProtectedRepositories, 1);
    assert.equal(payload.summary.rulesetCheckedRepositories, 1);
    assert.equal(payload.summary.repositoriesWithActiveRulesets, 1);
    assert.equal(payload.summary.repositoriesWithRequiredWorkflowRules, 1);
    assert.equal(payload.summary.observedActiveRulesetRules, 3);
    assert.equal(payload.summary.observedRequiredWorkflowReferences, 1);
    assert.equal(payload.governance.repositories[0].status, "gaps");
    assert.deepEqual(payload.governance.repositories[0].missingChecks, ["contributing"]);
    assert.equal(payload.governance.repositories[0].classicBranchProtection.defaultBranchProtected, true);
    assert.equal(payload.rulesets.workflowObservationModel, "active-ruleset-required-workflow-references");
    assert.equal(payload.rulesets.repositories[0].hasRequiredWorkflowRule, true);
    assert.deepEqual(payload.rulesets.repositories[0].requiredWorkflows, [{
      path: ".github/workflows/platform-contract.yml",
      repositoryId: 1001,
      repository: "governance-fixture",
      ref: "refs/heads/main",
      sha: "0123456789abcdef0123456789abcdef01234567",
    }]);
    assert.equal("parameters" in payload.rulesets.repositories[0].rules[2], false);
    assert.deepEqual(rulesetApiVersions, ["2026-03-10"]);
    assert.ok(authorizations.every((value) => value === `Bearer ${TOKEN}`));
    assert.doesNotMatch(serialized, new RegExp(TOKEN));
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ruleset observation can fail soft while file and classic evidence remain usable", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    if (url.pathname === "/user/repos") return jsonResponse([repositoryFixture()]);
    if (url.pathname.includes("/rules/branches/")) return jsonResponse({ message: "forbidden" }, 403);
    if (url.pathname === "/graphql") {
      const query = graphqlQuery(options);
      if (query.includes("GoreeCloudClassicBranchProtectionObservation")) {
        return jsonResponse({
          data: {
            r0: {
              name: "governance-fixture",
              branchProtectionRules: { pageInfo: { hasNextPage: false }, nodes: [] },
            },
          },
        });
      }
      return jsonResponse({
        data: {
          r0: {
            name: "governance-fixture",
            platformContract: { oid: "platform" },
            security: { oid: "security" },
            contributing: { oid: "contributing" },
            codeowners: { oid: "codeowners" },
          },
        },
      });
    }
    throw new Error(`Unhandled endpoint: ${url.pathname}`);
  };

  try {
    const response = await onRequestGet({
      env: { GITHUB_OWNER: OWNER, GITHUB_TOKEN: TOKEN, ACCESS_GATE_CONFIRMED: "true" },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.observationStatus, "partial");
    assert.equal(payload.governance.status, "complete");
    assert.equal(payload.rulesets.status, "unavailable");
    assert.equal(payload.summary.rulesetUnavailableRepositories, 1);
    assert.equal(payload.summary.repositoriesWithRequiredWorkflowRules, 0);
    assert.equal(payload.governance.repositories[0].checksAvailable, true);
    assert.equal(payload.governance.repositories[0].classicBranchProtection.available, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("governance API rejects mutation-style methods", async () => {
  const response = await onRequest({ request: new Request("https://example.invalid/api/governance", { method: "POST" }) });
  const payload = await response.json();

  assert.equal(response.status, 405);
  assert.equal(payload.code, "method_not_allowed");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});
