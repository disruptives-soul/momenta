import { notFound } from "next/navigation";
import { getRenderingTemplate } from "@/features/rendering/templates/template-registry";
import { getStorageImageResponse } from "@/infrastructure/storage/storage-asset-response";

export const runtime = "nodejs";

type TemplatePreviewAssetRouteProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: TemplatePreviewAssetRouteProps,
) {
  const { templateId } = await params;
  const template = getRenderingTemplate(templateId);

  if (!template) {
    notFound();
  }

  return getStorageImageResponse({
    key: template.storage?.previewKey,
    fallbackPublicSrc: template.preview.src,
    contentType: "image/webp",
    fallbackContentType: "image/webp",
  });
}
