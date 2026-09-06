# Public Source / Private Deployment Boundary

## Decision

`GoreeCloud/goreecloud-github-dashboard` is intentionally a **public, open-source repository**.

The operational GoreeCloud GitHub Dashboard is intentionally a **private, authenticated deployment** whenever it can expose non-public GoreeCloud repository information.

These are separate security boundaries. Public source visibility is expected and is not, by itself, a deployment-security defect.

## Public repository contract

The public repository may contain:

- Application source code.
- Static browser assets.
- Cloudflare Pages Function source.
- Tests and deterministic synthetic fixtures.
- Architecture, deployment, security, product, and conformance documentation.
- Non-secret example configuration.
- Open-source licensing and contribution records.

The public repository must not contain:

- Reusable GitHub credentials or authorization headers.
- Cloudflare API credentials or private deployment secrets.
- Private keys, signing keys, service-account credentials, or credential bundles.
- Production `.env`, `.dev.vars`, or equivalent secret-bearing configuration.
- Exported dashboard/API payloads containing non-public GoreeCloud repository information.
- Browser assets that directly authenticate to GitHub.
- Private deployment configuration that would weaken or bypass the authenticated access boundary.

Synthetic fixtures must remain synthetic and must not be copied from private GitHub responses.

## Private deployment contract

Before private repository data is enabled, the deployed application must remain behind an authenticated private-access layer.

The current fail-closed sequence remains:

1. Deploy source with `ACCESS_GATE_CONFIRMED` unset or false.
2. Configure and verify the authenticated private-access layer.
3. Provision the least-privilege read-only `GITHUB_TOKEN` in server-side secret storage.
4. Set `ACCESS_GATE_CONFIRMED=true` only after the authenticated boundary is verified.
5. Validate that unauthenticated users cannot reach private dashboard or governance data.

`ACCESS_GATE_CONFIRMED` is a deployment interlock, not an authentication mechanism.

## Browser boundary

Files under `public/` are considered publicly retrievable application assets. They must never contain:

- `GITHUB_TOKEN` values.
- Authorization credentials.
- Direct authenticated GitHub API calls.
- Exported private repository datasets.

The browser may call the dashboard's own protected server-side APIs. GitHub authentication remains inside the Pages Function boundary.

## API response boundary

Dashboard and governance data APIs remain read-only and use:

`Cache-Control: private, no-store, max-age=0`

This prevents shared caching from becoming an accidental disclosure channel while authorization-aware cache isolation is unverified.

Sanitized failures must not expose credentials, raw authorization headers, or unnecessary upstream response bodies.

## Automated enforcement

`scripts/validate-public-source.mjs` enforces a repository-local public-source safety contract. It supplements the existing repository validator by checking:

- Forbidden secret-bearing files are absent.
- Public static assets do not include credential markers or direct GitHub API authentication logic.
- Common reusable credential and private-key signatures are absent from committed text files.
- `.env.example` keeps the GitHub token blank and the access gate disabled.
- `.gitignore` protects local secret files.
- Private dashboard/governance APIs retain the access interlock and private no-store response policy.
- Public-source/private-deployment documentation remains explicit.

This validation reduces accidental disclosure risk but does not replace GitHub secret scanning, code review, deployment authentication, least-privilege credential review, or production security testing.

## Package publishing note

`package.json` retains `"private": true` intentionally. In npm metadata, that flag blocks accidental package publication; it does **not** mean the GitHub source repository is private.

## Acceptance boundary

A passing public-source validation means the checked revision satisfies these repository-local source-safety invariants. It does not establish production authentication, authorization, platform-system acceptance, Glaze UI acceptance, or Stable lifecycle eligibility.
