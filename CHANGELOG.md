# Changelog

All notable source changes to GoreeCloud GitHub Dashboard are recorded here. Git history remains authoritative for exact commits and pull requests.

## 0.3.0-dev — 2026-08-21

### Added

- Browser-side manual-refresh guard loaded before the existing application module through a dedicated bootstrap entry point.
- Visible refresh-state pill in the overview surface.
- Thirty-second cooldown after a successful dashboard refresh to reduce accidental repeated GitHub API fan-out.
- Ten-second retry floor after a failed refresh so upstream failures do not encourage rapid repeated retries.
- Dependency-free refresh-policy module with bounded cooldown calculations.
- Unit coverage for success cooldown, failure retry floor, deterministic cooldown deadlines, remaining-time rounding, and cooldown bounds.
- API contract tests for missing-credential fail-closed behavior, locked private-access interlock behavior, mutation-style HTTP method rejection, and protected JSON/no-store error responses.
- Deterministic representative GitHub API fixture coverage for complete private-repository aggregation, owner filtering, optional absence, permission denial, rate-limit loss, and sanitized core failures.
- Dedicated GitHub edge-fixture coverage for multi-page repository enumeration, owner filtering across pages, search rate-limit failure, recent-commit and release 404-versus-403 semantics, no-run workflow coverage, incomplete rate-limit resources, and upstream abort propagation.
- Dedicated bounded-collection fixtures for the five-page repository-enumeration cap and mixed multi-repository recent-change, changelog-fallback, and workflow coverage states.
- Full-width Coverage Detail surface that breaks recent-commit, changelog, release, workflow, and API-budget health into independently reviewable states.
- Dependency-free data-health presentation model with unit coverage for complete, partial, unavailable, malformed, and impossible count inputs.
- GitHub request identity-header contract test that ties the outbound dashboard `User-Agent` to the version declared in `package.json` and verifies the GitHub REST media type and API-version headers.

### Changed

- The browser entry point now loads `public/bootstrap.js`, which evaluates the refresh guard before `public/app.js`.
- Manual refresh clicks are blocked during an active cooldown in the capture phase before they can reach the application refresh listener.
- Repository validation now requires the bootstrap, refresh guard, refresh policy, refresh-state surface, refresh-policy tests, API contract tests, representative GitHub fixture tests, GitHub edge-fixture tests, bounded collection fixtures, GitHub request identity-header contract test, Coverage Detail surface, data-health model, and data-health tests.
- JavaScript syntax validation now checks the bootstrap, data-health, and refresh modules.
- The browser now distinguishes per-source successful and unavailable optional reads instead of requiring the aggregate partial-coverage pill to carry all diagnostic meaning.
- Repository enumeration is now fixture-validated across the existing 100-item page boundary so a full first page must continue to the next page while foreign-owner results remain excluded.
- Repository enumeration is additionally fixture-validated against its existing five-page safety bound so five full pages stop without requesting a sixth page.
- Optional recent-commit and release reads are now fixture-validated to preserve the semantic distinction between confirmed 404 absence and unavailable 403 evidence.
- Mixed multi-repository fixtures verify that successful results, confirmed optional absence, and isolated unavailable evidence can coexist without corrupting collection coverage semantics.
- A successful GitHub Actions response with no workflow runs is now fixture-validated as available coverage with an explicit `none` state rather than partial coverage.
- The outbound GitHub REST `User-Agent` now derives from an explicit `CLIENT_VERSION` of `0.3.0-dev`, eliminating the previous internal `0.2` identity drift while keeping the package at `0.3.0-dev`.
- Exact-head source validation at `9fa175d630a060767bf757d8a49cbf721524f608` completed successfully in workflow run #30 / `32542915735` with all forty-three tests passing and repository validation green.
- Architecture and deployment documentation distinguish the browser cooldown from enforceable server-side rate limiting.
- Architecture documentation records the deterministic GitHub fixture boundary and explicitly separates fixture evidence from live private-repository, rendered, deployment, and production acceptance.
- Dashboard version remains `0.3.0-dev` and the project remains in the GoreeCloud Development lifecycle.

### Security

