# Stage 1 mock events

## Status

Block 6 consolidated.

Events are stored only in `sessionStorage` and logged to the browser console.
They are not sent to Google Analytics, Microsoft Clarity or any external service.

Enable the development viewer with:

```txt
?debugEvents=1
```

## Rules

- Do not include personal values.
- Do not log name, age, date, time, place or message.
- Keep payloads limited to route, collection, product, step, field, price and currency.
- Use `trackValidationEvent` instead of calling analytics from visual components.

## Discovery

| Event | Fires when |
| --- | --- |
| `home_viewed` | Home mounts. |
| `catalog_viewed` | Catalog page mounts. |
| `category_viewed` | Cumpleaños infantiles category mounts or category card is clicked. |
| `collection_viewed` | Space Birthday page/card is viewed or selected. |
| `free_product_selected` | User chooses Invitación esencial. |
| `premium_product_viewed` | User views Stickers pack. |

## Personalization

| Event | Fires when |
| --- | --- |
| `personalization_started` | Guided personalization starts. |
| `personalization_step_viewed` | A personalization step becomes active. |
| `personalization_field_completed` | A field in a valid step is completed. |
| `personalization_validation_failed` | Current step cannot continue. |
| `personalization_back_clicked` | User goes back one step. |
| `personalization_completed` | User completes the last step. |
| `review_viewed` | Review route loads. |
| `personalization_edit_requested` | User edits a field from review. |
| `preview_requested` | User requests preview from review. |

## Free Result

| Event | Fires when |
| --- | --- |
| `preview_generation_started` | Preview simulation begins. |
| `preview_generation_completed` | Preview simulation succeeds. |
| `preview_generation_failed` | Preview simulation fails via dev flag. |
| `preview_viewed` | Prototype preview is visible. |
| `preview_edit_requested` | User returns to edit from preview. |
| `preview_confirmed` | User confirms the preview. |
| `download_page_viewed` | Download page loads. |
| `download_clicked` | User clicks simulated download. |
| `download_simulated` | Simulated download completes. |
| `download_failed` | Reserved for simulated download failure. |
| `premium_upsell_viewed` | Premium upsell appears after Free result. |
| `premium_upsell_clicked` | User clicks Premium upsell. |

## Premium

| Event | Fires when |
| --- | --- |
| `premium_details_viewed` | Premium detail content is shown. |
| `premium_preview_viewed` | Premium A4 preview is shown. |
| `premium_benefits_viewed` | Benefits list is shown. |
| `premium_cta_clicked` | User clicks `Comprar por ARS 1.990`. |
| `mock_checkout_started` | Mock checkout mounts. |
| `mock_checkout_viewed` | Mock checkout content is visible. |
| `mock_checkout_cancelled` | User returns from checkout. |
| `purchase_intent_confirmed` | User explicitly confirms purchase intent. |
| `mock_checkout_completed` | Mock checkout success path completes. |
| `premium_feedback_submitted` | Optional premium feedback is submitted. |

## Funnel Checks

Free funnel:

```txt
collection_viewed
-> personalization_started
-> personalization_completed
-> preview_viewed
-> download_clicked
```

Premium funnel:

```txt
premium_product_viewed
-> premium_cta_clicked
-> mock_checkout_started
-> purchase_intent_confirmed
```
