import type { InvitationTemplate } from "./template-types";

export const backing1x1Template: InvitationTemplate = {
  id: "sunday-in-bloom-backing-1x1-v1",
  collectionSlug: "space-birthday",
  productCode: "backing-1x1",
  widthMm: 1000,
  heightMm: 1000,
  widthPx: 5907,
  heightPx: 5906,
  master: {
    path: "space-birthday/invitation/BACKING 1mx1m-150.jpg",
    contentType: "image/jpeg",
  },
  preview: {
    src: "/momenta/space-birthday/backing/preview.webp",
    widthPx: 760,
  },
  artwork: {
    src: "/momenta/space-birthday/backing/preview.webp",
    contentType: "image/webp",
  },
  fields: {
    monogram: {
      label: "Texto principal",
      defaultValue: "S & M",
      x: 2953,
      y: 1420,
      width: 4000,
      fontFamily: "Arial, Helvetica, sans-serif",
      pdfFont: "helvetica",
      fontSize: 900,
      minFontSize: 420,
      fill: "#8e9678",
      align: "center",
      maxLines: 1,
    },
    eventName: {
      label: "Subtitulo",
      defaultValue: "Anniversary",
      x: 2953,
      y: 2300,
      width: 2700,
      fontFamily: "Arial, Helvetica, sans-serif",
      pdfFont: "helvetica",
      fontSize: 230,
      minFontSize: 120,
      fill: "#9b9488",
      align: "center",
      maxLines: 1,
      letterSpacing: 22,
    },
  },
};
