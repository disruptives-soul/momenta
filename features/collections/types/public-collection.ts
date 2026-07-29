import type { Product } from "@/domain";

export type PublicCollection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  products: Product[];
  prototype?: {
    assets: {
      cover: string;
      thumbnail: string;
      invitationPreview: string;
      stickersPreview: string;
      personalizedExample: string;
    };
    celebrationType: string;
    customizableFields: string[];
    heroCopy: string;
    missingAssets: string[];
    visualStyle: string;
  };
};
