import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGovernanceGraphqlQuery,
  fetchGovernanceCoverage,
  parsePlatformComponentType,
} from "../functions/lib/governance.js";

const OWNER = "GoreeCloud";
const TOKEN = "governance-applicability-fixture-token";

function repository(name) {
  return {
    name,
    full_name: `${OWNER}/${name}`,
    html_url: `https://github.com/${OWNER}/${name}`,
    visibility: "private",
    private: true,
    archived: false,
    disabled: false,
    default_branch: "main",
    pushed_at: "2026-09-06T12:00:00Z",
    updated_at: "2026-09-06T12:00:00Z",
    owner: { login: OWNER },
  };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function fileNode(name, componentType = null, missing = []) {
  const keys = [
    "platformContract",
    "security",
    "contributing",
    "codeowners",
    "readme",
    "specifications",
    "features",
    "benefits",
    "competitiveObjectives",
    "branding",
  ];
  const node = {
    name,
    ...Object.fromEntries(keys.map((key) => [key, missing.includes(key) ? null : { oid: `${name}-${key}` }])),
  };
  if (node.platformContract && componentType) {
    const text = `schema_version: "0.2"\n\ncomponent:\n  type: ${componentType}\n  id: fixture\n  product_name: Fixture\n  repository: GoreeCloud/${name}\n`;
    node.platformContract = {
      ...node.platformContract,
      byteSize: Buffer.byteLength(text),
      text,
    };
  }
  return node;
}

function protectionNode(name) {
  return {
    name,
    branchProtectionRules: {
      pageInfo: { hasNextPage: false },
      nodes: [],
    },
  };
}

function queryFromOptions(options = {}) {
  return JSON.parse(options.body || "{}").query || "";
}

test("platform component parser accepts only explicit application/service declarations inside component", () => {
  assert.equal(parsePlatformComponentType("component:\n  type: application\n"), "application");
  assert.equal(parsePlatformComponentType("component:\n  type: 'service' # governed role\n"), "service");
  assert.equal(parsePlatformComponentType("type: application\ncomponent:\n  id: missing-type\n"), null);
  assert.equal(parsePlatformComponentType("component:\n  type: library\n"), null);
  assert.equal(parsePlatformComponentType("component: { type: application }\n"), null);
});

test("governance GraphQL query requests bounded Platform Contract blob text in the existing file observation", () => {
  const query = buildGovernanceGraphqlQuery(OWNER, [repository("alpha")]);
  assert.match(query, /platformContract: object\(expression: "main:goreecloud\.platform\.yaml"\)/);
  assert.match(query, /\.\.\. on Blob \{ byteSize text \}/);
  assert.equal((query.match(/GoreeCloudGovernanceObservation/g) || []).length, 1);
});

test("documentation applicability is classified only from explicit Platform Contract component types", async () => {
  const repositories = [repository("app"), repository("service"), repository("unclassified")];
  const originalFetch = globalThis.fetch;
  let requests = 0;

  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/graphql");
    requests += 1;
    const query = queryFromOptions(options);

    if (query.includes("GoreeCloudClassicBranchProtectionObservation")) {
      return response({
        data: {
          r0: protectionNode("app"),
          r1: protectionNode("service"),
          r2: protectionNode("unclassified"),
        },
      });
    }

    return response({
      data: {
        r0: fileNode("app", "application"),
        r1: fileNode("service", "service", ["benefits"]),
        r2: fileNode("unclassified", null),
      },
    });
  };

  try {
    const coverage = await fetchGovernanceCoverage({ GITHUB_TOKEN: TOKEN }, OWNER, repositories);
    assert.equal(requests, 2);
    assert.equal(coverage.documentation.applicability, "mixed-platform-contract-component-type");
    assert.equal(coverage.documentation.applicabilityModel, "platform-contract-component-type-declaration");
    assert.deepEqual(coverage.documentation.applicableComponentTypes, ["application", "service"]);
    assert.equal(coverage.documentation.classifiedRepositories, 2);
    assert.equal(coverage.documentation.unclassifiedRepositories, 1);
    assert.equal(coverage.documentation.applicationRepositories, 1);
    assert.equal(coverage.documentation.serviceRepositories, 1);
    assert.equal(coverage.documentation.applicableRepositoriesWithAllObservedFiles, 1);
    assert.equal(coverage.documentation.applicableRepositoriesWithObservedGaps, 1);

    const app = coverage.repositories.find((item) => item.name === "app");
    assert.deepEqual(app.documentation.applicability, {
      status: "applicable",
      componentType: "application",
      source: "goreecloud.platform.yaml",
      reason: "explicit-platform-contract-component-type",
    });

    const service = coverage.repositories.find((item) => item.name === "service");
    assert.equal(service.documentation.applicability.status, "applicable");
    assert.equal(service.documentation.applicability.componentType, "service");
    assert.deepEqual(service.documentation.missingChecks, ["benefits"]);

    const unclassified = coverage.repositories.find((item) => item.name === "unclassified");
    assert.equal(unclassified.documentation.applicability.status, "unclassified");
    assert.equal(unclassified.documentation.applicability.componentType, null);
    assert.equal(unclassified.documentation.applicability.reason, "platform-contract-text-unavailable");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
