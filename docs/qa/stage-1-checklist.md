# Stage 1 QA checklist

## Status

Reusable checklist for Block 6 and later corrections.

## Environment

| Field | Value |
| --- | --- |
| Date | 2026-07-29 |
| Build | Local Next.js prototype |
| Browser |  |
| Device |  |
| Viewport |  |
| Tester |  |

## Routes

| Route | Expected | Result | Notes |
| --- | --- | --- | --- |
| `/` | Home loads and CTA opens catalog. |  |  |
| `/catalog` | Catalog shows Space Birthday and search. |  |  |
| `/categories/childrens-birthdays` | Shows Cumpleaños infantiles. |  |  |
| `/collections/space-birthday` | Shows Free and Premium. |  |  |
| `/collections/space-birthday/personalize` | Guided form starts. |  |  |
| `/projects/demo-space-birthday/review` | Review is recoverable. |  |  |
| `/projects/demo-space-birthday/preview` | Simulated preview works. |  |  |
| `/projects/demo-space-birthday/download` | Simulated download works. |  |  |
| `/collections/space-birthday/stickers-pack` | Premium detail works. |  |  |
| `/checkout/mock` | Mock checkout works. |  |  |
| `/checkout/mock/success` | Success screen works. |  |  |

## Functional Flow

| Check | Result | Notes |
| --- | --- | --- |
| Home value proposition is clear. |  |  |
| Catalog search returns empty state for unmatched terms. |  |  |
| Free/Premium differentiation is clear. |  |  |
| Personalization fields match Stage 0. |  |  |
| Invalid required fields block progress. |  |  |
| Back navigation preserves values. |  |  |
| Review formats values correctly. |  |  |
| Edit from review returns to the right step. |  |  |
| Preview generation succeeds. |  |  |
| Preview error works with `?simulateError=1`. |  |  |
| Download simulation completes. |  |  |
| Premium checkout does not ask for financial data. |  |  |
| Checkout error works with `?simulateError=1`. |  |  |

## Responsive

| Width | Result | Notes |
| --- | --- | --- |
| 320 px |  |  |
| 375 px |  |  |
| 390 px |  |  |
| 768 px |  |  |
| 1024 px |  |  |
| 1440 px |  |  |

Check for horizontal scroll, cropped text, unreachable CTAs, uncomfortable inputs,
small preview, navigation issues, checkout overflow and Free/Premium ordering.

## Accessibility

| Check | Result | Notes |
| --- | --- | --- |
| Keyboard navigation works. |  |  |
| Focus is visible. |  |  |
| Focus order is logical. |  |  |
| Inputs have visible labels. |  |  |
| Field errors are associated with inputs. |  |  |
| Generation status uses accessible announcement. |  |  |
| Buttons have clear names. |  |  |
| Content does not rely only on color. |  |  |
| Touch targets are comfortable. |  |  |

## Events

Open with `?debugEvents=1` and verify:

| Funnel | Expected | Result | Notes |
| --- | --- | --- | --- |
| Free | `collection_viewed -> personalization_started -> personalization_completed -> preview_viewed -> download_clicked` |  |  |
| Premium | `premium_product_viewed -> premium_cta_clicked -> mock_checkout_started -> purchase_intent_confirmed` |  |  |
