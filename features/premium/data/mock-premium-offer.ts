import { spaceStickersPackProduct } from "@/features/products/data/mock-products";

export const mockPremiumOffer = {
  productCode: "stickers-pack",
  collectionSlug: "space-birthday",
  collectionName: "Space Birthday",
  productName: spaceStickersPackProduct.name,
  price: 1990,
  currency: "ARS",
  priceLabel: spaceStickersPackProduct.priceLabel ?? "ARS 1.990",
  paymentModel: "Compra única",
  subscription: "Sin suscripción",
  delivery: "Producto digital, sin envío físico",
  pageFormat: "A4, 210 × 297 mm",
  stickerCount: 12,
  stickerDiameter: "5 cm",
  personalization: "Nombre y edad",
  relationship:
    "Complementa la Invitación esencial sin bloquear el producto gratuito.",
  includes: [
    "12 stickers circulares",
    "5 cm de diámetro",
    "Una hoja A4",
    "Personalización con nombre y edad",
    "Diseño coordinado con Space Birthday",
    "Producto digital listo para imprimir",
  ],
  freeComparison: [
    "La Invitación esencial es gratuita y puede usarse sola.",
    "El Stickers pack agrega una expansión coordinada para completar la celebración.",
  ],
} as const;

export const premiumEventPayload = {
  collectionSlug: mockPremiumOffer.collectionSlug,
  productCode: mockPremiumOffer.productCode,
  price: String(mockPremiumOffer.price),
  currency: mockPremiumOffer.currency,
} as const;
