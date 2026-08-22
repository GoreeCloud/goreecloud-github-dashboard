import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "README.md",
  "LICENSE",
  ".gitignore",
  ".env.example",
  "CHANGELOG.md",
  "SECURITY.md",
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "public/bootstrap.js",
  "public/data-health.js",
  "public/refresh-guard.js",
  "public/refresh-policy.js",
  "functions/_middleware.js",
  "functions/api/dashboard.js",
  "functions/lib/github.js",
  "docs/ARCHITECTURE.md",
  "docs/DEPLOYMENT.md",
  "tests/dashboard.test.mjs",
  "tests/refresh-policy.test.mjs",
  "tests/api-contract.test.mjs",
  "tests/github-fixtures.test.mjs",
  "tests/github-edge-fixtures.test.mjs",
  "tests/data-health.test.mjs",
];

const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

if (!failures.length) {
  const html = read("public/index.html");
  const css = read("public/styles.css");
  const app = read("public/app.js");
  const bootstrap = read("public/bootstrap.js");
  const dataHealth = read("public/data-health.js");
  const refreshGuard = read("public/refresh-guard.js");
  const refreshPolicy = read("public/refresh-policy.js");
  const api = read("functions/api/dashboard.js");
  const github = read("functions/lib/github.js");
  const githubFixtures = read("tests/github-fixtures.test.mjs");
  const githubEdgeFixtures = read("tests/github-edge-fixtures.test.mjs");
  const dataHealthTests = read("tests/data-health.test.mjs");
  const middleware = read("functions/_middleware.js");
  const gitignore = read(".gitignore");
  const envExample = read(".env.example");
  const license = read("LICENSE");

  if (/<script(?![^>]*src=)/i.test(html)) failures.push("Inline scripts are not allowed by the dashboard CSP.");
  if (/<style\b/i.test(html)) failures.push("Inline styles are not allowed by the dashboard CSP.");
  if (!html.includes('href="#main"')) failures.push("Skip navigation link is required.");
  if (!html.includes('id="repository-search"')) failures.push("Repository search control is required.");
  if (!html.includes('id="attention-list"')) failures.push("Repository Attention surface is required.");
  if (!html.includes('id="workflow-list"')) failures.push("CI Health surface is required.");
  if (!html.includes('id="coverage-list"')) failures.push("Per-source coverage detail surface is required.");
  if (!html.includes('id="coverage-count"')) failures.push("Coverage detail count surface is required.");
  if (!html.includes('id="data-state"')) failures.push("Data-coverage state is required.");
  if (!html.includes('id="rate-state"')) failures.push("Rate-limit state is required.");
  if (!html.includes('id="refresh-state"')) failures.push("Refresh-cooldown state is required.");
  if (!html.includes('src="/bootstrap.js"')) failures.push("Dashboard bootstrap module is required.");
  if (!bootstrap.includes('import "./refresh-guard.js"')) failures.push("Refresh guard must load before the application module.");
  if (!bootstrap.includes('import "./app.js"')) failures.push("Application module is missing from bootstrap.");
  if (!app.includes('import { buildCoverageRows } from "./data-health.js"')) failures.push("Coverage detail model is not connected to the dashboard renderer.");
  if (!app.includes("renderCoverage(dataHealth)")) failures.push("Coverage detail renderer is missing from dashboard refresh.");
  if (!dataHealth.includes("export function buildCoverageRows")) failures.push("Coverage detail model export is missing.");
  if (!dataHealth.includes('key: "api-budget"')) failures.push("API-budget coverage detail row is missing.");
  if (!dataHealthTests.includes("coverage detail marks only the affected repository probe partial")) failures.push("Coverage detail partial-state test is missing.");
  if (!refreshGuard.includes("stopImmediatePropagation")) failures.push("Refresh guard must block cooldown-bypassing clicks.");
  if (!refreshGuard.includes("MutationObserver")) failures.push("Refresh guard must react to completed refresh state changes.");
  if (!refreshPolicy.includes("SUCCESS_COOLDOWN_SECONDS = 30")) failures.push("Successful refresh cooldown must remain explicit and reviewable.");
  if (!refreshPolicy.includes("FAILURE_RETRY_SECONDS = 10")) failures.push("Failed refresh retry floor must remain explicit and reviewable.");
  if (!css.includes("@media (max-width: 599px)")) failures.push("Mobile Glaze UI range is missing.");
  if (!css.includes("@media (max-width: 1023px)")) failures.push("Tablet Glaze UI range is missing.");
  if (!css.includes("prefers-reduced-motion")) failures.push("Reduced-motion resilience is missing.");
  if (!css.includes("forced-colors")) failures.push("Forced-colors resilience is missing.");
  if (!api.includes("ACCESS_GATE_CONFIRMED")) failures.push("Private-data deployment interlock is missing.");
  if (!api.includes('mode: "read-only"')) failures.push("Read-only API mode declaration is missing.");
  if (!api.includes("repositoryAttention")) failures.push("Repository Attention API output is missing.");
  if (!api.includes("workflowHealth")) failures.push("CI Health API output is missing.");
  if (!api.includes("dataHealth")) failures.push("Partial-data API metadata is missing.");
  if (!api.includes("rateLimit")) failures.push("Rate-limit API output is missing.");
  if (!github.includes("Promise.allSettled")) failures.push("Bounded fail-soft GitHub fan-out is missing.");
  if (!github.includes("fetchWorkflowHealth")) failures.push("Workflow health aggregation is missing.");
  if (!github.includes("fetchRateLimit")) failures.push("Rate-limit aggregation is missing.");
  if (!github.includes("unavailableRepositories")) failures.push("Coverage-aware unavailable-repository tracking is missing.");
  if (!github.includes("DEFAULT_REQUEST_TIMEOUT_MS")) failures.push("GitHub request timeout constant is missing.");
  if (!github.includes("new AbortController()")) failures.push("AbortController request timeout protection is missing.");
  if (!github.includes("clearTimeout(timer)")) failures.push("GitHub request timeout cleanup is missing.");
  if (!githubFixtures.includes("representative GitHub fixtures produce a complete normalized dashboard response")) failures.push("Representative complete GitHub fixture coverage is missing.");
  if (!githubFixtures.includes("Actions permission denial becomes partial coverage")) failures.push("GitHub Actions permission-denial fixture coverage is missing.");
  if (!githubFixtures.includes("changelog permission denial is not misreported")) failures.push("Changelog permission-denial fixture coverage is missing.");
  if (!githubFixtures.includes("rate-limit endpoint failure keeps primary data usable")) failures.push("Rate-limit failure fixture coverage is missing.");
  if (!githubFixtures.includes("core GitHub permission failure returns a sanitized aggregation error")) failures.push("Sanitized core GitHub failure fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("repository pagination continues across full pages")) failures.push("Repository pagination edge-fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("search rate-limit failure stays sanitized at the dashboard boundary")) failures.push("Search rate-limit edge-fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("recent commit optional 404 and permission 403 remain distinct")) failures.push("Recent-commit 404/403 edge-fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("release optional 404 and permission 403 remain distinct")) failures.push("Release 404/403 edge-fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("workflow no-run response remains available coverage")) failures.push("Workflow no-run edge-fixture coverage is missing.");
  if (!githubEdgeFixtures.includes("upstream abort stays distinct from request timeout")) failures.push("Upstream-abort edge-fixture coverage is missing.");
  if (!middleware.includes("Content-Security-Policy")) failures.push("CSP security header is missing.");
  if (!middleware.includes("frame-ancestors 'none'")) failures.push("Frame-ancestor protection is missing.");
  if (!gitignore.includes(".dev.vars")) failures.push("Local Cloudflare secrets must be ignored.");
  if (!/GITHUB_TOKEN=\s*$/m.test(envExample)) failures.push(".env.example must keep GITHUB_TOKEN blank.");
  if (!license.includes("MIT License")) failures.push("MIT license marker is missing.");

  const sourceFiles = [];
  for (const directory of ["public", "functions", "docs", "scripts", "tests", ".github"]) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) continue;
    const stack = [absolute];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const next = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(next);
        else sourceFiles.push(next);
      }
    }
  }

  const secretPatterns = [
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /GITHUB_TOKEN\s*=\s*[A-Za-z0-9_-]{20,}/,
    /Authorization:\s*["'`]Bearer\s+[A-Za-z0-9_-]{20,}/i,
  ];

  for (const file of sourceFiles) {
    const relativePath = path.relative(root, file);
    let content = fs.readFileSync(file, "utf8");

    if (relativePath === "scripts/validate.mjs") {
      content = content.replace(
        /const secretPatterns = \[[\s\S]*?\n  \];/,
        "const secretPatterns = [];",
      );
    }

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) failures.push(`Potential committed secret in ${relativePath}`);
    }
  }
}

if (failures.length) {
  console.error("Repository validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository validation passed.");
