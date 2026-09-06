const state = {
  data: null,
  loading: false,
};

const PROBE_LABELS = {
  platformContract: "Platform Contract",
  security: "SECURITY",
  contributing: "CONTRIBUTING",
  codeowners: "CODEOWNERS",
};

const DOCUMENTATION_LABELS = {
  readme: "README",
  specifications: "SPECIFICATIONS",
  features: "FEATURES",
  benefits: "BENEFITS",
  competitiveObjectives: "COMPETITIVE-OBJECTIVES",
  branding: "BRANDING",
};

const byId = (id) => document.getElementById(id);

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = String(value ?? "—");
}

function setPill(id, value, success = false) {
  const element = byId(id);
  if (!element) return;
  element.textContent = String(value ?? "—");
  element.className = success ? "pill pill-success" : "pill";
}

function clear(element) {
  while (element?.firstChild) element.removeChild(element.firstChild);
}

function formatRelative(dateValue) {
  if (!dateValue) return "Unknown";
  const then = new Date(dateValue).getTime();
  if (!Number.isFinite(then)) return "Unknown";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function createBadge(text, variant = "") {
  const badge = document.createElement("span");
  badge.className = `badge${variant ? ` badge-${variant}` : ""}`;
  badge.textContent = text;
  return badge;
}

function createLink(url, text) {
  const link = document.createElement("a");
  link.className = "item-link";
  link.href = url || "#";
  if (url) {
    link.target = "_blank";
    link.rel = "noreferrer noopener";
  }
  link.textContent = text;
  return link;
}

function emptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function coverageLabel(status) {
  if (status === "complete") return "Observed";
  if (status === "unavailable") return "Unavailable";
  return "Partial";
}

function renderProbeCards(containerId, countId, probes = [], labels = {}, emptyMessage = "No probes were returned.") {
  const container = byId(containerId);
  clear(container);
  setText(countId, probes.length);

  if (!probes.length) {
    container?.append(emptyState(emptyMessage));
    return;
  }

  for (const probe of probes) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = probe.label || labels[probe.key] || probe.key;
    const badge = createBadge(
      coverageLabel(probe.status),
      probe.status === "complete" ? "success" : "private",
    );
    header.append(title, badge);

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = probe.checked > 0
      ? `${probe.present} present · ${probe.absent} absent across ${probe.checked} safely observed repositories.`
      : "No repositories were safely observed for this file.";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = `${probe.path || "Expected path unavailable"}${probe.unavailable ? ` · ${probe.unavailable} repository observations unavailable` : ""}`;

    card.append(header, description, meta);
    container?.append(card);
  }
}

function renderProbes(probes = []) {
  renderProbeCards(
    "probe-list",
    "probe-count",
    probes,
    PROBE_LABELS,
    "No governance probes were returned.",
  );
}

function renderDocumentation(documentation = {}) {
  renderProbeCards(
    "documentation-list",
    "documentation-count",
    documentation.probes || [],
    DOCUMENTATION_LABELS,
    "No documentation evidence was returned.",
  );

  const boundary = byId("documentation-boundary");
  if (boundary) {
    boundary.textContent = documentation.applicability === "repository-role-unclassified"
      ? "Repository role/type applicability is not evaluated by this view. Presence or absence is evidence only."
      : "Documentation applicability remains a separate governed decision.";
  }
}

function protectionControlLabels(rules = []) {
  const labels = [];
  if (rules.some((rule) => rule.requiresApprovingReviews)) labels.push("approving reviews");
  if (rules.some((rule) => rule.requiresCodeOwnerReviews)) labels.push("code-owner reviews");
  if (rules.some((rule) => rule.requiresStatusChecks)) labels.push("status checks");
  if (rules.some((rule) => rule.requiresStrictStatusChecks)) labels.push("up-to-date branch");
  if (rules.some((rule) => rule.requiresCommitSignatures)) labels.push("signed commits");
  if (rules.some((rule) => rule.requiresConversationResolution)) labels.push("conversation resolution");
  if (rules.some((rule) => rule.requireLastPushApproval)) labels.push("last-push approval");
  return labels;
}

function renderClassicProtection(protection = {}) {
  const container = byId("classic-protection-list");
  clear(container);
  setText("classic-protection-count", protection.checkedRepositories ?? 0);

  const card = document.createElement("article");
  card.className = "list-card";

  const header = document.createElement("div");
  header.className = "list-card-header";
  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = "Classic default-branch rules";
  header.append(
    title,
    createBadge(
      coverageLabel(protection.status),
      protection.status === "complete" ? "success" : "private",
    ),
  );

  const description = document.createElement("p");
  description.className = "item-description";
  if ((protection.checkedRepositories || 0) > 0) {
    description.textContent = `${protection.protectedRepositories || 0} matching rule observed · ${protection.unprotectedRepositories || 0} no matching classic rule observed across ${protection.checkedRepositories} safely observed repositories.`;
  } else {
    description.textContent = "No repositories were safely observed for classic default-branch protection.";
  }

  const meta = document.createElement("p");
  meta.className = "item-meta";
  meta.textContent = `Classic branch-protection rules are shown separately from active ruleset rules${protection.unavailableRepositories ? ` · ${protection.unavailableRepositories} repository observations unavailable` : ""}`;

  card.append(header, description, meta);
  container?.append(card);
}

