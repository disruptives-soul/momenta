import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import type { StorageProvider } from "@/services/ports/storage-provider";
import { LocalFileStorageProvider } from "./local-file-storage-provider";
import {
  createStorageProvider,
  getStorageProviderName,
} from "./storage-provider-factory";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
};
const DEV_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};
const STORAGE_READ_TIMEOUT_MS = 4_000;

function getAssetCacheHeaders() {
  return process.env.NODE_ENV === "development"
    ? DEV_CACHE_HEADERS
    : PUBLIC_CACHE_HEADERS;
}

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

function imageResponse(input: {
  body: Uint8Array;
  contentType?: string;
  fallbackContentType: string;
  source: string;
}) {
  return new Response(bytesToBody(input.body), {
    headers: {
      ...getAssetCacheHeaders(),
      "Content-Type": input.contentType ?? input.fallbackContentType,
      "X-Momenta-Asset-Source": input.source,
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, label: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out`)),
          STORAGE_READ_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function readStorageImage(input: {
  key: string;
  provider: StorageProvider;
  source: string;
  contentType: string;
}) {
  if (!input.provider.getObject) {
    return null;
  }

  try {
    const object = await withTimeout(
      input.provider.getObject({ key: input.key }),
      `${input.source} asset read for ${input.key}`,
    );

    if (!object?.body) {
      return null;
    }

    return imageResponse({
      body: object.body,
      contentType: object.contentType,
      fallbackContentType: input.contentType,
      source: input.source,
    });
  } catch (error) {
    console.warn(`Asset read failed from ${input.source} for ${input.key}.`, error);
    return null;
  }
}

function uniqueKeys(keys: Array<string | undefined>) {
  return keys.filter((key, index, list): key is string => {
    return Boolean(key) && list.indexOf(key) === index;
  });
}

export async function getStorageImageResponse(input: {
  key?: string;
  fallbackKey?: string;
  fallbackPublicSrc?: string;
  fallbackContentType?: string;
  contentType: string;
}) {
  const keys = uniqueKeys([input.key, input.fallbackKey]);
  const primaryProvider = createStorageProvider();
  const primarySource = getStorageProviderName();

  for (const key of keys) {
    const response = await readStorageImage({
      key,
      provider: primaryProvider,
      source: primarySource,
      contentType: input.contentType,
    });

    if (response) {
      return response;
    }
  }

  if (primarySource !== "local-file") {
    const localProvider = new LocalFileStorageProvider();

    for (const key of keys) {
      const response = await readStorageImage({
        key,
        provider: localProvider,
        source: "local-file",
        contentType: input.contentType,
      });

      if (response) {
        return response;
      }
    }
  }

  if (!input.fallbackPublicSrc) {
    return new Response("Asset not found", { status: 404 });
  }

  const fallback = await readFile(getPublicAssetPath(input.fallbackPublicSrc));

  return imageResponse({
    body: fallback,
    contentType: input.fallbackContentType ?? input.contentType,
    fallbackContentType: input.contentType,
    source: "public",
  });
}
