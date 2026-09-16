# Proposed v0.2 read-only connector plan

**Proposal only. All current adapters remain disabled. No account connections are authorized by this document.**

## Delivery order

1. Validate fixture ingestion using the existing Observation contract. Keep registry baseline immutable and test stale, denied, unknown, unavailable, rate-limited and conflicting observations.
2. Add a separately authorized local collector with an allowlist of project/resource pairs, timeouts, cancellation and bounded schedules. No arbitrary URL or arbitrary path input. Keep network privileges and credentials outside the browser. Select a local credential mechanism with the owner; do not discover or import existing `.env` files.
3. Add sanitized Mac status with explicit paths only, then one approved GitHub repository and one approved Vercel project. Compare with owner-supplied evidence before expanding coverage.
4. Add controlled HTTP probes after domains/routes and a deliberate soft-404 control are approved.
5. Consider Supabase only after precise read-only scope is approved and its safe metadata surface is verified. Keep it disabled if required access is broader than the chosen scope.

## Proposed adapter scope

| Adapter | Intended read-only observations | Exclusions / validation |
|---|---|---|
| GitHub | Allowlisted repository identity/visibility, branch SHA, check conclusions | No source-file contents, secrets, workflows, issues/comments, repo creation or push. Confirm minimum available read scopes at implementation time. |
| Vercel | Allowlisted project deployments, serving aliases, source ref/SHA, deployment state | No environment values, build logs that might contain secrets, promote/redeploy, alias/domain or project changes. Distinguish current alias target from latest deployment. |
| HTTP uptime | Approved HTTPS route status, duration, timestamp, soft-404 control | No authenticated pages, form submission, unrestricted redirects, response-body storage or private-network target expansion. Bound redirects, duration and response size. |
| Sanitized Mac status | Existence of explicitly approved project paths; branch/HEAD and clean/dirty counts | No home-wide crawl, no source contents, no environment files, no filenames from untracked sensitive content, no command strings supplied by the browser, no Git writes. |
| Supabase | Owner-reviewed, sanitized schema/migration inventory if a sufficiently narrow read-only mechanism exists | No application rows, credentials, SQL Editor history, saved snippets, function bodies, dumps, links, migrations, arbitrary queries or mutation. Verify product/API behavior only in the later authorized phase. |

The Supabase adapter is a generic disabled interface, not an implemented Supabase feature. Supabase-specific guidance informs the boundary: privileged credentials and function bodies must not reach clients. No Supabase service, documentation endpoint, CLI or database was contacted to build v0.1, in keeping with the user’s explicit isolation boundary.

## Common collector requirements

- Every observation cites the exact sanitized resource and includes observation/collection/expiration times. Preserve errors and uncertainty. An error must not become a healthy value, zero usage, or a current observation.
- Separate observed values from inferred relationships and risk signals. Merge by project ID/field with source priority and freshness rules, retaining conflicting evidence for review.
- Use explicit resource allowlists and smallest available read scopes. Fail closed on unexpected redirects, host identity, response shape, permission expansion or absent authorization.
- Redact before persistence; discard response bodies outside the schema. Store credential references only in the collector configuration, never values in source control, static bundles or browser storage.
- Persist sanitized observations in an app-owned local store. Use append-only event design with export and retention controls; evaluate tamper evidence before calling it an audit trail.
- Start with manual refresh and modest bounded concurrency; owner-approved schedules later. No paid resource or commercial service requirement is assumed. Surface unavailable permissions/cost data instead of signing up for anything.

## Promotion criteria

Before enabling even one adapter: approved scope; contract fixtures pass; revoked access and rate limiting tested; no write methods/commands; secret-shaped response rejection; no privileged values in bundles/logs; provenance/freshness badges verified; zero unintended network destinations; and UI still useful offline. Production changes remain out of scope.

## Real approvals are separate

A real approval system requires authenticated owner identity, explicit per-item scope, evidence references, durable event storage, integrity controls and revocation semantics. v0.1 local simulation history must never be silently promoted into real approvals. Execution connectors require a separate design and separate authorization beyond this read-only plan.
