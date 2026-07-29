# Stage 1 Vercel preview

## Status

Prepared for preview deployment. URL pending after Vercel deployment.

This preview is for internal QA and controlled user validation only. It is not a
public launch of Momenta.

## Roadmap Boundary

```txt
Stage 1: In progress — Implementation complete, pending validation
Stage 2: Not started — pending Stage 1 validation
Stage 3: Not started — pending Stage 1 and Stage 2
```

## Vercel Configuration

| Setting | Value |
| --- | --- |
| Project | `momenta` |
| Framework | Next.js |
| Root directory | `./` |
| Install command | `pnpm install` |
| Build command | `pnpm build` |
| Output directory | Next.js default |
| Environment variables | None required for Stage 1 |

## Indexing

The validation prototype must not be indexed.

Applied controls:

- Global Next.js metadata: `noindex, nofollow`.
- HTTP header: `X-Robots-Tag: noindex, nofollow`.
- `robots.txt`: disallow all crawlers.

Local production smoke result:

| Check | Result |
| --- | --- |
| `/` includes `X-Robots-Tag` | Passed |
| `/catalog` includes `X-Robots-Tag` | Passed |
| `/robots.txt` returns `Disallow: /` | Passed |

## Routes To Verify On Vercel

| Route | Result | Notes |
| --- | --- | --- |
| `/` | Pending |  |
| `/catalog` | Pending |  |
| `/categories/childrens-birthdays` | Pending |  |
| `/collections/space-birthday` | Pending |  |
| `/collections/space-birthday/personalize` | Pending |  |
| `/projects/demo-space-birthday/review` | Pending |  |
| `/projects/demo-space-birthday/preview` | Pending |  |
| `/projects/demo-space-birthday/download` | Pending |  |
| `/collections/space-birthday/stickers-pack` | Pending |  |
| `/checkout/mock` | Pending |  |
| `/checkout/mock/success` | Pending |  |

## Debug And Error Checks

| URL | Expected |
| --- | --- |
| `/?debugEvents=1` | Shows the mock event viewer. |
| `/projects/demo-space-birthday/preview?simulateError=1` | Shows simulated preview error. |
| `/checkout/mock?simulateError=1` | Shows simulated checkout error. |

## Differences From Local

Pending after deployed preview review.

## Open Bugs

- `BUG-001 — Assets finales no disponibles — High`

Do not move Stage 1 to `Ready for user testing` while `BUG-001` remains open.
