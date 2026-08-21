const API_ROOT = "https://api.github.com";
const API_VERSION = "2022-11-28";
const CHANGELOG_PATHS = ["CHANGELOG.md", "docs/CHANGELOG.md", "changelog.md"];

export function activityScore(repository, now = Date.now()) {
  const pushedAt = Date.parse(repository.pushed_at || repository.updated_at || 0);
  const ageDays = Number.isFinite(pushedAt) ? Math.max(0, (now - pushedAt) / 86_400_000) : 3650;

  let recency = 0;
  if (ageDays <= 1) recency = 100;
  else if (ageDays <= 3) recency = 86;
  else if (ageDays <= 7) recency = 72;
  else if (ageDays <= 14) recency = 58;
  else if (ageDays <= 30) recency = 42;
  else if (ageDays <= 90) recency = 24;
  else if (ageDays <= 180) recency = 10;

  const openWork = Math.min(Number(repository.open_issues_count || 0) * 2, 20);
  const stars = Math.min(Number(repository.stargazers_count || 0) * 0.5, 10);
  const activeBonus = repository.archived || repository.disabled ? -50 : 8;

  return Math.max(0, Math.round((recency + openWork + stars + activeBonus) * 10) / 10);
}

export function normalizeRepository(repo, now = Date.now()) {
  return {
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || "",
    url: repo.html_url,
    visibility: repo.visibility || (repo.private ? "private" : "public"),
    private: Boolean(repo.private),
    archived: Boolean(repo.archived),
    language: repo.language || null,
    defaultBranch: repo.default_branch || "main",
    openIssues: Number(repo.open_issues_count || 0),
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    updatedAt: repo.pushed_at || repo.updated_at || null,
    activityScore: activityScore(repo, now),
  };
}

export function topRepositories(repositories, limit = 10, now = Date.now()) {
  return repositories
    .filter((repo) => !repo.archived && !repo.disabled)
    .map((repo) => normalizeRepository(repo, now))
    .sort((a, b) => b.activityScore - a.activityScore || Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0))
    .slice(0, limit);
}

export function summarizeRepositories(repositories, openPullRequests = 0, openIssues = 0) {
  return {
    totalRepositories: repositories.length,
    publicRepositories: repositories.filter((repo) => !repo.private).length,
    privateRepositories: repositories.filter((repo) => repo.private).length,
    archivedRepositories: repositories.filter((repo) => repo.archived).length,
    openPullRequests,
    openIssues,
  };
}

export function firstMeaningfulChangelogSection(markdown) {
  if (!markdown) return "";
  const lines = markdown.replace(/\r/g, "").split("\n");
  const collected = [];
  let headingSeen = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (collected.length) collected.push("");
      continue;
    }

    if (/^#\s+/.test(line) && !headingSeen) continue;
    if (/^#{2,6}\s+/.test(line)) {
      if (headingSeen && collected.length) break;
      headingSeen = true;
      collected.push(line.replace(/^#{2,6}\s+/, ""));
      continue;
    }

    if (headingSeen || collected.length) collected.push(line.replace(/^[-*]\s+/, "• "));
    if (collected.join(" ").length > 460) break;
  }

  return collected.join(" ").replace(/\s+/g, " ").trim().slice(0, 520);
}

function headers(env) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "GoreeCloud-GitHub-Dashboard/0.1",
    "X-GitHub-Api-Version": API_VERSION,
  };
}

export async function githubRequest(env, path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      ...headers(env),
      ...(options.headers || {}),
    },
  });

  if (response.status === 404 && options.optional) return null;

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    const rateMessage = remaining === "0" && reset
      ? ` GitHub rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}.`
      : "";
    throw new Error(`GitHub API ${response.status} for ${path}.${rateMessage}`);
  }

  return response.json();
}

export async function fetchAllRepositories(env, owner) {
  const repositories = [];

  for (let page = 1; page <= 5; page += 1) {
    const batch = await githubRequest(
      env,
      `/user/repos?affiliation=owner&per_page=100&page=${page}&sort=updated&direction=desc`,
    );
    const owned = batch.filter((repo) => repo.owner?.login?.toLowerCase() === owner.toLowerCase());
    repositories.push(...owned);
    if (batch.length < 100) break;
  }

  return repositories;
}

export async function fetchRecentChanges(env, owner, rankedRepositories) {
  const candidates = rankedRepositories.slice(0, 8);
  const results = await Promise.allSettled(
    candidates.map(async (repo) => {
      const commits = await githubRequest(
        env,
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/commits?per_page=3`,
        { optional: true },
      );
      return (commits || []).map((commit) => ({
        repository: repo.name,
        sha: commit.sha,
        message: String(commit.commit?.message || "Commit").split("\n")[0],
        author: commit.author?.login || commit.commit?.author?.name || "Unknown author",
        date: commit.commit?.author?.date || commit.commit?.committer?.date || null,
        url: commit.html_url,
      }));
    }),
  );

  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0))
    .slice(0, 16);
}

export async function fetchOpenWork(env, owner, type, limit = 10) {
  const qualifier = type === "pr" ? "is:pr" : "is:issue";
  const data = await githubRequest(
    env,
    `/search/issues?q=${encodeURIComponent(`user:${owner} ${qualifier} is:open`)}&sort=updated&order=desc&per_page=${limit}`,
  );

  return {
    total: Number(data.total_count || 0),
    items: (data.items || []).map((item) => ({
      title: item.title,
      repository: item.repository_url?.split("/").pop() || "Repository",
      state: item.draft ? "draft" : "open",
      author: item.user?.login || "Unknown author",
      updatedAt: item.updated_at,
      url: item.html_url,
      summary: item.body ? item.body.replace(/[#>*_`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 220) : "",
    })),
  };
}

async function fetchFileContent(env, owner, repository, path) {
  const data = await githubRequest(
    env,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    { optional: true },
  );
  if (!data || data.type !== "file" || !data.content) return null;

  try {
    const normalized = data.content.replace(/\n/g, "");
    const bytes = Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export async function fetchChangelogs(env, owner, rankedRepositories) {
  const results = await Promise.allSettled(
    rankedRepositories.slice(0, 10).map(async (repo) => {
      for (const path of CHANGELOG_PATHS) {
        const content = await fetchFileContent(env, owner, repo.name, path);
        if (content) {
          return {
            title: repo.name,
            repository: repo.name,
            path,
            url: `${repo.url}/blob/${repo.defaultBranch}/${path}`,
            summary: firstMeaningfulChangelogSection(content) || "Changelog file detected.",
            updatedAt: repo.updatedAt,
          };
        }
      }
      return null;
    }),
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value)
    .slice(0, 10);
}

export async function fetchReleases(env, owner, rankedRepositories) {
  const results = await Promise.allSettled(
    rankedRepositories.slice(0, 10).map(async (repo) => {
      const release = await githubRequest(
        env,
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/releases/latest`,
        { optional: true },
      );
      if (!release) return null;
      return {
        title: release.name || release.tag_name,
        tag: release.tag_name,
        repository: repo.name,
        url: release.html_url,
        publishedAt: release.published_at || release.created_at,
        summary: release.body ? release.body.replace(/[#>*_`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240) : "",
      };
    }),
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value)
    .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
    .slice(0, 10);
}