- The refresh guard does not receive or store the GitHub token and does not change the server-side credential boundary.
- The cooldown is explicitly not treated as authentication, authorization, or server-side abuse prevention.
- Automated API contract coverage verifies that missing credentials and an unconfirmed private-access gate fail closed and that error responses retain private/no-store protections.
- Representative fixtures verify that a synthetic GitHub credential and raw upstream-only repository/workflow fields do not pass through the normalized dashboard payload.
- Permission-denied fixture scenarios verify that unavailable workflow/changelog evidence is represented as partial coverage instead of false success or false confirmed absence.
- Core upstream permission failures are fixture-validated to return the sanitized `github_aggregation_failed` browser response without exposing the synthetic credential or raw upstream response body.
- Search API rate-limit failures are fixture-validated to remain sanitized at the dashboard boundary without returning the synthetic credential or raw upstream response body.
- Upstream request cancellation is fixture-validated as distinct from the dashboard's own bounded timeout path so external aborts are not falsely reported as internal request timeouts.
- Coverage Detail is derived only from aggregate counts and the rate-limit-availability flag already returned by the private dashboard API; it does not expose the server-side unavailable-repository identity list or credential material.
- GitHub request identity testing uses only a synthetic test credential and does not introduce or expose a reusable GitHub credential.
- Exact-head CI retained only Contents read and Metadata read permissions for its GitHub token.
- No GitHub mutation route, production deployment, private-access change, or credential expansion is introduced by this development entry.

## 0.2.0-dev — 2026-08-21

### Added

- Repository Attention surface for explainable operational signals across the Top 10 active repositories.
- Critical attention for latest failed/cancelled/timed-out/action-required/startup-failure/stale workflow conclusions.
- Review attention for ranked repositories with more than 90 days since the latest push or at least 15 GitHub-reported open issues/pull requests.
- Informational attention when no repository-local changelog is detected in successfully probed paths.
- Best-effort latest GitHub Actions workflow status for each Top 10 repository.
- Explicit complete/partial data-coverage metadata so unavailable optional reads are not hidden.
- Normalized GitHub core/search rate-limit metadata with browser-visible remaining core API budget.
- AbortController-backed 8-second default timeout protection for every GitHub request, with bounded internal override values and cleanup of timers/forwarded abort listeners.
- Unit tests for workflow normalization, rate-limit normalization, CI-priority attention ordering, stale-repository attention, coverage-aware attention, per-repository recent-change partial failures, fail-soft rate-limit behavior, and request timeout behavior.

### Changed

- Recent-commit, changelog, release, and workflow repository fan-out returns explicit checked/unavailable collection metadata instead of silently dropping rejected repository reads.
- Settled collections retain the names of repositories whose optional reads rejected so derived attention can distinguish unavailable evidence from confirmed absence.
- Repository Attention says CI or changelog coverage is unavailable when the corresponding probe rejected instead of falsely claiming a missing changelog or implying CI was successfully checked.
- `dataHealth.unavailableReads` combines rejected recent-commit, changelog, release, and workflow reads; coverage is complete only when those bounded probes succeed and rate-limit information is available.
- A stalled core GitHub request now terminates through the sanitized core-error path instead of waiting indefinitely.
- A stalled repository-specific optional GitHub request now rejects into the existing settled collection and becomes partial coverage while successful peer data remains available.
- Glaze UI documentation records the current Stable 1.3 baseline directly and keeps TV explicitly unsupported.
- Architecture and deployment documentation define optional Actions-read permission, partial-data behavior, request timeout behavior, rate-limit visibility, and the repository-attention model.
- Dashboard version remains `0.2.0-dev` and the project remains in the GoreeCloud Development lifecycle.

### Security

- GitHub Actions visibility remains read-only and fail-soft; lack of Actions read permission does not encourage broader token privileges merely to keep the primary dashboard usable.
- Rate-limit information is normalized server-side and does not expose authorization material.
- Repository-specific partial failures are represented explicitly without exposing raw upstream error bodies or credentials to the browser.
- Unavailable repository names are used only inside the private server-side aggregation path to derive truthful attention messaging; they are not exposed as a separate public API surface.
- Request timeout errors do not expose the GitHub credential, authorization header, or upstream response body to the browser.
- No GitHub mutation route or production deployment is introduced by this development entry.

## 0.1.0-dev — 2026-08-21

### Added

- Initial private GoreeCloud GitHub Dashboard foundation.
- Glaze UI responsive shell for Mobile, Tablet, Desktop, and Wide Desktop.
- Recent commit activity feed.
- Top 10 repository ranking based primarily on operational recency.
- Repository inventory with search, visibility, language, update age, and open-work indicators.
- Open pull request and issue summaries.
- Repository-local changelog discovery.
- Latest GitHub release discovery.
- Server-side GitHub API aggregation through Cloudflare Pages Functions.
- Fail-closed `ACCESS_GATE_CONFIRMED` private-data deployment interlock.
- Server-side-only read-only GitHub credential boundary.
- Security headers and strict same-origin browser policy.
- Reduced-motion, increased-contrast, forced-colors, keyboard-focus, and solid-surface resilience.
- Dependency-free source validation and unit tests.
- Architecture, deployment, security, and licensing documentation.

### Security

- The dashboard does not implement GitHub mutations.
- Private GitHub data remains locked until the external private-access layer is explicitly confirmed.
- No production deployment is approved by this development entry.
