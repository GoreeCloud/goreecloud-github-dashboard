# Architecture

## Role

GoreeCloud GitHub Dashboard is a read-only operational view over GoreeCloud-owned GitHub repositories. GitHub remains the authoritative source for repository state, commits, issues, pull requests, releases, workflow runs, and repository-local changelogs. The dashboard does not create a second authoritative repository database.

## Request path

```text
Authenticated private user
  -> private access layer (required for deployment)
  -> Cloudflare Pages static interface
  -> /api/dashboard Pages Function
  -> read-only GitHub API credential
  -> GitHub REST API
```

The browser never receives the GitHub credential. The Pages Function returns only normalized fields needed by the interface.

## Data aggregation

A refresh performs the following bounded read operations:

1. Enumerate repositories accessible to the authenticated GitHub credential and filter them to `GITHUB_OWNER`.
2. Calculate an operational activity score and retain the top ten active repositories.
3. Read a small number of recent commits from the most active repositories.
4. Query the ten most recently updated open pull requests and issues.
5. Probe common repository-local changelog paths for the Top 10 repositories.
6. Probe the latest published GitHub release for the Top 10 repositories.
7. Best-effort probe the latest GitHub Actions workflow run for each Top 10 repository.
8. Read the authenticated GitHub rate-limit resource when available.
9. Derive repository-attention and data-coverage signals from the normalized results.
10. Normalize data before returning it to the browser.

The implementation intentionally limits pagination and repository fan-out so a single dashboard refresh does not perform repository-wide deep crawling.

## Top repository ranking

The dashboard ranks operational relevance rather than popularity alone. The current score favors:

- Recent pushes, with the strongest weight.
- A bounded amount of open-work weight.
- A small bounded star signal.
- Active/non-archived state.

Archived and disabled repositories do not appear in the Top 10. The score is implemented as a pure function and covered by unit tests so future tuning remains explicit and reviewable.

## Repository-attention model

Repository attention is a derived operational view over the same Top 10 set. It does not change GitHub state and does not claim that every signal is a defect.

Current signals are deliberately understandable:

- A latest workflow conclusion such as `failure`, `cancelled`, `timed_out`, `action_required`, `startup_failure`, or `stale` is treated as critical attention.
- A ranked repository with no push for more than 90 days is marked for review.
- A ranked repository reporting at least 15 open issues/pull requests through GitHub's repository count receives a review signal.
- Absence of a repository-local changelog in the probed paths is informational.

Critical signals sort ahead of review and informational signals. The model is intentionally small and explainable; future health scoring must not become an opaque substitute for the underlying GitHub evidence.

## CI/workflow visibility

The dashboard probes only the latest workflow run for each Top 10 repository. This is a bounded health indicator rather than an Actions replacement.

Actions visibility is best-effort. If the read-only credential cannot read workflow runs for one or more repositories, those failures are isolated with `Promise.allSettled`. The primary dashboard continues to render, `dataHealth.status` becomes `partial`, and the UI reports partial coverage.

A repository with no workflow run is represented as an ordinary `none` state. It is not treated as an API failure.

## Changelog model

The dashboard checks these paths, in order:

- `CHANGELOG.md`
- `docs/CHANGELOG.md`
- `changelog.md`

It extracts a short summary from the first meaningful changelog section and links to the authoritative file in GitHub. Absence of a repository-local changelog is not an application failure; it may appear as an informational repository-attention signal for the ranked set.

The separate `goreecloud-changelogs` application remains independently governed. The dashboard does not invent changelog entries that are not present in the probed GitHub repository files and does not make the changelog application an undocumented runtime dependency.

## Partial-data and rate-limit model

Repository fan-out that is useful but not authoritative for the entire page is fail-soft. Recent-commit reads, changelog probes, release probes, and workflow-run reads use per-repository settled results. One repository-specific upstream failure therefore does not erase successful results from the other repositories.

Each bounded collection returns:

- `checked`: number of repositories selected for that probe.
- `unavailable`: number of repository reads that rejected.
- `items`: normalized successful results.

The API combines those unavailable counts into `dataHealth.unavailableReads`. `dataHealth.status` is `partial` whenever any bounded repository read is unavailable or normalized rate-limit information cannot be read. It is `complete` only when those optional probes return without rejected repository reads and the rate-limit resource is available.

The server reads GitHub's `/rate_limit` endpoint when possible and returns normalized `core` and `search` resource values: limit, used, remaining, and reset time. The browser displays only the normalized remaining core budget.

This model prevents recent commits, changelogs, releases, workflow status, or rate-limit visibility from disappearing silently while the page implies complete coverage.

## Privacy boundary

The dashboard repository is private and the intended live dashboard is private. Private repository names, descriptions, commit messages, issue titles, pull request titles, workflow names/branches, changelog text, release metadata, and derived attention signals are all treated as private operational information unless separately approved for public display.

The source includes a deployment interlock: `/api/dashboard` refuses to return data until `ACCESS_GATE_CONFIRMED=true`. That value may be enabled only after an authenticated private-access layer has been configured and tested. The interlock is not authentication by itself.

## Credential boundary

`GITHUB_TOKEN` must be a read-only credential and must remain server-side. Required permissions should be the minimum read scopes needed for repository metadata, contents, commits, issues, pull requests, and releases. GitHub Actions read access is optional but recommended when CI health is desired.

Do not grant write, administration, workflow-write, secret-management, or repository-deletion permissions to the dashboard credential.

The application never performs GitHub mutations.

## Failure behavior

Core account-wide failures, such as inability to enumerate the repository portfolio or query the primary open-work searches, return a sanitized dashboard error and preserve the read-only boundary. Repository-specific recent-commit, changelog, release, and workflow failures degrade to explicit partial coverage. Rate-limit visibility also fails soft.

No token, upstream authorization header, private stack trace, or raw credential-bearing response is returned to the browser.

A future short-lived server or edge cache may reduce GitHub API calls, but cached private data must remain inside the same authenticated private-access boundary and must expose freshness clearly.

## Glaze UI adaptation

The project follows the current Stable Glaze UI 1.3 baseline and the governing form-factor fidelity requirements:

- Phone / Compact: touch-first stacked composition and bottom navigation.
- Tablet / Medium: compact navigation rail and tablet-appropriate content stacking.
- Desktop / Expanded: persistent sidebar, efficient pointer/keyboard workspace, searchable repository table, and multi-column panels.
- Wide Desktop: increased information density without stretching content indiscriminately.
- TV: explicitly unsupported in the initial foundation and therefore not claimed as tested or accepted.

Representative visual acceptance remains required at 390 × 844, 820 × 1180, 1280 × 900, and 1600 × 1000 for the supported classes. The UI also includes reduced-motion, increased-contrast, forced-colors, keyboard-focus, and solid-surface resilience.

## Authority and future work

GitHub remains authoritative. This dashboard is a derived read-only view. Future additions should preserve that model unless a separate GoreeCloud specification explicitly authorizes a write-capable feature with additional security, authorization, audit, and recovery controls.
