import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createStorageProvider,
  getStorageProviderName,
} from "@/infrastructure/storage/storage-provider-factory";

export const runtime = "nodejs";

type CatalogCollectionPayload = {
  slug: string;
  name: string;
  description?: string;
};

type CatalogProductPayload = {
  slug: string;
  name: string;
  pieceType: string;
  price: number;
  visualFormat: string;
  widthMm: number;
  heightMm: number;
  printProfileId: string;
  templateId: string;
  status?: string;
};

type CatalogPrintProfilePayload = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  targetPpi: number;
  designMasterPpi: number;
  instructionsKey?: string;
};

type CatalogTemplatePayload = {
  id: string;
  status?: string;
  safeArea: {
    insetMm: number;
  };
  allowedColors: string[];
  allowedFonts?: string[];
  defaultFont?: string;
  defaultFill?: string;
  textElements: unknown[];
};

type CatalogAssetsPayload = {
  masterUrl: string;
  previewUrl: string;
};

type CatalogSyncPayload = {
  event: string;
  collection: CatalogCollectionPayload;
  product: CatalogProductPayload;
  printProfile: CatalogPrintProfilePayload;
  template: CatalogTemplatePayload;
  assets: CatalogAssetsPayload;
};

type CatalogStatus = "draft" | "needs_calibration" | "ready" | "published";

