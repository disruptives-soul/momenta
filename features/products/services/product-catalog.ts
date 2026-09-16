import { mockProducts, type PrototypeProduct } from "../data/mock-products";
import { renderingTemplates } from "@/features/rendering/templates/template-registry";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";

export function listProducts() {
  return mockProducts;
}

export function getProductBySlug(productSlug: string) {
  return mockProducts.find((product) => product.slug === productSlug) ?? null;
}

export function getRelatedProducts(product: PrototypeProduct) {
  return mockProducts.filter(
    (item) =>
      item.collectionSlug === product.collectionSlug && item.id !== product.id,
  );
}

export function getRenderingTemplateForProduct(product: PrototypeProduct) {
  return (
    renderingTemplates.find(
      (template) => template.printProfile.id === product.printProfileId,
    ) ?? null
  );
}

export function getProductForRenderingTemplate(template: InvitationTemplate) {
  return (
    mockProducts.find(
      (product) => product.printProfileId === template.printProfile.id,
    ) ?? null
  );
}
