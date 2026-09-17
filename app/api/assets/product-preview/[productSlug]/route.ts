import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/features/products/services/server-product-catalog";
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
  const product = await getCatalogProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  return getStorageImageResponse({
    key: product.assets?.previewKey,
    fallbackPublicSrc:
      product.prototype.previewSrc ||
      "/momenta/space-birthday/previews/invitacion-a3.webp",
    contentType: "image/webp",
    fallbackContentType: "image/webp",
  });
}
