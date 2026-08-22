# GoreeCloud GitHub Dashboard

Private, first-party GoreeCloud repository command center for recent changes, changelogs, top repositories, repository attention, CI health, pull requests, issues, releases, API-budget visibility, and repository inventory.

## Status

**Release lifecycle: Development.** Source is not production-approved and no production deployment is implied by this repository.

The application is deliberately text-first while its unique canonical product icon/service mark remains unapproved. It follows the current Stable Glaze UI 1.3 baseline with purpose-built Phone, Tablet, Desktop, and Wide Desktop compositions. TV is explicitly unsupported in the initial project scope.

## Current features

- Recent commit activity across GoreeCloud repositories.
- Top 10 repositories ranked by operational activity rather than popularity alone.
- Total, public, and private repository counts.
- Repository-attention signals for failed CI, stale active repositories, large open-work counts, confirmed missing repository-local changelogs, and unavailable CI/changelog coverage among the ranked repositories.
- Best-effort latest GitHub Actions status for the Top 10 repositories.
- Explicit complete/partial data-coverage state when optional repository reads are unavailable.
- GitHub core API remaining-budget visibility when the rate-limit endpoint is available.
- Bounded per-request GitHub timeout protection so a stalled upstream request cannot hold the complete dashboard refresh indefinitely.
- Client-side manual-refresh discipline: a successful refresh starts a 30-second cooldown, while a failed refresh starts a 10-second retry floor.
- Open pull request and issue summaries.
- Latest release visibility where repositories publish GitHub releases.
- Repository-local changelog discovery using common `CHANGELOG.md` paths.
- Searchable repository directory with visibility, language, activity, and open-work metadata.
- Responsive Glaze UI layouts for Phone, Tablet, Desktop, and Wide Desktop.
- Light, dark, reduced-motion, increased-contrast, and forced-colors resilience.
- Fail-closed private-data gate for Cloudflare Pages deployments.

## Privacy and security boundary

This dashboard is designed to display private repository metadata. The GitHub credential must therefore stay server-side in a Cloudflare Pages Function secret and must be read-only. It must never be embedded in browser JavaScript, HTML, build output, screenshots, documentation, or source control.

The API refuses to return repository data unless all of the following are true:

1. `GITHUB_TOKEN` is configured as a server-side secret.
2. `GITHUB_OWNER` identifies the intended account (default: `GoreeCloud`).
3. `ACCESS_GATE_CONFIRMED=true` is configured **only after** the deployed site is protected by an authenticated private-access layer such as Cloudflare Access.

`ACCESS_GATE_CONFIRMED` is a deployment safety interlock, not an authentication mechanism. The external access layer remains mandatory before enabling private data.

GitHub Actions visibility is deliberately best-effort. If the read-only credential does not include the permission needed to read workflow runs, the rest of the dashboard remains available and the interface reports partial coverage rather than failing the complete aggregation request.

Each GitHub request is also protected by a bounded timeout. The current default is 8 seconds, with internal test/override values clamped to a safe range. Timeout errors follow the same sanitized core-failure or partial-coverage paths as other upstream failures and never expose the GitHub credential.

The browser also applies a manual-refresh guard. After a successful refresh, additional manual refresh clicks are blocked for 30 seconds. After a failed refresh, retries are held for 10 seconds. This reduces accidental repeated GitHub API fan-out, but it is not server-side rate limiting, authentication, or an abuse-prevention boundary.

## Local development

The static interface can be opened directly from `public/` for visual work. Live GitHub data requires a Pages-compatible local runtime and server-side environment values.

```text
GITHUB_OWNER=GoreeCloud
GITHUB_TOKEN=<read-only secret>
ACCESS_GATE_CONFIRMED=true
```

Keep real values in local secret storage such as `.dev.vars`; that file is ignored by Git.

## Validation

The repository intentionally has no runtime package dependencies in the current foundation. With Node.js installed:

```bash
npm test
npm run check
```

The validation workflow checks repository structure, JavaScript syntax, security invariants, dashboard health surfaces, timeout protection, refresh-guard integrity, fail-closed API contracts, and unit tests for ranking, normalization, changelog extraction, workflow normalization, rate-limit normalization, repository-attention behavior, partial-data behavior, request timeout behavior, and cooldown calculations.

Deterministic representative GitHub fixtures exercise the complete dashboard aggregation path without live credentials. They verify private-repository normalization and owner filtering, complete coverage, Actions permission denial, the distinction between confirmed optional `404` absence and unavailable permission-denied evidence, fail-soft rate-limit loss, and sanitized core GitHub failures. Fixture validation strengthens source confidence but does not replace live private-repository validation, rendered form-factor acceptance, or deployment acceptance.

## Deployment

See `docs/DEPLOYMENT.md`. Do not publish the dashboard with private repository access until its private-access boundary is configured and verified.

## Architecture

See `docs/ARCHITECTURE.md` for the read-only aggregation model, partial-data behavior, request timeout strategy, manual-refresh discipline, deterministic GitHub fixture validation, rate-limit strategy, ranking model, repository-attention model, changelog behavior, and security boundaries.

## License

MIT. See `LICENSE`.
