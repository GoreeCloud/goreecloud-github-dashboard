import { buildCoverageRows } from "./data-health.js";

const state = {
  data: null,
  loading: false,
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
  while (element.firstChild) element.removeChild(element.firstChild);
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

function createLink(url, className = "item-link") {
  const link = document.createElement("a");
  link.className = className;
  link.href = url || "#";
  if (url) {
    link.target = "_blank";
    link.rel = "noreferrer noopener";
  }
  return link;
}

function createBadge(text, variant = "") {
  const badge = document.createElement("span");
  badge.className = `badge${variant ? ` badge-${variant}` : ""}`;
  badge.textContent = text;
  return badge;
}

function renderRecentChanges(items = []) {
  const container = byId("recent-changes");
  clear(container);
  setText("recent-count", items.length);

  if (!items.length) {
    container.append(emptyState("No recent commit activity was returned."));
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "timeline-item";

    const mark = document.createElement("span");
    mark.className = "timeline-mark";
    mark.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    const link = createLink(item.url);
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = item.message || "Commit";
    link.append(title);

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = `${item.repository} · ${item.author || "Unknown author"} · ${item.sha?.slice(0, 7) || ""}`;

    body.append(link, meta);

    const time = document.createElement("span");
    time.className = "item-time";
    time.textContent = formatRelative(item.date);

    card.append(mark, body, time);
    container.append(card);
  }
}

function renderTopRepositories(items = []) {
  const container = byId("top-repositories");
  clear(container);
  setText("top-count", items.length);

  if (!items.length) {
    container.append(emptyState("No repositories were available for ranking.", "li"));
    return;
  }

  items.forEach((repo, index) => {
    const item = document.createElement("li");
    item.className = "ranking-item";

    const rank = document.createElement("span");
    rank.className = "rank-number";
    rank.textContent = String(index + 1);

    const link = createLink(repo.url);
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = repo.name;
    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = `${repo.visibility} · ${repo.language || "No primary language"} · updated ${formatRelative(repo.updatedAt)}`;
    link.append(title, meta);

    const score = document.createElement("span");
    score.className = "rank-score";
    score.textContent = `${Math.round(repo.activityScore)} pts`;

    item.append(rank, link, score);
    container.append(item);
  });
}

function renderAttention(items = []) {
  const container = byId("attention-list");
  clear(container);
  setText("attention-count", items.length);

  if (!items.length) {
    container.append(emptyState("No attention signals were produced for the ranked repositories."));
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const link = createLink(item.url);
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = item.repository;
    link.append(title);

    const label = item.severity === "critical" ? "Critical" : item.severity === "warning" ? "Review" : "Info";
    const variant = item.severity === "critical" || item.severity === "warning" ? "private" : "";
    header.append(link, createBadge(label, variant));

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = (item.reasons || []).join(" · ");

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = `Activity ${Math.round(item.activityScore || 0)} pts · updated ${formatRelative(item.updatedAt)}`;

    card.append(header, description, meta);
    container.append(card);
  }
}

function renderWorkflowHealth(items = [], dataHealth = {}) {
  const container = byId("workflow-list");
  clear(container);
  setText("workflow-count", items.length);

  if (!items.length) {
    const unavailable = Number(dataHealth.workflowRepositoriesUnavailable || 0);
    container.append(emptyState(
      unavailable
        ? "Workflow status is unavailable with the current read permissions. Other dashboard data remains usable."
        : "No workflow status was returned for the ranked repositories.",
    ));
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const link = createLink(item.url);
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = item.repository;
    link.append(title);

    const stateLabel = item.conclusion || item.status || "unknown";
    const failureStates = new Set(["failure", "cancelled", "timed_out", "action_required", "startup_failure", "stale"]);
    const variant = stateLabel === "success" ? "success" : failureStates.has(stateLabel) ? "private" : "";
    header.append(link, createBadge(stateLabel.replaceAll("_", " "), variant));

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = item.status === "none"
      ? "No workflow run was returned."
      : item.title || "GitHub Actions";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    meta.textContent = [item.event, item.branch, item.updatedAt ? formatRelative(item.updatedAt) : null].filter(Boolean).join(" · ");

    card.append(header, description);
    if (meta.textContent) card.append(meta);
    container.append(card);
  }
}

function renderCoverage(dataHealth = {}) {
  const container = byId("coverage-list");
  clear(container);
  const rows = buildCoverageRows(dataHealth);
  setText("coverage-count", rows.length);

  for (const row of rows) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = row.label;

    const label = row.status === "complete" ? "Complete" : row.status === "partial" ? "Partial" : "Unavailable";
    const variant = row.status === "complete" ? "success" : "private";
    header.append(title, createBadge(label, variant));

    const description = document.createElement("p");
    description.className = "item-description";
    if (row.kind === "repository") {
      description.textContent = row.checked === 0
        ? "No ranked repositories required this probe."
        : `${row.available} of ${row.checked} repository reads succeeded.`;
    } else {
      description.textContent = row.available
        ? "GitHub core/search API budget metadata was returned."
        : "API budget visibility is unavailable; primary dashboard data may still be usable.";
    }

    const meta = document.createElement("p");
    meta.className = "item-meta";
    if (row.kind === "repository") {
      meta.textContent = row.unavailable > 0
        ? `${row.unavailable} unavailable read${row.unavailable === 1 ? "" : "s"}`
        : "No unavailable reads";
    } else {
      meta.textContent = row.available ? "Rate-limit telemetry available" : "Rate-limit telemetry unavailable";
    }

    card.append(header, description, meta);
    container.append(card);
  }
}

