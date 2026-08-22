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

## GitHub request timeout boundary

Every call made through `githubRequest` receives an AbortController-backed timeout. The current production default is 8 seconds per GitHub request. The internal override used by tests and potential future specialized calls is clamped between 250 milliseconds and 20 seconds so an accidental value cannot create an unbounded request or an effectively disabled timeout.

The timeout wraps the complete fetch operation and is always cleared in `finally`. If a caller supplies an upstream AbortSignal, that signal is forwarded to the internal controller and its listener is removed during cleanup.

Timeout handling preserves the existing failure hierarchy:

- A timeout during a core account-wide read, such as repository enumeration or the primary open-work searches, causes a sanitized dashboard refresh failure.
- A timeout during bounded repository fan-out, such as one repository's recent commits, changelog, release, or workflow status, is captured by `Promise.allSettled` and becomes explicit partial coverage while successful peer results remain usable.
- The browser does not receive the GitHub credential, raw authorization header, or a private stack trace when a timeout occurs.

This prevents one stalled upstream GitHub request from holding the dashboard indefinitely while preserving truthful partial-data semantics.

## Manual refresh discipline

The browser entry point is now `public/bootstrap.js`, which evaluates the refresh guard before the existing application module. The guard does not perform GitHub reads itself and does not alter the server-side credential boundary.

After the application reports a successful refresh, the guard starts a 30-second manual-refresh cooldown. During that period, the Refresh control is disabled, its visible label counts down, and capture-phase click handling prevents a user click from reaching the application refresh listener. If the application reports that data is unavailable, the guard starts a shorter 10-second retry floor so an upstream failure cannot encourage rapid repeated retries.

Cooldown calculations live in the dependency-free `public/refresh-policy.js` module and are covered by unit tests. The user interface exposes the current refresh state as an additional overview pill.

This mechanism is intentionally a browser-side operational safeguard only. It reduces accidental repeated API fan-out and makes refresh behavior explicit, but it is not server-side rate limiting, authentication, authorization, abuse prevention, or a substitute for GitHub's own rate limits. A user with direct authenticated access to the API endpoint could bypass the browser guard, so any future need for enforceable throttling must be implemented server-side inside the same private access boundary.

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
- Absence of a repository-local changelog in successfully probed paths is informational.
- A failed workflow or changelog probe is represented as unavailable coverage, not misrepresented as a successful CI state or a confirmed missing changelog.

Critical signals sort ahead of review and informational signals. The model is intentionally small and explainable; future health scoring must not become an opaque substitute for the underlying GitHub evidence.

## CI/workflow visibility

The dashboard probes only the latest workflow run for each Top 10 repository. This is a bounded health indicator rather than an Actions replacement.

Actions visibility is best-effort. If the read-only credential cannot read workflow runs for one or more repositories, or a workflow request times out, those failures are isolated with `Promise.allSettled`. The primary dashboard continues to render, `dataHealth.status` becomes `partial`, and the affected repository can carry an explicit CI-coverage-unavailable attention reason.

A repository with no workflow run after a successful Actions read is represented as an ordinary `none` state. It is not treated as an API failure.

## Changelog model

The dashboard checks these paths, in order:

- `CHANGELOG.md`
- `docs/CHANGELOG.md`
- `changelog.md`

It extracts a short summary from the first meaningful changelog section and links to the authoritative file in GitHub. A successful probe that finds no repository-local changelog may appear as an informational attention signal. A rejected or timed-out changelog probe is instead recorded as unavailable coverage so the dashboard does not claim absence without evidence.

The separate `goreecloud-changelogs` application remains independently governed. The dashboard does not invent changelog entries that are not present in the probed GitHub repository files and does not make the changelog application an undocumented runtime dependency.

## Partial-data and rate-limit model

Repository fan-out that is useful but not authoritative for the entire page is fail-soft. Recent-commit reads, changelog probes, release probes, and workflow-run reads use per-repository settled results. One repository-specific upstream failure therefore does not erase successful results from the other repositories.

Each bounded collection retains:

- `checked`: number of repositories selected for that probe.
- `unavailable`: number of repository reads that rejected.
- `unavailableRepositories`: repository names associated with rejected reads, retained server-side for correct derived attention behavior.
- `items`: normalized successful results.

The public dashboard API does not expose the internal unavailable-repository name arrays separately because the browser only needs aggregate coverage state. The server uses those names to avoid confusing an unavailable probe with confirmed absence.

The API combines rejected-read counts into `dataHealth.unavailableReads`. `dataHealth.status` is `partial` whenever any bounded repository read is unavailable or normalized rate-limit information cannot be read. It is `complete` only when those optional probes return without rejected repository reads and the rate-limit resource is available.

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

Core account-wide failures, such as inability to enumerate the repository portfolio or query the primary open-work searches, return a sanitized dashboard error and preserve the read-only boundary. Repository-specific recent-commit, changelog, release, and workflow failures—including timeouts—degrade to explicit partial coverage. Rate-limit visibility also fails soft.

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
