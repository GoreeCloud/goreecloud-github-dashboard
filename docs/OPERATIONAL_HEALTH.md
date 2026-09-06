# Operational Health and Readiness

GoreeCloud GitHub Dashboard exposes two deliberately small operational interfaces for platform orchestration and deployment checks.

## `/api/health`

Purpose: process-level liveness only.

A successful response means the Pages Function route is executing and can return a normalized JSON response. It does **not** claim that GitHub is reachable, that the private-access layer is correctly deployed, that the GitHub credential is valid, or that the application has passed production acceptance.

The response contains only safe service metadata: service identifier, source version, Development lifecycle, read-only mode, and `scope: process`.

## `/api/ready`

Purpose: configuration readiness for the private dashboard data boundary.

Readiness returns HTTP `200` only when both conditions required before the dashboard may attempt private GitHub aggregation are configured:

- A non-empty server-side `GITHUB_TOKEN` exists.
- `ACCESS_GATE_CONFIRMED=true` is set after the external authenticated private-access layer has been verified.

Otherwise it returns HTTP `503` with the generic code `deployment_not_ready`.

The endpoint deliberately does not identify which prerequisite is absent, does not return credential material, and does not call GitHub. A `ready` response therefore means **configuration-ready**, not upstream-ready, authenticated-user-ready, production-ready, or Stable.

## Security and cache boundary

Both endpoints are read-only, reject non-GET methods, return JSON with `X-Content-Type-Options: nosniff`, and use `Cache-Control: private, no-store, max-age=0`.

The readiness route does not replace Cloudflare Access or another authenticated private-access layer. `ACCESS_GATE_CONFIRMED` remains a deployment interlock rather than an authentication mechanism.

## Acceptance boundary

These interfaces satisfy the source-level health/readiness declaration in `goreecloud.platform.yaml`. They do not establish live deployment evidence until the exact deployed revision is exercised in the intended environment and its behavior is recorded through the applicable production-readiness process.