function rulesetSourceLabels(sources = []) {
  return sources
    .map((source) => [source.sourceType, source.source].filter(Boolean).join(": "))
    .filter(Boolean);
}

function workflowLabel(workflow = {}) {
  const source = workflow.repository || (workflow.repositoryId ? `repository #${workflow.repositoryId}` : "unknown repository");
  const revision = workflow.ref || (workflow.sha ? workflow.sha.slice(0, 12) : null);
  return `${source} · ${workflow.path || "unknown workflow path"}${revision ? ` @ ${revision}` : ""}`;
}

function renderRulesets(rulesets = {}) {
  const container = byId("rulesets-list");
  clear(container);
  setText("rulesets-count", rulesets.checkedRepositories ?? 0);

  const card = document.createElement("article");
  card.className = "list-card";

  const header = document.createElement("div");
  header.className = "list-card-header";
  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = "Active default-branch rulesets";
  header.append(
    title,
    createBadge(
      coverageLabel(rulesets.status),
      rulesets.status === "complete" ? "success" : "private",
    ),
  );

  const description = document.createElement("p");
  description.className = "item-description";
  if ((rulesets.checkedRepositories || 0) > 0) {
    description.textContent = `${rulesets.repositoriesWithActiveRules || 0} repositories with active rules · ${rulesets.repositoriesWithNoActiveRules || 0} with no active rules returned · ${rulesets.observedActiveRules || 0} active rule records observed.`;
  } else {
    description.textContent = "No repositories were safely observed for active default-branch rulesets.";
  }

  const meta = document.createElement("p");
  meta.className = "item-meta";
  meta.textContent = `Enabled active repository- and organization-level rules only · evaluate/disabled rulesets are outside this view${rulesets.unavailableRepositories ? ` · ${rulesets.unavailableRepositories} repository observations unavailable` : ""}`;

  card.append(header, description, meta);
  container?.append(card);
}

function renderRequiredWorkflows(rulesets = {}) {
  const container = byId("required-workflows-list");
  clear(container);
  setText("required-workflows-count", rulesets.repositoriesWithRequiredWorkflowRules ?? 0);

  const rows = (rulesets.repositories || []).filter(
    (repository) => repository.available && repository.hasRequiredWorkflowRule,
  );

  if (!rows.length) {
    container?.append(emptyState("No active workflow rule was observed. This is not a policy-failure classification."));
    return;
  }

  for (const repository of rows) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const title = document.createElement("h3");
    title.className = "item-title";
    if (repository.url) title.append(createLink(repository.url, repository.repository));
    else title.textContent = repository.repository;
    header.append(title, createBadge("Workflow rule observed", "success"));

    const description = document.createElement("p");
    description.className = "item-description";
    const workflows = repository.requiredWorkflows || [];
    description.textContent = workflows.length
      ? workflows.map(workflowLabel).join(" · ")
      : "An active workflow rule was returned, but no valid workflow reference was normalized.";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = "Required workflow evidence only · GoreeCloud policy satisfaction is not evaluated by this view.";

    card.append(header, description, meta);
    container?.append(card);
  }
}

function rulesetTerms(ruleset = {}) {
  if (!ruleset.available) return ["ruleset unavailable"];
  if (!ruleset.hasActiveRules) return ["no active rules", "no active rulesets"];
  return [
    "active rules",
    "active rulesets",
    ...(ruleset.ruleTypes || []),
    ...rulesetSourceLabels(ruleset.sources || []),
    ...(ruleset.requiredWorkflows || []).flatMap((workflow) => [
      workflow.path,
      workflow.repository,
      workflow.ref,
      workflow.sha,
    ]),
  ];
}

function documentationTerms(documentation = {}) {
  if (!documentation.available) return ["documentation unavailable"];
  return [
    documentation.status,
    ...(documentation.presentChecks || []).map((key) => DOCUMENTATION_LABELS[key] || key),
    ...(documentation.missingChecks || []).map((key) => `missing ${DOCUMENTATION_LABELS[key] || key}`),
  ];
}

