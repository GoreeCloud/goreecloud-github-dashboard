# GoreeCloud GitHub Dashboard

First-party GoreeCloud repository command center for recent changes, changelogs, top repositories, repository attention, CI health, pull requests, issues, releases, API-budget visibility, repository governance evidence, and repository inventory.

**Visibility model:** this GitHub repository is intentionally **public and open source**. The operational dashboard deployment remains **private and authenticated** whenever it can access or display non-public GoreeCloud repository data.

## Status

**Release lifecycle: Development.** Source is not production-approved and no production deployment is implied by this repository.

The application is deliberately text-first while its unique canonical product icon/service mark remains unapproved. Source migration now targets the current Stable **GLAZE UI V1.1 / 1.1.0** baseline verified in the canonical Glaze UI source repository. The V1.1 source mapping is implemented as Development work, but rendered, accessibility, resilience, and form-factor acceptance remain pending. Phone, Tablet, Desktop, and Wide Desktop are the intended supported form factors; TV is explicitly unsupported in the initial project scope.

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
- Dedicated read-only governance control plane for baseline files, policy-defined documentation evidence, classic branch protection, active rulesets, and required-workflow references.
- Documentation observation for `README.md`, `SPECIFICATIONS.md`, `FEATURES.md`, `BENEFITS.md`, `COMPETITIVE-OBJECTIVES.md`, and `BRANDING.md`, with repository role/type applicability explicitly left unclassified.
- Four-state appearance control: System, Light, Dark, and explicit Deep Dark. System follows the operating-system preference; Deep Dark is opt-in.
- Shared native appearance controller used by both dashboard and governance views; the superseded binary Light/Dark renderer listener has been removed.
- Development-stage GLAZE UI V1.1 source mapping with solid durable data surfaces, navigation-only Glaze material, 48 px touch targets, purpose-built Tablet navigation, Reduced Transparency fallback, and a solid fallback before optional `color-mix()` enhancement.
- Visible focus, Reduced Motion, Increased Contrast, and Forced Colors resilience.
- Fail-closed private-data gate for Cloudflare Pages deployments.
- Public-source safety validation for credential, private-key, browser-authentication, example-configuration, and exported-data boundaries.
- GoreeCloud Platform Contract v0.2 root declaration with exact-head Development conformance validation.
- Repository-policy validation for the six mandatory application/service root documentation records.

See [SPECIFICATIONS.md](SPECIFICATIONS.md) for the version-coupled product specification and [FEATURES.md](FEATURES.md) for the explicit implemented/partial/not-approved capability boundary.

## Privacy and security boundary

The public source repository must never contain reusable credentials, private deployment configuration, or non-public GoreeCloud repository data. Public source visibility is therefore independent from operational data visibility. See [docs/PUBLIC_SOURCE_BOUNDARY.md](docs/PUBLIC_SOURCE_BOUNDARY.md) for the enforced source/deployment separation.

This dashboard is designed to display private repository metadata. The GitHub credential must therefore stay server-side in a Cloudflare Pages Function secret and must be read-only. It must never be embedded in browser JavaScript, HTML, build output, screenshots, documentation, or source control.

The API refuses to return repository data unless all of the following are true:

1. `GITHUB_TOKEN` is configured as a server-side secret.
2. `GITHUB_OWNER` identifies the intended account (default: `GoreeCloud`).
3. `ACCESS_GATE_CONFIRMED=true` is configured **only after** the deployed site is protected by an authenticated private-access layer such as Cloudflare Access.

`ACCESS_GATE_CONFIRMED` is a deployment safety interlock, not an authentication mechanism. The external access layer remains mandatory before enabling private data.

GitHub Actions visibility is deliberately best-effort. If the read-only credential does not include the permission needed to read workflow runs, the rest of the dashboard remains available and the interface reports partial coverage rather than failing the complete aggregation request.

Each GitHub request is protected by a bounded timeout. The current default is 8 seconds, with internal test/override values clamped to a safe range. Timeout errors follow the same sanitized core-failure or partial-coverage paths as other upstream failures and never expose the GitHub credential.

The browser also applies a manual-refresh guard. After a successful refresh, additional manual refresh clicks are blocked for 30 seconds. After a failed refresh, retries are held for 10 seconds. This reduces accidental repeated GitHub API fan-out, but it is not server-side rate limiting, authentication, or an abuse-prevention boundary.

## Governance observation

The private `/governance.html` surface uses GET-only `/api/governance` evidence. It now keeps five concepts distinct:

