# Stage 1: Experience prototype implementation plan

## Status

Stage 1: In progress — Implementation complete, pending validation.

Stage 2: Not started — pending Stage 1 validation.

Stage 3: Not started — pending Stage 1 and Stage 2.

Block 6 is technically approved. Do not start new functional blocks, Stage 2 or
Stage 3 before Stage 1 manual and user validation.

Stage 1 validates the full user experience with mock data and local state only.
It must not connect Supabase, real auth, Cloudflare R2, Mercado Pago, Resend,
the SVG engine, Sharp, pdf-lib, real exports or protected downloads.

## Objective

Create a mobile-first navigable prototype that lets a user:

1. Understand what Momenta offers.
2. Find Space Birthday.
3. Identify the free product.
4. Personalize the invitation.
5. Review and correct the data.
6. View a simulated personalized preview.
7. Reach a simulated download.
8. Review the Stickers pack.
9. Confirm purchase intent for ARS 1.990.

## Route inventory

| Route | Purpose | Data source |
| --- | --- | --- |
| `/` | Home and value proposition | Mock catalog summary |
| `/catalog` | Minimal catalog | Mock collections |
| `/categories/childrens-birthdays` | Active category page | Mock category and collections |
| `/collections/space-birthday` | Collection detail and product selection | Mock collection |
| `/collections/space-birthday/personalize` | Free product guided form | Local state |
| `/projects/[projectId]/review` | Review entered data | Local/mock project state |
| `/projects/[projectId]/preview` | Simulated generation and preview | Local/mock project state |
| `/projects/[projectId]/download` | Simulated download | Local/mock generated files |
| `/collections/space-birthday/stickers-pack` | Premium product detail | Mock premium product |
| `/checkout/mock` | Simulated checkout intent | Local state |
| `/checkout/mock/success` | Purchase intent confirmation | Local state |

## Screen inventory

| Screen | Primary validation |
| --- | --- |
| Home | User understands Momenta quickly |
| Catalog | User can discover available collections |
| Category | User can find Cumpleaños infantiles and Space Birthday |
| Collection detail | User understands Free vs Premium options |
| Personalization form | User can complete required fields |
| Review | User can detect and correct mistakes |
| Preview | User trusts the simulated result |
| Downloads | User understands what they would receive |
| Premium detail | User sees value in Stickers pack |
| Checkout simulation | User can confirm purchase intent |

## Component map

Shared UI:

- `Button`
- `Badge`
- `Input`
- `Textarea`
- `FieldError`
- `ProgressSteps`
- `EmptyState`
- `LoadingState`
- `ErrorState`

Collection components:

- `CollectionCard`
- `CategoryHero`
- `CollectionHero`
- `ProductOptionCard`
- `PremiumProductCard`

Personalization components:

- `PersonalizationForm`
- `PersonalizationField`
- `InvitationPreviewMock`
- `DataReviewPanel`
- `FormSummaryBar`

Prototype flow components:

- `GenerationSimulation`
- `DownloadOptionsMock`
- `PremiumIncludedPreview`
- `CheckoutSimulation`
- `ValidationEventLogger`

Layout components:

- `SiteHeader`
- `MobileBottomAction`
- `PageShell`

## Screen states

Home:

- Default.
- Loading catalog teaser.
- Empty collections fallback.

Catalog:

- Default with Space Birthday.
- Empty search/result state.
- Loading state.

Category:

- Default with one active collection.
- Coming-soon categories visible only as disabled context if needed.

Collection:

- Default with Free and Premium cards.
- Premium clicked state.
- Missing preview fallback.

Personalization:

- Empty fields.
- Invalid required fields.
- Invalid date.
- Invalid time.
- Max length exceeded.
- Valid ready-to-review state.

Review:

- Complete data.
- Edit requested.
- Missing local state fallback.

Preview:

- Simulated generation loading.
- Preview ready.
- Simulated generation error.

Downloads:

- Download ready.
- Download clicked.
- Missing generated preview fallback.

Premium detail:

- Default included-content preview.
- Premium clicked.
- Price visible.

Checkout simulation:

- Checkout started.
- Interest confirmed.
- Simulated cancel/back.

## Mock data structure

Suggested files:

- `features/catalog/data/mock-categories.ts`
- `features/collections/data/mock-collections.ts`
- `features/products/data/mock-products.ts`
- `features/projects/data/mock-project.ts`
- `features/prototype/data/mock-flow-states.ts`
- `features/analytics/services/track-validation-event.ts`

Core mock objects:

```ts
type MockCategory = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "coming-soon";
};

type MockCollection = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  visualStyle: string;
  products: MockProduct[];
};

type MockProduct = {
  id: string;
  slug: string;
  name: string;
  access: "free" | "premium";
  priceLabel?: string;
  widthMm: number;
  heightMm: number;
  fields: MockPersonalizationField[];
  stage1Behavior: "simulated";
};

type MockPersonalizationField = {
  key: "name" | "age" | "date" | "time" | "place" | "message";
  label: string;
  type: "text" | "number" | "date" | "time" | "textarea";
  required: boolean;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  displayFormat?: string;
};
```

