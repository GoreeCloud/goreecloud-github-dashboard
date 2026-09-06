# Competitive Objectives

GoreeCloud GitHub Dashboard is not intended to replace GitHub as the source of truth. It is a private, read-only operational layer optimized for the GoreeCloud repository portfolio.

## Benchmarks

The dashboard uses GitHub's native repository, organization, search, Actions, pull-request, issue, and release experiences as functional benchmarks. It may also learn from cross-repository operational dashboards that summarize engineering work, but it must remain original GoreeCloud software rather than reproducing another product's interface or architecture.

## Match

The dashboard should make routine repository operations at least as understandable as visiting individual GitHub surfaces for:

- Repository inventory and visibility.
- Recent activity.
- Open pull requests and issues.
- Latest releases.
- Repository-local changelog discovery.
- Best-effort workflow status.
- Direct links back to authoritative GitHub records.

## Exceed for the GoreeCloud portfolio

The product should provide value that the ordinary single-repository view does not provide efficiently:

- Explainable cross-repository activity ranking.
- Portfolio-wide Repository Attention signals.
- Explicit partial-data and unavailable-evidence handling instead of silently dropping failed probes.
- API-budget visibility and bounded upstream fan-out.
- Privacy-minimized normalized responses for a private operational dashboard.
- One searchable directory spanning the accessible GoreeCloud repository portfolio.
- Clear separation between confirmed absence and unavailable evidence for optional data such as changelogs or workflow runs.

## Intentionally different

The dashboard deliberately rejects several directions unless separately governed later:

- It does not become a second repository-state authority.
- It does not implement GitHub mutations in the current product scope.
- It does not request broad administrative credentials for convenience.
- It does not reproduce every GitHub feature or page.
- It does not treat stars or historical popularity as the primary operational ranking signal.
- It does not hide upstream permission or availability failures behind falsely complete data.
- It does not introduce shared caching of private repository data without verified authorization-aware isolation.

## Success criteria

The dashboard succeeds when it reduces the effort required to understand current GoreeCloud repository activity while preserving GitHub authority, least privilege, private-data boundaries, explainable evidence state, and a purpose-built GoreeCloud user experience.
