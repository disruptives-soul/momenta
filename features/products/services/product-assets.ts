import type { PrototypeProduct } from "../data/mock-products";

export function getProductPreviewAssetSrc(product: PrototypeProduct) {
  if (!product.assets?.previewKey) {
    return product.prototype.previewSrc;
  }

  return `/api/assets/product-preview/${product.slug}`;
}