Approved field rules:

- `name`: required, max 30.
- `age`: required, number from 1 to 99.
- `date`: required, valid date, displayed as `Sábado 12 de septiembre`.
- `time`: required, valid time, displayed as `15:30 h`.
- `place`: required, max 60.
- `message`: optional, max 120.

## Free flow

```txt
Home
-> Catalog
-> Cumpleaños infantiles
-> Space Birthday
-> Invitación esencial
-> Personalization
-> Review
-> Simulated generation
-> Preview
-> Simulated download
```

Data can live in local component state or controlled route params for Stage 1. Do
not persist to Supabase.

## Premium flow

```txt
Space Birthday
-> Stickers pack
-> Premium detail
-> Price ARS 1.990
-> Simulated checkout
-> Purchase intent confirmation
```

The event `purchase_intent_confirmed` is the main Premium signal. A product card
click alone is not enough.

## Validation events

Events to simulate through a local logger:

- `home_viewed`
- `catalog_viewed`
- `collection_viewed`
- `free_product_selected`
- `premium_product_viewed`
- `personalization_started`
- `personalization_step_viewed`
- `personalization_field_completed`
- `personalization_validation_failed`
- `personalization_back_clicked`
- `personalization_completed`
- `review_viewed`
- `personalization_edit_requested`
- `preview_requested`
- `preview_viewed`
- `download_clicked`
- `premium_clicked`
- `mock_checkout_started`
- `purchase_intent_confirmed`

Stage 1 implementation can log these events to the console and keep a lightweight
in-memory list for manual QA.

## Implementation order

1. Consolidate mock data files and remove duplicated pilot constants.
2. Add shared prototype layout components.
3. Implement route skeletons with mobile-first navigation.
4. Build Home, Catalog and Category.
5. Build Space Birthday collection page with Free/Premium differentiation.
6. Build personalization form with approved validations.
7. Build review screen and edit loop.
8. Build simulated generation and preview.
9. Build simulated download.
10. Build premium detail and checkout simulation.
11. Add validation-event logger.
12. Add loading, error and empty states.
13. Run mobile/desktop QA and document user-test script.

## Acceptance criteria by screen

Home:

- Explains Momenta without mentioning a free-form editor.
- Primary action leads to catalog.
- Works cleanly on mobile first viewport.

Catalog:

- Shows Space Birthday clearly.
- Lets the user reach Cumpleaños infantiles or the collection page.
- Handles empty/loading states.

Category:

- Shows only approved active pilot category behavior.
- Does not imply multiple functional categories.

Collection:

- Shows Space Birthday visual direction.
- Differentiates Invitación esencial as Free.
- Differentiates Stickers pack as Premium with ARS 1.990.
- Does not promise real payment or real download.

Personalization:

- Includes exactly the approved fields.
- Enforces approved limits visually.
- Formats date as `Sábado 12 de septiembre`.
- Formats time as `15:30 h`.
- Allows continuing only when required fields are valid.

Review:

- Displays all user-entered data.
- Allows returning to edit.
- Makes the next action clear.

Preview:

- Shows simulated generation before preview.
- Shows a credible personalized invitation preview.
- Does not call SVG, Sharp or pdf-lib.

Downloads:

- Shows simulated PNG/PDF options.
- Captures `download_clicked`.
- Avoids private URL or R2 language.

Premium detail:

- Explains A4, 12 circular stickers, 5 cm diameter.
- Shows name and age personalization.
- Shows coordinated Space Birthday design.

Checkout simulation:

- Shows ARS 1.990.
- Captures `mock_checkout_started`.
- Requires explicit confirmation to emit `purchase_intent_confirmed`.
- Does not open Mercado Pago.

## Stage 1 non-goals

- No Supabase.
- No real authentication.
- No Cloudflare R2.
- No Mercado Pago.
- No Resend.
- No SVG rendering engine.
- No Sharp.
- No pdf-lib.
- No real exports.
- No protected downloads.
- No dashboard in the first authorized delivery.

## Block 4 prototype preview note

The Block 4 invitation preview is a `Prototype preview renderer`. It is built
with HTML and CSS only to validate comprehension and trust. It must not be reused
as the production rendering engine without explicit technical evaluation.

To test the simulated error state during development, open:

```txt
/projects/demo-space-birthday/preview?simulateError=1
```

## Block 5 simulated checkout note

The Block 5 checkout validates purchase intent only. It does not request payment
data, create orders, integrate Mercado Pago or process charges.

To test the simulated checkout error state during development, open:

```txt
/checkout/mock?simulateError=1
```

## Pending SEO route decision

Before public SEO launch, decide whether `/categories/childrens-birthdays`
should migrate to a Spanish public URL such as
`/categorias/cumpleanos-infantiles`. Do not migrate it during Block 2.
