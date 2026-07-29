# Stage 1 Vercel Preview

## Status

Deployment verified for internal validation.

This preview is for internal QA and controlled user validation only. It is not a
public launch of Momenta.

URL:

```txt
https://momenta-gamma.vercel.app/
```

Vercel environment:

```txt
Production deployment used as validation preview
```

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

Verification result:

| Check | Result |
| --- | --- |
| `X-Robots-Tag` | Passed: `noindex, nofollow`. |
| Page metadata | Passed: `meta name="robots" content="noindex, nofollow"`. |
| `/robots.txt` | Passed: `User-Agent: *` and `Disallow: /`. |

## Routes Verified On Vercel

| Route | Result | Notes |
| --- | --- | --- |
| `/` | Passed | 200, title `Momenta`. |
| `/catalog` | Passed | 200, title `Catálogo | Momenta`. |
| `/categories/childrens-birthdays` | Passed | 200, title `Cumpleaños infantiles | Momenta`. |
| `/collections/space-birthday` | Passed | 200, title `Space Birthday | Momenta`. |
| `/collections/space-birthday/personalize` | Passed | 200, title `Personalizar invitación | Momenta`. |
| `/projects/demo-space-birthday/review` | Passed | 200, title `Revisión de datos | Momenta`. |
| `/projects/demo-space-birthday/preview` | Passed | 200, title `Preview | Momenta`. |
| `/projects/demo-space-birthday/download` | Passed | 200, title `Descarga simulada | Momenta`. |
| `/collections/space-birthday/stickers-pack` | Passed | 200, title `Stickers pack | Momenta`. |
| `/checkout/mock` | Passed | 200, title `Checkout simulado | Momenta`. |
| `/checkout/mock/success` | Passed | 200, title `Interés confirmado | Momenta`. |
| `/robots.txt` | Passed | 200, disallows all crawlers. |

## Debug And Error Checks

| URL | Result |
| --- | --- |
| `/?debugEvents=1` | Passed. Shows the mock event viewer. |
| `/projects/demo-space-birthday/preview?simulateError=1` | Loads with 200. Shows missing personalization fallback if no draft exists; simulated preview failure requires a complete local draft. |
| `/checkout/mock?simulateError=1` | Loads with 200. Simulated checkout failure is triggered after pressing the confirmation CTA. |

## Browser Smoke

| Check | Result | Notes |
| --- | --- | --- |
| Render smoke | Passed | Headless Chrome rendered representative routes. |
| Navigation | Passed with caveat | Home to catalog navigation was exercised. Full manual route flow remains pending. |
| `sessionStorage` | Passed | `home_viewed` was stored in `momenta:stage1:validation-events`. |
| Mock events | Passed | `home_viewed` appeared in session storage; mock event console info was observed. |
| Console errors | Passed | No blocking browser errors detected in Chrome headless smoke. |
| Resources/fonts | Passed | No failed resource loads detected in Chrome headless smoke. |
| Mobile real | Pending | Must be checked on physical devices by QA/business. |

## Differences From Local

- Vercel is serving the `main` deployment through the production project URL,
  but it is being treated only as a validation preview.
- No provider-backed environment variables are configured, matching Stage 1.
- Direct access to preview error simulation behaves like local: without a
  complete draft in `sessionStorage`, the missing personalization fallback is
  shown first.
- Checkout error simulation loads normally and requires clicking the
  confirmation CTA to enter the simulated failed state.

## Open Bugs And Launch Tasks

- `BUG-001 — Assets finales no disponibles — High`
- `LAUNCH-001 — Remove global noindex before public launch`

Do not move Stage 1 to `Ready for user testing` while `BUG-001` remains open.
