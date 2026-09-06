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

function renderProbes(probes = []) {
  const container = byId("probe-list");
  clear(container);
  setText("probe-count", probes.length);

  if (!probes.length) {
    container.append(emptyState("No governance probes were returned."));
    return;
  }

  for (const probe of probes) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = probe.label || PROBE_LABELS[probe.key] || probe.key;
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
    container.append(card);
  }
}

function renderRepositoryRows(repositories = [], query = "") {
  const body = byId("governance-table-body");
  clear(body);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = repositories.filter((repository) => {
    if (!normalizedQuery) return true;
    const missingLabels = (repository.missingChecks || []).map((key) => PROBE_LABELS[key] || key);
    return [repository.name, repository.visibility, repository.status, ...missingLabels]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = normalizedQuery ? "No governance observations match this search." : "No repository observations were returned.";
    row.append(cell);
    body.append(row);
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

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatRelative(repository.updatedAt);

    row.append(repositoryCell, visibilityCell, observedCell, missingCell, updatedCell);
    body.append(row);
  }
}

function renderGovernance(data) {
  state.data = data;
  const summary = data.summary || {};
  const governance = data.governance || {};

  setText("stat-total", summary.totalRepositories ?? 0);
  setText("stat-observed", summary.repositoriesWithAllObservedFiles ?? 0);
  setText("stat-gaps", summary.repositoriesWithObservedGaps ?? 0);
  setText("stat-unavailable", summary.unavailableRepositories ?? 0);
  setPill("generated-at", `Updated ${formatRelative(data.generatedAt)}`);
  setPill("api-state", "Read-only governance connected", true);

  const coverageText = governance.status === "complete"
    ? "Observation complete"
    : governance.status === "unavailable"
      ? "Observation unavailable"
      : "Observation partial";
  setPill("coverage-state", coverageText, governance.status === "complete");
  setText("sidebar-status", `${summary.checkedRepositories ?? 0} repositories safely observed`);

  renderProbes(governance.probes || []);
  renderRepositoryRows(governance.repositories || [], byId("governance-search").value);
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
  renderRepositoryRows(state.data?.governance?.repositories || [], event.target.value);
});

refreshGovernance();
