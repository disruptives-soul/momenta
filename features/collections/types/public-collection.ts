import type { CollectionPiece, Product } from "@/domain";

export type PublicCollection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  pieces: CollectionPiece[];
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
