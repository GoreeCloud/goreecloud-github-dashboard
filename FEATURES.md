# Features

This record distinguishes verified source functionality from work that is partial, acceptance-gated, or not yet implemented. GitHub and exact repository history remain authoritative for source state.

## Implemented in Development source

- Read-only Cloudflare Pages Function aggregation of GoreeCloud GitHub repository data.
- Server-side GitHub credential boundary; reusable credentials are not shipped to the browser.
- Fail-closed `ACCESS_GATE_CONFIRMED` deployment interlock before private dashboard data is returned.
- Recent commit aggregation with bounded repository enumeration and fan-out.
- Top 10 repository ranking based primarily on current operational activity.
- Total, public, and private repository counts.
- Searchable repository directory.
- Open pull-request and issue summaries.
- Repository-local changelog discovery with common-path fallback.
- Latest release visibility.
- Best-effort latest GitHub Actions status for ranked repositories.
- Repository Attention signals for CI failure, staleness, large open-work counts, changelog state, and unavailable evidence.
- Explicit complete/partial coverage metadata for recent commits, changelogs, releases, workflows, and API-budget reads.
- Coverage Detail diagnostics derived from aggregate coverage counts.
- Normalized GitHub core/search rate-limit visibility when available.
- AbortController-backed bounded GitHub request timeouts.
- Manual refresh discipline with a 30-second post-success cooldown and 10-second failure retry floor.
- Private/no-store API cache policy; shared private-data caching is intentionally disabled.
- Strict browser security headers and sanitized API failure responses.
- Light/dark appearance support, visible focus, Reduced Motion, Increased Contrast, Forced Colors, and solid-surface resilience.
- Current-Stable GLAZE UI V1.1 / 1.1.0 source migration layer with 48 px touch targets, solid durable data surfaces, navigation-only Glaze material, and improved tablet navigation.
- Deterministic unit, contract, representative aggregation, edge, bounded-collection, request-header, cache-policy, data-health, and refresh-policy tests.

## Partial or acceptance-gated

- **GLAZE UI V1.1:** source migration is in progress; rendered, accessibility, resilience, and form-factor acceptance remain pending.
- **GitHub Actions coverage:** best-effort and dependent on the least-privilege runtime credential's supported read permission.
- **Private deployment:** source contains the deployment boundary, but an authenticated private-access layer and production runtime have not been accepted.
- **Live GitHub validation:** deterministic fixtures exist; representative live public/private repository validation remains required.
- **Product identity:** text-first presentation is intentional until a unique canonical dashboard identity is approved.
- **Platform-system conformance:** source-level privacy/security/continuity controls exist, but all seven GoreeCloud Platform Systems remain subject to the statuses in `docs/PLATFORM_CONFORMANCE.md`.

## Not currently implemented or approved

- GitHub repository, issue, pull-request, release, workflow, or settings mutations.
- GoreeCloud Identity authentication or authorization integration.
- GoreeCloud Mesh capability/event integration.
- Accepted Wardveil Security integration.
- Accepted Privacy Shield integration.
- Accepted Everkeep backup/restore integration.
- Production Cloudflare Pages deployment approval.
- Authorization-aware private-data shared caching.
- TV/far-view support.
- Stable lifecycle promotion.

Features must move between these sections only when implementation and applicable validation evidence support the change.
