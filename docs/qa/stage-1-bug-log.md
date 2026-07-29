# Stage 1 bug log

## Status

No Blocker bugs are currently documented. One High risk is open because final
visual assets are not ready for external user testing.

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
| BUG-002 | Internal and technical language visible to users. | Public routes | All | Review public copy across discovery, personalization, preview, download and Premium. | User-facing copy reads like a product experience without internal implementation terms. | Internal language was removed from normal user flow; debug/docs may retain technical terms. | High | Resolved pending QA | Copy cleanup pass and forbidden-term scan. |
| LAUNCH-001 | Remove global noindex before public launch. | All | All | Prepare production launch after validation. | Public launch can be indexed when business approves. | Current validation deployment intentionally uses `noindex, nofollow`. | Low | Open | Vercel preview verification. |
