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

test("governance API returns normalized file and classic branch-protection observations without credential leakage", async () => {
  const originalFetch = globalThis.fetch;
  const authorizations = [];

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    authorizations.push(options.headers?.Authorization || null);

    if (url.pathname === "/user/repos") {
      return jsonResponse([repositoryFixture()]);
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
    assert.equal(payload.observationModel, "presence-and-classic-branch-protection");
    assert.equal(payload.summary.totalRepositories, 1);
    assert.equal(payload.summary.checkedRepositories, 1);
    assert.equal(payload.summary.repositoriesWithObservedGaps, 1);
    assert.equal(payload.summary.classicProtectionCheckedRepositories, 1);
    assert.equal(payload.summary.classicProtectedRepositories, 1);
    assert.equal(payload.summary.classicUnprotectedRepositories, 0);
    assert.equal(payload.summary.classicProtectionUnavailableRepositories, 0);
    assert.equal(payload.governance.repositories[0].status, "gaps");
    assert.deepEqual(payload.governance.repositories[0].missingChecks, ["contributing"]);
    assert.equal(payload.governance.repositories[0].classicBranchProtection.available, true);
    assert.equal(payload.governance.repositories[0].classicBranchProtection.defaultBranchProtected, true);
    assert.equal(payload.governance.repositories[0].classicBranchProtection.matchingRules[0].requiresStatusChecks, true);
    assert.ok(authorizations.every((value) => value === `Bearer ${TOKEN}`));
    assert.doesNotMatch(serialized, new RegExp(TOKEN));
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
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
