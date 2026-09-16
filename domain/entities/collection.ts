export type CollectionStatus = "draft" | "published" | "archived";
export type CollectionPieceStatus = "draft" | "ready" | "published";

export type PieceType = {
  id: string;
  label: string;
  pluralLabel: string;
};

export type CollectionPiece = {
  id: string;
  collectionId: string;
  pieceTypeId: string;
  productId: string;
  templateId: string;
  printProfileId: string;
  status: CollectionPieceStatus;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: CollectionStatus;
  coverAssetId?: string;
  pieces: CollectionPiece[];
  productIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};
