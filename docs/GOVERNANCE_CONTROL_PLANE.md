# Governance Control Plane

## Status

- Product: GoreeCloud GitHub Dashboard
- Lifecycle: Development
- Surface: `/governance.html`
- API: `/api/governance`
- Mode: read-only
- Observation model: baseline files + policy-defined documentation evidence + Platform Contract component-type applicability evidence + classic branch protection + active ruleset rules + required-workflow references
- Production acceptance: not established

## Purpose

The governance control-plane view provides a compact observation of repository-governance evidence across repositories accessible to the configured GoreeCloud GitHub credential.

The current Development slice observes four independent source channels:

1. exact default-branch presence of four baseline files, including `goreecloud.platform.yaml`;
2. exact default-branch presence of six policy-defined application/service documentation paths, with bounded application/service applicability evidence when the Platform Contract explicitly declares `component.type`;
3. classic GitHub branch-protection rules that GitHub reports as matching the exact default branch; and
4. active GitHub ruleset rules that GitHub reports as applying to the exact default branch, including bounded required-workflow references when an active workflow rule is returned.

This remains an observation surface, not a compliance engine. Presence, absence, a declared component type, matching rules, returned ruleset rules, or required-workflow references do not by themselves establish policy correctness, manifest validity, release eligibility, platform conformance, security acceptance, or Stable qualification.

## Baseline-file observation

The baseline default-branch paths are:

