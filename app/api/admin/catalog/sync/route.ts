import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createStorageProvider,
  getStorageProviderName,
} from "@/infrastructure/storage/storage-provider-factory";
import {
  getIllustratorFontFamilies,
  getIllustratorMasterPpi,
  importIllustratorTemplate,
  isIllustratorTemplateExport,
} from "@/features/rendering/templates/illustrator-template-importer";
import { getBundledGoogleFontFamily } from "@/features/rendering/templates/google-font-assets";

export const runtime = "nodejs";
export const maxDuration = 60;

type CatalogSyncEvent =
  | "product.deleted"
  | "product.published"
  | "product.trashed"
  | "product.unpublished";

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
  illustratorTemplateUrl?: string;
  templateSourceUrl?: string;
};

type CatalogSyncPayload = {
  event: CatalogSyncEvent;
  collection: CatalogCollectionPayload;
  product: CatalogProductPayload;
  printProfile: CatalogPrintProfilePayload;
  template: CatalogTemplatePayload;
  assets: CatalogAssetsPayload;
};

type CatalogDeletePayload = {
  event: Extract<
    CatalogSyncEvent,
    "product.deleted" | "product.trashed" | "product.unpublished"
  >;
  collection: {
    slug: string;
  };
  product: {
    slug: string;
    templateId?: string;
  };
  template?: {
    id?: string;
  };
};

type CatalogStatus = "draft" | "needs_calibration" | "ready" | "published";

type CatalogStorageKeys = {
  masterKey: string;
  previewKey: string;
  templateKey: string;
  productKey: string;
  illustratorSourceKey?: string;
};

type WordPressSyncCallbackPayload =
  | {
      ok: true;
      templateId: string;
      catalogStatus: CatalogStatus;
      textElementCount: number;
      storage: string;
      keys: CatalogStorageKeys;
    }
  | {
      ok: false;
      templateId: string;
      error: string;
      missingFonts?: string[];
    };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isAuthorized(request: Request) {
  const secret = process.env.MOMENTA_ADMIN_SECRET;

  if (!isUsableEnvValue(secret) && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!isUsableEnvValue(secret)) {
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

function readPayloadEvent(body: unknown) {
  if (!isRecord(body)) {
    throw new Error("Payload must be a JSON object.");
  }

  const event = body.event;

  if (
    event !== "product.deleted" &&
    event !== "product.published" &&
    event !== "product.trashed" &&
    event !== "product.unpublished"
  ) {
    throw new Error(
      "payload.event must be product.published, product.deleted, product.trashed, or product.unpublished.",
    );
  }

  return event;
}

function parseDeletePayload(
  body: unknown,
  event: Extract<
    CatalogSyncEvent,
    "product.deleted" | "product.trashed" | "product.unpublished"
  >,
): CatalogDeletePayload {
  const errors: string[] = [];

  if (!isRecord(body)) {
    throw new Error("Payload must be a JSON object.");
  }

  const collectionSource = isRecord(body.collection) ? body.collection : null;
  const productSource = isRecord(body.product) ? body.product : null;
  const templateSource = isRecord(body.template) ? body.template : null;

  if (!collectionSource) errors.push("payload.collection is required.");
  if (!productSource) errors.push("payload.product is required.");

  const collection = collectionSource ?? {};
  const product = productSource ?? {};
  const template = templateSource ?? {};
  const payload: CatalogDeletePayload = {
    event,
    collection: {
      slug: readRequiredString(collection, "slug", "collection", errors),
    },
    product: {
      slug: readRequiredString(product, "slug", "product", errors),
      templateId: readOptionalString(product, "templateId"),
    },
    template: templateSource
      ? {
          id: readOptionalString(template, "id"),
        }
      : undefined,
  };

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return payload;
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
    event: "product.published",
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
      illustratorTemplateUrl: readOptionalString(assets, "illustratorTemplateUrl"),
      templateSourceUrl: readOptionalString(assets, "templateSourceUrl"),
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

function getDeleteStorageKeys(payload: CatalogDeletePayload): CatalogStorageKeys {
  const base = `collections/${payload.collection.slug}/${payload.product.slug}/v1`;

  return {
    masterKey: `${base}/master.jpg`,
    previewKey: `${base}/preview.webp`,
    templateKey: `${base}/template.json`,
    productKey: `${base}/_product.json`,
    illustratorSourceKey: `${base}/illustrator-source.json`,
  };
}

function getIllustratorSourceKey(payload: CatalogSyncPayload) {
  return `collections/${payload.collection.slug}/${payload.product.slug}/v1/illustrator-source.json`;
}

function getCatalogStatus(payload: CatalogSyncPayload): CatalogStatus {
  const status = payload.template.status ?? payload.product.status;
  const hasTextElements = payload.template.textElements.length > 0;

  if (status === "draft" || status === "ready" || status === "published") {
    return status;
  }

  if (status === "needs_calibration" && hasTextElements) {
    return "published";
  }

  return hasTextElements ? "published" : "needs_calibration";
}

function mmToPixels(mm: number, ppi: number) {
  return Math.round((mm / 25.4) * ppi);
}

function getTemplateSourceUrl(payload: CatalogSyncPayload) {
  return payload.assets.illustratorTemplateUrl ?? payload.assets.templateSourceUrl;
}

function mergeUniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getMissingBundledFontFamilies(fontFamilies: string[]) {
  return fontFamilies.filter((fontFamily) => !getBundledGoogleFontFamily(fontFamily));
}

function getFontCacheCommand(fontFamilies: string[]) {
  return `pnpm fonts:cache ${fontFamilies
    .map((fontFamily) => JSON.stringify(fontFamily))
    .join(" ")}`;
}

function getImportedFontFamilies(textElements: unknown[]) {
  return textElements
    .filter(isRecord)
    .map((element) => element.fontFamily)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.split(",")[0]?.trim() ?? "")
    .filter(Boolean);
}

function withImportedIllustratorElements(
  payload: CatalogSyncPayload,
  textElements: unknown[],
): CatalogSyncPayload {
  return {
    ...payload,
    product: {
      ...payload.product,
      status: "needs_calibration",
    },
    template: {
      ...payload.template,
      status: "needs_calibration",
      allowedFonts: mergeUniqueStrings([
        ...(payload.template.allowedFonts ?? []),
        ...getImportedFontFamilies(textElements),
      ]),
      textElements,
    },
  };
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
      illustratorSourceKey: keys.illustratorSourceKey,
    },
  };
}

