import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { createStorageProvider, getStorageProviderName } from "@/infrastructure/storage/storage-provider-factory";
import { getRenderingTemplateAsync } from "@/features/rendering/templates/headless-template-registry";
import { getMasterAssetPath } from "@/features/rendering/templates/load-runtime-template";

export const runtime = "nodejs";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
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
    try {
      const object = await createStorageProvider().getObject?.({
        key: template.storage.masterKey,
      });

      if (object?.body) {
        return new Response(bytesToBody(object.body), {
          headers: {
            ...PUBLIC_CACHE_HEADERS,
            "Content-Type": object.contentType ?? template.master.contentType,
            "X-Momenta-Asset-Source": getStorageProviderName(),
          },
        });
      }
    } catch (error) {
      console.warn(`Falling back to bundled master for ${template.id}.`, error);
    }
  }

  if (!template.master.path) {
    notFound();
  }

  const fallback = await readFile(getMasterAssetPath(template));

  return new Response(bytesToBody(fallback), {
    headers: {
      ...PUBLIC_CACHE_HEADERS,
      "Content-Type": template.master.contentType,
      "X-Momenta-Asset-Source": "bundled",
    },
  });
}
