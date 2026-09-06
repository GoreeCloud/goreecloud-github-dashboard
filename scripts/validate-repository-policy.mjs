import fs from "node:fs";

const requiredApplicationServiceFiles = [
  "README.md",
  "SPECIFICATIONS.md",
  "FEATURES.md",
  "BENEFITS.md",
  "COMPETITIVE-OBJECTIVES.md",
  "BRANDING.md",
];

const failures = [];

for (const file of requiredApplicationServiceFiles) {
  if (!fs.existsSync(file)) {
    failures.push(`Missing mandatory application/service repository document: ${file}`);
  }
}

if (fs.existsSync("README.md")) {
  const readme = fs.readFileSync("README.md", "utf8");
  for (const file of requiredApplicationServiceFiles.filter((file) => file !== "README.md")) {
    if (!readme.includes(`](${file})`)) failures.push(`README must link ${file}`);
  }
}

if (failures.length) {
  console.error("Repository-policy documentation validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository-policy documentation validation passed.");