function getProductObject(
  payload: CatalogSyncPayload,
  keys: CatalogStorageKeys,
  storage: string,
) {
  const status = getCatalogStatus(payload);
  const textElementCount = payload.template.textElements.length;

  return {
    collection: payload.collection,
    product: {
      ...payload.product,
      status,
      textElementCount,
      outputFormats: ["png", "pdf"],
      assets: {
        provider: storage,
        masterKey: keys.masterKey,
        previewKey: keys.previewKey,
        templateKey: keys.templateKey,
        illustratorSourceKey: keys.illustratorSourceKey,
      },
    },
    printProfile: payload.printProfile,
    templateId: payload.template.id,
    syncedAt: new Date().toISOString(),
  };
}

function isUsableEnvValue(value?: string) {
  return Boolean(value && value.trim() !== "" && value !== "[SENSITIVE]");
}

function getWordPressSyncCallbackUrl() {
  return isUsableEnvValue(process.env.MOMENTA_SYNC_CALLBACK_URL)
    ? process.env.MOMENTA_SYNC_CALLBACK_URL
    : undefined;
}

async function notifyWordPressSyncCallback(
  payload: WordPressSyncCallbackPayload,
) {
  const url = getWordPressSyncCallbackUrl();
  const secret = process.env.MOMENTA_ADMIN_SECRET;

  if (!url) {
    return { skipped: true as const, reason: "missing_callback_url" as const };
  }

  if (!isUsableEnvValue(secret)) {
    return { skipped: true as const, reason: "missing_admin_secret" as const };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.text();

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        detail: body.slice(0, 500),
      };
    }

    return {
      ok: true as const,
      status: response.status,
      detail: body.slice(0, 500),
    };
  } catch (error) {
    return {
      ok: false as const,
      detail: getErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function revalidateCatalogPaths(payload: CatalogSyncPayload) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/collections/${payload.collection.slug}`);
  revalidatePath(`/products/${payload.product.slug}`);
  revalidatePath(`/products/${payload.product.slug}/personalize`);
}

function revalidateDeletedCatalogPaths(payload: CatalogDeletePayload) {
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

async function downloadJsonAsset(url: string) {
  const asset = await downloadAsset(url, "application/json");
  const text = new TextDecoder().decode(asset.body).replace(/^\uFEFF/, "");

  return {
    ...asset,
    json: JSON.parse(text) as unknown,
  };
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isUsableEnvValue(url) || !isUsableEnvValue(serviceRoleKey)) {
    return null;
  }

  return {
    url: url!.replace(/\/+$/, ""),
    serviceRoleKey: serviceRoleKey!,
  };
}

function isMissingSupabaseTable(status: number, body: string) {
  return status === 404 && body.includes("PGRST205");
}

async function upsertRows(table: string, rows: unknown[]) {
  if (rows.length === 0) {
    return { skipped: false as const };
  }

  const config = getSupabaseConfig();

  if (!config) {
    return { skipped: true as const, reason: "missing_config" as const };
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

  if (response.ok) {
    return { skipped: false as const };
  }

  const body = await response.text();

  if (isMissingSupabaseTable(response.status, body)) {
    return {
      skipped: true as const,
      reason: "missing_table" as const,
      table,
      detail: body,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed for ${table}: ${response.status} ${body}`,
    );
  }

  return { skipped: false as const };
}

