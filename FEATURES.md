# Features

This record distinguishes verified source functionality from work that is partial, acceptance-gated, or not yet implemented. GitHub and exact repository history remain authoritative for source state.

## Implemented in Development source

- Read-only Cloudflare Pages Function aggregation of GoreeCloud GitHub repository data.
- Server-side GitHub credential boundary; reusable credentials are not shipped to the browser.
- Fail-closed `ACCESS_GATE_CONFIRMED` deployment interlock before private dashboard data is returned.
- Intentional public/open-source repository model separated from the private authenticated operational deployment boundary.
- Automated public-source safety validation that rejects common reusable GitHub/Cloudflare credentials, private-key signatures, credentialed URLs, forbidden local secret files, and exported data/secret artifacts under `public/`.
- Browser-source safety checks that reject direct `api.github.com` references, authorization-header logic, and `GITHUB_TOKEN` references in publicly retrievable application assets.
- Non-secret example configuration contract requiring a blank `GITHUB_TOKEN`, `ACCESS_GATE_CONFIRMED=false`, ignored local secret files, and npm `private=true` as an accidental-package-publication guard rather than a repository-visibility setting.
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
- Governance baseline-file observations distinguish present, absent, and unavailable evidence; failed GraphQL batches and GraphQL errors are never converted into false missing-file claims.
- Separate policy-defined documentation evidence for root `README.md`, `SPECIFICATIONS.md`, `FEATURES.md`, `BENEFITS.md`, `COMPETITIVE-OBJECTIVES.md`, and `BRANDING.md`.
- Documentation evidence reuses the existing bounded GraphQL batch, adding no GitHub endpoint, permission, or repository fan-out.
- Documentation presence/absence is normalized independently from the four-file baseline and carries `repository-role-unclassified` applicability so the dashboard cannot turn missing files into a repository-policy failure before role/type classification exists.
- This repository now includes the mandatory root `SPECIFICATIONS.md` and a CI-enforced six-file application/service documentation baseline.
- Separate classic default-branch protection observation using GitHub GraphQL `branchProtectionRules` plus `matchingRefs`, with bounded rule/ref pagination and normalized selected control flags.
- Separate active ruleset observation using GitHub's exact-branch rules endpoint, including applicable repository- and organization-level active rulesets.
- Active ruleset fan-out is bounded to six concurrent repository reads by default and eight maximum; a full 100-rule first page is treated as unavailable because pagination completeness cannot be proven from the response-body-only request helper.
- Active ruleset browser data is deliberately bounded to rule type, ruleset id, source type, and source; non-workflow rule parameters are not forwarded.
- Active ruleset `workflows` rules expose bounded required-workflow reference evidence: workflow path, defining repository id, locally resolved accessible repository name when available, optional ref, and optional sha.
- Required-workflow references are deduplicated and bounded to 20 per workflow rule and 40 per observed repository; unknown repository ids remain unresolved rather than receiving invented names.
- Required-workflow observation reuses the existing active-ruleset response and adds no GitHub endpoint, permission, or repository fan-out.
- Baseline/documentation files, classic protection, and active rulesets are independent upstream evidence channels so an unavailable channel does not erase successful peer evidence; workflow-reference availability follows the active-ruleset channel.
- Governance terminology is deliberately observational: file presence, documentation evidence, matching classic rules, active ruleset rules, and workflow references do not establish policy applicability, lifecycle eligibility, conformance, or Stable qualification.
- Four-state appearance policy: System, Light, Dark, and explicit Deep Dark, with an accessible deterministic cycle and persisted user selection.
- Shared native appearance controller for both dashboard and governance views, including idempotent control installation and fail-soft browser-storage handling.
- Superseded renderer-local binary Light/Dark logic and its capture-phase migration guard have been removed.
- System appearance follows operating-system Light/Dark preference; Deep Dark remains an explicit opt-in rather than being inferred automatically.
- Light/dark/deep-dark appearance support, visible focus, Reduced Motion, Increased Contrast, Forced Colors, Reduced Transparency fallback, and solid-surface/color-mix resilience.
- Current-Stable GLAZE UI V1.1 / 1.1.0 source migration layer with 48 px touch targets, solid durable data surfaces, navigation-only Glaze material, and improved tablet navigation.
- GoreeCloud Platform Contract v0.2 root manifest declaring all seven Platform Systems, Development lifecycle, health/readiness interfaces, governance endpoint/dependency metadata, and nonconformant status.
- Exact-head Platform Contract CI wrapper pinned to the reviewed central contract implementation, including computed-result schema validation and a fail-closed Stable-eligibility assertion.
- Deterministic unit, contract, representative aggregation, edge, bounded-collection, request-header, cache-policy, data-health, refresh-policy, appearance-policy, operational-health, governance-observation, active-ruleset/required-workflow-observation, public-source-policy, Glaze-migration, repository-policy, and product/conformance source tests.

