# Momenta

Momenta is a generative design platform for printable collections. The MVP
validates whether users can find a collection, personalize it easily and pay for
premium content.

## Current roadmap stage

Momenta has closed Stage 0: pilot definition.

A minimal technical foundation already exists so the prototype can live inside
the repository, but Stage 3 is not complete. Stage 1 is now the active product
stage and must use the frozen pilot scope.

```txt
Stage 0: Approved — scope frozen
Stage 1: In progress — Implementation complete, pending validation
Stage 2: Not started — pending Stage 1 validation
Stage 3: Not started — pending Stage 1 and Stage 2
```

## Architecture

Momenta is a modular monolith:

```txt
app/              Next.js App Router, pages and route handlers
features/         Product modules with UI, actions, services and repositories
domain/           Framework-independent business entities
services/ports/   Provider interfaces used by application services
infrastructure/   Vendor adapters for Supabase, R2, Mercado Pago and Resend
components/       Shared UI components
lib/              Shared utilities
types/            Cross-module types only when truly global
public/           Public static assets
docs/             Architecture decisions and product notes
```

Business logic should not live in React components. Providers should not be
imported directly from UI. The SVG rendering engine must stay independent from
React.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

On Windows PowerShell, use `pnpm.cmd` if script execution blocks `pnpm.ps1`.
Do not use npm or yarn in this repository.

## Next vertical slice

Plan and build the Stage 1 prototype following
`docs/product/stage-1-requirements.md`:

1. One collection.
2. One product.
3. One SVG template.
4. One guided form.
5. One preview.
6. One simulated generation state.
7. One simulated download screen.
8. One simulated premium checkout intent.
