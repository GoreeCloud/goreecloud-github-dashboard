# Governance Control Plane

## Status

- Product: GoreeCloud GitHub Dashboard
- Lifecycle: Development
- Surface: `/governance.html`
- API: `/api/governance`
- Mode: read-only
- Observation model: baseline files + classic branch protection + active ruleset rules + required-workflow references
- Production acceptance: not established

## Purpose

The governance control-plane view provides a compact observation of repository-governance evidence across repositories accessible to the configured GoreeCloud GitHub credential.

The current Development slice observes three independent source channels:

1. exact default-branch presence of four baseline files;
2. classic GitHub branch-protection rules that GitHub reports as matching the exact default branch; and
3. active GitHub ruleset rules that GitHub reports as applying to the exact default branch, including bounded required-workflow references when an active workflow rule is returned.

This remains an observation surface, not a compliance engine. Presence, absence, matching rules, returned ruleset rules, or required-workflow references do not by themselves establish policy correctness, applicability, release eligibility, platform conformance, security acceptance, or Stable qualification.

## Baseline-file observation

The currently observed default-branch paths are:

- `goreecloud.platform.yaml`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`

File presence uses the GitHub GraphQL API in batches of at most 20 repositories by default, with a hard internal maximum of 25. Each path is bound to the repository's reported default branch.

A successful observation can report a file as present or absent. A failed GraphQL batch, GraphQL error, or missing repository node remains unavailable evidence and is not converted into a missing-file claim.

## Classic default-branch protection

Classic branch protection is observed separately through GitHub GraphQL `branchProtectionRules` and `matchingRefs`.

The dashboard asks GitHub which rules match each repository's exact default branch rather than reimplementing GitHub's branch-pattern semantics. Matching classic rules are normalized to bounded control evidence including:

- approving-review requirement and approving-review count;
- code-owner review requirement;
- required status-check contexts;
- strict status checks;
- commit-signature requirement;
- conversation-resolution requirement;
- last-push approval;
- linear-history requirement;
- force-push and deletion allowances; and
- administrator enforcement.

The rule list is bounded to 100 and matching refs to 10 per rule. If GitHub reports additional pages and the exact default-branch match cannot be safely established from the bounded result, the observation remains unavailable rather than becoming a false no-rule result.

## Active ruleset observation

Rulesets are a third evidence channel and are intentionally independent from classic branch protection.

For each repository, the server requests GitHub's `GET /repos/{owner}/{repo}/rules/branches/{branch}` endpoint for the exact default branch. The request is pinned locally to GitHub REST API version `2026-03-10` while the dashboard's general GitHub client remains on its existing default API version.

This endpoint returns active rules that apply to the branch, including applicable repository-level and organization-level rulesets. Rulesets in `evaluate` or `disabled` enforcement states are not part of this active-rule response.

The dashboard normalizes bounded rule identity/source metadata:

- rule type;
- ruleset id;
- ruleset source type; and
- ruleset source.

For active workflow rules, the dashboard additionally normalizes only the workflow reference fields needed for observation. Other raw ruleset parameters remain excluded from the browser contract.

Ruleset reads use a default maximum of six concurrent repository requests, with a hard internal maximum of eight. Each request asks for one page of up to 100 active rules. Because the shared GitHub request helper intentionally exposes response bodies rather than pagination headers, a full 100-rule page is treated as unavailable evidence instead of being silently classified as complete.

## Required-workflow reference observation

GitHub's current rules schema represents required workflow rules with rule type `workflows`. The rule's workflow references can include:

- workflow file `path`;
- defining `repository_id`;
- optional workflow `ref`; and
- optional workflow `sha`.

The dashboard normalizes only those fields. When the defining repository id matches an accessible owned repository already present in the portfolio enumeration, its repository name is resolved locally from that existing evidence. Unknown repository ids remain ids; the dashboard does not invent a name or perform a new lookup.

Required-workflow references are bounded to 20 references per workflow rule and 40 unique references per observed repository. Duplicate references are collapsed by defining repository, path, ref, and sha.

The required-workflow surface uses the wording `Workflow rule observed`. It does **not** claim that:

- the workflow is the GoreeCloud-required workflow for that repository role;
- the workflow file still contains the expected governed implementation;
- the referenced ref or sha is the approved version;
- the workflow has executed successfully on a given change; or
- the repository satisfies GoreeCloud required-workflow policy.

Those are separate policy, source-validation, and runtime-evidence questions.

## Independent fail-soft channels

Baseline files, classic protection, and rulesets are intentionally independent.

Failure of one channel does not erase successful evidence from the others. The aggregate page status is:

- `complete` only when all active channels are complete;
- `unavailable` only when all active channels are unavailable; and
- `partial` for mixed known/unknown coverage.

Required-workflow references are derived from the active-ruleset channel and inherit its availability. If active-ruleset evidence is unavailable, the dashboard does not infer that required workflow rules are absent.

Per-channel unavailable evidence is never converted into absence.

## Interpretation boundary

The following distinctions are mandatory:

- `No matching classic rule` means only that the classic-rule observation completed and no classic rule matched the exact default branch.
- `No active rules` means only that the active-rules endpoint returned an empty set for the exact default branch.
- `Workflow rule observed` means only that an active ruleset returned a rule of type `workflows`; it is not a policy-satisfaction result.
- An unavailable ruleset observation means the dashboard could not safely classify that repository's active ruleset or required-workflow-reference state.
- None of these labels is a repository compliance classification.

Classic rules and active rulesets can coexist. A repository can have no matching classic rule while still receiving protection from active rulesets.

## Privacy and authorization boundary

`/api/governance` uses the same deployment boundary as `/api/dashboard`:

1. `GITHUB_TOKEN` must exist server-side.
2. `ACCESS_GATE_CONFIRMED=true` must be set only after an authenticated private-access layer has been configured and verified.
3. Browser responses remain `private, no-store, max-age=0`.
4. The GitHub token is never returned to the browser.
5. The API is GET-only and exposes no GitHub mutation route.

The active-rules endpoint requires only repository Metadata read permission for supported fine-grained credentials. The dashboard does not request organization ruleset administration access; applicable organization-level rules are observed through the branch-specific repository endpoint.

Because the governance view can expose private repository identities and governance settings, it is not approved for public deployment.

## Authority boundary

GitHub remains authoritative for repository state. Applicable GoreeCloud policies, Platform Contract rules, repository role/type registry, source-control governance, and platform-system evidence remain authoritative for interpretation.

GoreeCloud Manager or GoreeCloud Mesh may later present accepted governance state, but this dashboard does not transfer authority or infer positive conformance from observed source-control settings.

## Current limitations

The current slice still does not determine:

- repository role/type;
- whether Platform Contract v0.2 applies to a particular repository;
- manifest validity or computed conformance for peer repositories;
- which observed workflow references are required by GoreeCloud policy for a repository role/type;
- whether an observed required workflow reference points to an approved governed workflow revision;
- whether required workflows executed successfully for a particular pull request or push;
- dependency/security automation coverage;
- hosted secret-scanning acceptance;
- release eligibility;
- documentation completeness beyond the four observed paths;
- current Glaze UI target in peer repositories;
- Identity, Mesh, Wardveil Security, Privacy Shield, Everkeep, or Manager integration state in peer repositories; or
- branch/ruleset mutation or enforcement.

## Acceptance boundary

Automated source tests validate bounded batching/concurrency, exact default-branch targeting, file-presence normalization, classic matching-ref behavior, active-ruleset source/type normalization, bounded required-workflow reference normalization, local repository-id resolution, unavailable-evidence handling, channel independence, credential non-disclosure, no-store responses, page structure, bootstrap order, and conservative terminology.

These tests do not replace representative live private-repository validation, rendered form-factor review, accessibility acceptance, Cloudflare Pages deployment validation, authenticated private-access verification, production monitoring, rollback/recovery validation, or explicit production approval.
