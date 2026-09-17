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

type AutoTextElement = {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  pdfFont: "helvetica";
  fontWeight: number;
  fontSize: number;
  minFontSize: number;
  fill: string;
  align: "center";
  maxLines: number;
  lineHeight: number;
  letterSpacing: number;
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

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function getEstimatedTextColor(
  previewPixels: Buffer,
  mask: Uint8Array,
  width: number,
  box: { minX: number; minY: number; maxX: number; maxY: number },
) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = box.minY; y <= box.maxY; y += 1) {
    for (let x = box.minX; x <= box.maxX; x += 1) {
      const pixelIndex = y * width + x;

      if (!mask[pixelIndex]) {
        continue;
      }

      const offset = pixelIndex * 4;
      red += previewPixels[offset] ?? 0;
      green += previewPixels[offset + 1] ?? 0;
      blue += previewPixels[offset + 2] ?? 0;
      count += 1;
    }
  }

  if (count === 0) {
    return "#202124";
  }

  return rgbToHex(red / count, green / count, blue / count);
}

function dilateMask(mask: Uint8Array, width: number, height: number) {
  const output = new Uint8Array(mask.length);
  const radiusX = Math.max(8, Math.round(width * 0.018));
  const radiusY = Math.max(2, Math.round(height * 0.004));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) {
        continue;
      }

      const minY = Math.max(0, y - radiusY);
      const maxY = Math.min(height - 1, y + radiusY);
      const minX = Math.max(0, x - radiusX);
      const maxX = Math.min(width - 1, x + radiusX);

      for (let yy = minY; yy <= maxY; yy += 1) {
        const row = yy * width;

        for (let xx = minX; xx <= maxX; xx += 1) {
          output[row + xx] = 1;
        }
      }
    }
  }

  return output;
}

function findMaskComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  const components: Array<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    area: number;
  }> = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) {
      continue;
    }

    const queue = [start];
    visited[start] = 1;
    let cursor = 0;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    while (cursor < queue.length) {
      const index = queue[cursor];
      cursor += 1;

      const x = index % width;
      const y = Math.floor(index / width);
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy += 1) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) {
          const next = yy * width + xx;

          if (mask[next] && !visited[next]) {
            visited[next] = 1;
            queue.push(next);
          }
        }
      }
    }

    components.push({ minX, minY, maxX, maxY, area });
  }

  return components;
}

async function createAutoTextElementsFromPreview(
  master: Uint8Array,
  preview: Uint8Array,
): Promise<AutoTextElement[]> {
  let sharp: typeof import("sharp").default;

  try {
    sharp = (await import("sharp")).default;
  } catch (error) {
    console.error("Sharp unavailable", error);
    throw new Error("Sharp unavailable for preview text layer detection.");
  }

  const masterImage = sharp(master);
  const metadata = await masterImage.metadata();
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return [];
  }

  const analysisWidth = Math.min(1000, sourceWidth);
  const analysisHeight = Math.max(1, Math.round((sourceHeight / sourceWidth) * analysisWidth));
  const [masterPixels, previewPixels] = await Promise.all([
    sharp(master)
      .resize(analysisWidth, analysisHeight, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer(),
    sharp(preview)
      .resize(analysisWidth, analysisHeight, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer(),
  ]);
  const mask = new Uint8Array(analysisWidth * analysisHeight);

  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const redDiff = Math.abs((previewPixels[offset] ?? 0) - (masterPixels[offset] ?? 0));
    const greenDiff = Math.abs((previewPixels[offset + 1] ?? 0) - (masterPixels[offset + 1] ?? 0));
    const blueDiff = Math.abs((previewPixels[offset + 2] ?? 0) - (masterPixels[offset + 2] ?? 0));
    const diff = redDiff + greenDiff + blueDiff;

    if (diff > 95) {
      mask[index] = 1;
    }
  }

  const groupedMask = dilateMask(mask, analysisWidth, analysisHeight);
  const scaleX = sourceWidth / analysisWidth;
  const scaleY = sourceHeight / analysisHeight;
  const minWidth = analysisWidth * 0.025;
  const minHeight = analysisHeight * 0.004;
  const maxComponentArea = analysisWidth * analysisHeight * 0.22;

  return findMaskComponents(groupedMask, analysisWidth, analysisHeight)
    .map((box) => ({
      ...box,
      width: box.maxX - box.minX + 1,
      height: box.maxY - box.minY + 1,
    }))
    .filter((box) => (
      box.width >= minWidth &&
      box.height >= minHeight &&
      box.area <= maxComponentArea &&
      box.width <= analysisWidth * 0.92 &&
      box.height <= analysisHeight * 0.35
    ))
    .sort((a, b) => (a.minY === b.minY ? a.minX - b.minX : a.minY - b.minY))
    .slice(0, 12)
    .map((box, index) => {
      const x = ((box.minX + box.maxX) / 2) * scaleX;
      const y = (box.minY + box.height * 0.82) * scaleY;
      const width = Math.max(120, box.width * scaleX * 1.18);
      const fontSize = Math.max(24, box.height * scaleY * 1.08);

      return {
        id: `auto-text-${index + 1}`,
        label: `Texto detectado ${index + 1}`,
        text: `Texto ${index + 1}`,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        fontFamily: "Arial, Helvetica, sans-serif",
        pdfFont: "helvetica",
        fontWeight: box.height > analysisHeight * 0.04 ? 700 : 500,
        fontSize: Math.round(fontSize),
        minFontSize: 24,
        fill: getEstimatedTextColor(previewPixels, mask, analysisWidth, box),
        align: "center",
        maxLines: box.height > analysisHeight * 0.045 ? 2 : 1,
        lineHeight: 1.15,
        letterSpacing: 0,
      };
    });
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

    if (payload.template.textElements.length === 0) {
      payload = {
        ...payload,
        template: {
          ...payload.template,
          textElements: await createAutoTextElementsFromPreview(
            master.body,
            preview.body,
          ),
        },
      };
    }

    if (payload.template.textElements.length === 0) {
      return NextResponse.json(
        {
          error: "No text layers detected from preview image",
          catalogStatus: "draft",
          textElementCount: 0,
        },
        { status: 422 },
      );
    }

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
    const catalogStatus = getCatalogStatus(payload);

    revalidateCatalogPaths(payload);

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
