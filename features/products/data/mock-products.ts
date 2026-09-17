import type { Product } from "@/domain";

export const pieceTypes = [
  {
    id: "invitation",
    label: "Invitacion",
    pluralLabel: "Invitaciones",
  },
  {
    id: "stickers",
    label: "Stickers",
    pluralLabel: "Stickers",
  },
  {
    id: "banner",
    label: "Banner",
    pluralLabel: "Banners",
  },
  {
    id: "backing",
    label: "Backing",
    pluralLabel: "Backings",
  },
] as const;

const spaceCollection = {
  id: "col_space_birthday",
  slug: "space-birthday",
  name: "Space Birthday",
} as const;

function getSpaceProductAssets(pieceSlug: string) {
  const versionPrefix = `collections/${spaceCollection.slug}/${pieceSlug}/v1`;

  return {
    provider: "r2" as const,
    masterKey: `${versionPrefix}/master.jpg`,
    previewKey: `${versionPrefix}/preview.webp`,
    templateKey: `${versionPrefix}/template.json`,
    generatedPrefix: `generated/${spaceCollection.slug}/${pieceSlug}`,
  };
}

export type PrototypeProduct = Product & {
  catalogStatus?: "draft" | "needs_calibration" | "ready" | "published";
  priceLabel?: string;
  prototype: {
    behavior: "simulated";
    ctaLabel: string;
    href: string;
    highlights: string[];
    previewAlt: string;
    previewAspect: "portrait" | "landscape" | "square";
    previewSrc: string;
    visualFormat: string;
  };
};

const birthdayTextVariables: Product["variables"] = [
  {
    key: "name",
    label: "Nombre",
    kind: "text",
    rule: { required: true, maxLength: 30, placeholder: "Mateo" },
  },
  {
    key: "age",
    label: "Edad",
    kind: "number",
    rule: {
      required: true,
      maxLength: 2,
      minValue: 1,
      maxValue: 99,
      placeholder: "7",
    },
  },
];

export const spaceInvitationProduct: PrototypeProduct = {
  id: "prod_space_invitation",
  slug: "invitation",
  collectionId: spaceCollection.id,
  collectionSlug: spaceCollection.slug,
  collectionName: spaceCollection.name,
  collectionPieceId: "piece_space_invitation",
  pieceTypeId: "invitation",
  pieceTypeName: "Invitacion",
  printProfileId: "a3-portrait",
  name: "Invitacion Bosque",
  description:
    "Invitacion vertical gratuita para personalizar con los datos de la celebracion.",
  access: "free",
  widthMm: 297,
  heightMm: 420,
  templateId: "tpl_space_invitation_v1",
  assets: getSpaceProductAssets("invitation-a3"),
  variables: [
    ...birthdayTextVariables,
    {
      key: "date",
      label: "Fecha",
      kind: "date",
      rule: {
        required: true,
        placeholder: "2026-09-12",
        displayFormat: "Sabado 12 de septiembre",
      },
    },
    {
      key: "time",
      label: "Hora",
      kind: "time",
      rule: {
        required: true,
        placeholder: "15:30",
        displayFormat: "15:30 h",
      },
    },
    {
      key: "place",
      label: "Lugar",
      kind: "text",
      rule: {
        required: true,
        maxLength: 60,
        placeholder: "Salon Cosmos",
      },
    },
    {
      key: "message",
      label: "Mensaje adicional",
      kind: "text",
      rule: {
        required: false,
        maxLength: 120,
        placeholder: "Te esperamos",
      },
    },
  ],
  outputFormats: ["png", "pdf"],
  prototype: {
    behavior: "simulated",
    ctaLabel: "Ver producto",
    href: "/products/invitation",
    highlights: [
      "Vista previa personalizada",
      "Formato preparado para PNG y PDF",
      "Arte real desde INVITACION A3.jpg",
    ],
    previewAlt: "Invitacion A3 Sunday in Bloom",
    previewAspect: "portrait",
    previewSrc: "/momenta/space-birthday/previews/invitacion-a3.webp",
    visualFormat: "Invitacion A3 297 x 420 mm",
  },
};

