import { NextResponse } from "next/server";
import {
  createStorageProvider,
  getStorageProviderName,
} from "@/infrastructure/storage/storage-provider-factory";

export const runtime = "nodejs";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key is required." }, { status: 400 });
  }

  try {
    const object = await createStorageProvider().getObject?.({ key });

    return NextResponse.json({
      ok: true,
      key,
      storage: getStorageProviderName(),
      bytes: object?.body.byteLength ?? 0,
      contentType: object?.contentType,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        key,
        storage: getStorageProviderName(),
        detail: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