## Partial or acceptance-gated

- **GLAZE UI V1.1:** source migration includes System, Light, Dark, and Deep Dark appearance states plus the shared native controller; rendered, accessibility, resilience, optical-quality, and form-factor acceptance remain pending.
- **Platform Contract v0.2:** declaration and source/CI validation are implemented; the computed result is intentionally nonconformant because required platform-system integrations and acceptance evidence remain incomplete.
- **Operational health/readiness:** source endpoints and contract tests exist; deployed runtime and monitoring acceptance remain pending.
- **Public-source safety:** repository-local detection and source contracts are implemented, but hosted secret scanning, dependency/security automation, branch/ruleset enforcement, signed release provenance, and production deployment security validation remain separate acceptance work.
- **Governance control plane:** baseline-file, documentation-path, classic default-branch protection, active default-branch ruleset, and required-workflow reference observation are implemented, but repository role/type, applicability, peer-manifest validation, governed-workflow policy evaluation, security/dependency automation interpretation, release eligibility, and platform-system integration state are not yet implemented.
- **Documentation semantics:** the six policy-defined application/service paths are observed, but the dashboard does not yet know which peer repositories are applications/services or whether a missing path is policy-relevant for that repository.
- **Governance runtime:** deterministic source/fixture coverage exists; representative live private-repository REST/GraphQL permission and rate-budget validation remains pending.
- **Required-workflow semantics:** workflow-rule references are observed, but the dashboard does not decide whether an observed workflow is the applicable GoreeCloud-required workflow, whether the referenced revision is approved, or whether it executed successfully for a particular change.
- **Other ruleset semantics:** active rule types and sources are observed, but the dashboard does not yet decide whether status-check, code-scanning, merge-queue, deployment, or other rules satisfy GoreeCloud policy.
- **GitHub Actions coverage:** best-effort and dependent on the least-privilege runtime credential's supported read permission.
- **Private deployment:** source contains the deployment boundary, but an authenticated private-access layer and production runtime have not been accepted.
- **Live GitHub validation:** deterministic fixtures exist; representative live public/private repository validation remains required.
- **Product identity:** text-first presentation is intentional until a unique canonical dashboard identity is approved.
- **Platform-system conformance:** source-level privacy/security/continuity controls exist, but all seven GoreeCloud Platform Systems remain subject to the blocked/nonconformant statuses in `docs/PLATFORM_CONFORMANCE.md`.

## Not currently implemented or approved

- GitHub repository, issue, pull-request, release, workflow, classic branch-protection, ruleset, or settings mutations.
- Authoritative machine-readable repository role/type registry.
- Automated classic branch-protection or ruleset enforcement.
- Repository-policy applicability classification for peer documentation paths.
- Required-workflow policy satisfaction or execution-status certification for peer repositories.
- Hosted secret-scanning acceptance evidence for the repository.
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
