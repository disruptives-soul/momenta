import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { tmpdir } from "node:os";
import sharp from "sharp";
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
    };

type AutoTextElement = {
  id: string;
  label: string;
  text: string;
  source: "ocr";
  confidence: number;
  needsReview: boolean;
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

type DetectedTextBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
  width: number;
  height: number;
};

type CropBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type OcrTextResult = {
  text: string;
  confidence: number;
  needsReview: boolean;
};

type OcrLineResult = OcrTextResult & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const TESSERACT_INIT_TIMEOUT_MS = 15_000;
const FULL_PREVIEW_OCR_TIMEOUT_MS = 45_000;
const CROP_OCR_TIMEOUT_MS = 5_000;
const TESSERACT_TERMINATE_TIMEOUT_MS = 3_000;
const MAX_OCR_CROPS = 8;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(label)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function terminateTesseractWorker(worker: { terminate: () => Promise<unknown> }) {
  try {
    await withTimeout(
      worker.terminate(),
      TESSERACT_TERMINATE_TIMEOUT_MS,
      "Tesseract worker termination timed out",
    );
  } catch (error) {
    console.error("Tesseract worker termination failed", error);
  }
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCropBounds(
  box: DetectedTextBox,
  scaleX: number,
  scaleY: number,
  sourceWidth: number,
  sourceHeight: number,
): CropBounds {
  const paddingX = Math.max(12, Math.round(box.width * scaleX * 0.22));
  const paddingY = Math.max(8, Math.round(box.height * scaleY * 0.58));
  const left = clamp(Math.floor(box.minX * scaleX - paddingX), 0, sourceWidth - 1);
  const top = clamp(Math.floor(box.minY * scaleY - paddingY), 0, sourceHeight - 1);
  const right = clamp(Math.ceil((box.maxX + 1) * scaleX + paddingX), left + 1, sourceWidth);
  const bottom = clamp(Math.ceil((box.maxY + 1) * scaleY + paddingY), top + 1, sourceHeight);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

async function createOcrCrop(preview: Uint8Array, crop: CropBounds) {
  const upscale = crop.width < 900 ? Math.min(4, Math.max(2, Math.ceil(900 / crop.width))) : 1;

  return sharp(preview)
    .extract(crop)
    .resize({
      width: Math.min(1800, crop.width * upscale),
      height: Math.min(900, crop.height * upscale),
      fit: "inside",
      withoutEnlargement: false,
    })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

function normalizeOcrText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[|_~`]/g, "")
    .trim();
}

function isWatermarkText(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z]/g, "");

  return (
    normalized.includes("MOMENTA") ||
    normalized.includes("PREVIEW") ||
    normalized.includes("VISTA") ||
    normalized.includes("PREVIA")
  );
}

function hasReadableTemplateText(value: string) {
  return /[A-ZÀ-ÿ0-9&]/i.test(value) && !isWatermarkText(value);
}

async function recognizeTextCrops(crops: Buffer[]): Promise<OcrTextResult[]> {
  const fallback = crops.map(() => ({
    text: "",
    confidence: 0,
    needsReview: true,
  }));

  if (crops.length === 0) {
    return [];
  }

  try {
    const tesseract = await import("tesseract.js");
    const worker = await withTimeout(
      tesseract.createWorker("eng", undefined, {
        cachePath: tmpdir(),
      }),
      TESSERACT_INIT_TIMEOUT_MS,
      "Tesseract crop OCR worker init timed out",
    );

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: tesseract.PSM.SINGLE_LINE,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      const results: OcrTextResult[] = [];

      for (const crop of crops.slice(0, MAX_OCR_CROPS)) {
        const result = await withTimeout(
          worker.recognize(crop),
          CROP_OCR_TIMEOUT_MS,
          "Tesseract crop OCR timed out",
        );
        const confidence = Math.round(result.data.confidence ?? 0);
        const text = normalizeOcrText(result.data.text ?? "");
        const hasUsableText = hasReadableTemplateText(text) && confidence >= 60;

        results.push({
          text: hasUsableText ? text : "",
          confidence,
          needsReview: !hasUsableText,
        });
      }

      return results;
    } finally {
      await terminateTesseractWorker(worker);
    }
  } catch (error) {
    console.error("Tesseract OCR failed", error);
    return fallback;
  }
}

async function recognizePreviewTextLines(
  preview: Uint8Array,
  previewWidth: number,
  previewHeight: number,
): Promise<OcrLineResult[]> {
  const maxOcrWidth = 1000;
  const scale = previewWidth > maxOcrWidth ? maxOcrWidth / previewWidth : 1;
  const ocrWidth = Math.max(1, Math.round(previewWidth * scale));
  const ocrHeight = Math.max(1, Math.round(previewHeight * scale));
  const fallback: OcrLineResult[] = [];

  try {
    const image = await sharp(preview)
      .resize(ocrWidth, ocrHeight, { fit: "fill" })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
    const tesseract = await import("tesseract.js");
    const worker = await withTimeout(
      tesseract.createWorker("eng", undefined, {
        cachePath: tmpdir(),
      }),
      TESSERACT_INIT_TIMEOUT_MS,
      "Tesseract full-preview OCR worker init timed out",
    );

    try {
      await worker.setParameters({
        tessedit_pageseg_mode: tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      const result = await withTimeout(
        worker.recognize(image),
        FULL_PREVIEW_OCR_TIMEOUT_MS,
        "Tesseract full-preview OCR timed out",
      );
      const lines =
        result.data.blocks?.flatMap((block) =>
          block.paragraphs.flatMap((paragraph) => paragraph.lines),
        ) ?? [];

      const inverseScale = scale > 0 ? 1 / scale : 1;

      return lines
        .map((line): OcrLineResult => {
          const text = normalizeOcrText(line.text ?? "");
          const confidence = Math.round(line.confidence ?? 0);
          const width = Math.max(1, line.bbox.x1 - line.bbox.x0);
          const height = Math.max(1, line.bbox.y1 - line.bbox.y0);
          const hasUsableText = hasReadableTemplateText(text) && confidence >= 45;

          return {
            text: hasUsableText ? text : "",
            confidence,
            needsReview: !hasUsableText,
            x: (line.bbox.x0 + width / 2) * inverseScale,
            y: (line.bbox.y0 + height * 0.82) * inverseScale,
            width: width * inverseScale,
            height: height * inverseScale,
          };
        })
        .filter((line) => line.text !== "")
        .sort((a, b) => (Math.abs(a.y - b.y) < 8 ? a.x - b.x : a.y - b.y))
        .slice(0, 16);
    } finally {
      await terminateTesseractWorker(worker);
    }
  } catch (error) {
    console.error("Tesseract full-preview OCR failed", error);
    return fallback;
  }
}

function createTextElementsFromOcrLines(
  lines: OcrLineResult[],
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number,
): AutoTextElement[] {
  const scaleX = sourceWidth / previewWidth;
  const scaleY = sourceHeight / previewHeight;

  return lines.map((line, index) => {
    const fontSize = Math.min(140, Math.max(24, line.height * scaleY * 0.94));

    return {
      id: `auto-text-${index + 1}`,
      label: `Campo editable ${index + 1}`,
      text: line.text,
      source: "ocr",
      confidence: line.confidence,
      needsReview: line.needsReview,
      x: Math.round(line.x * scaleX),
      y: Math.round(line.y * scaleY),
      width: Math.round(Math.max(120, line.width * scaleX * 1.2)),
      fontFamily: "Arial, Helvetica, sans-serif",
      pdfFont: "helvetica",
      fontWeight: fontSize > 58 ? 700 : 500,
      fontSize: Math.round(fontSize),
      minFontSize: 24,
      fill: "#202124",
      align: "center",
      maxLines: 1,
      lineHeight: 1.15,
      letterSpacing: 0,
    };
  });
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
  const masterImage = sharp(master);
  const [masterMetadata, previewMetadata] = await Promise.all([
    masterImage.metadata(),
    sharp(preview).metadata(),
  ]);
  const sourceWidth = masterMetadata.width ?? 0;
  const sourceHeight = masterMetadata.height ?? 0;
  const previewWidth = previewMetadata.width ?? sourceWidth;
  const previewHeight = previewMetadata.height ?? sourceHeight;

  if (sourceWidth <= 0 || sourceHeight <= 0 || previewWidth <= 0 || previewHeight <= 0) {
    return [];
  }

  const ocrLines = await recognizePreviewTextLines(preview, previewWidth, previewHeight);

  if (ocrLines.length > 0) {
    return createTextElementsFromOcrLines(
      ocrLines,
      sourceWidth,
      sourceHeight,
      previewWidth,
      previewHeight,
    );
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
  const previewScaleX = previewWidth / analysisWidth;
  const previewScaleY = previewHeight / analysisHeight;
  const minWidth = analysisWidth * 0.025;
  const minHeight = analysisHeight * 0.004;
  const maxComponentArea = analysisWidth * analysisHeight * 0.22;

  const boxes = findMaskComponents(groupedMask, analysisWidth, analysisHeight)
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
    .slice(0, 12);

  const ocrCrops = await Promise.all(
    boxes.map((box) => createOcrCrop(
      preview,
      getCropBounds(box, previewScaleX, previewScaleY, previewWidth, previewHeight),
    )),
  );
  const ocrResults = await recognizeTextCrops(ocrCrops);

  return boxes
    .map((box, index) => {
      const x = ((box.minX + box.maxX) / 2) * scaleX;
      const y = (box.minY + box.height * 0.82) * scaleY;
      const width = Math.max(120, box.width * scaleX * 1.18);
      const fontSize = Math.min(140, Math.max(32, box.height * scaleY * 0.72));
      const ocr = ocrResults[index] ?? {
        text: "",
        confidence: 0,
        needsReview: true,
      };

      return {
        id: `auto-text-${index + 1}`,
        label: `Campo editable ${index + 1}`,
        text: ocr.text,
        source: "ocr",
        confidence: ocr.confidence,
        needsReview: ocr.needsReview,
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

function getOcrStats(textElements: unknown[]) {
  let ocrTextCount = 0;
  let needsReviewCount = 0;

  for (const element of textElements) {
    if (!isRecord(element)) {
      continue;
    }

    if (typeof element.text === "string" && element.text.trim() !== "") {
      ocrTextCount += 1;
    }

    if (element.needsReview === true) {
      needsReviewCount += 1;
    }
  }

  return {
    ocrTextCount,
    needsReviewCount,
  };
}

function getWordPressSyncCallbackUrl() {
  return (
    process.env.MOMENTA_SYNC_CALLBACK_URL ??
    "https://disruptive-soul.com/wp-test/wp-json/momenta/v1/sync-callback"
  );
}

async function notifyWordPressSyncCallback(
  payload: WordPressSyncCallbackPayload,
) {
  const url = getWordPressSyncCallbackUrl();
  const secret = process.env.MOMENTA_ADMIN_SECRET;

  if (!url) {
    return { skipped: true as const, reason: "missing_callback_url" as const };
  }

  if (!secret) {
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
      const error = "No text layers detected from preview image";
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
    const ocrStats = getOcrStats(templateObject.textElements);

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
      ...ocrStats,
      storage: storageName,
      keys,
      createdKeys,
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
