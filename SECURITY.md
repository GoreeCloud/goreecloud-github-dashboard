# Security Policy

## Scope

GoreeCloud GitHub Dashboard is a private, read-only operational interface. Security issues that could expose private repository metadata, credentials, source, authentication state, deployment configuration, or other GoreeCloud information are treated as high priority.

## Credential rules

- Never commit a GitHub token, personal access token, API key, session value, Cloudflare credential, private key, or other reusable secret.
- Keep `GITHUB_TOKEN` server-side only.
- Use a read-only GitHub credential scoped to the minimum repositories and read permissions needed by the dashboard.
- Do not use an administrative GitHub credential for the dashboard runtime.
- Do not place private credentials in screenshots, examples, test fixtures, issue bodies, pull-request descriptions, or logs.

## Private deployment rule

A deployment that can display private repository metadata must be protected by an authenticated private-access layer. The `ACCESS_GATE_CONFIRMED` environment value is a fail-closed deployment interlock, not an authentication mechanism. It must remain false until the external access control is configured and verified.

## Runtime behavior

The dashboard runtime is intentionally read-only. It must not create, update, merge, close, label, delete, release, dispatch, or administer GitHub resources.

The browser receives normalized dashboard data only. It must never receive the GitHub authorization header or credential.

## Reporting

Do not disclose a suspected vulnerability in a public issue when the report could reveal private GoreeCloud information. Use the repository's private/security reporting path available to authorized GoreeCloud administrators.

## Production boundary

The presence of source code, a successful CI run, or a preview deployment does not by itself approve production use. Private-access validation, secret isolation, rollback, and representative UI/security acceptance remain separate release gates.