function renderRepositoryRows(repositories = [], rulesetByRepository = new Map(), query = "") {
  const body = byId("governance-table-body");
  clear(body);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = repositories.filter((repository) => {
    if (!normalizedQuery) return true;
    const missingLabels = (repository.missingChecks || []).map((key) => PROBE_LABELS[key] || key);
    const protection = repository.classicBranchProtection || {};
    const protectionTerms = !protection.available
      ? ["protection unavailable"]
      : protection.defaultBranchProtected
        ? [
            "classic protected",
            "matching rule",
            ...(protection.matchingRules || []).map((rule) => rule.pattern),
            ...protectionControlLabels(protection.matchingRules || []),
          ]
        : ["no matching rule", "classic unprotected"];
    const ruleset = rulesetByRepository.get(repository.name) || {};

    return [
      repository.name,
      repository.visibility,
      repository.status,
      ...missingLabels,
      ...documentationTerms(repository.documentation || {}),
      ...protectionTerms,
      ...rulesetTerms(ruleset),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.className = "empty-state";
    cell.textContent = normalizedQuery ? "No governance observations match this search." : "No repository observations were returned.";
    row.append(cell);
    body?.append(row);
    return;
  }

  for (const repository of filtered) {
    const row = document.createElement("tr");

    const repositoryCell = document.createElement("td");
    const name = document.createElement("div");
    name.className = "repo-name";
    name.append(createLink(repository.url, repository.name));
    repositoryCell.append(name);
    const branch = document.createElement("div");
    branch.className = "repo-description";
    branch.textContent = `Default branch: ${repository.defaultBranch || "unknown"}${repository.archived ? " · archived" : ""}`;
    repositoryCell.append(branch);

    const visibilityCell = document.createElement("td");
    visibilityCell.append(createBadge(repository.visibility, repository.visibility === "private" ? "private" : "public"));

    const observedCell = document.createElement("td");
    if (!repository.checksAvailable) {
      observedCell.append(createBadge("Unavailable", "private"));
    } else {
      observedCell.textContent = `${repository.presentChecks?.length || 0} / ${Object.keys(PROBE_LABELS).length}`;
    }

    const missingCell = document.createElement("td");
    if (!repository.checksAvailable) {
      missingCell.textContent = "Unknown — observation unavailable";
    } else if (!repository.missingChecks?.length) {
      missingCell.append(createBadge("None observed", "success"));
    } else {
      missingCell.textContent = repository.missingChecks.map((key) => PROBE_LABELS[key] || key).join(" · ");
    }

    const documentationCell = document.createElement("td");
    const documentation = repository.documentation || {};
    if (!documentation.available) {
      documentationCell.append(createBadge("Unavailable", "private"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = "Documentation observation unavailable";
      documentationCell.append(detail);
    } else {
      const present = documentation.presentChecks?.length || 0;
      const total = Object.keys(DOCUMENTATION_LABELS).length;
      documentationCell.append(createBadge(
        documentation.missingChecks?.length ? `${present} / ${total} observed` : "All observed",
        documentation.missingChecks?.length ? "" : "success",
      ));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = documentation.missingChecks?.length
        ? `Absent evidence: ${documentation.missingChecks.map((key) => DOCUMENTATION_LABELS[key] || key).join(" · ")}`
        : "All six policy-defined application/service documentation paths are present";
      documentationCell.append(detail);
    }

    const protectionCell = document.createElement("td");
    const protection = repository.classicBranchProtection || {};
    if (!protection.available) {
      protectionCell.append(createBadge("Unavailable", "private"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = "Classic-rule observation unavailable";
      protectionCell.append(detail);
    } else if (protection.defaultBranchProtected) {
      protectionCell.append(createBadge("Matching rule", "success"));
      const rules = protection.matchingRules || [];
      const detail = document.createElement("div");
      detail.className = "repo-description";
      const controls = protectionControlLabels(rules);
      const patterns = rules.map((rule) => rule.pattern).filter(Boolean);
      detail.textContent = [
        patterns.length ? `Pattern${patterns.length === 1 ? "" : "s"}: ${patterns.join(", ")}` : null,
        controls.length ? `Observed controls: ${controls.join(" · ")}` : "No selected control flags observed",
      ].filter(Boolean).join(" · ");
      protectionCell.append(detail);
    } else {
      protectionCell.append(createBadge("No matching rule"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = "No matching classic rule returned; active rulesets are shown separately";
      protectionCell.append(detail);
    }

    const rulesetCell = document.createElement("td");
    const ruleset = rulesetByRepository.get(repository.name) || {};
    if (!ruleset.available) {
      rulesetCell.append(createBadge("Unavailable", "private"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = "Active-ruleset observation unavailable";
      rulesetCell.append(detail);
    } else if (ruleset.hasActiveRules) {
      rulesetCell.append(createBadge("Active rules", "success"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      const sourceLabels = rulesetSourceLabels(ruleset.sources || []);
      detail.textContent = [
        `${ruleset.activeRuleCount || 0} active rule${ruleset.activeRuleCount === 1 ? "" : "s"}`,
        (ruleset.ruleTypes || []).length ? `Types: ${ruleset.ruleTypes.join(" · ")}` : null,
        sourceLabels.length ? `Sources: ${sourceLabels.join(" · ")}` : null,
        ruleset.hasRequiredWorkflowRule ? `${ruleset.requiredWorkflowCount || 0} required workflow reference${ruleset.requiredWorkflowCount === 1 ? "" : "s"}` : null,
      ].filter(Boolean).join(" · ");
      rulesetCell.append(detail);
    } else {
      rulesetCell.append(createBadge("No active rules"));
      const detail = document.createElement("div");
      detail.className = "repo-description";
      detail.textContent = "No enabled active ruleset rules returned for this default branch";
      rulesetCell.append(detail);
    }

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatRelative(repository.updatedAt);

    row.append(
      repositoryCell,
      visibilityCell,
      observedCell,
      missingCell,
      documentationCell,
      protectionCell,
      rulesetCell,
      updatedCell,
    );
    body?.append(row);
  }
}

function rulesetObservationMap(rulesets = {}) {
  return new Map((rulesets.repositories || []).map((item) => [item.repository, item]));
}

function renderGovernance(data) {
  state.data = data;
  const summary = data.summary || {};
  const governance = data.governance || {};
  const documentation = governance.documentation || {};
  const classicProtection = governance.classicBranchProtection || {};
  const rulesets = data.rulesets || {};
  const rulesetByRepository = rulesetObservationMap(rulesets);

  setText("stat-total", summary.totalRepositories ?? 0);
  setText("stat-observed", summary.repositoriesWithAllObservedFiles ?? 0);
  setText("stat-gaps", summary.repositoriesWithObservedGaps ?? 0);
  setText("stat-documentation-complete", summary.repositoriesWithAllObservedDocumentation ?? 0);
  setText("stat-documentation-gaps", summary.repositoriesWithObservedDocumentationGaps ?? 0);
  setText("stat-classic-protected", summary.classicProtectedRepositories ?? 0);
  setText("stat-rulesets-active", summary.repositoriesWithActiveRulesets ?? 0);
  setText("stat-required-workflows", summary.repositoriesWithRequiredWorkflowRules ?? 0);
  setText("stat-unavailable", summary.unavailableRepositories ?? 0);
  setPill("generated-at", `Updated ${formatRelative(data.generatedAt)}`);
  setPill("api-state", "Read-only governance connected", true);

  const overallStatus = data.observationStatus || governance.status;
  const coverageText = overallStatus === "complete"
    ? "Observation complete"
    : overallStatus === "unavailable"
      ? "Observation unavailable"
      : "Observation partial";
  setPill("coverage-state", coverageText, overallStatus === "complete");
  setText(
    "sidebar-status",
    `${summary.checkedRepositories ?? 0} baseline · ${summary.documentationCheckedRepositories ?? 0} docs · ${summary.classicProtectionCheckedRepositories ?? 0} classic · ${summary.rulesetCheckedRepositories ?? 0} ruleset observations`,
  );

  renderProbes(governance.probes || []);
  renderDocumentation(documentation);
  renderClassicProtection(classicProtection);
  renderRulesets(rulesets);
  renderRequiredWorkflows(rulesets);
  renderRepositoryRows(
    governance.repositories || [],
    rulesetByRepository,
    byId("governance-search")?.value || "",
  );
}

function setLoading(loading) {
  state.loading = loading;
  const button = byId("refresh-button");
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? "Refreshing…" : "Refresh";
  button.setAttribute("aria-busy", String(loading));
}

function showAlert(message, kind = "warning") {
  const alert = byId("dashboard-alert");
  if (!alert) return;
  alert.hidden = !message;
  alert.textContent = message || "";
  alert.dataset.kind = kind;
}

async function refreshGovernance() {
  if (state.loading) return;
  setLoading(true);
  showAlert("");

  try {
    const response = await fetch("/api/governance", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Governance API returned ${response.status}.`);
    }

    renderGovernance(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load governance observations.";
    showAlert(`${message} No repository state was changed.`);
    setPill("api-state", "Data unavailable");
    setPill("coverage-state", "Observation unavailable");
    setText("sidebar-status", "Governance data unavailable");
  } finally {
    setLoading(false);
  }
}

byId("refresh-button")?.addEventListener("click", refreshGovernance);
byId("governance-search")?.addEventListener("input", (event) => {
  const rulesets = state.data?.rulesets || {};
  renderRepositoryRows(
    state.data?.governance?.repositories || [],
    rulesetObservationMap(rulesets),
    event.target.value,
  );
});

refreshGovernance();
