# Changelog

All notable source changes to GoreeCloud GitHub Dashboard are recorded here. Git history remains authoritative for exact commits and pull requests.

## 0.3.0-dev — continued 2026-09-05

### Added

- Repository-local `docs/GLAZE_UI_CONFORMANCE.md` mapping the dashboard to the current Stable GLAZE UI V1.1 / 1.1.0 release anchor while explicitly retaining rendered and production acceptance as pending.
- `public/glaze-v1.1.css` as the application-specific V1.1 migration layer, with Deep Teal / Soft Amber atmosphere, solid durable data surfaces, navigation-only Glaze material, 48 px target sizing, Reduced Transparency fallback, and purpose-built Tablet navigation.
- `public/glaze-ui.js` to expose the exact source target and acceptance-pending state to the running interface.
- GLAZE UI migration tests covering the exact Stable source anchor, material boundary, 48 px target floor, Tablet composition, resilience hooks, bootstrap order, and fail-closed acceptance status.
- Mandatory repository product records: `COMPETITIVE-OBJECTIVES.md`, `FEATURES.md`, and `BENEFITS.md`.
- `scripts/validate-product-records.mjs` to enforce product-record presence, README links, current GLAZE UI source target, exact release anchor, acceptance-pending status, and evaluation of all seven GoreeCloud Platform Systems.
- Root `goreecloud.platform.yaml` adopting GoreeCloud Platform Contract v0.2 with Development lifecycle, all seven Platform Systems, explicit continuity/dependency declarations, current Stable Glaze UI 1.1.0 compatibility, and truthful `nonconformant` status.
- Exact-head `.github/workflows/platform-contract.yml` pinned to reviewed central `GoreeCloud/GoreeCloud` Platform Contract revision `4a0ebf20ffb669e3d5680ab6c8d34583f1712966`; it validates the manifest, computes the conformance result against the actual pull-request head, validates the result schema, and asserts that Development is not Stable-eligible.
- Safe `/api/health` process-liveness endpoint that returns only non-secret service metadata and does not depend on GitHub availability or credentials.
- Fail-closed `/api/ready` configuration-readiness endpoint that requires both server-side GitHub credential configuration and confirmed external private-access configuration without revealing which prerequisite is missing.
- `docs/OPERATIONAL_HEALTH.md` defining health/readiness semantics, cache/security boundaries, and the distinction between source-level readiness and production acceptance.
- Health/readiness contract tests covering version synchronization, private no-store responses, generic not-ready behavior, secret non-disclosure, configuration-ready behavior, and non-GET rejection.
- `public/theme-policy.js` and `public/appearance-guard.js` implementing a deterministic four-state `System → Light → Dark → Deep Dark → System` appearance policy without coupling appearance changes to the GitHub data renderer.
- Appearance-policy tests covering the four-state cycle, invalid-value normalization, accessible state labels/icons, bootstrap order, capture behavior, System dark-preference support, Deep Dark source tokens, and the solid `color-mix()` fallback.

### Changed

- Synchronized the development branch with the newer `main` baseline so `BRANDING.md` and `docs/PLATFORM_CONFORMANCE.md` are carried forward rather than left behind.
- Reworked `docs/PLATFORM_CONFORMANCE.md` from a four-system statement into a truthful seven-system status table covering GoreeCloud Manager, Privacy Shield, Wardveil Security, Everkeep, Glaze UI, GoreeCloud Mesh, and GoreeCloud Identity.
- Extended platform-conformance documentation with the machine-readable v0.2 declaration, continuity boundary, pinned central validator revision, and exact-head wrapper rationale while the central reusable workflow's known PR revision-attribution issue remains unresolved.
- Updated the Platform Contract manifest from absent health/readiness hooks to source-backed `/api/health` and `/api/ready` declarations.
- Updated the static interface and README from the superseded Glaze UI 1.3 label to the current Stable V1.1 / 1.1.0 source target, with acceptance explicitly pending.
- Replaced the compressed Tablet first-letter navigation rail with a full-label horizontal Tablet navigation composition.
- Durable dashboard panels no longer depend on backdrop blur; active form-factor navigation remains the primary Glaze surface.
- Touch-capable buttons, icon buttons, search, navigation, and mobile navigation now use a 48 px minimum source target.
- System appearance now follows the operating-system Light/Dark preference, while Deep Dark is a separate explicit near-black mode rather than an automatically inferred state.
- The appearance button now exposes the current and next mode through an accessible label and persists only the selected appearance mode.
- The optional hero `color-mix()` treatment now has an immediately preceding solid-surface fallback so unsupported color mixing cannot restore the superseded translucent panel material.
- Bootstrap order now applies GLAZE UI source state, the appearance migration guard, refresh discipline, and then the legacy renderer in that order.
- `npm run check` now validates product/conformance records, appearance-policy invariants, operational endpoint invariants, Platform Contract source invariants, and syntax-checks the GLAZE UI, appearance, health/readiness, and dashboard runtime modules.
- README now links the competitive objectives, features, benefits, branding, operational health record, Glaze UI mapping, root Platform Contract declaration, and seven-system platform-conformance records.

### Security and truthfulness

