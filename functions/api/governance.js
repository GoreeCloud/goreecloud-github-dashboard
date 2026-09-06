import { fetchAllRepositories } from "../lib/github.js";
import { fetchGovernanceCoverage } from "../lib/governance.js";
import { fetchRulesetCoverage } from "../lib/rulesets.js";

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

function combinedObservationStatus(...statuses) {
  if (statuses.every((status) => status === "complete")) return "complete";
  if (statuses.every((status) => status === "unavailable")) return "unavailable";
  return "partial";
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
    const [governance, rulesets] = await Promise.all([
      fetchGovernanceCoverage(env, owner, repositories),
      fetchRulesetCoverage(env, owner, repositories),
    ]);
    const documentation = governance.documentation || {};
    const classicProtection = governance.classicBranchProtection || {};
    const observationStatus = combinedObservationStatus(governance.status, rulesets.status);

    return json({
      generatedAt: new Date().toISOString(),
      owner,
      mode: "read-only",
      observationModel: "baseline-files-documentation-evidence-classic-protection-active-rulesets",
      observationStatus,
      summary: {
        totalRepositories: governance.totalRepositories,
        checkedRepositories: governance.checkedRepositories,
        unavailableRepositories: governance.unavailableRepositories,
        repositoriesWithAllObservedFiles: governance.repositoriesWithAllObservedFiles,
        repositoriesWithObservedGaps: governance.repositoriesWithObservedGaps,
        documentationCheckedRepositories: documentation.checkedRepositories || 0,
        documentationUnavailableRepositories: documentation.unavailableRepositories || 0,
        repositoriesWithAllObservedDocumentation: documentation.repositoriesWithAllObservedFiles || 0,
        repositoriesWithObservedDocumentationGaps: documentation.repositoriesWithObservedGaps || 0,
        classicProtectionCheckedRepositories: classicProtection.checkedRepositories || 0,
        classicProtectedRepositories: classicProtection.protectedRepositories || 0,
        classicUnprotectedRepositories: classicProtection.unprotectedRepositories || 0,
        classicProtectionUnavailableRepositories: classicProtection.unavailableRepositories || 0,
        rulesetCheckedRepositories: rulesets.checkedRepositories || 0,
        repositoriesWithActiveRulesets: rulesets.repositoriesWithActiveRules || 0,
        repositoriesWithNoActiveRulesets: rulesets.repositoriesWithNoActiveRules || 0,
        repositoriesWithRequiredWorkflowRules: rulesets.repositoriesWithRequiredWorkflowRules || 0,
        rulesetUnavailableRepositories: rulesets.unavailableRepositories || 0,
        observedActiveRulesetRules: rulesets.observedActiveRules || 0,
        observedRequiredWorkflowReferences: rulesets.observedRequiredWorkflowReferences || 0,
      },
      governance,
      rulesets,
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
