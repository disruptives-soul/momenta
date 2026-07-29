# ADR 0001: Modular monolith

## Status

Accepted.

## Context

Momenta needs fast MVP validation without locking the product into a fragile
prototype. The core value is the visual design system and deterministic
personalization pipeline, not distributed infrastructure.

## Decision

Momenta will be built as a modular monolith on Next.js App Router.

Each module owns its application logic, validators, repositories and UI
components. Domain entities stay framework independent. Infrastructure providers
are accessed through ports so Supabase, R2, Mercado Pago and Resend can be
replaced later without rewriting product logic.

## Consequences

- Lower operational cost during MVP validation.
- Simpler deployments through Vercel.
- Clear boundaries without microservice overhead.
- Future provider changes require adapter work, not domain rewrites.

## Guardrails

- Do not place business logic in React components.
- Do not import provider clients in presentation components.
- Do not create renderers per product.
- Keep the rendering engine independent from React.
