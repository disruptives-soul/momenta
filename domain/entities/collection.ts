export type CollectionStatus = "draft" | "published" | "archived";

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: CollectionStatus;
  coverAssetId?: string;
  productIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};
