import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/products/services/product-catalog";
import { getStorageImageResponse } from "@/infrastructure/storage/storage-asset-response";

export const runtime = "nodejs";

type ProductPreviewAssetRouteProps = {
  params: Promise<{
    productSlug: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ProductPreviewAssetRouteProps,
) {
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  return getStorageImageResponse({
    key: product.assets?.previewKey,
    fallbackPublicSrc: product.prototype.previewSrc,
    contentType: "image/webp",
    fallbackContentType: "image/webp",
  });
}