- `goreecloud.platform.yaml`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`

File presence uses the GitHub GraphQL API in batches of at most 20 repositories by default, with a hard internal maximum of 25. Each path is bound to the repository's reported default branch.

A successful observation can report a file as present or absent. A failed GraphQL batch, GraphQL error, or missing repository node remains unavailable evidence and is not converted into a missing-file claim.

## Documentation evidence and applicability observation

The current Repository Control policy defines these six root Markdown records as mandatory for GoreeCloud application and service repositories:

- `README.md`
- `SPECIFICATIONS.md`
- `FEATURES.md`
- `BENEFITS.md`
- `COMPETITIVE-OBJECTIVES.md`
- `BRANDING.md`

The dashboard observes those paths on the exact default branch using the same GraphQL repository batch as the four baseline paths. This adds no GitHub endpoint, permission, or repository fan-out.

The evidence is deliberately normalized into its own `documentation` channel. It does not alter the historical four-file baseline result.

GoreeCloud Platform Contract v0.2 defines `component.type` as either `application` or `service`. The existing GraphQL file observation therefore also requests bounded text and byte-size metadata for the already-probed `goreecloud.platform.yaml` blob. The dashboard recognizes documentation applicability only when the exact default-branch manifest contains an explicit `component.type: application` or `component.type: service` declaration inside the `component` mapping.

This is declaration evidence, not full manifest validation. The dashboard does **not** infer repository role from repository names, descriptions, visibility, topics, or neighboring projects. It also does not classify role when:

- the Platform Contract is absent;
- the file observation is unavailable;
- the blob text is unavailable;
- the blob exceeds the 32 KiB interpretation bound;
- the component declaration is malformed or outside the expected mapping; or
- the component type is not one of the two v0.2 values.

Those cases remain `unclassified`. Raw Platform Contract text is used only server-side for this bounded declaration read and is not returned to the browser.

Portfolio documentation summaries expose the applicability model `platform-contract-component-type-declaration`, counts for classified and unclassified repositories, application/service counts, and raw six-path presence evidence. Per-repository documentation evidence exposes the normalized applicability status and declared component type when safely available.

`Docs complete` means only that all six paths were present for the observed repository. `Docs gaps` means only that at least one path was absent from the successfully observed default branch. For an explicitly classified application/service repository, the declaration establishes that the six-path policy category is applicable; it still does **not** establish compliance, release eligibility, or Stable qualification. For an unclassified repository, presence/absence remains evidence without a policy-applicability conclusion.

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

Rulesets are another evidence channel and are intentionally independent from classic branch protection.

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

Baseline/documentation file observation, classic protection, and rulesets are intentionally independent channels. Baseline and documentation evidence share one GitHub GraphQL request channel, but they are normalized separately after a successful response.

Failure of one upstream channel does not erase successful evidence from the others. The aggregate page status is:

- `complete` only when all active channels are complete;
- `unavailable` only when all active channels are unavailable; and
- `partial` for mixed known/unknown coverage.

Required-workflow references are derived from the active-ruleset channel and inherit its availability. If active-ruleset evidence is unavailable, the dashboard does not infer that required workflow rules are absent.

Per-channel unavailable evidence is never converted into absence.

## Interpretation boundary

The following distinctions are mandatory:

- `Baseline gaps` means only that one or more of the four baseline paths were absent in a successfully observed default branch.
- `Docs gaps` means only that one or more of the six policy-defined application/service documentation paths were absent. An explicit Platform Contract `component.type` may establish application/service applicability, but the label itself is still not a compliance classification.
- `Unclassified` documentation applicability means no safe application/service declaration was normalized from the bounded exact-default-branch Platform Contract evidence.
- `No matching classic rule` means only that the classic-rule observation completed and no classic rule matched the exact default branch.
- `No active rules` means only that the active-rules endpoint returned an empty set for the exact default branch.
- `Workflow rule observed` means only that an active ruleset returned a rule of type `workflows`; it is not a policy-satisfaction result.
- An unavailable observation means the dashboard could not safely classify that evidence channel.
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

The applicability classifier introduces no additional GitHub request. It reads only bounded text already returned inside the existing GraphQL file observation, returns normalized type/reason metadata rather than raw manifest text, and preserves the existing server-side credential boundary.

Because the governance view can expose private repository identities and governance settings, it is not approved for public deployment.

## Authority boundary

GitHub remains authoritative for repository state. The central Platform Contract schema remains authoritative for the permitted v0.2 component-type values. Applicable GoreeCloud policies, canonical project specifications, repository-local validated manifests, source-control governance, and platform-system evidence remain authoritative for interpretation.

The dashboard's component-type parser is deliberately narrower than full Platform Contract validation. A recognized declaration is applicability evidence only; it must not be presented as proof that the complete manifest validates or that computed conformance is positive.

GoreeCloud Manager or GoreeCloud Mesh may later present accepted governance state, but this dashboard does not transfer authority or infer positive conformance from observed source-control settings.

## Current limitations

The current slice still does not determine:

- repository role/type when no bounded readable Platform Contract explicitly declares `application` or `service`;
- full Platform Contract validity or computed conformance for peer repositories;
- whether an unclassified repository is subject to the six-file documentation policy through another governed authority;
- which observed workflow references are required by GoreeCloud policy for a repository role/type;
- whether an observed required workflow reference points to an approved governed workflow revision;
- whether required workflows executed successfully for a particular pull request or push;
- dependency/security automation coverage;
- hosted secret-scanning acceptance;
- release eligibility;
- current Glaze UI target in peer repositories;
- Identity, Mesh, Wardveil Security, Privacy Shield, Everkeep, or Manager integration state in peer repositories; or
- branch/ruleset mutation or enforcement.

## Acceptance boundary

Automated source tests validate bounded batching/concurrency, exact default-branch targeting, baseline and documentation file-presence normalization, bounded Platform Contract blob-text requesting, strict application/service component-type parsing, classified/unclassified applicability counts, unavailable/unreadable declaration handling, classic matching-ref behavior, active-ruleset source/type normalization, bounded required-workflow reference normalization, local repository-id resolution, unavailable-evidence handling, channel independence, credential non-disclosure, no-store responses, page structure, bootstrap order, and conservative terminology.

The exact-head Development validation for this increment passed 93/93 tests in `Validate GitHub dashboard foundation` run #102 / `34035215792`; the independent `Validate GoreeCloud Platform Contract v0.2` run #65 / `34035215793` also passed on the same source revision `0a6d1b4bca6eb8410d5c0e76ef862e15c2d96f3c`.

These tests do not replace representative live private-repository validation, rendered form-factor review, accessibility acceptance, Cloudflare Pages deployment validation, authenticated private-access verification, production monitoring, rollback/recovery validation, or explicit production approval.
