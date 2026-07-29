# Stage 1: Experience prototype requirements

## Status

Ready to start. Stage 0 is approved and frozen.

## Objective

Validate comprehension, navigation, personalization, perceived value and premium
purchase intent through a navigable simulation.

Stage 1 must not expand architecture, integrations or production
infrastructure.

## Included

- Navigable prototype.
- Mobile-first design.
- Home.
- Minimal catalog.
- Category page for Cumpleaños infantiles.
- Space Birthday collection page.
- Free product.
- Premium product.
- Interactive form.
- Visual validations.
- Data review.
- Simulated preview.
- Simulated generation.
- Simulated download.
- Simulated premium checkout.
- Loading states.
- Error states.
- Empty states.
- Test analytics events.
- Mock or local data.

## Scope lock

Stage 1 must use the approved Stage 0 scope. The pilot collection, products,
price, fields, hypotheses and flows must not change without a new explicit
business decision.

## Not included

- Supabase.
- Real database.
- Real authentication.
- Cloudflare R2.
- SVG rendering engine.
- Sharp.
- pdf-lib.
- Real personalized PNG.
- Real personalized PDF.
- Mercado Pago.
- Real payments.
- Resend.
- Real emails.
- Private URLs.
- Protected downloads.
- Admin panel.

## Required assets

Before implementation starts, the prototype needs provisional but credible
assets:

- Main Space Birthday image.
- Catalog thumbnail.
- Free invitation preview.
- Stickers pack preview.
- Personalized invitation example.
- Color palette.
- Typography references.
- Collection name and description.
- Free product copy.
- Premium product copy.
- Stickers pack benefits.
- Button text and primary messages.

## Validation events

The prototype should register or simulate:

- `home_viewed`
- `catalog_viewed`
- `collection_viewed`
- `free_product_selected`
- `premium_product_viewed`
- `personalization_started`
- `personalization_completed`
- `preview_viewed`
- `download_clicked`
- `premium_clicked`
- `mock_checkout_started`
- `purchase_intent_confirmed`

The main premium validation event is `purchase_intent_confirmed`. A single click
on the premium product is not enough to confirm purchase intent.

## User testing plan

First round:

- 5 to 8 people outside the project.
- Prioritize mobile usage.

Priority profiles:

- Mothers.
- Fathers.
- Relatives organizing birthdays.
- Small event organizers.
- People who have used printables.

## Test tasks

1. Explain in their own words what Momenta offers.
2. Find Space Birthday.
3. Identify which product is free.
4. Personalize the invitation.
5. Review and correct their data.
6. Reach the preview.
7. Try to download the result.
8. Review the Stickers pack.
9. Say whether they would pay ARS 1.990.
10. Explain what they expected to receive.

## Stage 1 close criteria

Stage 1 is complete when:

- The prototype is fully navigable.
- The flow works on mobile and desktop.
- Fields have visible validations.
- Users can review and correct answers.
- The simulated preview represents the result clearly.
- Free and Premium products are easy to differentiate.
- The simulated checkout works.
- Main events can be measured.
- At least one user testing round is completed.
- Main problems are documented.
- Required adjustments are defined before building the real flow.
