# Mandatory Native and Platform Conformance

GoreeCloud GitHub Dashboard is original GoreeCloud-owned software and remains in the **Development** lifecycle. Stable eligibility requires substantive, evidence-backed evaluation of all seven GoreeCloud Platform Systems; labels, badges, or UI copy do not constitute integration.

## Current conformance state

| Platform System | Current state | Evidence / boundary |
| --- | --- | --- |
| GoreeCloud Manager | Planned / not integrated | The dashboard is a separate operational product. A future Manager link or summary may be appropriate, but no Manager capability is currently consumed or exposed. |
| Privacy Shield | Partial source-level controls; platform integration pending | Private API responses are `private, no-store`; browser output is normalized and minimizes unavailable-repository identity detail. No canonical Privacy Shield policy/service integration has been accepted. |
| Wardveil Security | Partial source-level controls; platform integration pending | Fail-closed deployment interlock, server-side credential boundary, security headers, sanitized errors, timeouts, and read-only routes exist. These controls do not establish Wardveil integration or security acceptance. |
| Everkeep | Partial continuity documentation; platform integration pending | Git preserves source history and deployment/rollback documentation exists. No Everkeep-managed backup/restore or recovery acceptance is established for deployment configuration or operational state. |
| Glaze UI | Migration in progress | Source mapping now targets current Stable GLAZE UI V1.1 / 1.1.0. Application-specific rendered/accessibility/form-factor acceptance remains pending; see `docs/GLAZE_UI_CONFORMANCE.md`. |
| GoreeCloud Mesh | Not integrated | The dashboard currently calls GitHub directly from its server-side aggregation boundary. No Mesh registration, capability, dependency, event, or evidence transport is implemented. |
| GoreeCloud Identity | Not integrated | Production is intended to sit behind authenticated private access, but no GoreeCloud Identity authentication, authorization, session, role, or delegated-authority contract is implemented or accepted. |

## Release boundary

The dashboard must remain Development and nonconformant while required platform integrations or evidence remain incomplete. In particular, source-level security/privacy controls must not be described as Wardveil or Privacy Shield acceptance, an external access gate must not be described as GoreeCloud Identity integration, and source UI changes must not be described as Glaze UI acceptance without exact-revision rendered evidence.

## Native application boundary

Small technically necessary foundational dependencies may be used when independent reimplementation would reduce correctness, security, standards compliance, interoperability, or maintainability. They must not become the product shell or define GoreeCloud GitHub Dashboard identity.

Repository CI, release records, project specifications, and changelogs should progressively enforce and record this conformance boundary as integrations are actually implemented and validated.