function renderCardList(containerId, countId, items, type) {
  const container = byId(containerId);
  clear(container);
  setText(countId, items.length);

  if (!items.length) {
    container.append(emptyState(`No ${type} data was returned.`));
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "list-card";

    const header = document.createElement("div");
    header.className = "list-card-header";

    const link = createLink(item.url);
    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = item.title || item.repository || item.name || "Untitled";
    link.append(title);

    const badgeText = item.state || item.tag || item.path || item.visibility;
    header.append(link);
    if (badgeText) header.append(createBadge(badgeText, item.state === "draft" ? "private" : ""));

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = item.summary || item.description || item.repository || "";

    const meta = document.createElement("p");
    meta.className = "item-meta";
    const metaParts = [];
    if (item.repository && item.repository !== item.title) metaParts.push(item.repository);
    if (item.author) metaParts.push(item.author);
    if (item.updatedAt || item.publishedAt) metaParts.push(formatRelative(item.updatedAt || item.publishedAt));
    meta.textContent = metaParts.join(" · ");

    card.append(header);
    if (description.textContent) card.append(description);
    if (meta.textContent) card.append(meta);
    container.append(card);
  }
}

function renderRepositoryDirectory(repositories = [], query = "") {
  const body = byId("repository-table-body");
  clear(body);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = repositories.filter((repo) => {
    if (!normalizedQuery) return true;
    return [repo.name, repo.description, repo.language, repo.visibility]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = normalizedQuery ? "No repositories match this search." : "No repositories were returned.";
    row.append(cell);
    body.append(row);
    return;
  }

  for (const repo of filtered) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const link = createLink(repo.url);
    const name = document.createElement("div");
    name.className = "repo-name";
    name.textContent = repo.name;
    link.append(name);
    nameCell.append(link);
    if (repo.description) {
      const description = document.createElement("div");
      description.className = "repo-description";
      description.textContent = repo.description;
      nameCell.append(description);
    }

    const visibilityCell = document.createElement("td");
    visibilityCell.append(createBadge(repo.visibility, repo.visibility === "private" ? "private" : "public"));

    const languageCell = document.createElement("td");
    languageCell.textContent = repo.language || "—";

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatRelative(repo.updatedAt);

    const openCell = document.createElement("td");
    openCell.textContent = String(repo.openIssues ?? 0);

    row.append(nameCell, visibilityCell, languageCell, updatedCell, openCell);
    body.append(row);
  }
}

