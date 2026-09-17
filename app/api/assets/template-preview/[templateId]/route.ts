import { notFound } from "next/navigation";
import { getRenderingTemplateAsync } from "@/features/rendering/templates/headless-template-registry";
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
  const template = await getRenderingTemplateAsync(templateId);

  if (!template) {
    notFound();
  }

  return getStorageImageResponse({
    key: template.storage?.previewKey,
    fallbackPublicSrc:
      template.preview.src || "/momenta/space-birthday/previews/invitacion-a3.webp",
    contentType: "image/webp",
    fallbackContentType: "image/webp",
  });
}
