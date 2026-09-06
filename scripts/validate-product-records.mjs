import fs from "node:fs";

const requiredFiles = [
  "COMPETITIVE-OBJECTIVES.md",
  "FEATURES.md",
  "BENEFITS.md",
  "goreecloud.platform.yaml",
  "docs/GLAZE_UI_CONFORMANCE.md",
  "docs/PLATFORM_CONFORMANCE.md",
  "docs/OPERATIONAL_HEALTH.md",
  "docs/PUBLIC_SOURCE_BOUNDARY.md",
  "public/glaze-ui.js",
  "public/glaze-v1.1.css",
  "public/theme-policy.js",
  "public/appearance-guard.js",
  "functions/api/health.js",
  "functions/api/ready.js",
  "scripts/validate-public-source.mjs",
  "tests/glaze-ui-conformance.test.mjs",
  "tests/appearance-policy.test.mjs",
  "tests/health-readiness.test.mjs",
  "tests/public-source-policy.test.mjs",
  ".github/workflows/platform-contract.yml",
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing product/conformance record: ${file}`);
}

if (!failures.length) {
  const readme = fs.readFileSync("README.md", "utf8");
  const bootstrap = fs.readFileSync("public/bootstrap.js", "utf8");
  const glazeRuntime = fs.readFileSync("public/glaze-ui.js", "utf8");
  const glazeMapping = fs.readFileSync("docs/GLAZE_UI_CONFORMANCE.md", "utf8");
  const glazeCss = fs.readFileSync("public/glaze-v1.1.css", "utf8");
  const themePolicy = fs.readFileSync("public/theme-policy.js", "utf8");
  const appearanceGuard = fs.readFileSync("public/appearance-guard.js", "utf8");
  const platform = fs.readFileSync("docs/PLATFORM_CONFORMANCE.md", "utf8");
  const manifest = fs.readFileSync("goreecloud.platform.yaml", "utf8");
  const platformWorkflow = fs.readFileSync(".github/workflows/platform-contract.yml", "utf8");
  const health = fs.readFileSync("functions/api/health.js", "utf8");
  const ready = fs.readFileSync("functions/api/ready.js", "utf8");
  const publicSourceBoundary = fs.readFileSync("docs/PUBLIC_SOURCE_BOUNDARY.md", "utf8");
  const publicSourceValidator = fs.readFileSync("scripts/validate-public-source.mjs", "utf8");

  for (const record of ["COMPETITIVE-OBJECTIVES.md", "FEATURES.md", "BENEFITS.md"]) {
    if (!readme.includes(record)) failures.push(`README must link ${record}`);
  }

  if (!/public(?:\s*\/\s*|\s+and\s+)open[- ]source/i.test(readme)) {
    failures.push("README must state the intentional public/open-source repository model.");
  }
  if (!/private(?:\s+and)?\s+authenticated/i.test(readme)) {
    failures.push("README must preserve the private authenticated operational deployment model.");
  }
  if (!/public, open-source repository/i.test(publicSourceBoundary)) {
    failures.push("Public source boundary must explicitly declare public/open-source source visibility.");
  }
  if (!/private, authenticated deployment/i.test(publicSourceBoundary)) {
    failures.push("Public source boundary must explicitly preserve private authenticated deployment.");
  }
  for (const marker of [
    "detectSecretMarkers",
    "isForbiddenPublicArtifact",
    "GITHUB_TOKEN",
    "api\\.github\\.com",
    "ACCESS_GATE_CONFIRMED=false",
    'packageJson.private !== true',
  ]) {
    if (!publicSourceValidator.includes(marker)) failures.push(`Public source validator missing required marker: ${marker}`);
  }

  const expectedBootstrapOrder = [
    'import "./glaze-ui.js";',
    'import "./appearance-guard.js";',
    'import "./refresh-guard.js";',
    'import "./app.js";',
  ];
  let previousIndex = -1;
  for (const statement of expectedBootstrapOrder) {
    const index = bootstrap.indexOf(statement);
    if (index <= previousIndex) failures.push(`Bootstrap order must include ${statement} after the prior migration boundary.`);
    previousIndex = index;
  }

  if (!glazeRuntime.includes('GLAZE_UI_VERSION = "1.1.0"')) {
    failures.push("Dashboard must target current Stable GLAZE UI 1.1.0.");
  }

  if (!glazeRuntime.includes('GLAZE_UI_ACCEPTANCE = "pending"')) {
    failures.push("GLAZE UI acceptance must remain fail-closed while rendered evidence is pending.");
  }

  if (!glazeMapping.includes("15cc76d2bcd4065552dc31c77145b63f34d9e7b2")) {
    failures.push("GLAZE UI mapping must retain the exact Stable source anchor.");
  }

  for (const appearance of ["System", "Light", "Dark", "Deep Dark"]) {
    if (!glazeMapping.includes(appearance)) failures.push(`GLAZE UI mapping must document ${appearance} appearance.`);
  }
  if (!themePolicy.includes('Object.freeze(["system", "light", "dark", "deep-dark"])')) {
    failures.push("Appearance policy must retain the governed four-state cycle.");
  }
  if (!appearanceGuard.includes("stopImmediatePropagation")) {
    failures.push("Appearance migration guard must capture the control before the legacy binary theme listener.");
  }
  if (!glazeCss.includes(':root[data-theme="deep-dark"]')) {
    failures.push("GLAZE UI CSS must implement explicit Deep Dark appearance.");
  }
  if (!glazeCss.includes(":root:not([data-theme])")) {
    failures.push("System appearance must preserve operating-system dark preference behavior.");
  }
  if (!/\.panel-glaze\s*\{[\s\S]*background:\s*var\(--content-surface\);[\s\S]*color-mix/.test(glazeCss)) {
    failures.push("Optional color-mix hero material must retain a solid compatibility fallback.");
  }

  for (const system of [
    "GoreeCloud Manager",
    "Privacy Shield",
    "Wardveil Security",
    "Everkeep",
    "Glaze UI",
    "GoreeCloud Mesh",
    "GoreeCloud Identity",
  ]) {
    if (!platform.includes(system)) failures.push(`Platform conformance must evaluate ${system}.`);
  }

  for (const marker of [
    'schema_version: "0.2"',
    "component:\n  type: application\n  id: github-dashboard",
    "repository: GoreeCloud/goreecloud-github-dashboard",
    "lifecycle: development",
    "version: 0.3.0-dev",
    'glaze_ui_required: "1.1.0"',
    "health_endpoint: /api/health",
    "readiness_endpoint: /api/ready",
    "status: nonconformant",
  ]) {
    if (!manifest.includes(marker)) failures.push(`Platform manifest missing required marker: ${marker}`);
  }

  if (manifest.includes("result: applicable-conformant")) {
    failures.push("Development manifest must not claim an accepted platform-system integration without evidence.");
  }

  for (const source of [health, ready]) {
    if (!source.includes('"Cache-Control": "private, no-store, max-age=0"')) {
      failures.push("Operational endpoints must remain private no-store.");
    }
    if (!source.includes('mode: "read-only"')) {
      failures.push("Operational endpoints must retain the read-only mode declaration.");
    }
  }
  if (!ready.includes("ACCESS_GATE_CONFIRMED") || !ready.includes("GITHUB_TOKEN")) {
    failures.push("Readiness must fail closed on both private-access confirmation and GitHub credential configuration.");
  }
  if (!ready.includes('code: "deployment_not_ready"')) {
    failures.push("Readiness must retain a generic not-ready response code.");
  }

  if (!platformWorkflow.includes("4a0ebf20ffb669e3d5680ab6c8d34583f1712966")) {
    failures.push("Platform Contract validation must pin the reviewed central implementation revision.");
  }
  if (!platformWorkflow.includes("github.event.pull_request.head.sha")) {
    failures.push("Platform Contract validation must resolve pull requests to the exact head SHA.");
  }
  if (!platformWorkflow.includes("result['stable_eligible'] is False")) {
    failures.push("Platform Contract workflow must verify Development is not Stable-eligible.");
  }
}

if (failures.length) {
  console.error("Product/conformance validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product/conformance validation passed.");
