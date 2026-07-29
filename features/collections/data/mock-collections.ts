import { activePilotCategory } from "@/features/catalog/data/mock-categories";
import { spaceBirthdayAssets } from "@/features/collections/data/space-birthday-assets";
import {
  spaceInvitationProduct,
  spaceStickersPackProduct,
} from "@/features/products/data/mock-products";
import type { PublicCollection } from "../types/public-collection";

export const mockCollections: PublicCollection[] = [
  {
    id: "col_space_birthday",
    slug: "space-birthday",
    name: "Space Birthday",
    description:
      "Una colección espacial para crear invitaciones y piezas imprimibles para cumpleaños infantiles.",
    categorySlug: activePilotCategory.slug,
    categoryName: activePilotCategory.name,
    status: "published",
    tags: ["infantil", "espacio", "cumpleaños"],
    products: [spaceInvitationProduct, spaceStickersPackProduct],
    prototype: {
      assets: {
        cover: spaceBirthdayAssets.cover.id,
        thumbnail: spaceBirthdayAssets.thumbnail.id,
        invitationPreview: spaceBirthdayAssets.invitationPreview.id,
        stickersPreview: spaceBirthdayAssets.stickersPreview.id,
        personalizedExample: spaceBirthdayAssets.personalizedExample.id,
      },
      celebrationType: "Cumpleaños infantiles",
      customizableFields: [
        "nombre",
        "edad",
        "fecha",
        "hora",
        "lugar",
        "mensaje adicional",
      ],
      heroCopy:
        "Una colección espacial para crear una invitación clara, alegre y lista para imprimir.",
      missingAssets: [
        "Portada final de colección",
        "Miniatura de catálogo",
        "Preview final de Invitación esencial",
        "Preview final de Stickers pack",
        "Ejemplo personalizado final",
      ],
      visualStyle:
        "Espacio infantil con cohetes, planetas, estrellas y colores brillantes aptos para impresión.",
    },
  },
];

export const pilotCollection = mockCollections[0];
