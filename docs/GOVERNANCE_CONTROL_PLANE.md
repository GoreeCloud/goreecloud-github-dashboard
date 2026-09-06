# Governance Control Plane

## Status

- Product: GoreeCloud GitHub Dashboard
- Lifecycle: Development
- Surface: `/governance.html`
- API: `/api/governance`
- Mode: read-only
- Observation model: presence-only
- Production acceptance: not established

## Purpose

The governance control-plane view provides a compact, live observation of baseline repository governance files across the repositories accessible to the configured GoreeCloud GitHub credential.

The current Development slice observes exact default-branch presence for:

- `goreecloud.platform.yaml`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`

This is an observation surface, not a compliance engine. File presence does not establish policy correctness, Platform Contract applicability, lifecycle eligibility, security acceptance, or Stable qualification. File absence does not automatically establish a policy violation because repository role/type and applicability can differ.

## Retrieval model

The server first uses the existing bounded owned-repository enumeration. Governance file presence is then queried through the GitHub GraphQL API in batches of at most 20 repositories by default, with a hard internal maximum of 25.

Each repository query binds the observed file paths to that repository's reported default branch. The four observations for a repository are carried in the same GraphQL repository selection so the feature does not multiply into four REST content requests per repository.

Batch requests use the existing bounded GitHub request timeout and server-side credential boundary.

## Fail-soft and fail-closed behavior

A successful GraphQL repository selection may report a file as present or absent.

A failed GraphQL batch, a GraphQL response containing errors, or a missing repository node is treated as unavailable evidence. Unavailable evidence is not converted into a missing-file claim.

The view therefore distinguishes:

- `observed` — all four currently observed files are present;
- `gaps` — observation succeeded and one or more currently observed files are absent; and
- `unavailable` — the repository could not be safely classified by the current observation request.

The word `observed` deliberately does not mean conformant.

## Privacy and authorization boundary

`/api/governance` uses the same deployment boundary as `/api/dashboard`:

1. `GITHUB_TOKEN` must exist server-side.
2. `ACCESS_GATE_CONFIRMED=true` must be set only after an authenticated private-access layer has been configured and verified.
3. Browser responses remain `private, no-store, max-age=0`.
4. The GitHub token is never returned to the browser.
5. The API is GET-only and exposes no GitHub mutation route.

Because the governance view can expose private repository identities and file-presence facts, it is not approved for public deployment.

## Authority boundary

GitHub remains authoritative for repository state. The applicable GoreeCloud policies, Platform Contract, repository role/type registry, source-control governance, and platform-system evidence remain authoritative for interpretation.

GoreeCloud Manager or GoreeCloud Mesh may later present or aggregate accepted governance state, but this dashboard does not transfer authority to those systems or infer positive conformance from file presence.

## Current limitations

The current slice does not yet determine:

- repository role/type;
- whether Platform Contract v0.2 is applicable to a particular repository;
- manifest validity or computed conformance for another repository;
- branch protection/ruleset state;
- required workflow enforcement;
- dependency or security automation coverage;
- release eligibility;
- documentation completeness beyond the four observed paths;
- current Glaze UI target in other repositories;
- Identity, Mesh, Wardveil Security, Privacy Shield, Everkeep, or Manager integration state in other repositories.

Those are separate control-plane capabilities and must preserve their own producer authority and evidence requirements.

## Acceptance boundary

Automated source tests validate batching, default-branch expressions, normalized presence/absence, unavailable-evidence handling, API fail-closed behavior, credential non-disclosure, no-store responses, page structure, bootstrap order, and conservative terminology.

These tests do not replace live private-repository validation, GitHub GraphQL permission validation, rendered form-factor review, accessibility acceptance, Cloudflare Pages deployment validation, private-access verification, or production approval.