export const spaceStickersPackProduct: PrototypeProduct = {
  id: "prod_space_stickers_pack",
  slug: "stickers-pack",
  collectionId: spaceCollection.id,
  collectionSlug: spaceCollection.slug,
  collectionName: spaceCollection.name,
  collectionPieceId: "piece_space_stickers_a3",
  pieceTypeId: "stickers",
  pieceTypeName: "Stickers",
  printProfileId: "stickers-a3-portrait",
  name: "Stickers A3",
  description:
    "Lamina A3 con 12 stickers circulares coordinados con Sunday in Bloom.",
  access: "premium",
  priceLabel: "ARS 6.00",
  widthMm: 297,
  heightMm: 420,
  templateId: "tpl_space_stickers_pack_v1",
  assets: getSpaceProductAssets("stickers-a3"),
  variables: birthdayTextVariables,
  outputFormats: ["png", "pdf"],
  prototype: {
    behavior: "simulated",
    ctaLabel: "Ver producto",
    href: "/products/stickers-pack",
    highlights: [
      "12 stickers circulares",
      "Lamina A3",
      "Arte real desde STICKERS A3.jpg",
    ],
    previewAlt: "Lamina A3 de stickers Sunday in Bloom",
    previewAspect: "portrait",
    previewSrc: "/momenta/space-birthday/previews/stickers-a3.webp",
    visualFormat: "Stickers A3 297 x 420 mm",
  },
};

export const spaceBannerProduct: PrototypeProduct = {
  id: "prod_space_banner",
  slug: "banner",
  collectionId: spaceCollection.id,
  collectionSlug: spaceCollection.slug,
  collectionName: spaceCollection.name,
  collectionPieceId: "piece_space_banner_2x1",
  pieceTypeId: "banner",
  pieceTypeName: "Banner",
  printProfileId: "banner-2x1-landscape",
  name: "Banner 2 x 1 m",
  description:
    "Banner horizontal coordinado para ambientar la mesa o fondo de cumpleanos.",
  access: "premium",
  priceLabel: "ARS 8.00",
  widthMm: 2000,
  heightMm: 1000,
  templateId: "tpl_space_banner_v1",
  assets: getSpaceProductAssets("banner-2x1m"),
  variables: [],
  outputFormats: ["png", "pdf"],
  prototype: {
    behavior: "simulated",
    ctaLabel: "Ver pieza",
    href: "/products/banner",
    highlights: [
      "Formato horizontal 2 x 1 m",
      "Arte real desde BANNER 2mx1m-150.jpg",
      "Preparado como asset de coleccion",
    ],
    previewAlt: "Banner horizontal Sunday in Bloom",
    previewAspect: "landscape",
    previewSrc: "/momenta/space-birthday/previews/banner-2x1m.webp",
    visualFormat: "Banner 2000 x 1000 mm",
  },
};

export const spaceBackingProduct: PrototypeProduct = {
  id: "prod_space_backing",
  slug: "backing",
  collectionId: spaceCollection.id,
  collectionSlug: spaceCollection.slug,
  collectionName: spaceCollection.name,
  collectionPieceId: "piece_space_backing_1x1",
  pieceTypeId: "backing",
  pieceTypeName: "Backing",
  printProfileId: "backing-1x1-square",
  name: "Backing 1 x 1 m",
  description:
    "Backing cuadrado para fondo decorativo, fotos o mesa principal.",
  access: "premium",
  priceLabel: "ARS 5.00",
  widthMm: 1000,
  heightMm: 1000,
  templateId: "tpl_space_backing_v1",
  assets: getSpaceProductAssets("backing-1x1m"),
  variables: [],
  outputFormats: ["png", "pdf"],
  prototype: {
    behavior: "simulated",
    ctaLabel: "Ver pieza",
    href: "/products/backing",
    highlights: [
      "Formato cuadrado 1 x 1 m",
      "Arte real desde BACKING 1mx1m-150.jpg",
      "Preparado como asset de coleccion",
    ],
    previewAlt: "Backing cuadrado Sunday in Bloom",
    previewAspect: "square",
    previewSrc: "/momenta/space-birthday/previews/backing-1x1m.webp",
    visualFormat: "Backing 1000 x 1000 mm",
  },
};

export const mockProducts = [
  spaceInvitationProduct,
  spaceStickersPackProduct,
  spaceBannerProduct,
  spaceBackingProduct,
];
