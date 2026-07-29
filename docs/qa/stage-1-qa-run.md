# Stage 1 QA run

## Status

Technical smoke checks executed locally. Full visual, responsive and
accessibility QA requires manual browser review.

## Environment

| Field | Value |
| --- | --- |
| Date | 2026-07-29 |
| Machine | Local Windows workspace |
| Server | `http://127.0.0.1:3000` |
| Package manager | pnpm |

## Automated Checks

| Check | Result |
| --- | --- |
| `pnpm.cmd lint` | Passed |
| `pnpm.cmd build` | Passed |
| `pnpm.cmd typecheck` | Passed |
| Route HTTP smoke | Passed |
| Local `noindex, nofollow` smoke | Passed |

## Vercel Preview

Preview deployment preparation is documented in
`docs/qa/stage-1-vercel-preview.md`.

Vercel route verification is pending until the preview URL is available.

## Route HTTP Smoke

Temporary local production server:

```txt
http://127.0.0.1:3000
```

| Route | Result |
| --- | --- |
| `/` | 200 |
| `/catalog` | 200 |
| `/categories/childrens-birthdays` | 200 |
| `/collections/space-birthday` | 200 |
| `/collections/space-birthday/personalize` | 200 |
| `/projects/demo-space-birthday/review` | 200 |
| `/projects/demo-space-birthday/preview` | 200 |
| `/projects/demo-space-birthday/download` | 200 |
| `/collections/space-birthday/stickers-pack` | 200 |
| `/checkout/mock` | 200 |
| `/checkout/mock/success` | 200 |

## Manual QA Still Required

- Chrome full flow.
- Edge or Chromium secondary browser.
- Firefox desktop.
- Safari mobile when available.
- Viewports: 320, 375, 390, 768, 1024, 1440.
- Keyboard-only pass.
- Screen reader spot check if available.

## Known Limitations

The local agent performed route/build smoke checks, but cannot certify visual
quality across real devices without browser/device review.
