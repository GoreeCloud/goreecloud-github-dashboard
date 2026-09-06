import { fetchAllRepositories } from "../lib/github.js";
import { fetchGovernanceCoverage } from "../lib/governance.js";

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
        error: "GitHub governance data is not configured.",
        code: "github_not_configured",
      },
      503,
    );
  }

  if (String(env.ACCESS_GATE_CONFIRMED || "").toLowerCase() !== "true") {
    return json(
      {
        error: "Private governance data access is locked.",
        code: "private_access_gate_locked",
      },
      503,
    );
  }

  try {
    const repositories = await fetchAllRepositories(env, owner);
    const governance = await fetchGovernanceCoverage(env, owner, repositories);

    return json({
      generatedAt: new Date().toISOString(),
      owner,
      mode: "read-only",
      observationModel: "presence-only",
      summary: {
        totalRepositories: governance.totalRepositories,
        checkedRepositories: governance.checkedRepositories,
        unavailableRepositories: governance.unavailableRepositories,
        repositoriesWithAllObservedFiles: governance.repositoriesWithAllObservedFiles,
        repositoriesWithObservedGaps: governance.repositoriesWithObservedGaps,
      },
      governance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub governance aggregation failed.";
    console.error("Governance aggregation failed without exposing credentials.", message);
    return json(
      {
        error: "The governance view could not refresh from GitHub. Check read-only token permissions, API availability, and deployment configuration.",
        code: "github_governance_aggregation_failed",
      },
      502,
    );
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return json({ error: "Method not allowed.", code: "method_not_allowed" }, 405);
}
