# Cache Policy

## Current decision

GoreeCloud GitHub Dashboard does not cache authenticated dashboard API responses in the current Development lifecycle.

The dashboard aggregates private and public GitHub repository information behind an authenticated private-access boundary. Until the deployed authentication layer provides a verified, stable identity signal that can safely partition cached responses, the API must return `Cache-Control: private, no-store, max-age=0` and must not use shared edge-cache primitives.

This is an intentional privacy decision, not an implementation omission.

## Why shared caching is deferred

A shared cache can improve GitHub API efficiency, but an incorrectly keyed cache can replay one authenticated user's private repository data to another request. The current source does not yet have production-validated authenticated identity metadata, so it cannot prove that a shared cache key would be isolated correctly.

The browser-side manual-refresh cooldown reduces accidental repeated fan-out, but it is not a cache, rate limiter, authentication mechanism, or authorization boundary.

## Required current behavior

While caching remains deferred:

- Every dashboard API response uses private, no-store semantics.
- The private dashboard function does not call `caches.default` or another shared edge cache.
- No ETag or shared-cache freshness contract is presented as an authenticated data-isolation guarantee.
- GitHub request fan-out remains bounded through pagination limits, selective detail reads, timeouts, and bounded repository probes.
- The application continues to surface `generatedAt`, data coverage, API-budget visibility, and refresh cooldown state without implying cached freshness.

## Preconditions before cache implementation

A future short-lived server-side or edge cache may be evaluated only after all of the following are true:

1. The authenticated private-access layer is deployed and independently verified.
2. A stable identity or authorization partition is available to the server-side function without exposing reusable credentials to the browser.
3. The cache key includes every authorization dimension required to prevent cross-user or cross-scope replay.
4. Cache entries are short-lived and have an explicit maximum age.
5. Manual refresh has a defined and testable relationship to cache revalidation or bypass.
6. The browser presents truthful freshness information rather than implying every view is live.
7. Private/no-store failure responses remain uncached.
8. Automated tests cover isolation, expiration, stale behavior, refresh behavior, partial GitHub failures, and rate-limit behavior.
9. Production acceptance includes live authenticated verification that private repository data cannot cross an authorization boundary.
10. Rollback can disable caching without changing the private-data access model.

## Evaluation outcome

For the current Development source, the safe outcome is **defer shared caching**. The expected performance benefit does not justify introducing an unverified private-data cache partition before authenticated deployment evidence exists.

This decision can be revisited after the private-access and live-data acceptance gates are complete. Any future cache implementation must remain read-only, privacy-preserving, bounded, reversible, and subordinate to GitHub as the authoritative repository-state source.