async function deleteSupabaseRows(
  table: string,
  query: Record<string, string>,
) {
  const config = getSupabaseConfig();

  if (!config) {
    return { skipped: true as const, reason: "missing_config" as const };
  }

  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, `eq.${value}`]),
  );
  const response = await fetch(`${config.url}/rest/v1/${table}?${params}`, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: "return=representation",
    },
  });

  if (response.ok) {
    const rows = (await response.json().catch(() => [])) as unknown[];

    return {
      skipped: false as const,
      deleted: Array.isArray(rows) ? rows.length : 0,
    };
  }

  const body = await response.text();

  if (isMissingSupabaseTable(response.status, body)) {
    return {
      skipped: true as const,
      reason: "missing_table" as const,
      table,
      detail: body,
    };
  }

  throw new Error(
    `Supabase delete failed for ${table}: ${response.status} ${body}`,
  );
}

async function deleteCatalogMetadataFromSupabase(payload: CatalogDeletePayload) {
  if (!getSupabaseConfig()) {
    return { skipped: true as const };
  }

  const templateId = payload.template?.id ?? payload.product.templateId;
  const templates = templateId
    ? await deleteSupabaseRows("momenta_catalog_templates", { id: templateId })
    : await deleteSupabaseRows("momenta_catalog_templates", {
        collection_slug: payload.collection.slug,
        product_slug: payload.product.slug,
      });

  const products = await deleteSupabaseRows("momenta_catalog_products", {
    collection_slug: payload.collection.slug,
    slug: payload.product.slug,
  });

  return { skipped: false as const, products, templates };
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

  const collections = await upsertRows("momenta_catalog_collections", [
    {
      slug: payload.collection.slug,
      name: payload.collection.name,
      description: payload.collection.description ?? null,
      updated_at: syncedAt,
    },
  ]);

  if (collections.skipped) {
    return collections;
  }

  const products = await upsertRows("momenta_catalog_products", [
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

  if (products.skipped) {
    return products;
  }

  const templates = await upsertRows("momenta_catalog_templates", [
    {
      id: payload.template.id,
      collection_slug: payload.collection.slug,
      product_slug: payload.product.slug,
      template_payload: getTemplateObject(payload, keys),
      updated_at: syncedAt,
    },
  ]);

  if (templates.skipped) {
    return templates;
  }

  return { skipped: false as const };
}

function getStorageKeysForDeletion(keys: CatalogStorageKeys) {
  return [
    keys.masterKey,
    keys.previewKey,
    keys.illustratorSourceKey,
    keys.templateKey,
    keys.productKey,
  ].filter((key): key is string => Boolean(key));
}

async function deleteCatalogStorageObjects(keys: CatalogStorageKeys) {
  const storage = createStorageProvider();
  const deletedKeys: string[] = [];
  const failedKeys: Array<{ key: string; error: string }> = [];

  if (!storage.deleteObject) {
    return {
      skipped: true as const,
      reason: "unsupported_storage_delete" as const,
      deletedKeys,
      failedKeys,
    };
  }

  for (const key of getStorageKeysForDeletion(keys)) {
    try {
      await storage.deleteObject({ key });
      deletedKeys.push(key);
    } catch (error) {
      failedKeys.push({ key, error: getErrorMessage(error) });
    }
  }

  return {
    skipped: false as const,
    deletedKeys,
    failedKeys,
  };
}

async function handleCatalogDelete(payload: CatalogDeletePayload) {
  const storageName = getStorageProviderName();
  const keys = getDeleteStorageKeys(payload);
  const [storage, supabase] = await Promise.all([
    deleteCatalogStorageObjects(keys),
    deleteCatalogMetadataFromSupabase(payload),
  ]);

  revalidateDeletedCatalogPaths(payload);

  const callback = await notifyWordPressSyncCallback({
    ok: true,
    templateId: payload.template?.id ?? payload.product.templateId ?? "",
    catalogStatus: "draft",
    textElementCount: 0,
    storage: storageName,
    keys,
  });

  return NextResponse.json({
    ok: true,
    event: payload.event,
    collectionSlug: payload.collection.slug,
    productSlug: payload.product.slug,
    templateId: payload.template?.id ?? payload.product.templateId,
    deleted: true,
    storage: storageName,
    keys,
    storageDelete: storage,
    supabase,
    callback,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  let event: CatalogSyncEvent;

  try {
    body = await request.json();
    event = readPayloadEvent(body);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid catalog sync payload.",
        detail: getErrorMessage(error),
      },
      { status: 400 },
    );
  }

  if (
    event === "product.deleted" ||
    event === "product.trashed" ||
    event === "product.unpublished"
  ) {
    try {
      return await handleCatalogDelete(parseDeletePayload(body, event));
    } catch (error) {
      return NextResponse.json(
        {
          error: "Catalog delete sync failed.",
          detail: getErrorMessage(error),
        },
        { status: 500 },
      );
    }
  }

  let payload: CatalogSyncPayload;

  try {
    payload = parsePayload(body);
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
    const templateSourceUrl = getTemplateSourceUrl(payload);
    let illustratorSource:
      | Awaited<ReturnType<typeof downloadJsonAsset>>
      | null = null;

    if (payload.template.textElements.length === 0 && templateSourceUrl) {
      illustratorSource = await downloadJsonAsset(templateSourceUrl);

      if (!isIllustratorTemplateExport(illustratorSource.json)) {
        const error = "Invalid Illustrator template source.";
        const callback = await notifyWordPressSyncCallback({
          ok: false,
          templateId: payload.template.id,
          error,
        });

        return NextResponse.json(
          {
            error,
            catalogStatus: "draft",
            textElementCount: 0,
            callback,
          },
          { status: 422 },
        );
      }

      const missingFonts = getMissingBundledFontFamilies(
        getIllustratorFontFamilies(illustratorSource.json),
      );

      if (missingFonts.length > 0) {
        const command = getFontCacheCommand(missingFonts);
        const error = `Missing bundled Google Fonts: ${missingFonts.join(
          ", ",
        )}. Run ${command} and redeploy before syncing this product.`;
        const callback = await notifyWordPressSyncCallback({
          ok: false,
          templateId: payload.template.id,
          error,
          missingFonts,
        });

        return NextResponse.json(
          {
            error,
            catalogStatus: "draft",
            textElementCount: 0,
            missingFonts,
            command,
            callback,
          },
          { status: 422 },
        );
      }

      const designMasterPpi = getIllustratorMasterPpi(
        illustratorSource.json,
        payload.printProfile.designMasterPpi,
      );
      payload = {
        ...payload,
        printProfile: {
          ...payload.printProfile,
          designMasterPpi,
        },
      };
      const importedTextElements = importIllustratorTemplate(
        illustratorSource.json,
        {
          widthPx: mmToPixels(payload.product.widthMm, designMasterPpi),
          heightPx: mmToPixels(payload.product.heightMm, designMasterPpi),
          designMasterPpi,
          defaultFontFamily: payload.template.defaultFont,
          defaultFill: payload.template.defaultFill,
        },
      );

      payload = withImportedIllustratorElements(payload, importedTextElements);
      keys.illustratorSourceKey = getIllustratorSourceKey(payload);
    }

    if (payload.template.textElements.length === 0) {
      const error = "Template textElements are required.";
      const callback = await notifyWordPressSyncCallback({
        ok: false,
        templateId: payload.template.id,
        error,
      });

      return NextResponse.json(
        {
          error,
          catalogStatus: "draft",
          textElementCount: 0,
          callback,
        },
        { status: 422 },
      );
    }

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

    if (illustratorSource && keys.illustratorSourceKey) {
      await storage.putObject({
        key: keys.illustratorSourceKey,
        body: illustratorSource.body,
        contentType: illustratorSource.contentType,
      });
      createdKeys.push(keys.illustratorSourceKey);
    }

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
    const catalogStatus = getCatalogStatus(payload);

    revalidateCatalogPaths(payload);

    const callbackPayload: WordPressSyncCallbackPayload = {
      ok: true,
      templateId: payload.template.id,
      catalogStatus,
      textElementCount: templateObject.textElements.length,
      storage: storageName,
      keys,
    };
    const callback = await notifyWordPressSyncCallback(callbackPayload);

    return NextResponse.json({
      ok: true,
      collectionSlug: payload.collection.slug,
      productSlug: payload.product.slug,
      templateId: payload.template.id,
      catalogStatus,
      textElementCount: templateObject.textElements.length,
      storage: storageName,
      keys,
      createdKeys,
      templateSource: keys.illustratorSourceKey
        ? {
            type: "illustrator",
            key: keys.illustratorSourceKey,
          }
        : undefined,
      supabase,
      callback,
    });
  } catch (error) {
    const detail = getErrorMessage(error);
    const callback = await notifyWordPressSyncCallback({
      ok: false,
      templateId: payload.template.id,
      error: detail,
    });

    return NextResponse.json(
      {
        error: "Catalog sync failed.",
        detail,
        storage: storageName,
        created: createdKeys.length,
        createdKeys,
        callback,
      },
      { status: 500 },
    );
  }
}
