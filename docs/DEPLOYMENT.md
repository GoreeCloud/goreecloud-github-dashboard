# Deployment

## Production status

The foundation is not production-approved. This guide defines the intended private deployment boundary; it does not indicate that a live deployment has already been configured or accepted.

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

Use the minimum read permissions needed by the current feature set. The foundation reads:

- Repository metadata.
- Repository contents for changelog discovery.
- Commit history.
- Issues.
- Pull requests.
- Releases.

Do not grant the dashboard credential repository administration, contents write, issues write, pull-request write, workflow write, secrets, organization administration, or deletion permissions.

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

## Validation before production approval

At minimum, validate:

- `npm test` and `npm run check` pass at the exact release candidate head.
- The deployed site is inaccessible to unauthenticated users.
- The API fails closed if the GitHub token is removed.
- The API fails closed if `ACCESS_GATE_CONFIRMED` is not true.
- Browser developer tools show no GitHub credential or authorization header.
- Private repository data is not cached publicly.
- Security headers are present.
- Mobile 390 x 844, Tablet 820 x 1180, Desktop 1280 x 900, and Wide Desktop 1600 x 1000 task flows are reviewed for the supported foundation targets.
- Keyboard focus, reduced motion, increased contrast, and forced-colors behavior remain usable.
- Empty, GitHub-error, and rate-limit states are understandable and do not leak backend internals.
- Rollback to the prior Pages deployment is available.

TV is not an initial supported target and is not part of the initial acceptance claim.

## Rollback

Source rollback is performed through Git history. Deployment rollback should use the hosting platform's previous known-good deployment. If private access cannot be verified, set `ACCESS_GATE_CONFIRMED=false` or remove it; the API will immediately stop returning GitHub data even if the static shell remains reachable.
