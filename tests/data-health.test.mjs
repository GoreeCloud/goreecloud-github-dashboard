import test from "node:test";
import assert from "node:assert/strict";
import { buildCoverageRows } from "../public/data-health.js";

test("coverage detail reports complete repository probes and API budget visibility", () => {
  const rows = buildCoverageRows({
    recentChangeRepositoriesChecked: 10,
    recentChangeRepositoriesUnavailable: 0,
    changelogRepositoriesChecked: 10,
    changelogRepositoriesUnavailable: 0,
    releaseRepositoriesChecked: 10,
    releaseRepositoriesUnavailable: 0,
    workflowRepositoriesChecked: 10,
    workflowRepositoriesUnavailable: 0,
    rateLimitAvailable: true,
  });

  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0], {
    key: "recent-changes",
    label: "Recent commits",
    kind: "repository",
    checked: 10,
    available: 10,
    unavailable: 0,
    status: "complete",
  });
  assert.equal(rows[4].status, "complete");
  assert.equal(rows[4].available, true);
});

test("coverage detail marks only the affected repository probe partial", () => {
  const rows = buildCoverageRows({
    recentChangeRepositoriesChecked: 10,
    recentChangeRepositoriesUnavailable: 0,
    changelogRepositoriesChecked: 10,
    changelogRepositoriesUnavailable: 2,
    releaseRepositoriesChecked: 10,
    releaseRepositoriesUnavailable: 0,
    workflowRepositoriesChecked: 10,
    workflowRepositoriesUnavailable: 0,
    rateLimitAvailable: true,
  });

  const changelogs = rows.find((row) => row.key === "changelogs");
  const workflows = rows.find((row) => row.key === "workflows");

  assert.equal(changelogs.status, "partial");
  assert.equal(changelogs.available, 8);
  assert.equal(changelogs.unavailable, 2);
  assert.equal(workflows.status, "complete");
});

test("coverage detail represents API budget loss without changing repository coverage", () => {
  const rows = buildCoverageRows({
    recentChangeRepositoriesChecked: 4,
    changelogRepositoriesChecked: 4,
    releaseRepositoriesChecked: 4,
    workflowRepositoriesChecked: 4,
    rateLimitAvailable: false,
  });

  assert.equal(rows.slice(0, 4).every((row) => row.status === "complete"), true);
  assert.deepEqual(rows[4], {
    key: "api-budget",
    label: "API budget",
    kind: "service",
    available: false,
    status: "unavailable",
  });
});

test("coverage detail clamps malformed and impossible counts", () => {
  const rows = buildCoverageRows({
    recentChangeRepositoriesChecked: "3.9",
    recentChangeRepositoriesUnavailable: 9,
    changelogRepositoriesChecked: -2,
    changelogRepositoriesUnavailable: "not-a-number",
  });

  assert.equal(rows[0].checked, 3);
  assert.equal(rows[0].unavailable, 3);
  assert.equal(rows[0].available, 0);
  assert.equal(rows[0].status, "partial");
  assert.equal(rows[1].checked, 0);
  assert.equal(rows[1].unavailable, 0);
  assert.equal(rows[1].available, 0);
  assert.equal(rows[1].status, "complete");
});
