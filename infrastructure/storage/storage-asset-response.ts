import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { createStorageProvider } from "./storage-provider-factory";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
};

function bytesToBody(bytes: Uint8Array) {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return body;
}

function getPublicAssetPath(src: string) {
  const normalizedSrc = src.replace(/^\/+/, "");
  const publicRoot = join(process.cwd(), "public");
  const targetPath = normalize(join(publicRoot, normalizedSrc));

  if (!targetPath.startsWith(publicRoot)) {
    throw new Error(`Invalid public asset path: ${src}`);
  }

  return targetPath;
}

export async function getStorageImageResponse(input: {
  key?: string;
  fallbackPublicSrc: string;
  fallbackContentType?: string;
  contentType: string;
}) {
  if (input.key) {
    try {
      const object = await createStorageProvider().getObject?.({
        key: input.key,
      });

      if (object?.body) {
        return new Response(bytesToBody(object.body), {
          headers: {
            ...PUBLIC_CACHE_HEADERS,
            "Content-Type": object.contentType ?? input.contentType,
            "X-Momenta-Asset-Source": "r2",
          },
        });
      }
    } catch (error) {
      console.warn(`Falling back to local preview for ${input.key}.`, error);
    }
  }

  const fallback = await readFile(getPublicAssetPath(input.fallbackPublicSrc));

  return new Response(bytesToBody(fallback), {
    headers: {
      ...PUBLIC_CACHE_HEADERS,
      "Content-Type": input.fallbackContentType ?? input.contentType,
      "X-Momenta-Asset-Source": "local",
    },
  });
}
