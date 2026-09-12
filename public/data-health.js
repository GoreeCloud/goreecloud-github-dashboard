const REPOSITORY_PROBES = [
  {
    key: "recent-changes",
    label: "Recent commits",
    checked: "recentChangeRepositoriesChecked",
    unavailable: "recentChangeRepositoriesUnavailable",
  },
  {
    key: "changelogs",
    label: "Changelogs",
    checked: "changelogRepositoriesChecked",
    unavailable: "changelogRepositoriesUnavailable",
  },
  {
    key: "releases",
    label: "Releases",
    checked: "releaseRepositoriesChecked",
    unavailable: "releaseRepositoriesUnavailable",
  },
  {
    key: "workflows",
    label: "CI workflows",
    checked: "workflowRepositoriesChecked",
    unavailable: "workflowRepositoriesUnavailable",
  },
];

function normalizedCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
}

export function buildCoverageRows(dataHealth = {}) {
  const repositoryRows = REPOSITORY_PROBES.map((probe) => {
    const checked = normalizedCount(dataHealth[probe.checked]);
    const requestedUnavailable = normalizedCount(dataHealth[probe.unavailable]);
    const unavailable = Math.min(checked, requestedUnavailable);
    const available = Math.max(0, checked - unavailable);

    return {
      key: probe.key,
      label: probe.label,
      kind: "repository",
      checked,
      available,
      unavailable,
      status: unavailable > 0 ? "partial" : "complete",
    };
  });

  const rateLimitAvailable = dataHealth.rateLimitAvailable === true;

  return [
    ...repositoryRows,
    {
      key: "api-budget",
      label: "API budget",
      kind: "service",
      available: rateLimitAvailable,
      status: rateLimitAvailable ? "complete" : "unavailable",
    },
  ];
}
