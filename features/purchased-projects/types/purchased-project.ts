import type { TextElement } from "@/features/rendering/templates/template-types";

export type GeneratedVersion = {
  id: string;
  projectId: string;
  createdAt: string;
  fileName?: string;
  storageKey?: string;
};

export type PurchasedProductSnapshot = {
  id: string;
  slug: string;
  name: string;
  pieceTypeName: string;
  collectionSlug: string;
  collectionName: string;
  widthMm: number;
  heightMm: number;
  outputFormats: string[];
  priceLabel?: string;
  previewSrc?: string;
  previewAlt?: string;
  visualFormat?: string;
};

export type PurchasedTemplateSnapshot = {
  id: string;
  printProfileId: string;
  widthMm: number;
  heightMm: number;
};

export type PurchasedProject = {
  id: string;
  userId: string;
  productId: string;
  templateId: string;
  product: PurchasedProductSnapshot;
  template: PurchasedTemplateSnapshot;
  scene: TextElement[];
  purchasedAt: string;
  editableUntil: string;
  reactivationCount: number;
  generatedVersions: GeneratedVersion[];
};

export interface PurchasedProjectRepository {
  listByUser(userId: string): Promise<PurchasedProject[]>;
  getById(id: string): Promise<PurchasedProject | null>;
  create(project: PurchasedProject): Promise<void>;
  update(project: PurchasedProject): Promise<void>;
}
