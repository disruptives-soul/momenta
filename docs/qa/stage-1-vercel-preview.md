# Stage 1 Vercel Preview

## Status

Deployment technically rechecked after commit `85c41b6`.

This URL is for internal QA and controlled validation only. It is not a public
launch of Momenta.

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

## Deployment Diagnosis

| Question | Result |
| --- | --- |
| Is commit `85c41b6` present locally? | Passed. Local `main` HEAD is `85c41b6d9217249f7e8e132591086b6fda7310a0`. |
| Is commit `85c41b6` present on GitHub `origin/main`? | Passed. `git ls-remote origin refs/heads/main` returned `85c41b6d9217249f7e8e132591086b6fda7310a0`. |
| Which branch is Vercel Production Branch? | Requires Vercel dashboard access. Expected: `main`. |
| Did Vercel generate a deployment for `85c41b6`? | Requires Vercel dashboard access. Inferred likely because the public alias now serves the cleaned copy. |
| Did that deployment pass build? | Requires Vercel dashboard access for exact deployment status. Inferred likely because requested routes return 200. |
| Does `momenta-gamma.vercel.app` point to the latest deployment? | Latest HTTP smoke now shows cleaned copy, but dashboard alias confirmation is still required. |
| Is there a commit-specific deployment URL? | Requires Vercel dashboard access. Copy it from the Vercel Deployments tab if available. |
| Did GitHub-Vercel auto deploy stop? | Not proven. GitHub has the commit and the alias now reflects the cleaned copy in technical smoke. |
| Differences local/GitHub/Vercel | Local and GitHub both point to `85c41b6`. Vercel alias currently appears updated by HTTP, while business previously observed stale content. |

Manual Vercel checks for business:

1. Open Vercel project `momenta`.
2. Confirm `Settings -> Git -> Production Branch` is `main`.
3. Open `Deployments`.
4. Find the deployment for commit `85c41b6 Clean public copy for Stage 1 validation`.
5. Confirm build status is `Ready`.
6. Confirm alias `momenta-gamma.vercel.app` points to that deployment.
7. Copy the deployment-specific URL, if different from the alias.
8. If no deployment exists for `85c41b6`, trigger `Redeploy` from the latest `main` commit.

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

## Routes Rechecked On Alias

| Route | Result | Notes |
| --- | --- | --- |
| `/` | Passed | 200, title `Momenta`; cleaned copy present. |
| `/catalog` | Passed | 200, title `Catálogo | Momenta`; no forbidden visible phrase detected. |
| `/categories/childrens-birthdays` | Passed | 200, title `Cumpleaños infantiles | Momenta`; no forbidden visible phrase detected. |
| `/collections/space-birthday` | Passed | 200, title `Space Birthday | Momenta`; no forbidden visible phrase detected. |
| `/collections/space-birthday/stickers-pack` | Passed | 200, title `Stickers pack | Momenta`; no forbidden visible phrase detected. |
| `/projects/demo-space-birthday/preview` | Passed | 200, title `Vista previa | Momenta`; no forbidden visible phrase detected. |
| `/projects/demo-space-birthday/download` | Passed | 200, title `Descarga | Momenta`; no forbidden visible phrase detected. |
| `/checkout/mock` | Passed | 200, title `Confirmar interés | Momenta`; route name contains `mock` by design. |
| `/checkout/mock/success` | Passed | 200, title `Interés confirmado | Momenta`; route name contains `mock` by design. |

## Public Copy Deployment Scan

Checked terms:

```txt
prototipo
mock
provisional
placeholder
assets pendientes
Etapa 1
Bloque
shell
precio de validación
checkout simulado
```

Result:

- No stale business-facing phrases were found in normal visible copy by HTTP
  smoke.
- `placeholder` appears only as HTML input attributes or internal serialized
  field configuration.
- `mock` appears in route names such as `/checkout/mock` and serialized internal
  bundle names, not as normal visible copy.
- Business should hard-refresh or use a private/incognito window if stale copy
  is still visible.

## Debug And Error Checks

| URL | Result |
| --- | --- |
| `/?debugEvents=1` | Previously passed. Shows the mock event viewer; technical terms are allowed in this development-only view. |
| `/projects/demo-space-birthday/preview?simulateError=1` | Previously passed. Loads with 200; complete draft is required to enter the simulated preview failure. |
| `/checkout/mock?simulateError=1` | Previously passed. Loads with 200; simulated checkout failure is triggered after pressing the confirmation CTA. |

## Differences From Local

- Vercel is serving the `main` deployment through the production project URL,
  but it is being treated only as a validation preview.
- No provider-backed environment variables are configured, matching Stage 1.
- The alias looked stale in business review immediately after commit `85c41b6`.
  Latest technical HTTP smoke now shows cleaned copy.
- Vercel dashboard is still needed to confirm the exact deployment, Production
  Branch, build status and alias target.

## Open Bugs And Launch Tasks

- `BUG-001 — Assets finales no disponibles — High`
- `BUG-002 — Resolved in repository, pending deployment verification`
- `DEPLOY-001 — Vercel alias does not reflect commit 85c41b6 — High`
- `LAUNCH-001 — Remove global noindex before public launch`

Do not move Stage 1 to `Ready for user testing` while `BUG-001`, `BUG-002` or
`DEPLOY-001` remains open.
