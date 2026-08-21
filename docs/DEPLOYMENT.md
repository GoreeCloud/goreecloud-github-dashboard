# Deployment

## Production status

The project remains in the GoreeCloud **Development** lifecycle. Source validation is green for the current development work, but production deployment and acceptance are not approved. This guide defines the intended private deployment boundary; it does not indicate that a live deployment has already been configured or accepted.

## Required architecture

Because the dashboard may expose private repository metadata, the deployed application must be protected by an authenticated private-access layer before the data API is unlocked.

Recommended path:

```text
User -> Cloudflare Access -> Cloudflare Pages -> Pages Function -> GitHub API
```

Do not deploy a public static site that calls GitHub directly with a private token. Do not place a GitHub token in browser JavaScript, HTML, a checked-in environment file, Pages build output, or client-visible runtime configuration.

## Environment values

Configure the following in the server-side Pages/Workers environment:

- `GITHUB_OWNER=GoreeCloud`
- `GITHUB_TOKEN` — secret, read-only, repository-scoped as narrowly as practical.
- `ACCESS_GATE_CONFIRMED=true` — set only after the private-access layer is configured and verified.

For local work, store real secrets in `.dev.vars`; the repository ignores that file.

## GitHub credential permissions

Use the minimum read permissions needed by the current feature set. The dashboard reads:

- Repository metadata.
- Repository contents for changelog discovery.
- Commit history.
- Issues.
- Pull requests.
- Releases.
- GitHub Actions workflow runs, when the credential is permitted to read them.
- Authenticated rate-limit metadata.

GitHub Actions read access is optional but recommended for the CI Health surface. If Actions data cannot be read, the dashboard must remain usable and explicitly report partial coverage.

Do not grant the dashboard credential repository administration, contents write, issues write, pull-request write, workflow write, secrets, organization administration, or deletion permissions.

## Request timeout behavior

Every outbound GitHub request is protected by an AbortController-backed timeout. The current default is 8 seconds per request. The internal timeout value is clamped to a bounded range so future specialized calls or tests cannot accidentally create an unbounded request.

During deployment validation, verify both timeout paths:

- A core request timeout must produce a sanitized dashboard refresh error and must not leak the credential or raw authorization header.
- A repository-specific optional request timeout must preserve successful peer data and switch the dashboard to partial coverage rather than failing the complete page.

No production environment setting is required for the current timeout because the default is source-controlled and validated. A future configuration option should be added only if a demonstrated operational need justifies it.

## Access-gate sequence

1. Create the Pages project from this repository or another approved GoreeCloud deployment path.
2. Leave `ACCESS_GATE_CONFIRMED` unset or false.
3. Deploy and verify that `/api/dashboard` fails closed with the private-access-gate message.
4. Configure the authenticated private-access layer for the dashboard hostname.
5. Verify an unauthenticated request cannot reach the application data surface.
6. Verify an authorized user can reach the static application.
7. Add the read-only `GITHUB_TOKEN` as a server-side secret.
8. Set `GITHUB_OWNER`.
9. Only after the access boundary is confirmed, set `ACCESS_GATE_CONFIRMED=true`.
10. Verify the dashboard loads expected private and public repository metadata without exposing the token in browser source, network payloads, logs, or generated assets.
11. Confirm whether workflow visibility is complete or partial with the chosen least-privilege token.
12. Confirm normalized GitHub API budget visibility is present, or that its absence is reported as partial coverage.
13. Confirm an intentionally stalled or unreachable upstream request is bounded by the request timeout rather than hanging the dashboard indefinitely.

## Validation before production approval

At minimum, validate:

- `npm test` and `npm run check` pass at the exact release-candidate head when the project reaches that lifecycle stage.
- The deployed site is inaccessible to unauthenticated users.
- The API fails closed if the GitHub token is removed.
- The API fails closed if `ACCESS_GATE_CONFIRMED` is not true.
- Browser developer tools show no GitHub credential or authorization header.
- Private repository data is not cached publicly.
- Security headers are present.
- Phone 390 x 844, Tablet 820 x 1180, Desktop 1280 x 900, and Wide Desktop 1600 x 1000 representative task flows are reviewed for the supported targets.
- Keyboard focus, reduced motion, increased contrast, and forced-colors behavior remain usable.
- Repository Attention distinguishes critical, review, informational, and coverage-unavailable signals without implying unavailable evidence is a confirmed defect or confirmed absence.
- CI Health correctly shows success/failure/in-progress/no-run states where Actions read access exists.
- Missing Actions read permission degrades to explicit partial coverage rather than a complete dashboard outage.
- GitHub rate-limit metadata is shown when available and absent data is not silently represented as complete.
- Core and repository-specific request timeouts behave according to the documented failure hierarchy.
- Empty, GitHub-error, optional-data, timeout, and rate-limit states are understandable and do not leak backend internals.
- Rollback to the prior Pages deployment is available.

TV is not an initial supported target and is not part of the initial acceptance claim.

## Rollback

Source rollback is performed through Git history. Deployment rollback should use the hosting platform's previous known-good deployment. If private access cannot be verified, set `ACCESS_GATE_CONFIRMED=false` or remove it; the API will immediately stop returning GitHub data even if the static shell remains reachable.
