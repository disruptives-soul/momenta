import type { Product } from "@/domain";

export type PrototypeProduct = Product & {
  priceLabel?: string;
  prototype: {
    behavior: "simulated";
    ctaLabel: string;
    href: string;
    highlights: string[];
    visualFormat: string;
  };
};

export const spaceInvitationProduct: PrototypeProduct = {
  id: "prod_space_invitation",
  slug: "invitation",
  collectionId: "col_space_birthday",
  name: "Invitación esencial",
  description:
    "Invitación vertical gratuita para personalizar con los datos de la celebración.",
  access: "free",
  widthMm: 127,
  heightMm: 178,
  templateId: "tpl_space_invitation_v1",
  variables: [
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
    {
      key: "date",
      label: "Fecha",
      kind: "date",
      rule: {
        required: true,
        placeholder: "2026-09-12",
        displayFormat: "Sábado 12 de septiembre",
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
        placeholder: "Salón Cosmos",
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
    ctaLabel: "Personalizar gratis",
    href: "/collections/space-birthday/personalize",
    highlights: [
      "Vista previa personalizada",
      "Formato preparado para PNG y PDF",
      "Sin editor libre",
    ],
    visualFormat: "Invitación vertical 5 x 7 in",
  },
};

export const spaceStickersPackProduct: PrototypeProduct = {
  id: "prod_space_stickers_pack",
  slug: "stickers-pack",
  collectionId: "col_space_birthday",
  name: "Stickers pack",
  description:
    "Página A4 con 12 stickers circulares de 5 cm, coordinados con Space Birthday.",
  access: "premium",
  priceLabel: "ARS 1.990",
  widthMm: 210,
  heightMm: 297,
  templateId: "tpl_space_stickers_pack_v1",
  variables: [
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
  ],
  outputFormats: ["png", "pdf"],
  prototype: {
    behavior: "simulated",
    ctaLabel: "Ver Stickers pack",
    href: "/collections/space-birthday/stickers-pack",
    highlights: [
      "12 stickers circulares",
      "5 cm de diámetro",
      "Compra única",
    ],
    visualFormat: "Página A4 210 x 297 mm",
  },
};

export const mockProducts = [
  spaceInvitationProduct,
  spaceStickersPackProduct,
];
