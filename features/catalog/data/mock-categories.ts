export type MockCategory = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "coming-soon";
  description: string;
};

export const mockCategories: MockCategory[] = [
  {
    id: "cat_childrens_birthdays",
    slug: "childrens-birthdays",
    name: "Cumpleaños infantiles",
    status: "active",
    description:
      "Colecciones imprimibles para cumpleaños infantiles con personalización guiada.",
  },
  {
    id: "cat_baby_shower",
    slug: "baby-shower",
    name: "Baby shower",
    status: "coming-soon",
    description: "Nuevas colecciones para baby shower.",
  },
  {
    id: "cat_baptism_communion",
    slug: "baptism-communion",
    name: "Bautismo y comunión",
    status: "coming-soon",
    description: "Diseños imprimibles para bautismo y comunión.",
  },
];

export const activePilotCategory = mockCategories[0];
