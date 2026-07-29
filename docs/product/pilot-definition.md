
## Status

Stage 0: Approved — Scope frozen.

Stage 0 is approved at product, scope and validation strategy level. From this
point forward, the pilot collection, products, price, fields, hypotheses and
flows must not change without a new explicit business decision.

Stage 1 will be a navigable simulation only. It will not include real file
generation, payments, storage, authentication or production infrastructure.

## Objective

Define exactly what the first user can select, personalize, preview, buy and
download.

The MVP must validate only three assumptions:

1. Users can find a collection they like.
2. Users can personalize it without confusion.
3. Users are willing to pay for premium printable content.

## Pilot definitions

| Item | Decision |
| --- | --- |
| Pilot category | Cumpleaños infantiles |
| Pilot collection | Space Birthday |
| Free product | Invitación esencial |
| Premium product | Stickers pack |
| Premium validation price | ARS 1.990 |
| Commercial model | One-time purchase |
| Subscription | Out of scope |

Only `Cumpleaños infantiles` is required to test the initial flow.

## Pilot collection

| Field | Decision |
| --- | --- |
| Name | Space Birthday |
| Slug | space-birthday |
| Category | Cumpleaños infantiles |
| Audience | Families planning a child's birthday |
| Visual direction | Space, rockets, stars, friendly planets, bright but printable colors |
| Collection status | Pilot |
| Business goal | Validate collection appeal and guided personalization |

## Free product

| Field | Decision |
| --- | --- |
| Product | Invitación esencial |
| Product slug | invitation |
| Size | 127 x 178 mm |
| Print equivalent | 5 x 7 in |
| Orientation | Portrait |
| Template format | SVG in later stages |
| Stage 1 preview | Simulated personalized preview |
| Stage 1 download | Simulated download |
| Later exports | PNG and PDF |
| Access | Free |

The free product includes one vertical invitation personalized with structured
event data.

It does not include:

- ZIP export.
- Multiple products.
- Advanced quality presets.
- Manual design editing.
- Drag-and-drop editing.

## Premium product

| Field | Decision |
| --- | --- |
| Product | Stickers pack |
| Product slug | stickers-pack |
| Size | A4 page, 210 x 297 mm |
| Content | 12 circular stickers |
| Sticker diameter | 5 cm |
| Personalization | Name and age |
| Visual language | Coordinated with Space Birthday |
| Stage 1 preview | Simulated included-content preview |
| Stage 1 checkout | Simulated |
| Stage 1 download | Simulated |
| Price | ARS 1.990 |
| Access | Premium |

The price is a validation anchor, not a permanent pricing model.

## Personalization contract

User data must always be structured, even if Stage 1 stores it locally or in
mock state only.

| Key | Label | Type | Required | Rule | Example |
| --- | --- | --- | --- | --- | --- |
| name | Nombre | text | Yes | Max 30 characters | Mateo |
| age | Edad | number | Yes | Number from 1 to 99 | 7 |
| date | Fecha | date | Yes | Required valid date, displayed as `Sábado 12 de septiembre` | 2026-09-12 |
| time | Hora | time | Yes | Required valid time, displayed as `15:30 h` | 15:30 |
| place | Lugar | text | Yes | Max 60 characters | Salón Cosmos |
| message | Mensaje adicional | text | No | Max 120 characters | Te esperamos |

## Text rules

- All text input must be escaped before SVG insertion in later stages.
- Empty optional fields must not leave visible placeholders.
- Required fields block preview/export until valid.
- Long text must shrink within field limits before failing in later stages.
- Overflow should be shown as a validation error, not silently clipped.
- The user cannot move, resize or edit layout elements freely.

## SVG template contract

The first SVG template must expose named placeholders matching the
personalization contract.

Required placeholder ids:

- `var-name`
- `var-age`
- `var-date`
- `var-time`
- `var-place`
- `var-message`

Initial template metadata:

```json
{
  "templateId": "tpl_space_invitation_v1",
  "productId": "prod_space_invitation",
  "widthMm": 127,
  "heightMm": 178,
  "variables": ["name", "age", "date", "time", "place", "message"]
}
```

## Approved free flow

```txt
Home
-> Catalog
-> Category: Cumpleaños infantiles
-> Collection: Space Birthday
-> Product selection
-> Personalization
-> Data review
-> Simulated generation
-> Personalized preview
-> Simulated download
```

## Approved premium flow

```txt
Space Birthday
-> Stickers pack
-> Included-content preview
-> Price ARS 1.990
-> Simulated checkout
-> Purchase intent confirmation
```

Real Mercado Pago integration waits until users demonstrate meaningful purchase
intent in the prototype.

## Product hypotheses

### Main hypothesis

Users can discover a collection, understand what they can personalize and finish
an invitation flow without assistance.

### Premium hypothesis

Users who personalize the free invitation will show intent to pay ARS 1.990 for
a coordinated Stickers pack.

## Stage 0 close criteria

Stage 0 is closed when business approves:

- Pilot category.
- Pilot collection.
- Free product.
- Free product content.
- Premium product.
- Premium product content.
- Validation price.
- Fields and limits.
- Free flow.
- Premium flow.
- Validation hypotheses.
- Explicit Stage 1 scope.

After approval, the scope stays frozen until the first user testing round is
completed.
