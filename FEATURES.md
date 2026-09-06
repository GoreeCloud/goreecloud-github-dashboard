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
- Safe `/api/health` process-liveness endpoint with no GitHub or credential dependency.
- Fail-closed `/api/ready` configuration-readiness endpoint requiring both server-side GitHub credential configuration and confirmed external private-access configuration without exposing which prerequisite is missing.
- Dedicated `/governance.html` Portfolio Control Plane view and GET-only `/api/governance` endpoint.
- Batched GitHub GraphQL observation of exact default-branch presence for `goreecloud.platform.yaml`, root `SECURITY.md`, root `CONTRIBUTING.md`, and `.github/CODEOWNERS`, with a default batch size of 20 and hard maximum of 25 repositories.
- Governance observations distinguish present, absent, and unavailable evidence; failed GraphQL batches and GraphQL errors are never converted into false missing-file claims.
- Governance terminology is deliberately presence-only: observed baseline files do not establish compliance, Platform Contract applicability, lifecycle eligibility, or Stable qualification.
- Four-state appearance policy: System, Light, Dark, and explicit Deep Dark, with an accessible deterministic cycle and persisted user selection.
- System appearance follows operating-system Light/Dark preference; Deep Dark remains an explicit opt-in rather than being inferred automatically.
- Light/dark/deep-dark appearance support, visible focus, Reduced Motion, Increased Contrast, Forced Colors, Reduced Transparency fallback, and solid-surface/color-mix resilience.
- Current-Stable GLAZE UI V1.1 / 1.1.0 source migration layer with 48 px touch targets, solid durable data surfaces, navigation-only Glaze material, and improved tablet navigation.
- GoreeCloud Platform Contract v0.2 root manifest declaring all seven Platform Systems, Development lifecycle, health/readiness interfaces, governance endpoint/dependency metadata, and nonconformant status.
- Exact-head Platform Contract CI wrapper pinned to the reviewed central contract implementation, including computed-result schema validation and a fail-closed Stable-eligibility assertion.
- Deterministic unit, contract, representative aggregation, edge, bounded-collection, request-header, cache-policy, data-health, refresh-policy, appearance-policy, operational-health, governance-observation, Glaze-migration, and product/conformance source tests.

## Partial or acceptance-gated

- **GLAZE UI V1.1:** source migration now includes System, Light, Dark, and Deep Dark appearance states; rendered, accessibility, resilience, optical-quality, and form-factor acceptance remain pending.
- **Platform Contract v0.2:** declaration and source/CI validation are implemented; the computed result is intentionally nonconformant because required platform-system integrations and acceptance evidence remain incomplete.
- **Operational health/readiness:** source endpoints and contract tests exist; deployed runtime and monitoring acceptance remain pending.
- **Governance control plane:** baseline file presence observation is implemented, but repository role/type, applicability, manifest validation for peer repositories, branch/ruleset enforcement, required workflow state, security/dependency automation, release eligibility, broader documentation completeness, and platform-system integration state are not yet implemented.
- **Governance GraphQL runtime:** deterministic source/fixture coverage exists; representative live private-repository GraphQL permission and rate-budget validation remains pending.
- **GitHub Actions coverage:** best-effort and dependent on the least-privilege runtime credential's supported read permission.
- **Private deployment:** source contains the deployment boundary, but an authenticated private-access layer and production runtime have not been accepted.
- **Live GitHub validation:** deterministic fixtures exist; representative live public/private repository validation remains required.
- **Product identity:** text-first presentation is intentional until a unique canonical dashboard identity is approved.
- **Platform-system conformance:** source-level privacy/security/continuity controls exist, but all seven GoreeCloud Platform Systems remain subject to the blocked/nonconformant statuses in `docs/PLATFORM_CONFORMANCE.md`.

## Not currently implemented or approved

- GitHub repository, issue, pull-request, release, workflow, branch-protection, ruleset, or settings mutations.
- Authoritative machine-readable repository role/type registry.
- Automated branch-protection or ruleset enforcement.
- Release eligibility certification for peer repositories.
- GoreeCloud Identity authentication or authorization integration.
- GoreeCloud Mesh capability/event integration.
- Accepted Wardveil Security integration.
- Accepted Privacy Shield integration.
- Accepted Everkeep backup/restore integration.
- Accepted GoreeCloud Manager integration.
- Production Cloudflare Pages deployment approval.
- Authorization-aware private-data shared caching.
- TV/far-view support.
- Stable lifecycle promotion.

Features must move between these sections only when implementation and applicable validation evidence support the change.
