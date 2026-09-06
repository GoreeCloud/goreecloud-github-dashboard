# GoreeCloud GitHub Dashboard

First-party GoreeCloud repository command center for recent changes, changelogs, top repositories, repository attention, CI health, pull requests, issues, releases, API-budget visibility, and repository inventory. The dashboard is designed for authenticated private operational use even though repository visibility is a separate GitHub configuration concern.

## Status

**Release lifecycle: Development.** Source is not production-approved and no production deployment is implied by this repository.

The application is deliberately text-first while its unique canonical product icon/service mark remains unapproved. Source migration now targets the current Stable **GLAZE UI V1.1 / 1.1.0** baseline. The V1.1 source mapping is implemented as Development work, but rendered, accessibility, resilience, and form-factor acceptance remain pending. Phone, Tablet, Desktop, and Wide Desktop are the intended supported form factors; TV is explicitly unsupported in the initial project scope.

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
- Safe process-level `/api/health` and fail-closed configuration-level `/api/ready` operational interfaces.
- Development-stage GLAZE UI V1.1 source mapping with solid durable data surfaces, navigation-only Glaze material, 48 px touch targets, and purpose-built Tablet navigation.
- Light, dark, reduced-motion, reduced-transparency fallback, increased-contrast, and forced-colors resilience.
- Fail-closed private-data gate for Cloudflare Pages deployments.
- GoreeCloud Platform Contract v0.2 root declaration with exact-head Development conformance validation.

See [FEATURES.md](FEATURES.md) for the explicit implemented/partial/not-approved capability boundary.

## Privacy and security boundary

This dashboard is designed to display private repository metadata. The GitHub credential must therefore stay server-side in a Cloudflare Pages Function secret and must be read-only. It must never be embedded in browser JavaScript, HTML, build output, screenshots, documentation, or source control.

The API refuses to return repository data unless all of the following are true:

1. `GITHUB_TOKEN` is configured as a server-side secret.
2. `GITHUB_OWNER` identifies the intended account (default: `GoreeCloud`).
3. `ACCESS_GATE_CONFIRMED=true` is configured **only after** the deployed site is protected by an authenticated private-access layer such as Cloudflare Access.

`ACCESS_GATE_CONFIRMED` is a deployment safety interlock, not an authentication mechanism. The external access layer remains mandatory before enabling private data.

GitHub Actions visibility is deliberately best-effort. If the read-only credential does not include the permission needed to read workflow runs, the rest of the dashboard remains available and the interface reports partial coverage rather than failing the complete aggregation request.

Each GitHub request is protected by a bounded timeout. The current default is 8 seconds, with internal test/override values clamped to a safe range. Timeout errors follow the same sanitized core-failure or partial-coverage paths as other upstream failures and never expose the GitHub credential.

The browser also applies a manual-refresh guard. After a successful refresh, additional manual refresh clicks are blocked for 30 seconds. After a failed refresh, retries are held for 10 seconds. This reduces accidental repeated GitHub API fan-out, but it is not server-side rate limiting, authentication, or an abuse-prevention boundary.

## Operational health and readiness

`/api/health` reports only process-level liveness and safe Development metadata. `/api/ready` reports configuration readiness only after the server-side GitHub credential exists and the external private-access layer has been verified and represented by `ACCESS_GATE_CONFIRMED=true`. It does not identify which prerequisite is missing and does not probe GitHub.

See [docs/OPERATIONAL_HEALTH.md](docs/OPERATIONAL_HEALTH.md) for exact semantics. Neither endpoint establishes upstream availability, authenticated-user acceptance, production readiness, or Stable status by itself.

## GLAZE UI migration

The application-specific source mapping is documented in [docs/GLAZE_UI_CONFORMANCE.md](docs/GLAZE_UI_CONFORMANCE.md). It targets GLAZE UI V1.1 / 1.1.0 and deliberately records rendered and production acceptance as pending. The migration layer is loaded before the refresh guard and application renderer so the active UI exposes the current source target rather than the superseded historical label.

## Platform conformance

The repository-root [goreecloud.platform.yaml](goreecloud.platform.yaml) declares GoreeCloud Platform Contract v0.2 state, including `/api/health` and `/api/ready`. All seven GoreeCloud Platform Systems and their current implementation status are explained in [docs/PLATFORM_CONFORMANCE.md](docs/PLATFORM_CONFORMANCE.md). The manifest is deliberately `nonconformant`, and the dashboard remains Development while applicable Identity, Mesh, Wardveil, Privacy Shield, Everkeep, Manager, and Glaze acceptance gates remain incomplete.

The Platform Contract workflow pins the reviewed central contract implementation and validates the exact pull-request head rather than using a synthetic PR merge revision. A passing manifest check does not promote lifecycle status or establish any platform-system acceptance.

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

Validation covers repository structure, JavaScript syntax, security invariants, dashboard health surfaces, timeout protection, refresh-guard integrity, fail-closed API contracts, deterministic GitHub aggregation, operational health/readiness, cache policy, data health, the current GLAZE UI V1.1 source-migration contract, repository product records, and local Platform Contract source invariants. GitHub Actions additionally runs the pinned central Platform Contract v0.2 validator and evaluator against the exact dashboard revision.

Deterministic representative GitHub fixtures exercise the complete dashboard aggregation path without live credentials. They verify private-repository normalization and owner filtering, complete coverage, Actions permission denial, the distinction between confirmed optional `404` absence and unavailable permission-denied evidence, fail-soft rate-limit loss, and sanitized core GitHub failures. Fixture validation strengthens source confidence but does not replace live private-repository validation, rendered form-factor acceptance, or deployment acceptance.

## Product records

- [COMPETITIVE-OBJECTIVES.md](COMPETITIVE-OBJECTIVES.md) — benchmark goals and deliberate product differences.
- [FEATURES.md](FEATURES.md) — current, partial, acceptance-gated, and unapproved functionality.
- [BENEFITS.md](BENEFITS.md) — benefits supported by current Development source and benefits not yet claimed.
- [BRANDING.md](BRANDING.md) — current canonical identity boundary.
- [goreecloud.platform.yaml](goreecloud.platform.yaml) — machine-readable Platform Contract v0.2 declaration.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Do not publish the dashboard with private repository access until its private-access boundary is configured and verified.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the read-only aggregation model, partial-data behavior, request timeout strategy, manual-refresh discipline, deterministic GitHub fixture validation, rate-limit strategy, ranking model, repository-attention model, changelog behavior, and security boundaries.

## License

MIT. See [LICENSE](LICENSE).
