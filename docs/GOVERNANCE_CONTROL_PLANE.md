# Governance Control Plane

## Status

- Product: GoreeCloud GitHub Dashboard
- Lifecycle: Development
- Surface: `/governance.html`
- API: `/api/governance`
- Mode: read-only
- Observation model: baseline-file presence plus classic default-branch protection
- Production acceptance: not established

## Purpose

The governance control-plane view provides a compact, live observation of baseline repository governance files and classic GitHub branch-protection state across repositories accessible to the configured GoreeCloud GitHub credential.

The current Development slice observes exact default-branch presence for:

- `goreecloud.platform.yaml`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`

It also observes whether the repository's **default branch** is matched by a classic GitHub `BranchProtectionRule`, together with selected normalized controls from matching rules:

- approving-review requirement and required review count;
- code-owner review requirement;
- required status-check contexts;
- strict/up-to-date status-check behavior;
- signed-commit requirement;
- conversation-resolution requirement;
- last-push approval requirement;
- linear-history requirement;
- force-push and deletion allowances; and
- administrator enforcement state.

This is an observation surface, not a compliance engine. File presence and branch-protection settings do not establish policy correctness, Platform Contract applicability, lifecycle eligibility, security acceptance, or Stable qualification. File absence or an observed lack of a matching classic branch-protection rule does not automatically establish a policy violation because repository role/type and applicability can differ.

## Retrieval model

The server first uses the existing bounded owned-repository enumeration. Governance evidence is then queried through the GitHub GraphQL API in batches of at most 20 repositories by default, with a hard internal maximum of 25.

### Baseline files

Each file-presence query binds the observed paths to the repository's reported default branch. The four file observations for a repository are carried in the same GraphQL repository selection so the feature does not multiply into four REST content requests per repository.

### Classic branch protection

Classic branch-protection observation is a **separate GraphQL evidence channel** from baseline-file presence. Separating the channels means a permission or schema failure affecting branch-protection data does not erase valid file evidence.

For each repository, the dashboard requests up to 100 classic branch-protection rules. For each returned rule, GitHub's own `matchingRefs` connection is filtered using the reported default-branch name. The dashboard then requires an exact ref-name match before treating the rule as covering that default branch. This avoids reimplementing GitHub's branch-pattern matching rules in dashboard code.

The matching-ref query is bounded. If pagination indicates that more branch-protection rules or more filtered matching refs exist and no exact default-branch match has been observed yet, the dashboard marks classic-protection evidence **unavailable** rather than claiming that no rule exists.

Batch requests use the existing bounded GitHub request timeout and server-side credential boundary.

## Fail-soft and fail-closed behavior

A successful baseline-file GraphQL selection may report a file as present or absent.

A successful classic-protection selection may report:

- `matching rule` — at least one classic `BranchProtectionRule` is confirmed to match the exact default branch;
- `no matching rule` — the bounded classic-rule observation completed and no classic rule matched the default branch; or
- `unavailable` — permission, GraphQL, node, or pagination evidence is insufficient for a safe conclusion.

A failed GraphQL batch, a GraphQL response containing errors, or a missing repository node is treated as unavailable evidence for that evidence channel. Unavailable evidence is never converted into a missing-file or no-protection claim.

Baseline-file rows continue to distinguish:

- `observed` — all four currently observed files are present;
- `gaps` — file observation succeeded and one or more currently observed files are absent; and
- `unavailable` — baseline-file evidence could not be safely classified.

Overall control-plane coverage combines the file and classic-protection evidence channels:

- `complete` — both channels are complete for the current bounded observation;
- `partial` — at least one channel has usable evidence and at least one channel has unavailable evidence; and
- `unavailable` — neither channel can safely classify the current portfolio observation.

The words `observed`, `matching rule`, and `no matching rule` deliberately do not mean conformant or nonconformant.

## Rulesets boundary

This slice observes **classic GitHub branch-protection rules only**. GitHub repository/organization rulesets are not yet included in the classification.

Therefore, `no matching rule` means only that no matching classic `BranchProtectionRule` was observed through the completed bounded query. It must not be interpreted as proof that the default branch has no GitHub protection of any kind.

Ruleset observation is a separate planned capability so the dashboard can preserve a truthful distinction between classic branch protection and newer ruleset-based enforcement.

## Privacy and authorization boundary

`/api/governance` uses the same deployment boundary as `/api/dashboard`:

1. `GITHUB_TOKEN` must exist server-side.
2. `ACCESS_GATE_CONFIRMED=true` must be set only after an authenticated private-access layer has been configured and verified.
3. Browser responses remain `private, no-store, max-age=0`.
4. The GitHub token is never returned to the browser.
5. The API is GET-only and exposes no GitHub mutation route.

Because the governance view can expose private repository identities, file-presence facts, branch-protection patterns, and required status-check names, it is not approved for public operational deployment even though the application source repository is public/open source.

## Authority boundary

GitHub remains authoritative for repository state. The applicable GoreeCloud policies, Platform Contract, repository role/type registry, source-control governance, and platform-system evidence remain authoritative for interpretation.

GoreeCloud Manager or GoreeCloud Mesh may later present or aggregate accepted governance state, but this dashboard does not transfer authority to those systems or infer positive conformance from observed GitHub settings.

## Current limitations

The current slice does not yet determine:

- repository role/type;
- whether Platform Contract v0.2 is applicable to a particular repository;
- manifest validity or computed conformance for another repository;
- GitHub ruleset state;
- required workflow enforcement beyond the status-check names exposed by matching classic branch-protection rules;
- dependency or security automation coverage;
- release eligibility;
- documentation completeness beyond the four observed paths;
- current Glaze UI target in other repositories;
- Identity, Mesh, Wardveil Security, Privacy Shield, Everkeep, or Manager integration state in other repositories.

Those are separate control-plane capabilities and must preserve their own producer authority and evidence requirements.

## Acceptance boundary

Automated source tests validate batching, default-branch file expressions, classic branch-protection query construction, exact matching-ref handling, normalized protection controls, incomplete-pagination fail-soft behavior, independent evidence channels, normalized presence/absence, unavailable-evidence handling, API fail-closed behavior, credential non-disclosure, no-store responses, page structure, bootstrap order, and conservative terminology.

These tests do not replace live private-repository validation, GitHub GraphQL permission validation, rendered form-factor review, accessibility acceptance, Cloudflare Pages deployment validation, private-access verification, ruleset observation, or production approval.
