import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TEXT_EXTENSIONS = new Set([
  "", ".css", ".env", ".example", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".yaml", ".yml", ".toml",
]);

const FORBIDDEN_PUBLIC_EXTENSIONS = new Set([
  ".csv", ".db", ".env", ".log", ".ndjson", ".sqlite", ".sqlite3", ".tsv",
]);

const FORBIDDEN_BASENAMES = new Set([
  ".dev.vars",
  ".env",
  ".env.local",
  ".env.production",
  "credentials.json",
  "service-account.json",
  "secrets.json",
  "id_rsa",
  "id_ed25519",
]);

const SECRET_PATTERNS = Object.freeze([
  ["GitHub classic token", /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ["GitHub fine-grained token", /github_pat_[A-Za-z0-9_]{20,}/g],
  ["GitHub token assignment", /GITHUB_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/gi],
  ["Cloudflare API token assignment", /(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/gi],
  ["Bearer credential", /Authorization\s*:\s*["'`]Bearer\s+[A-Za-z0-9_.-]{32,}/gi],
  ["Private key", /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/g],
  ["Credentialed URL", /https?:\/\/[^\s/:]+:[^\s/@]+@[^\s]+/gi],
]);

function walkFiles(root) {
  const files = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!fs.existsSync(current)) continue;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(next);
      else files.push(next);
    }
  }

  return files;
}

function isTextCandidate(file) {
  const extension = path.extname(file).toLowerCase();
  return TEXT_EXTENSIONS.has(extension) && fs.statSync(file).size <= 1024 * 1024;
}

export function detectSecretMarkers(content) {
  const matches = [];
  for (const [label, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) matches.push(label);
  }
  return matches;
}

export function isForbiddenPublicArtifact(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const basename = path.basename(normalized).toLowerCase();
  const extension = path.extname(normalized).toLowerCase();

  return FORBIDDEN_BASENAMES.has(basename)
    || FORBIDDEN_PUBLIC_EXTENSIONS.has(extension)
    || /(?:^|\/)(?:dashboard|governance|github)-(?:data|response|export)(?:\.|$)/i.test(normalized);
}

export function validatePublicSource(root = process.cwd()) {
  const failures = [];
  const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
  const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

  for (const forbidden of [
    ".dev.vars",
    ".env",
    ".env.local",
    ".env.production",
    "credentials.json",
    "service-account.json",
    "secrets.json",
  ]) {
    if (exists(forbidden)) failures.push(`Forbidden secret-bearing repository file: ${forbidden}`);
  }

  if (exists("public")) {
    for (const file of walkFiles(path.join(root, "public"))) {
      const relativePath = path.relative(root, file);
      if (isForbiddenPublicArtifact(relativePath)) {
        failures.push(`Forbidden data/secret artifact under public/: ${relativePath}`);
      }
      if (!isTextCandidate(file)) continue;

      const content = fs.readFileSync(file, "utf8");
      if (/GITHUB_TOKEN/i.test(content)) failures.push(`Browser asset references GITHUB_TOKEN: ${relativePath}`);
      if (/api\.github\.com/i.test(content)) failures.push(`Browser asset references GitHub API directly: ${relativePath}`);
      if (/Authorization\s*:/i.test(content)) failures.push(`Browser asset contains authorization-header logic: ${relativePath}`);
    }
  }

  for (const file of walkFiles(root)) {
    if (!isTextCandidate(file)) continue;
    const relativePath = path.relative(root, file);
    const content = fs.readFileSync(file, "utf8");
    for (const marker of detectSecretMarkers(content)) {
      failures.push(`Potential ${marker} committed in ${relativePath}`);
    }
  }

  if (!exists(".gitignore")) {
    failures.push(".gitignore is required for public-source secret hygiene.");
  } else {
    const gitignore = read(".gitignore");
    for (const marker of [".dev.vars", ".env", ".env.*", "!.env.example"]) {
      if (!gitignore.includes(marker)) failures.push(`.gitignore must retain ${marker}`);
    }
  }

  if (!exists(".env.example")) {
    failures.push(".env.example is required for non-secret deployment configuration guidance.");
  } else {
    const envExample = read(".env.example");
    if (!/GITHUB_TOKEN=\s*$/m.test(envExample)) failures.push(".env.example must keep GITHUB_TOKEN blank.");
    if (!/^ACCESS_GATE_CONFIRMED=false\s*$/m.test(envExample)) failures.push(".env.example must keep ACCESS_GATE_CONFIRMED fail-closed.");
  }

  if (exists("package.json")) {
    const packageJson = JSON.parse(read("package.json"));
    if (packageJson.private !== true) failures.push("package.json must retain private=true to prevent accidental npm publication.");
  }

  for (const apiPath of ["functions/api/dashboard.js", "functions/api/governance.js"]) {
    if (!exists(apiPath)) continue;
    const source = read(apiPath);
    if (!source.includes("ACCESS_GATE_CONFIRMED")) failures.push(`${apiPath} must retain the private deployment interlock.`);
    if (!source.includes('"Cache-Control": "private, no-store, max-age=0"')) failures.push(`${apiPath} must remain private no-store.`);
  }

  if (!exists("docs/PUBLIC_SOURCE_BOUNDARY.md")) {
    failures.push("Public-source/private-deployment boundary documentation is required.");
  } else {
    const boundary = read("docs/PUBLIC_SOURCE_BOUNDARY.md");
    if (!/public, open-source repository/i.test(boundary)) failures.push("Public source policy must explicitly declare the repository public/open source.");
    if (!/private, authenticated deployment/i.test(boundary)) failures.push("Public source policy must explicitly preserve private authenticated deployment.");
  }

  if (exists("README.md")) {
    const readme = read("README.md");
    if (!/public(?:\s*\/\s*|\s+and\s+)open[- ]source/i.test(readme)) failures.push("README must state the public/open-source repository model.");
    if (!/private(?:\s+and)?\s+authenticated/i.test(readme)) failures.push("README must state the private authenticated deployment model.");
  }

  return failures;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  const failures = validatePublicSource(process.cwd());
  if (failures.length) {
    console.error("Public-source validation failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log("Public-source validation passed.");
}