- four baseline file paths;
- six policy-defined application/service documentation paths;
- classic default-branch protection;
- active default-branch rulesets; and
- bounded required-workflow references from active workflow rules.

The documentation paths share the existing batched GraphQL request, so the new evidence does not add a GitHub endpoint, permission, or repository fan-out. The dashboard does **not** assume every owned repository is an application or service. Until an authoritative repository role/type registry is available, documentation presence or absence remains observational evidence rather than a policy-satisfaction result.

See [docs/GOVERNANCE_CONTROL_PLANE.md](docs/GOVERNANCE_CONTROL_PLANE.md) for the exact interpretation and failure boundaries.

## Operational health and readiness

`/api/health` reports only process-level liveness and safe Development metadata. `/api/ready` reports configuration readiness only after the server-side GitHub credential exists and the external private-access layer has been verified and represented by `ACCESS_GATE_CONFIRMED=true`. It does not identify which prerequisite is missing and does not probe GitHub.

See [docs/OPERATIONAL_HEALTH.md](docs/OPERATIONAL_HEALTH.md) for exact semantics. Neither endpoint establishes upstream availability, authenticated-user acceptance, production readiness, or Stable status by itself.

## GLAZE UI migration

The application-specific source mapping is documented in [docs/GLAZE_UI_CONFORMANCE.md](docs/GLAZE_UI_CONFORMANCE.md). It targets GLAZE UI V1.1 / 1.1.0 and deliberately records rendered and production acceptance as pending. The migration layer is loaded before the appearance controller, refresh guard, and application renderer so the active UI exposes the current source target rather than a superseded historical label.

Appearance cycles `System → Light → Dark → Deep Dark → System`. The System state keeps operating-system Light/Dark behavior, while Deep Dark remains an explicit near-black mode. A shared appearance controller now owns initialization, persistence, accessible current/next-mode labeling, and the appearance button on both dashboard and governance pages. The prior binary renderer listener and capture-phase migration workaround have been removed.

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

Validation covers repository structure, the six-file application/service documentation baseline, public-source safety, JavaScript syntax, security invariants, dashboard health surfaces, timeout protection, refresh-guard integrity, fail-closed API contracts, deterministic GitHub aggregation, operational health/readiness, native four-state appearance-controller behavior, cache policy, data health, the current GLAZE UI V1.1 source-migration contract, repository product records, governance evidence boundaries, and local Platform Contract source invariants. GitHub Actions additionally runs the pinned central Platform Contract v0.2 validator and evaluator against the exact dashboard revision.

Deterministic representative GitHub fixtures exercise the complete dashboard aggregation path without live credentials. They verify private-repository normalization and owner filtering, complete coverage, Actions permission denial, the distinction between confirmed optional `404` absence and unavailable permission-denied evidence, fail-soft rate-limit loss, and sanitized core GitHub failures. Fixture validation strengthens source confidence but does not replace live private-repository validation, rendered form-factor acceptance, or deployment acceptance.

## Product records

- [SPECIFICATIONS.md](SPECIFICATIONS.md) — version-coupled product specification and acceptance boundary.
- [COMPETITIVE-OBJECTIVES.md](COMPETITIVE-OBJECTIVES.md) — benchmark goals and deliberate product differences.
- [FEATURES.md](FEATURES.md) — current, partial, acceptance-gated, and unapproved functionality.
- [BENEFITS.md](BENEFITS.md) — benefits supported by current Development source and benefits not yet claimed.
- [BRANDING.md](BRANDING.md) — current canonical identity boundary.
- [docs/GOVERNANCE_CONTROL_PLANE.md](docs/GOVERNANCE_CONTROL_PLANE.md) — governance evidence model and interpretation boundaries.
- [docs/PUBLIC_SOURCE_BOUNDARY.md](docs/PUBLIC_SOURCE_BOUNDARY.md) — public/open-source source contract and private authenticated deployment boundary.
- [goreecloud.platform.yaml](goreecloud.platform.yaml) — machine-readable Platform Contract v0.2 declaration.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The source repository may remain public; do not expose the operational dashboard or its private-repository API data until the authenticated private-access boundary is configured and verified.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the read-only aggregation model, partial-data behavior, request timeout strategy, manual-refresh discipline, deterministic GitHub fixture validation, rate-limit strategy, ranking model, repository-attention model, changelog behavior, and security boundaries.

## License

MIT. See [LICENSE](LICENSE).
