import { activePilotCategory } from "@/features/catalog/data/mock-categories";
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
      "Una colección piloto para validar invitaciones infantiles personalizables sin editor libre.",
    categorySlug: activePilotCategory.slug,
    categoryName: activePilotCategory.name,
    status: "published",
    tags: ["infantil", "espacio", "piloto"],
    products: [spaceInvitationProduct, spaceStickersPackProduct],
    prototype: {
      assets: {
        cover: "placeholder:space-birthday-cover",
        thumbnail: "placeholder:space-birthday-thumbnail",
        invitationPreview: "placeholder:space-invitation-preview",
        stickersPreview: "placeholder:space-stickers-preview",
        personalizedExample: "placeholder:space-personalized-example",
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
