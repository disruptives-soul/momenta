import { activePilotCategory } from "@/features/catalog/data/mock-categories";
import { spaceBirthdayAssets } from "@/features/collections/data/space-birthday-assets";
import {
  spaceBackingProduct,
  spaceBannerProduct,
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
      "Una coleccion espacial para crear invitaciones y piezas imprimibles para cumpleanos infantiles.",
    categorySlug: activePilotCategory.slug,
    categoryName: activePilotCategory.name,
    status: "published",
    tags: ["infantil", "espacio", "cumpleanos"],
    pieces: [
      {
        id: "piece_space_invitation",
        collectionId: "col_space_birthday",
        pieceTypeId: "invitation",
        productId: spaceInvitationProduct.id,
        templateId: "space-birthday-invitation-v1",
        printProfileId: "a3-portrait",
        status: "published",
      },
      {
        id: "piece_space_stickers_a3",
        collectionId: "col_space_birthday",
        pieceTypeId: "stickers",
        productId: spaceStickersPackProduct.id,
        templateId: "sunday-in-bloom-stickers-a3-v1",
        printProfileId: "stickers-a3-portrait",
        status: "published",
      },
      {
        id: "piece_space_banner_2x1",
        collectionId: "col_space_birthday",
        pieceTypeId: "banner",
        productId: spaceBannerProduct.id,
        templateId: "sunday-in-bloom-banner-2x1-v1",
        printProfileId: "banner-2x1-landscape",
        status: "published",
      },
      {
        id: "piece_space_backing_1x1",
        collectionId: "col_space_birthday",
        pieceTypeId: "backing",
        productId: spaceBackingProduct.id,
        templateId: "sunday-in-bloom-backing-1x1-v1",
        printProfileId: "backing-1x1-square",
        status: "published",
      },
    ],
    products: [
      spaceInvitationProduct,
      spaceStickersPackProduct,
      spaceBannerProduct,
      spaceBackingProduct,
    ],
    prototype: {
      assets: {
        cover: spaceBirthdayAssets.cover.id,
        thumbnail: spaceBirthdayAssets.thumbnail.id,
        invitationPreview: spaceBirthdayAssets.invitationPreview.id,
        stickersPreview: spaceBirthdayAssets.stickersPreview.id,
        personalizedExample: spaceBirthdayAssets.personalizedExample.id,
      },
      celebrationType: "Cumpleanos infantiles",
      customizableFields: [
        "nombre",
        "edad",
        "fecha",
        "hora",
        "lugar",
        "mensaje adicional",
      ],
      heroCopy:
        "Una coleccion espacial para crear una invitacion clara, alegre y lista para imprimir.",
      missingAssets: [
        "Portada final de coleccion",
        "Miniatura de catalogo",
        "Preview final de Invitacion esencial",
        "Preview final de Stickers pack",
        "Ejemplo personalizado final",
      ],
      visualStyle:
        "Espacio infantil con cohetes, planetas, estrellas y colores brillantes aptos para impresion.",
    },
  },
];

export const pilotCollection = mockCollections[0];
