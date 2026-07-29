import type { TemplateVariable } from "./template";

export type ProductAccess = "free" | "premium";

export type ProductOutputFormat = "png" | "pdf";

export type Product = {
  id: string;
  slug: string;
  collectionId: string;
  name: string;
  description: string;
  access: ProductAccess;
  widthMm: number;
  heightMm: number;
  templateId: string;
  variables: TemplateVariable[];
  outputFormats: ProductOutputFormat[];
};
