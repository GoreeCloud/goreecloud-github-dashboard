import { githubRequest } from "./github.js";

export const GOVERNANCE_PROBES = Object.freeze([
  Object.freeze({ key: "platformContract", label: "Platform Contract", path: "goreecloud.platform.yaml" }),
  Object.freeze({ key: "security", label: "SECURITY", path: "SECURITY.md" }),
  Object.freeze({ key: "contributing", label: "CONTRIBUTING", path: "CONTRIBUTING.md" }),
  Object.freeze({ key: "codeowners", label: "CODEOWNERS", path: ".github/CODEOWNERS" }),
]);

const DEFAULT_BATCH_SIZE = 20;
const MAX_BATCH_SIZE = 25;

function boundedBatchSize(value = DEFAULT_BATCH_SIZE) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_BATCH_SIZE;
  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(numeric)));
}

function quoted(value) {
  return JSON.stringify(String(value));
}

function repositoryExpression(repository, path) {
  const branch = repository.default_branch || "main";
  return `${branch}:${path}`;
}

export function buildGovernanceGraphqlQuery(owner, repositories) {
  const fields = repositories.map((repository, index) => {
    const probes = GOVERNANCE_PROBES.map((probe) => (
      `${probe.key}: object(expression: ${quoted(repositoryExpression(repository, probe.path))}) { oid }`
    )).join("\n      ");

    return `r${index}: repository(owner: ${quoted(owner)}, name: ${quoted(repository.name)}) {\n      name\n      ${probes}\n    }`;
  }).join("\n    ");

  return `query GoreeCloudGovernanceObservation {\n    ${fields}\n  }`;
}

function normalizedRepository(repository) {
  return {
    name: repository.name,
    url: repository.html_url,
    visibility: repository.visibility || (repository.private ? "private" : "public"),
    private: Boolean(repository.private),
    archived: Boolean(repository.archived),
    defaultBranch: repository.default_branch || "main",
    updatedAt: repository.pushed_at || repository.updated_at || null,
  };
}

export function buildGovernanceCoverage(repositories, observations = []) {
  const observationByRepository = new Map(observations.map((observation) => [observation.repository, observation]));
  const rows = repositories.map((repository) => {
    const normalized = normalizedRepository(repository);
    const observation = observationByRepository.get(repository.name);
    const available = observation?.available === true;
    const presence = available ? observation.presence || {} : {};
    const presentChecks = available
      ? GOVERNANCE_PROBES.filter((probe) => presence[probe.key] === true).map((probe) => probe.key)
      : [];
    const missingChecks = available
      ? GOVERNANCE_PROBES.filter((probe) => presence[probe.key] !== true).map((probe) => probe.key)
      : [];

    return {
      ...normalized,
      status: available ? (missingChecks.length ? "gaps" : "observed") : "unavailable",
      checksAvailable: available,
      presentChecks,
      missingChecks,
    };
  });

  rows.sort((a, b) => {
    if (a.status === "unavailable" && b.status !== "unavailable") return -1;
    if (b.status === "unavailable" && a.status !== "unavailable") return 1;
    if (b.missingChecks.length !== a.missingChecks.length) return b.missingChecks.length - a.missingChecks.length;
    return a.name.localeCompare(b.name);
  });

  const checkedRepositories = rows.filter((row) => row.checksAvailable).length;
  const unavailableRepositories = rows.length - checkedRepositories;
  const probes = GOVERNANCE_PROBES.map((probe) => {
    const present = rows.filter((row) => row.checksAvailable && row.presentChecks.includes(probe.key)).length;
    return {
      key: probe.key,
      label: probe.label,
      path: probe.path,
      checked: checkedRepositories,
      present,
      absent: Math.max(0, checkedRepositories - present),
      unavailable: unavailableRepositories,
      status: unavailableRepositories > 0 ? "partial" : "complete",
    };
  });

  return {
    status: unavailableRepositories > 0 ? "partial" : "complete",
    totalRepositories: rows.length,
    checkedRepositories,
    unavailableRepositories,
    repositoriesWithAllObservedFiles: rows.filter((row) => row.status === "observed").length,
    repositoriesWithObservedGaps: rows.filter((row) => row.status === "gaps").length,
    probes,
    repositories: rows,
  };
}

async function fetchGovernanceBatch(env, owner, repositories) {
  const query = buildGovernanceGraphqlQuery(owner, repositories);
  const payload = await githubRequest(env, "/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!payload || (Array.isArray(payload.errors) && payload.errors.length > 0)) {
    throw new Error("GitHub GraphQL governance observation was unavailable.");
  }

  return repositories.map((repository, index) => {
    const node = payload.data?.[`r${index}`];
    if (!node || node.name !== repository.name) {
      return { repository: repository.name, available: false, presence: {} };
    }

    return {
      repository: repository.name,
      available: true,
      presence: Object.fromEntries(
        GOVERNANCE_PROBES.map((probe) => [probe.key, Boolean(node[probe.key]?.oid)]),
      ),
    };
  });
}

export async function fetchGovernanceCoverage(env, owner, repositories, options = {}) {
  const candidates = repositories.filter((repository) => (
    repository.owner?.login?.toLowerCase() === owner.toLowerCase()
  ));
  const batchSize = boundedBatchSize(options.batchSize);
  const batches = [];

  for (let index = 0; index < candidates.length; index += batchSize) {
    batches.push(candidates.slice(index, index + batchSize));
  }

  const settled = await Promise.allSettled(
    batches.map((batch) => fetchGovernanceBatch(env, owner, batch)),
  );
  const observations = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      observations.push(...result.value);
      return;
    }

    observations.push(...batches[index].map((repository) => ({
      repository: repository.name,
      available: false,
      presence: {},
    })));
  });

  return buildGovernanceCoverage(candidates, observations);
}
