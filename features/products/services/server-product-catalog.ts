import {
  getProductBySlug as getStaticProductBySlug,
  getRelatedProducts as getStaticRelatedProducts,
  listProducts as listStaticProducts,
} from "./product-catalog";
import {
  getHeadlessProductBySlug,
  isPublicProduct,
  listHeadlessProducts,
} from "./headless-catalog";
import type { PrototypeProduct } from "../data/mock-products";

function mergeProducts(
  headlessProducts: PrototypeProduct[],
  staticProducts: PrototypeProduct[],
) {
  return Array.from(
    new Map(
      [...staticProducts, ...headlessProducts].map((product) => [
        product.slug,
        product,
      ]),
    ).values(),
  );
}

export async function listCatalogProducts() {
  const [allHeadlessProducts, publicHeadlessProducts] = await Promise.all([
    listHeadlessProducts({ includeUnpublished: true }),
    listHeadlessProducts(),
  ]);

  if (allHeadlessProducts.length > 0) {
    return publicHeadlessProducts;
  }

  const reservedHeadlessSlugs = new Set(
    allHeadlessProducts.map((product) => product.slug),
  );
  const staticProducts = listStaticProducts().filter(
    (product) => !reservedHeadlessSlugs.has(product.slug),
  );

  return mergeProducts(publicHeadlessProducts, staticProducts);
}

export async function getCatalogProductBySlug(productSlug: string) {
  const [allHeadlessProducts, headlessProduct] = await Promise.all([
    listHeadlessProducts({ includeUnpublished: true }),
    getHeadlessProductBySlug(productSlug, {
      includeUnpublished: true,
    }),
  ]);

  if (headlessProduct) {
    return isPublicProduct(headlessProduct) ? headlessProduct : null;
  }

  if (allHeadlessProducts.length > 0) {
    return null;
  }

  return getStaticProductBySlug(productSlug);
}

export async function getCatalogRelatedProducts(product: PrototypeProduct) {
  const products = await listCatalogProducts();
  const related = products.filter(
    (item) =>
      item.collectionSlug === product.collectionSlug && item.id !== product.id,
  );

  return related.length > 0 ? related : getStaticRelatedProducts(product);
}