type CatalogStorageKeys = {
  masterKey: string;
  previewKey: string;
  templateKey: string;
  productKey: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
) {
  const value = source[key];

  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path}.${key} is required.`);
    return "";
  }

  return value.trim();
}

function readOptionalString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function readRequiredNumber(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
) {
  const value = source[key];
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    errors.push(`${path}.${key} must be a valid number.`);
    return 0;
  }

  return numeric;
}

function readStringArray(source: Record<string, unknown>, key: string) {
  const value = source[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parsePayload(body: unknown): CatalogSyncPayload {
  const errors: string[] = [];

  if (!isRecord(body)) {
    throw new Error("Payload must be a JSON object.");
  }

  const event = readRequiredString(body, "event", "payload", errors);

  if (event !== "product.published") {
    errors.push("payload.event must be product.published.");
  }

  const collectionSource = isRecord(body.collection) ? body.collection : null;
  const productSource = isRecord(body.product) ? body.product : null;
  const printProfileSource = isRecord(body.printProfile) ? body.printProfile : null;
  const templateSource = isRecord(body.template) ? body.template : null;
  const safeAreaSource =
    templateSource && isRecord(templateSource.safeArea)
      ? templateSource.safeArea
      : null;
  const assetsSource = isRecord(body.assets) ? body.assets : null;

  if (!collectionSource) errors.push("payload.collection is required.");
  if (!productSource) errors.push("payload.product is required.");
  if (!printProfileSource) errors.push("payload.printProfile is required.");
  if (!templateSource) errors.push("payload.template is required.");
  if (!safeAreaSource) errors.push("payload.template.safeArea is required.");
  if (!assetsSource) errors.push("payload.assets is required.");

  const collection = collectionSource ?? {};
  const product = productSource ?? {};
  const printProfile = printProfileSource ?? {};
  const template = templateSource ?? {};
  const safeArea = safeAreaSource ?? {};
  const assets = assetsSource ?? {};

  const payload: CatalogSyncPayload = {
    event,
    collection: {
      slug: readRequiredString(collection, "slug", "collection", errors),
      name: readRequiredString(collection, "name", "collection", errors),
      description: readOptionalString(collection, "description"),
    },
    product: {
      slug: readRequiredString(product, "slug", "product", errors),
      name: readRequiredString(product, "name", "product", errors),
      pieceType: readRequiredString(product, "pieceType", "product", errors),
      price: readRequiredNumber(product, "price", "product", errors),
      visualFormat: readRequiredString(
        product,
        "visualFormat",
        "product",
        errors,
      ),
      widthMm: readRequiredNumber(product, "widthMm", "product", errors),
      heightMm: readRequiredNumber(product, "heightMm", "product", errors),
      printProfileId: readRequiredString(
        product,
        "printProfileId",
        "product",
        errors,
      ),
      templateId: readRequiredString(product, "templateId", "product", errors),
      status: readOptionalString(product, "status"),
    },
    printProfile: {
      id: readRequiredString(printProfile, "id", "printProfile", errors),
      label: readRequiredString(printProfile, "label", "printProfile", errors),
      widthMm: readRequiredNumber(
        printProfile,
        "widthMm",
        "printProfile",
        errors,
      ),
      heightMm: readRequiredNumber(
        printProfile,
        "heightMm",
        "printProfile",
        errors,
      ),
      targetPpi: readRequiredNumber(
        printProfile,
        "targetPpi",
        "printProfile",
        errors,
      ),
      designMasterPpi: readRequiredNumber(
        printProfile,
        "designMasterPpi",
        "printProfile",
        errors,
      ),
      instructionsKey: readOptionalString(printProfile, "instructionsKey"),
    },
    template: {
      id: readRequiredString(template, "id", "template", errors),
      status: readOptionalString(template, "status"),
      safeArea: {
        insetMm: readRequiredNumber(safeArea, "insetMm", "template.safeArea", errors),
      },
      allowedColors: readStringArray(template, "allowedColors"),
      allowedFonts: readStringArray(template, "allowedFonts"),
      defaultFont: readOptionalString(template, "defaultFont"),
      defaultFill: readOptionalString(template, "defaultFill"),
      textElements: Array.isArray(template.textElements)
        ? template.textElements
        : [],
    },
    assets: {
      masterUrl: readRequiredString(assets, "masterUrl", "assets", errors),
      previewUrl: readRequiredString(assets, "previewUrl", "assets", errors),
    },
  };

  if (payload.product.templateId !== payload.template.id) {
    errors.push("product.templateId must match template.id.");
  }

  if (payload.product.printProfileId !== payload.printProfile.id) {
    errors.push("product.printProfileId must match printProfile.id.");
  }

  if (payload.product.widthMm <= 0 || payload.product.heightMm <= 0) {
    errors.push("product physical dimensions must be greater than zero.");
  }

  if (payload.template.safeArea.insetMm < 0) {
    errors.push("template.safeArea.insetMm cannot be negative.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return payload;
}

function getStorageKeys(payload: CatalogSyncPayload): CatalogStorageKeys {
  const base = `collections/${payload.collection.slug}/${payload.product.slug}/v1`;

  return {
    masterKey: `${base}/master.jpg`,
    previewKey: `${base}/preview.webp`,
    templateKey: `${base}/template.json`,
    productKey: `${base}/_product.json`,
  };
}

function getCatalogStatus(payload: CatalogSyncPayload): CatalogStatus {
  const status = payload.template.status ?? payload.product.status;

  if (
    status === "draft" ||
    status === "needs_calibration" ||
    status === "ready" ||
    status === "published"
  ) {
    return status;
  }

  return payload.template.textElements.length > 0
    ? "published"
    : "needs_calibration";
}

function getTemplateObject(payload: CatalogSyncPayload, keys: CatalogStorageKeys) {
  const status = getCatalogStatus(payload);

  return {
    id: payload.template.id,
    status,
    collectionSlug: payload.collection.slug,
    productSlug: payload.product.slug,
    widthMm: payload.product.widthMm,
    heightMm: payload.product.heightMm,
    printProfile: payload.printProfile,
    safeArea: payload.template.safeArea,
    allowedColors: payload.template.allowedColors,
    allowedFonts: payload.template.allowedFonts ?? [],
    defaultFont: payload.template.defaultFont,
    defaultFill: payload.template.defaultFill,
    textElements: payload.template.textElements,
    assets: {
      masterKey: keys.masterKey,
      previewKey: keys.previewKey,
    },
  };
}

function getProductObject(
  payload: CatalogSyncPayload,
  keys: CatalogStorageKeys,
  storage: string,
) {
  const status = getCatalogStatus(payload);

  return {
    collection: payload.collection,
    product: {
      ...payload.product,
      status,
      outputFormats: ["png", "pdf"],
      assets: {
        provider: storage,
        masterKey: keys.masterKey,
        previewKey: keys.previewKey,
        templateKey: keys.templateKey,
      },
    },
    printProfile: payload.printProfile,
    templateId: payload.template.id,
    syncedAt: new Date().toISOString(),
  };
}

function revalidateCatalogPaths(payload: CatalogSyncPayload) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/collections/${payload.collection.slug}`);
  revalidatePath(`/products/${payload.product.slug}`);
  revalidatePath(`/products/${payload.product.slug}/personalize`);
}

