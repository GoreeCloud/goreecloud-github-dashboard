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
  "functions/_middleware.js",
  "functions/api/dashboard.js",
  "functions/lib/github.js",
  "docs/ARCHITECTURE.md",
  "docs/DEPLOYMENT.md",
  "tests/dashboard.test.mjs",
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
  const api = read("functions/api/dashboard.js");
  const github = read("functions/lib/github.js");
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
  if (!html.includes('id="data-state"')) failures.push("Data-coverage state is required.");
  if (!html.includes('id="rate-state"')) failures.push("Rate-limit state is required.");
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

    // The validator necessarily contains the detector signatures themselves. Mask only
    // that declaration before scanning this file so real secrets elsewhere in it still fail.
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
