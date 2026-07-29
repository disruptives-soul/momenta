# Stage 1 bug log

## Status

No Blocker bugs are currently documented. High risks remain open while assets
and deployment verification are not fully cleared.

Stage 1 must not move to user testing while `BUG-001` remains open.

## Severity

- Blocker: prevents completing the main flow.
- High: seriously affects comprehension, personalization, preview or Premium intent.
- Medium: creates friction but has a workaround.
- Low: visual/content detail that does not block validation.

## Log

| ID | Description | Route | Device / viewport | Steps | Expected | Actual | Severity | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Final visual assets are not available; prototype uses placeholders. | Multiple | All | Review discovery, preview and Premium pages. | Provisional but credible assets available for external test. | Placeholders are visible and clearly marked. | High | Open | See asset inventory. |
| BUG-002 | Internal and technical language visible to users. | Public routes | All | Review public copy across discovery, personalization, preview, download and Premium. | User-facing copy reads like a product experience without internal implementation terms. | Internal language was removed from normal user flow in repository commit `85c41b6`; deployment verification remains pending business confirmation. | High | Resolved in repository, pending deployment verification | Copy cleanup pass and deployed smoke on `https://momenta-gamma.vercel.app/`. |
| DEPLOY-001 | Vercel alias does not reflect commit `85c41b6`. | Vercel alias | All | Compare GitHub `main`, Vercel deployment and `https://momenta-gamma.vercel.app/`. | Alias points to the latest successful deployment for commit `85c41b6`. | Business observed stale copy after push; latest technical smoke now serves cleaned copy, but Vercel dashboard confirmation is still required. | High | Open pending dashboard confirmation | Vercel alias smoke and GitHub `origin/main` check. |
| LAUNCH-001 | Remove global noindex before public launch. | All | All | Prepare production launch after validation. | Public launch can be indexed when business approves. | Current validation deployment intentionally uses `noindex, nofollow`. | Low | Open | Vercel preview verification. |
