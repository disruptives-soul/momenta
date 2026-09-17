import { NextResponse } from "next/server";
import { mockCollections } from "@/features/collections/data/mock-collections";
import { getHeadlessCatalogObjects } from "@/features/products/services/headless-catalog-provisioning";
import {
  createStorageProvider,
  getStorageProviderName,
} from "@/infrastructure/storage/storage-provider-factory";

export const runtime = "nodejs";

type ProvisionRequestBody = {
  dryRun?: boolean;
};

function isAuthorized(request: Request) {
  const secret = process.env.MOMENTA_ADMIN_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!secret) {
    return false;
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const headerSecret = request.headers.get("x-momenta-admin-secret");

  return bearer === secret || headerSecret === secret;
}

async function getBody(request: Request): Promise<ProvisionRequestBody> {
  if (!request.body) {
    return {};
  }

  try {
    return (await request.json()) as ProvisionRequestBody;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await getBody(request);
  const objects = getHeadlessCatalogObjects(mockCollections);

  if (body.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      storage: getStorageProviderName(),
      objects: objects.map((object) => ({
        key: object.key,
        contentType: object.contentType,
        bytes: object.body.byteLength,
      })),
    });
  }

  const storage = createStorageProvider();

  await Promise.all(
    objects.map((object) =>
      storage.putObject({
        key: object.key,
        body: object.body,
        contentType: object.contentType,
      }),
    ),
  );

  return NextResponse.json({
    ok: true,
    storage: getStorageProviderName(),
    created: objects.length,
    keys: objects.map((object) => object.key),
  });
}

export function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const objects = getHeadlessCatalogObjects(mockCollections);

  return NextResponse.json({
    ok: true,
    storage: getStorageProviderName(),
    collections: mockCollections.length,
    products: mockCollections.reduce(
      (total, collection) => total + collection.products.length,
      0,
    ),
    objects: objects.map((object) => ({
      key: object.key,
      contentType: object.contentType,
      bytes: object.body.byteLength,
    })),
  });
}
