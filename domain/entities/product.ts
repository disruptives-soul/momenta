import type { TemplateVariable } from "./template";

export type ProductAccess = "free" | "premium";

export type ProductOutputFormat = "png" | "pdf";

export type ProductStorageAssets = {
  provider: "local" | "r2";
  masterKey: string;
  previewKey: string;
  templateKey: string;
  generatedPrefix: string;
  fontKeys?: string[];
};

export type Product = {
  id: string;
  slug: string;
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
  collectionPieceId: string;
  pieceTypeId: string;
  pieceTypeName: string;
  printProfileId: string;
  name: string;
  description: string;
  access: ProductAccess;
  widthMm: number;
  heightMm: number;
  templateId: string;
  assets?: ProductStorageAssets;
  variables: TemplateVariable[];
  outputFormats: ProductOutputFormat[];
};
