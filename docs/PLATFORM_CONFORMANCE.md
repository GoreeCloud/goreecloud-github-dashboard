# Mandatory Native and Platform Conformance

GoreeCloud GitHub Dashboard is original GoreeCloud-owned software and remains in the **Development** lifecycle. Stable eligibility requires substantive, evidence-backed evaluation of all seven GoreeCloud Platform Systems; labels, badges, manifests, or UI copy do not constitute integration.

## Platform Contract v0.2

The repository declares its machine-readable platform state in root `goreecloud.platform.yaml` using GoreeCloud Platform Contract v0.2. The declaration is intentionally `nonconformant` and must remain fail-closed while required integrations and acceptance evidence are incomplete.

The current validation workflow pins the reviewed central Platform Contract implementation at `GoreeCloud/GoreeCloud` revision `4a0ebf20ffb669e3d5680ab6c8d34583f1712966`. It checks out the dashboard's exact pull-request head SHA before validating the manifest and computing the conformance result. This repository-local exact-head wrapper is used while the currently published reusable central workflow still has a known pull-request revision-attribution limitation. Moving back to the central reusable workflow requires a reviewed central revision that preserves exact caller-head provenance.

A passing structural manifest or computed Development result does not establish production acceptance or Stable eligibility.

## Current conformance state

| Platform System | Current state | Evidence / boundary |
| --- | --- | --- |
| GoreeCloud Manager | Applicable — Blocked | The dashboard is a separate operational product. A future Manager link or summary may be appropriate, but no Manager capability is currently consumed or exposed. |
| Privacy Shield | Applicable — Blocked | Private API responses are `private, no-store`; browser output is normalized and minimizes unavailable-repository identity detail. No canonical Privacy Shield policy/service integration has been accepted. |
| Wardveil Security | Applicable — Blocked | Fail-closed deployment interlock, server-side credential boundary, security headers, sanitized errors, timeouts, and read-only routes exist. These controls do not establish Wardveil integration or security acceptance. |
| Everkeep | Applicable — Blocked | Git preserves source history and deployment/rollback documentation exists. No Everkeep-managed backup/restore or recovery acceptance is established for deployment configuration or operational state. |
| Glaze UI | Applicable — Nonconformant | Source mapping targets current Stable GLAZE UI V1.1 / 1.1.0. Application-specific rendered/accessibility/form-factor acceptance remains pending; see `docs/GLAZE_UI_CONFORMANCE.md`. |
| GoreeCloud Mesh | Applicable — Blocked | The dashboard currently calls GitHub directly from its server-side aggregation boundary. No Mesh registration, capability, dependency, event, or evidence transport is implemented. |
| GoreeCloud Identity | Applicable — Blocked | Production is intended to sit behind authenticated private access, but no GoreeCloud Identity authentication, authorization, session, role, or delegated-authority contract is implemented or accepted. |

## Continuity boundary

The dashboard owns no durable user repository dataset; GitHub remains authoritative for repository data. Stable acceptance still requires recoverable deployment/configuration state, validated clean reconstruction and rollback, and Everkeep-compatible recovery evidence where applicable. Secrets remain outside source control and require separately governed secure recovery.

## Release boundary

The dashboard must remain Development and nonconformant while required platform integrations or evidence remain incomplete. In particular, source-level security/privacy controls must not be described as Wardveil or Privacy Shield acceptance, an external access gate must not be described as GoreeCloud Identity integration, and source UI changes must not be described as Glaze UI acceptance without exact-revision rendered evidence.

## Native application boundary

Small technically necessary foundational dependencies may be used when independent reimplementation would reduce correctness, security, standards compliance, interoperability, or maintainability. They must not become the product shell or define GoreeCloud GitHub Dashboard identity.

Repository CI, release records, project specifications, and changelogs should progressively enforce and record this conformance boundary as integrations are actually implemented and validated.
