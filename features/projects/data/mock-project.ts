export const demoProjectId = "demo-space-birthday";

export const demoProject = {
  id: demoProjectId,
  collectionSlug: "space-birthday",
  productSlug: "invitation",
  status: "draft",
  variables: {
    name: "Mateo",
    age: "7",
    date: "2026-09-12",
    time: "15:30",
    place: "Salón Cosmos",
    message: "Te esperamos",
  },
  displayValues: {
    date: "Sábado 12 de septiembre",
    time: "15:30 h",
  },
} as const;
