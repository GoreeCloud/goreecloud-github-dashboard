# GoreeCloud GitHub Dashboard — Specifications

## Status

- Product: GoreeCloud GitHub Dashboard
- Repository: `GoreeCloud/goreecloud-github-dashboard`
- Source version: `0.3.0-dev`
- Lifecycle: Development
- Development model: original GoreeCloud-owned application
- Repository visibility: public / open source
- Operational deployment: private and authenticated when non-public repository data is available
- GitHub integration mode: read-only
- Production approval: not established
- License: MIT

This repository-local specification is version-coupled to the Development source. GitHub remains authoritative for source state and repository history. GoreeCloud governance records remain authoritative for portfolio policy and lifecycle decisions.

## Purpose

GoreeCloud GitHub Dashboard is a first-party repository operations and governance-observation application. It consolidates bounded GitHub evidence so GoreeCloud can understand recent changes, repository activity, open work, releases, changelogs, CI state, API-budget health, and selected repository-governance signals without creating a second source of truth.

The dashboard may aggregate, normalize, rank, and present GitHub data. It does not become authoritative for commits, pull requests, issues, releases, branch rules, rulesets, workflows, repository settings, or source history.

## Architecture

The intended private operational path is:

```text
Authorized user
→ authenticated private-access layer
→ Cloudflare Pages
→ Cloudflare Pages Functions
→ GitHub API
```

Static browser assets contain no reusable GitHub credential. `GITHUB_TOKEN` remains server-side. `ACCESS_GATE_CONFIRMED=true` is a deployment interlock that may be enabled only after the external authenticated access layer has been configured and verified; it is not authentication itself.

Private dashboard and governance API responses use `private, no-store, max-age=0`.

## Core dashboard capabilities

Development source currently includes:

- recent commit aggregation;
- operational Top 10 repository ranking;
- total, public, and private repository counts;
- searchable repository directory;
- open pull-request and issue summaries;
- repository-local changelog discovery;
- latest release visibility;
- best-effort GitHub Actions state;
- Repository Attention signals;
- explicit partial/unavailable data coverage;
- GitHub core/search API-budget visibility where available;
- bounded GitHub request timeouts;
- manual-refresh cooldown/retry discipline;
- `/api/health` and `/api/ready`;
- responsive Phone, Tablet, Desktop, and Wide Desktop compositions; and
- a dedicated read-only repository governance observation view.

## Governance observation contract

`GET /api/governance` and `/governance.html` are observational surfaces. They do not mutate GitHub.

Current evidence channels are:

1. **Baseline files** — exact default-branch presence for:
   - `goreecloud.platform.yaml`
   - `SECURITY.md`
   - `CONTRIBUTING.md`
   - `.github/CODEOWNERS`
2. **Policy-defined documentation evidence** — exact default-branch presence for:
   - `README.md`
   - `SPECIFICATIONS.md`
   - `FEATURES.md`
   - `BENEFITS.md`
   - `COMPETITIVE-OBJECTIVES.md`
   - `BRANDING.md`
3. **Classic branch protection** — matching classic default-branch rules observed through GitHub GraphQL.
4. **Active rulesets** — active repository- and organization-level rules returned for the exact default branch.
5. **Required-workflow references** — bounded references normalized from active ruleset `workflows` rules.

Documentation presence is observed across accessible owned repositories because a repository role/type registry is not yet authoritative in this application. The six documentation files are policy-defined for GoreeCloud applications and services, but this dashboard does not infer that every observed repository is an application or service. Absence is therefore evidence, not a policy-failure classification.

Likewise, a matching classic rule, active ruleset rule, or required-workflow reference does not establish that the repository satisfies GoreeCloud policy.

Unavailable upstream evidence is kept unavailable; it is not converted into false absence.

## GitHub access discipline

The runtime credential must use the narrowest practical read permissions for enabled features. The dashboard defines no repository, issue, pull-request, release, workflow, branch-protection, ruleset, or settings mutation route.

Repository enumeration and repository-specific reads are bounded. Ruleset reads are independently fail-soft. A failed optional channel must not erase successful evidence from other channels.

## Privacy and public-source boundary

This public repository must not contain:

- reusable credentials or tokens;
- private keys;
- private deployment secrets;
- non-public GoreeCloud repository inventories exported from a live deployment;
- authenticated API payload captures containing restricted repository data; or
- browser-side GitHub authorization logic.

The operational deployment is private whenever it can expose non-public GoreeCloud repository information.

## User interface and accessibility

The current verified Glaze UI source target in the canonical `GoreeCloud/goreecloud-glaze-ui` repository is **GLAZE UI V1.1 / 1.1.0**. This application therefore keeps its source target at `1.1.0` until a later Stable Glaze release is verified in source and adopted through an application-specific migration.

Rendered acceptance remains pending. Source-level requirements include:

- System, Light, Dark, and Deep Dark appearances;
- durable readable surfaces that do not depend on blur;
- bounded Glaze use for interaction/navigation chrome;
- 48 px touch target floor where applicable;
- visible keyboard focus;
- Reduced Motion;
- Reduced Transparency;
- Increased Contrast;
- Forced Colors resilience;
- 200% text/reflow readiness; and
- purpose-built Phone, Tablet, Desktop, and Wide Desktop layouts.

TV is not part of the initial supported scope.

## Platform contract

The root `goreecloud.platform.yaml` adopts GoreeCloud Platform Contract v0.2. The project remains `development` and deliberately `nonconformant` while required platform-system integrations and acceptance evidence are incomplete.

All seven GoreeCloud Platform Systems remain independently governed:

- GoreeCloud Manager
- Privacy Shield
- Wardveil Security
- Everkeep
- Glaze UI
- GoreeCloud Mesh
- GoreeCloud Identity

Source-level controls must not be presented as accepted platform-system integration without the required evidence.

## Validation

Repository validation includes unit and contract tests, deterministic GitHub fixtures, public-source safety checks, product/conformance checks, JavaScript syntax validation, and exact-head Platform Contract validation in GitHub Actions.

Passing CI proves only the checks executed on that exact source revision. It does not establish rendered acceptance, authenticated deployment acceptance, production approval, or Stable qualification.

## Current acceptance gates

Open gates include:

- repository role/type registry and applicability rules;
- representative live GitHub REST/GraphQL validation with the intended least-privilege credential;
- security/dependency automation observation and interpretation;
- rendered Phone, Tablet, Desktop, and Wide Desktop review;
- accessibility/resilience acceptance;
- unique canonical product identity;
- authenticated private-access deployment verification;
- Cloudflare Pages runtime validation;
- monitoring and independent outage visibility;
- rollback/recovery verification;
- accepted Platform System integrations; and
- explicit production approval.

## Non-goals

The dashboard is not:

- a replacement for GitHub;
- a general GitHub administration console;
- a source-control mutation service;
- a secrets store;
- a replacement for GoreeCloud Manager or GoreeCloud Mesh;
- a policy authority; or
- a mechanism for promoting itself to Stable from observational evidence.
