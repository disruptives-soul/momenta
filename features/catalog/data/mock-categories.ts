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
    name: "Cumpleanos infantiles",
    status: "active",
    description:
      "Colecciones imprimibles para cumpleanos infantiles con personalizacion guiada.",
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
    name: "Bautismo y comunion",
    status: "coming-soon",
    description: "Disenos imprimibles para bautismo y comunion.",
  },
];

export const activePilotCategory = mockCategories[0];