async function downloadAsset(url: string, fallbackContentType: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Asset download failed for ${url}: ${response.status}`);
  }

  return {
    body: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? fallbackContentType,
  };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

async function upsertRows(table: string, rows: unknown[]) {
  if (rows.length === 0) {
    return;
  }

  const config = getSupabaseConfig();

  if (!config) {
    return;
  }

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed for ${table}: ${response.status} ${await response.text()}`,
    );
  }
}

async function saveCatalogMetadataToSupabase(
  payload: CatalogSyncPayload,
  keys: CatalogStorageKeys,
  storage: string,
) {
  if (!getSupabaseConfig()) {
    return { skipped: true as const };
  }

  const syncedAt = new Date().toISOString();

  await upsertRows("momenta_catalog_collections", [
    {
      slug: payload.collection.slug,
      name: payload.collection.name,
      description: payload.collection.description ?? null,
      updated_at: syncedAt,
    },
  ]);

  await upsertRows("momenta_catalog_products", [
    {
      id: `${payload.collection.slug}:${payload.product.slug}`,
      collection_slug: payload.collection.slug,
      slug: payload.product.slug,
      name: payload.product.name,
      piece_type: payload.product.pieceType,
      price: payload.product.price,
      visual_format: payload.product.visualFormat,
      width_mm: payload.product.widthMm,
      height_mm: payload.product.heightMm,
      print_profile_id: payload.printProfile.id,
      template_id: payload.template.id,
      storage_provider: storage,
      storage_keys: keys,
      product_payload: getProductObject(payload, keys, storage).product,
      print_profile_payload: payload.printProfile,
      updated_at: syncedAt,
    },
  ]);

  await upsertRows("momenta_catalog_templates", [
    {
      id: payload.template.id,
      collection_slug: payload.collection.slug,
      product_slug: payload.product.slug,
      template_payload: getTemplateObject(payload, keys),
      updated_at: syncedAt,
    },
  ]);

  return { skipped: false as const };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: CatalogSyncPayload;

  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid catalog sync payload.",
        detail: getErrorMessage(error),
      },
      { status: 400 },
    );
  }

  const storage = createStorageProvider();
  const storageName = getStorageProviderName();
  const keys = getStorageKeys(payload);
  const createdKeys: string[] = [];

  try {
    const [master, preview] = await Promise.all([
      downloadAsset(payload.assets.masterUrl, "image/jpeg"),
      downloadAsset(payload.assets.previewUrl, "image/webp"),
    ]);
    const templateObject = getTemplateObject(payload, keys);
    const productObject = getProductObject(payload, keys, storageName);

    await storage.putObject({
      key: keys.masterKey,
      body: master.body,
      contentType: master.contentType,
    });
    createdKeys.push(keys.masterKey);

    await storage.putObject({
      key: keys.previewKey,
      body: preview.body,
      contentType: preview.contentType,
    });
    createdKeys.push(keys.previewKey);

    await storage.putObject({
      key: keys.templateKey,
      body: new TextEncoder().encode(JSON.stringify(templateObject, null, 2)),
      contentType: "application/json",
    });
    createdKeys.push(keys.templateKey);

    await storage.putObject({
      key: keys.productKey,
      body: new TextEncoder().encode(JSON.stringify(productObject, null, 2)),
      contentType: "application/json",
    });
    createdKeys.push(keys.productKey);

    const supabase = await saveCatalogMetadataToSupabase(
      payload,
      keys,
      storageName,
    );

    revalidateCatalogPaths(payload);

    return NextResponse.json({
      ok: true,
      collectionSlug: payload.collection.slug,
      productSlug: payload.product.slug,
      templateId: payload.template.id,
      storage: storageName,
      keys,
      createdKeys,
      supabase,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Catalog sync failed.",
        detail: getErrorMessage(error),
        storage: storageName,
        created: createdKeys.length,
        createdKeys,
      },
      { status: 500 },
    );
  }
}
