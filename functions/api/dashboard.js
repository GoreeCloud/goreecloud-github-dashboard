import {
  buildRepositoryAttention,
  fetchAllRepositories,
  fetchChangelogs,
  fetchOpenWork,
  fetchRateLimit,
  fetchRecentChanges,
  fetchReleases,
  fetchWorkflowHealth,
  normalizeRepository,
  summarizeRepositories,
  topRepositories,
} from "../lib/github.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const owner = String(env.GITHUB_OWNER || "GoreeCloud").trim();

  if (!env.GITHUB_TOKEN) {
    return json(
      {
        error: "GitHub data is not configured. Add the read-only GITHUB_TOKEN as a server-side secret.",
        code: "github_not_configured",
      },
      503,
    );
  }

  if (String(env.ACCESS_GATE_CONFIRMED || "").toLowerCase() !== "true") {
    return json(
      {
        error: "Private-data access is locked. Protect the deployment with an authenticated private-access layer, verify it, then set ACCESS_GATE_CONFIRMED=true.",
        code: "private_access_gate_locked",
      },
      503,
    );
  }

  try {
    const repositories = await fetchAllRepositories(env, owner);
    const ranked = topRepositories(repositories, 10);

    const [pullRequestResult, issueResult, recentChangeResult, changelogResult, releaseResult, workflowHealth, rateLimit] = await Promise.all([
      fetchOpenWork(env, owner, "pr", 10),
      fetchOpenWork(env, owner, "issue", 10),
      fetchRecentChanges(env, owner, ranked),
      fetchChangelogs(env, owner, ranked),
      fetchReleases(env, owner, ranked),
      fetchWorkflowHealth(env, owner, ranked),
      fetchRateLimit(env),
    ]);

    const normalizedRepositories = repositories
      .map((repository) => normalizeRepository(repository))
      .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));

    const repositoryAttention = buildRepositoryAttention(
      ranked,
      changelogResult.items,
      workflowHealth.items,
      Date.now(),
      {
        changelogUnavailable: changelogResult.unavailableRepositories,
        workflowUnavailable: workflowHealth.unavailableRepositories,
      },
    );
    const unavailableReads = (
      workflowHealth.unavailable
      + recentChangeResult.unavailable
      + changelogResult.unavailable
      + releaseResult.unavailable
    );
    const dataHealth = {
      status: unavailableReads > 0 || !rateLimit ? "partial" : "complete",
      unavailableReads,
      workflowRepositoriesChecked: workflowHealth.checked,
      workflowRepositoriesUnavailable: workflowHealth.unavailable,
      recentChangeRepositoriesChecked: recentChangeResult.checked,
      recentChangeRepositoriesUnavailable: recentChangeResult.unavailable,
      changelogRepositoriesChecked: changelogResult.checked,
      changelogRepositoriesUnavailable: changelogResult.unavailable,
      releaseRepositoriesChecked: releaseResult.checked,
      releaseRepositoriesUnavailable: releaseResult.unavailable,
      rateLimitAvailable: Boolean(rateLimit),
    };

    return json({
      generatedAt: new Date().toISOString(),
      owner,
      mode: "read-only",
      summary: summarizeRepositories(repositories, pullRequestResult.total, issueResult.total),
      topRepositories: ranked,
      repositoryAttention,
      workflowHealth: workflowHealth.items,
      rateLimit,
      dataHealth,
      recentChanges: recentChangeResult.items,
      changelogs: changelogResult.items,
      releases: releaseResult.items,
      pullRequests: pullRequestResult.items,
      issues: issueResult.items,
      repositories: normalizedRepositories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub aggregation failed.";
    console.error("Dashboard aggregation failed without exposing credentials.", message);
    return json(
      {
        error: "The dashboard could not refresh from GitHub. Check read-only token permissions, rate limits, and deployment configuration.",
        code: "github_aggregation_failed",
      },
      502,
    );
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return json({ error: "Method not allowed.", code: "method_not_allowed" }, 405);
}
