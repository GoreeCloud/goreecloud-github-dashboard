# Changelog

All notable source changes to GoreeCloud GitHub Dashboard are recorded here. Git history remains authoritative for exact commits and pull requests.

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