function emptyState(message, tagName = "div") {
  const element = document.createElement(tagName);
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function renderDashboard(data) {
  state.data = data;
  const summary = data.summary || {};
  const dataHealth = data.dataHealth || {};
  const coreRate = data.rateLimit?.core;

  setText("stat-total", summary.totalRepositories ?? 0);
  setText("stat-private", summary.privateRepositories ?? 0);
  setText("stat-public", summary.publicRepositories ?? 0);
  setText("stat-open-work", (summary.openPullRequests ?? 0) + (summary.openIssues ?? 0));
  setPill("generated-at", `Updated ${formatRelative(data.generatedAt)}`);
  setPill("api-state", "Read-only data connected", true);

  const coverageComplete = dataHealth.status === "complete";
  const unavailable = Number(dataHealth.workflowRepositoriesUnavailable || 0);
  setPill(
    "data-state",
    coverageComplete ? "Coverage complete" : `Partial coverage${unavailable ? ` · ${unavailable} CI unavailable` : ""}`,
    coverageComplete,
  );

  if (coreRate) {
    const healthyRate = coreRate.limit > 0 && coreRate.remaining / coreRate.limit > 0.1;
    setPill("rate-state", `API ${coreRate.remaining.toLocaleString()} remaining`, healthyRate);
  } else {
    setPill("rate-state", "Rate limit unavailable");
  }

  setText("sidebar-status", `${summary.totalRepositories ?? 0} repositories connected`);

  renderRecentChanges(data.recentChanges || []);
  renderTopRepositories(data.topRepositories || []);
  renderAttention(data.repositoryAttention || []);
  renderWorkflowHealth(data.workflowHealth || [], dataHealth);
  renderCoverage(dataHealth);
  renderCardList("changelog-list", "changelog-count", data.changelogs || [], "changelog");
  renderCardList("release-list", "release-count", data.releases || [], "release");
  renderCardList("pr-list", "pr-count", data.pullRequests || [], "pull request");
  renderCardList("issue-list", "issue-count", data.issues || [], "issue");
  renderRepositoryDirectory(data.repositories || [], byId("repository-search").value);
}

function setLoading(loading) {
  state.loading = loading;
  const button = byId("refresh-button");
  button.disabled = loading;
  button.textContent = loading ? "Refreshing…" : "Refresh";
  button.setAttribute("aria-busy", String(loading));
}

function showAlert(message, kind = "warning") {
  const alert = byId("dashboard-alert");
  alert.hidden = !message;
  alert.textContent = message || "";
  alert.dataset.kind = kind;
}

async function refreshDashboard() {
  if (state.loading) return;
  setLoading(true);
  showAlert("");

  try {
    const response = await fetch("/api/dashboard", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Dashboard API returned ${response.status}.`);
    }

    renderDashboard(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard data.";
    showAlert(`${message} The interface remains read-only and no GitHub data was changed.`);
    setPill("api-state", "Data unavailable");
    setPill("data-state", "Coverage unavailable");
    setPill("rate-state", "Rate limit unavailable");
    setText("sidebar-status", "Data unavailable");
  } finally {
    setLoading(false);
  }
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
  localStorage.setItem("goreecloud-github-dashboard-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = current === "system" ? (prefersDark ? "dark" : "light") : current;
  applyTheme(effective === "dark" ? "light" : "dark");
}

function initializeTheme() {
  const saved = localStorage.getItem("goreecloud-github-dashboard-theme");
  if (saved === "light" || saved === "dark") applyTheme(saved);
}

initializeTheme();
byId("refresh-button").addEventListener("click", refreshDashboard);
byId("theme-toggle").addEventListener("click", toggleTheme);
byId("repository-search").addEventListener("input", (event) => {
  renderRepositoryDirectory(state.data?.repositories || [], event.target.value);
});

refreshDashboard();
