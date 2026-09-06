import fs from "node:fs";

const requiredFiles = [
  "COMPETITIVE-OBJECTIVES.md",
  "FEATURES.md",
  "BENEFITS.md",
  "docs/GLAZE_UI_CONFORMANCE.md",
  "docs/PLATFORM_CONFORMANCE.md",
  "public/glaze-ui.js",
  "public/glaze-v1.1.css",
  "tests/glaze-ui-conformance.test.mjs",
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
  const platform = fs.readFileSync("docs/PLATFORM_CONFORMANCE.md", "utf8");

  for (const record of ["COMPETITIVE-OBJECTIVES.md", "FEATURES.md", "BENEFITS.md"]) {
    if (!readme.includes(record)) failures.push(`README must link ${record}`);
  }

  if (!bootstrap.startsWith('import "./glaze-ui.js";')) {
    failures.push("GLAZE UI migration must load before dashboard behavior.");
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
}

if (failures.length) {
  console.error("Product/conformance validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Product/conformance validation passed.");
