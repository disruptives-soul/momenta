export const spaceBirthdayAssets = {
  cover: {
    id: "space-birthday-cover",
    label: "Vista de coleccion",
    title: "Sunday in Bloom",
    description:
      "Coleccion infantil con ilustraciones suaves, flores, animales y globos.",
  },
  thumbnail: {
    id: "space-birthday-thumbnail",
    label: "Coleccion disponible",
    title: "Sunday in Bloom",
    description:
      "Disenos imprimibles coordinados para cumpleanos infantiles.",
  },
  invitationPreview: {
    id: "space-invitation-preview",
    label: "Invitacion",
    title: "Invitacion A3",
    description: "Personaliza los datos principales de la celebracion.",
  },
  personalizedExample: {
    id: "space-personalized-example",
    label: "Ejemplo personalizado",
    title: "Mateo cumple 7",
    description: "Nombre, edad, fecha, hora, lugar y mensaje en una sola pieza.",
  },
  stickersPreview: {
    id: "space-stickers-preview",
    label: "Stickers",
    title: "Stickers A3",
    description: "Lamina A3 con 12 stickers circulares.",
  },
  stickersSheet: {
    id: "space-stickers-sheet",
    label: "Lamina A3",
    title: "12 stickers circulares",
    description: "Diseno coordinado con Sunday in Bloom.",
  },
  bannerPreview: {
    id: "space-banner-preview",
    label: "Banner",
    title: "Banner 2 x 1 m",
    description: "Pieza horizontal para ambientar la celebracion.",
  },
  backingPreview: {
    id: "space-backing-preview",
    label: "Backing",
    title: "Backing 1 x 1 m",
    description: "Pieza cuadrada para fondo decorativo o fotos.",
  },
  downloadDemo: {
    id: "space-download-demo",
    fileName: "momenta-space-birthday-demo.pdf",
    label: "Archivo de prueba",
  },
} as const;

export const spaceBirthdayGalleryItems = [
  {
    id: "invitation-a3",
    label: "Invitacion",
    title: "Invitacion A3",
    description: "Archivo real derivado de INVITACION A3.jpg.",
    src: "/momenta/space-birthday/previews/invitacion-a3.webp",
    aspect: "portrait",
    editable: true,
    templateId: "space-birthday-invitation-v1",
  },
  {
    id: "stickers-a3",
    label: "Stickers",
    title: "Stickers A3",
    description: "Archivo real derivado de STICKERS A3.jpg.",
    src: "/momenta/space-birthday/previews/stickers-a3.webp",
    aspect: "portrait",
    editable: true,
    templateId: "sunday-in-bloom-stickers-a3-v1",
  },
  {
    id: "banner-2x1",
    label: "Banner",
    title: "Banner 2 x 1 m",
    description: "Archivo real derivado de BANNER 2mx1m-150.jpg.",
    src: "/momenta/space-birthday/previews/banner-2x1m.webp",
    aspect: "landscape",
    editable: true,
    templateId: "sunday-in-bloom-banner-2x1-v1",
  },
  {
    id: "backing-1x1",
    label: "Backing",
    title: "Backing 1 x 1 m",
    description: "Archivo real derivado de BACKING 1mx1m-150.jpg.",
    src: "/momenta/space-birthday/previews/backing-1x1m.webp",
    aspect: "square",
    editable: true,
    templateId: "sunday-in-bloom-backing-1x1-v1",
  },
] as const;
