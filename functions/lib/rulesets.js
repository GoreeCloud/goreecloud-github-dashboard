import { githubRequest } from "./github.js";

export const RULESET_API_VERSION = "2026-03-10";

const RULESET_PAGE_SIZE = 100;
const DEFAULT_RULESET_CONCURRENCY = 6;
const MAX_RULESET_CONCURRENCY = 8;
const MAX_RULE_DETAILS = 40;
const MAX_RULE_TYPES = 40;
const MAX_RULESET_SOURCES = 40;

function coverageStatus(total, checked, unavailable) {
  if (total > 0 && checked === 0 && unavailable > 0) return "unavailable";
  if (unavailable > 0) return "partial";
  return "complete";
}

function boundedConcurrency(value = DEFAULT_RULESET_CONCURRENCY) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_RULESET_CONCURRENCY;
  return Math.min(MAX_RULESET_CONCURRENCY, Math.max(1, Math.floor(numeric)));
}

function safeString(value, limit = 160) {
  return typeof value === "string" ? value.slice(0, limit) : null;
}

export function normalizeRulesetRule(rule = {}) {
  const rulesetId = Number(rule.ruleset_id);
  return {
    type: safeString(rule.type, 100) || "unknown",
    rulesetId: Number.isFinite(rulesetId) ? rulesetId : null,
    rulesetSourceType: safeString(rule.ruleset_source_type, 80),
    rulesetSource: safeString(rule.ruleset_source, 160),
  };
}

function sourceKey(rule) {
  return [rule.rulesetSourceType || "unknown", rule.rulesetSource || "unknown", rule.rulesetId ?? "unknown"].join(":");
}

function normalizeRulesetResponse(repository, rules) {
  if (!Array.isArray(rules)) {
    return {
      repository: repository.name,
      available: false,
      defaultBranch: repository.default_branch || "main",
      activeRuleCount: null,
      hasActiveRules: null,
      ruleTypes: [],
      sources: [],
      rules: [],
    };
  }

  // A full first page cannot prove there is no second page because githubRequest
  // intentionally returns only the response body. Keep that evidence unavailable
  // rather than silently treating a potentially truncated rule set as complete.
  if (rules.length >= RULESET_PAGE_SIZE) {
    return {
      repository: repository.name,
      available: false,
      defaultBranch: repository.default_branch || "main",
      activeRuleCount: null,
      hasActiveRules: null,
      ruleTypes: [],
      sources: [],
      rules: [],
    };
  }

  const normalizedRules = rules.map(normalizeRulesetRule);
  const ruleTypes = [...new Set(normalizedRules.map((rule) => rule.type))].slice(0, MAX_RULE_TYPES);
  const sourceMap = new Map();
  for (const rule of normalizedRules) {
    const key = sourceKey(rule);
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        rulesetId: rule.rulesetId,
        sourceType: rule.rulesetSourceType,
        source: rule.rulesetSource,
      });
    }
  }

  return {
    repository: repository.name,
    available: true,
    defaultBranch: repository.default_branch || "main",
    activeRuleCount: normalizedRules.length,
    hasActiveRules: normalizedRules.length > 0,
    ruleTypes,
    sources: [...sourceMap.values()].slice(0, MAX_RULESET_SOURCES),
    rules: normalizedRules.slice(0, MAX_RULE_DETAILS),
  };
}

async function fetchRepositoryRulesets(env, owner, repository) {
  const branch = repository.default_branch || "main";
  const rules = await githubRequest(
    env,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository.name)}/rules/branches/${encodeURIComponent(branch)}?per_page=${RULESET_PAGE_SIZE}&page=1`,
    {
      headers: {
        "X-GitHub-Api-Version": RULESET_API_VERSION,
      },
    },
  );

  return normalizeRulesetResponse(repository, rules);
}

function unavailableObservation(repository) {
  return {
    repository: repository.name,
    available: false,
    defaultBranch: repository.default_branch || "main",
    activeRuleCount: null,
    hasActiveRules: null,
    ruleTypes: [],
    sources: [],
    rules: [],
  };
}

export function buildRulesetCoverage(repositories, observations = []) {
  const observationByRepository = new Map(
    observations.map((observation) => [observation.repository, observation]),
  );

  const rows = repositories.map((repository) => {
    const observation = observationByRepository.get(repository.name);
    return observation?.available === true
      ? observation
      : unavailableObservation(repository);
  });

  rows.sort((a, b) => {
    if (a.available !== b.available) return a.available ? 1 : -1;
    if (a.hasActiveRules !== b.hasActiveRules) return a.hasActiveRules ? -1 : 1;
    return a.repository.localeCompare(b.repository);
  });

  const checkedRepositories = rows.filter((row) => row.available).length;
  const unavailableRepositories = rows.length - checkedRepositories;
  const repositoriesWithActiveRules = rows.filter(
    (row) => row.available && row.hasActiveRules === true,
  ).length;
  const repositoriesWithNoActiveRules = Math.max(
    0,
    checkedRepositories - repositoriesWithActiveRules,
  );
  const observedActiveRules = rows.reduce(
    (total, row) => total + (row.available ? Number(row.activeRuleCount || 0) : 0),
    0,
  );

  return {
    status: coverageStatus(rows.length, checkedRepositories, unavailableRepositories),
    scope: "active-default-branch-rulesets",
    apiVersion: RULESET_API_VERSION,
    totalRepositories: rows.length,
    checkedRepositories,
    repositoriesWithActiveRules,
    repositoriesWithNoActiveRules,
    unavailableRepositories,
    observedActiveRules,
    repositories: rows,
  };
}

export async function fetchRulesetCoverage(env, owner, repositories, options = {}) {
  const candidates = repositories.filter((repository) => (
    repository.owner?.login?.toLowerCase() === owner.toLowerCase()
  ));
  const concurrency = boundedConcurrency(options.rulesetConcurrency);
  const observations = [];

  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    const settled = await Promise.allSettled(
      batch.map((repository) => fetchRepositoryRulesets(env, owner, repository)),
    );

    settled.forEach((result, batchIndex) => {
      observations.push(
        result.status === "fulfilled"
          ? result.value
          : unavailableObservation(batch[batchIndex]),
      );
    });
  }

  return buildRulesetCoverage(candidates, observations);
}
