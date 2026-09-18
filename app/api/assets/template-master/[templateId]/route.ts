import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { getRenderingTemplateAsync } from "@/features/rendering/templates/headless-template-registry";
import { getMasterAssetPath } from "@/features/rendering/templates/load-runtime-template";
import { getStorageImageResponse } from "@/infrastructure/storage/storage-asset-response";

export const runtime = "nodejs";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
};
const DEV_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

type TemplateMasterAssetRouteProps = {
  params: Promise<{
    templateId: string;
  }>;
};

function bytesToBody(bytes: Uint8Array) {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return body;
}

function getAssetCacheHeaders() {
  return process.env.NODE_ENV === "development"
    ? DEV_CACHE_HEADERS
    : PUBLIC_CACHE_HEADERS;
}

export async function GET(
  _request: Request,
  { params }: TemplateMasterAssetRouteProps,
) {
  const { templateId } = await params;
  const template = await getRenderingTemplateAsync(templateId);

  if (!template) {
    notFound();
  }

  if (template.storage?.masterKey) {
    return getStorageImageResponse({
      key: template.storage.masterKey,
      fallbackKey: template.storage.previewKey,
      contentType: template.master.contentType,
    });
  }

  if (!template.master.path) {
    notFound();
  }

  const fallback = await readFile(getMasterAssetPath(template));

  return new Response(bytesToBody(fallback), {
    headers: {
      ...getAssetCacheHeaders(),
      "Content-Type": template.master.contentType,
      "X-Momenta-Asset-Source": "bundled",
    },
  });
}
