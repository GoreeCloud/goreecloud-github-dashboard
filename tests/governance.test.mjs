import test from "node:test";
import assert from "node:assert/strict";
import {
  GOVERNANCE_PROBES,
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
      GOVERNANCE_PROBES.map((probe) => [probe.key, missing.includes(probe.key) ? null : { oid: `${name}-${probe.key}` }]),
    ),
  };
}

test("governance GraphQL query binds exact default branches and governed paths", () => {
  const query = buildGovernanceGraphqlQuery(OWNER, [
    repository("alpha", { default_branch: "master" }),
    repository("beta", { default_branch: "release/v1" }),
  ]);

  assert.match(query, /repository\(owner: "GoreeCloud", name: "alpha"\)/);
  assert.match(query, /master:goreecloud\.platform\.yaml/);
  assert.match(query, /master:SECURITY\.md/);
  assert.match(query, /master:CONTRIBUTING\.md/);
  assert.match(query, /master:\.github\/CODEOWNERS/);
  assert.match(query, /release\/v1:goreecloud\.platform\.yaml/);
});

test("governance coverage reports observed presence and absence without calling absence compliance", async () => {
  const repositories = [repository("alpha"), repository("beta", { visibility: "public", private: false })];
  const originalFetch = globalThis.fetch;
  let requests = 0;

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/graphql");
    assert.equal(options.method, "POST");
    assert.equal(options.headers?.Authorization, `Bearer ${TOKEN}`);
    requests += 1;
    return response({
      data: {
        r0: completeNode("alpha", ["contributing"]),
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

    assert.equal(requests, 1);
    assert.equal(coverage.status, "complete");
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

    const alpha = coverage.repositories.find((item) => item.name === "alpha");
    assert.equal(alpha.status, "gaps");
    assert.deepEqual(alpha.missingChecks, ["contributing"]);
    assert.equal(alpha.checksAvailable, true);

    const beta = coverage.repositories.find((item) => item.name === "beta");
    assert.equal(beta.status, "observed");
    assert.deepEqual(beta.missingChecks, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GraphQL errors remain unavailable instead of becoming false missing-file claims", async () => {
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
    assert.equal(coverage.checkedRepositories, 0);
    assert.equal(coverage.unavailableRepositories, 2);
    assert.equal(coverage.repositoriesWithObservedGaps, 0);
    assert.ok(coverage.repositories.every((item) => item.status === "unavailable"));
    assert.ok(coverage.repositories.every((item) => item.missingChecks.length === 0));
    assert.ok(coverage.probes.every((probe) => probe.status === "unavailable"));
    assert.ok(coverage.probes.every((probe) => probe.absent === 0));
    assert.ok(coverage.probes.every((probe) => probe.unavailable === 2));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("governance observation batches are bounded and preserve successful peer batches", async () => {
  const repositories = Array.from({ length: 21 }, (_, index) => repository(`repo-${String(index + 1).padStart(2, "0")}`));
  const originalFetch = globalThis.fetch;
  let requests = 0;

  globalThis.fetch = async () => {
    requests += 1;
    if (requests === 2) return response({ message: "fixture failure" }, 503);

    return response({
      data: Object.fromEntries(
        repositories.slice(0, 20).map((item, index) => [`r${index}`, completeNode(item.name)]),
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

    assert.equal(requests, 2);
    assert.equal(coverage.status, "partial");
    assert.equal(coverage.checkedRepositories, 20);
    assert.equal(coverage.unavailableRepositories, 1);
    assert.equal(coverage.repositoriesWithAllObservedFiles, 20);
    assert.equal(coverage.repositoriesWithObservedGaps, 0);
    assert.ok(coverage.probes.every((probe) => probe.status === "partial"));
    assert.equal(coverage.repositories.find((item) => item.name === "repo-21").status, "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