- No GitHub mutation route, production deployment, private-access change, runtime credential expansion, or shared private-data cache is introduced by this continuation.
- Source-level privacy and security controls remain explicitly distinct from accepted Privacy Shield or Wardveil integration.
- External private access remains explicitly distinct from GoreeCloud Identity integration.
- GLAZE UI source migration remains explicitly distinct from rendered, accessibility, form-factor, and production acceptance.
- Platform Contract validation is declaration/conformance evidence only; it cannot upgrade blocked integrations or missing acceptance into positive platform claims.
- Readiness returns one generic `deployment_not_ready` state and does not disclose whether the server-side credential or private-access confirmation is missing.
- Health/readiness endpoints are private no-store, read-only, and do not expose credential material.
- Appearance persistence stores only the non-sensitive selected appearance mode and does not alter the server-side credential or private-data boundary.
- The project remains in the Development lifecycle and the manifest deliberately declares `nonconformant`.

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
- Full-width Coverage Detail surface that breaks recent-commit, changelog, releases, workflows, and API-budget visibility into independently reviewable states.
- Dependency-free data-health presentation model with unit coverage for complete, partial, unavailable, malformed, and impossible count inputs.
- GitHub request identity-header contract test that ties the outbound dashboard `User-Agent` to the version declared in `package.json` and verifies the GitHub REST media type and API-version headers.
- `docs/CACHE_POLICY.md` documenting the current private-data cache boundary, prerequisites for any future authenticated cache partition, and the decision to defer shared caching during Development.
- Cache-policy tests confirming private/no-store/max-age=0 behavior and the absence of shared edge-cache primitives, shared-cache directives, and ETag-based cache contracts in the private dashboard function.

### Changed

- The browser entry point now loads `public/bootstrap.js`, which evaluates the refresh guard before `public/app.js`.
- Manual refresh clicks are blocked during an active cooldown in the capture phase before they can reach the application refresh listener.
- Repository validation now requires the bootstrap, refresh guard, refresh policy, refresh-state surface, refresh-policy tests, API contract tests, representative GitHub fixture tests, GitHub edge-fixture tests, bounded collection fixtures, GitHub request identity-header contract test, Coverage Detail surface, data-health model, and data-health tests.
- JavaScript syntax validation now checks the bootstrap, data-health, and refresh modules.
- The browser now distinguishes per-source successful and unavailable optional reads instead of requiring the aggregate partial-coverage pill to carry all diagnostic meaning.
- Repository enumeration is now fixture-validated across the existing 100-item page boundary so a full first page must continue to the next page while foreign-owner repositories remain excluded.
- Repository enumeration is additionally fixture-validated against the existing five-page safety cap so five full pages stop without requesting page 6.
- Mixed multi-repository recent-change coverage preserves successful data, confirmed 404 absence, and isolated 403 unavailability in one collection.
- Mixed changelog coverage validates fallback from `CHANGELOG.md` to `docs/CHANGELOG.md`, confirmed absence, and isolated permission denial without conflating those states.
- Mixed workflow coverage preserves successful and no-run repositories while isolating one permission failure.
- Recent-commit and release probes preserve the distinction between optional 404 absence and permission-denied 403 unavailability.
- Search API rate-limit failure remains sanitized at the dashboard boundary.
- Upstream abort propagation remains distinct from the dashboard's own bounded request-timeout path.
- Every GitHub request has an AbortController-backed 8-second default timeout with bounded internal overrides and cleanup.
- The outbound GitHub REST `User-Agent` now derives from explicit `CLIENT_VERSION = "0.3.0-dev"`, eliminating the previous internal `0.2` identity drift while keeping the package at `0.3.0-dev`.
- Shared server-side or edge caching was evaluated and intentionally deferred until authenticated deployment provides a verified authorization-aware identity partition. The API remains `private, no-store, max-age=0`, and source contracts reject shared edge-cache primitives, shared-cache directives, and ETag-based cache behavior in the current Development source.
- Architecture and deployment documentation distinguish the browser cooldown from enforceable server-side rate limiting.
- Architecture documentation records the deterministic GitHub fixture boundary and explicitly separates fixture evidence from live private-repository, rendered, deployment, and production acceptance.
- Dashboard version remains `0.3.0-dev` and the project remains in the GoreeCloud Development lifecycle.

### Security

- The refresh guard does not receive or store the GitHub token and does not change the server-side credential boundary.
- The cooldown is explicitly not treated as authentication, authorization, or server-side abuse prevention.
- Automated API contract coverage verifies missing-token and unconfirmed-access-gate fail-closed states.
- Repository-specific optional-read failures degrade to explicit partial coverage instead of silently dropping data or encouraging unnecessarily broad credentials.
- Coverage Detail uses only aggregate counts and the rate-limit-availability flag already returned by the private API; no additional private repository identity list is exposed.
- Request timeouts do not expose credentials, raw authorization headers, or private upstream response bodies to the browser.
- API error responses are validated for JSON, private/no-store caching, and nosniff protection.
- Representative fixtures verify that synthetic credentials and raw upstream-only repository/workflow fields do not pass through the normalized dashboard response.
- GitHub request-header and cache-policy validation use only synthetic/local test material and introduce no reusable secret.
- The current cache policy explicitly rejects shared edge caching of authenticated dashboard responses until a verified authorization-aware cache partition exists.
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
- AbortController-backed 8-second default timeout protection for every GitHub request, with bounded internal overrides and cleanup of timers/forwarded abort listeners.
- Unit tests for workflow normalization, rate-limit normalization, CI-priority attention ordering, stale-repository attention, coverage-aware attention, per-repository recent-change partial failures, fail-soft rate-limit behavior, and request timeout behavior.

### Changed

- Recent-commit, changelog, release, and workflow repository fan-out returns explicit checked/unavailable collection metadata instead of silently dropping rejected repository reads.
- Settled collections retain the names of repositories whose optional reads rejected so derived attention can distinguish unavailable evidence from confirmed absence.
- Repository Attention says CI or changelog coverage is unavailable when the corresponding probe rejected instead of falsely claiming a missing changelog or implying CI was successfully checked.
- `dataHealth.unavailableReads` combines rejected recent-commit, changelog, release, and workflow reads; coverage is complete only when those bounded probes succeed and rate-limit information is available.
- A stalled core GitHub request now terminates through the sanitized dashboard-error path instead of waiting indefinitely.
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
