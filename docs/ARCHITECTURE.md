# Architecture

## Role

GoreeCloud GitHub Dashboard is a read-only operational view over GoreeCloud-owned GitHub repositories. GitHub remains the authoritative source for repository state, commits, issues, pull requests, releases, and repository-local changelogs. The dashboard does not create a second authoritative repository database.

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
5. Probe common repository-local changelog paths for the top repositories.
6. Probe the latest published GitHub release for the top repositories.
7. Normalize data before returning it to the browser.

The foundation intentionally limits fan-out so a single dashboard refresh does not perform repository-wide deep crawling.

## Top repository ranking

The dashboard ranks operational relevance rather than popularity alone. The current score favors:

- Recent pushes, with the strongest weight.
- A bounded amount of open-work weight.
- A small bounded star signal.
- Active/non-archived state.

Archived and disabled repositories do not appear in the Top 10. The score is implemented as a pure function and covered by unit tests so future tuning remains explicit and reviewable.

## Changelog model

The dashboard checks these paths, in order:

- `CHANGELOG.md`
- `docs/CHANGELOG.md`
- `changelog.md`

It extracts a short summary from the first meaningful changelog section and links to the authoritative file in GitHub. Absence of a repository-local changelog is treated as an ordinary empty state, not as an application failure.

The dedicated `goreecloud-changelogs` repository can be integrated more deeply when it contains structured changelog data. The foundation does not invent changelog entries that are not present in GitHub.

## Privacy boundary

The dashboard repository is private and the intended live dashboard is private. Private repository names, descriptions, commit messages, issue titles, pull request titles, changelog text, and release metadata are all treated as private operational information unless separately approved for public display.

The source includes a deployment interlock: `/api/dashboard` refuses to return data until `ACCESS_GATE_CONFIRMED=true`. That value may be enabled only after an authenticated private-access layer has been configured and tested. The interlock is not authentication by itself.

## Credential boundary

`GITHUB_TOKEN` must be a read-only credential and must remain server-side. Recommended permissions are the minimum read scopes required for the selected repositories, such as repository metadata, contents, issues, and pull requests. Do not grant write, administration, workflow-write, secret-management, or repository-deletion permissions to the dashboard credential.

The application never performs GitHub mutations.

## Rate limits and failure behavior

The aggregator uses bounded repository fan-out and small result limits. A GitHub rate-limit or upstream failure returns a sanitized dashboard error and preserves the read-only boundary. No token, response body containing credentials, or stack trace is returned to the browser.

A future cache may be added at the server layer to reduce GitHub API calls, but cached private data must remain inside the same private access boundary.

## Glaze UI adaptation

The foundation follows Stable Glaze UI 1.3 component/accessibility semantics and the current form-factor direction:

- Mobile: touch-first stacked composition and bottom navigation.
- Tablet: compact navigation rail and pane-aware content stacking.
- Desktop: persistent sidebar, denser workspace, searchable repository table, and multi-column panels.
- Wide Desktop: increased workspace without stretching content indiscriminately.
- TV: explicitly unsupported in the initial foundation and therefore not claimed as tested or accepted.

The UI includes reduced-motion, increased-contrast, forced-colors, keyboard-focus, and solid-surface resilience.

## Authority and future work

GitHub remains authoritative. This dashboard is a derived read-only view. Future additions should preserve that model unless a separate GoreeCloud specification explicitly authorizes a write-capable feature with additional security and audit controls.
