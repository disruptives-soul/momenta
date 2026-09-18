import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createStorageProvider } from "@/infrastructure/storage/storage-provider-factory";
import type {
  BaseTextElement,
  InvitationTemplate,
  TemplateTextArc,
  TemplateTextField,
} from "./template-types";
import { defaultTextColors, defaultTextFonts } from "./text-scene";
import { getRenderingTemplate } from "./template-registry";
import {
  getBundledGoogleFontAsset,
  getBundledGoogleFontFamily,
} from "./google-font-assets";
import { normalizeTextPathGeometry } from "./path-text-layout";

type HeadlessTextElement = Partial<BaseTextElement> & {
  id: string;
  label?: string;
  text?: string;
  kind?: string;
  arc?: unknown;
  path?: unknown;
  pathLocked?: boolean;
};

type HeadlessTemplateObject = {
  id: string;
  status?: "draft" | "needs_calibration" | "ready" | "published";
  collectionSlug: string;
  productSlug: string;
  widthMm: number;
  heightMm: number;
  printProfile: InvitationTemplate["printProfile"];
  safeArea?: InvitationTemplate["safeArea"];
  allowedColors?: string[];
  allowedFonts?: string[];
  defaultFont?: string;
  defaultFill?: string;
  textElements: HeadlessTextElement[];
  assets: {
    masterKey: string;
    previewKey: string;
    illustratorSourceKey?: string;
  };
};

type SupabaseTemplateRow = {
  id: string;
  template_payload: HeadlessTemplateObject;
};

function mmToPixels(mm: number, ppi: number) {
  return Math.round((mm / 25.4) * ppi);
}

function isUsableEnvValue(value?: string) {
  return Boolean(value && value.trim() !== "" && value !== "[SENSITIVE]");
}

function parseJsonFile<T>(raw: string) {
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as T;
}

function getAllowedFonts(fonts?: string[]) {
  const defaultValues = new Set<string>(defaultTextFonts.map((font) => font.value));
  const importedFonts = (fonts ?? [])
    .map((font) => font.trim())
    .filter(Boolean)
    .map((font) => {
      const value = font.includes(",")
        ? font
        : `${font}, Arial, Helvetica, sans-serif`;

      return {
        label: font.split(",")[0]?.trim() ?? font,
        value,
        pdfFont: "helvetica" as const,
        fontAsset: getBundledGoogleFontAsset(font),
      };
    })
    .filter((font) => {
      if (defaultValues.has(font.value)) {
        return false;
      }

      defaultValues.add(font.value);
      return true;
    });

  return [...defaultTextFonts, ...importedFonts];
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

async function loadTemplateFromSupabase(templateId: string) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/momenta_catalog_templates?id=eq.${encodeURIComponent(
        templateId,
      )}&select=id,template_payload`,
      {
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
        },
        next: { revalidate: 30 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as SupabaseTemplateRow[];
    return rows[0]?.template_payload ?? null;
  } catch (error) {
    console.warn(`Supabase template read failed for ${templateId}; using local storage fallback.`, error);
    return null;
  }
}

async function loadTemplateFromStorage(templateId: string) {
  const root = join(process.cwd(), "tmp", "storage", "collections");
  const templatePath = await findTemplateFile(root, templateId);

  if (templatePath) {
    return parseJsonFile<HeadlessTemplateObject>(await readFile(templatePath, "utf8"));
  }

  const storage = createStorageProvider();
  const object = await storage.getObject?.({
    key: `templates/${templateId}.json`,
  }).catch(() => null);

  return object?.body
    ? parseJsonFile<HeadlessTemplateObject>(Buffer.from(object.body).toString("utf8"))
    : null;
}

async function findTemplateFile(root: string, templateId: string): Promise<string | null> {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      const result = await findTemplateFile(path, templateId);

      if (result) {
        return result;
      }
    }

    if (entry.name === "template.json") {
      const raw = await readFile(path, "utf8").catch(() => "");

      try {
        const template = parseJsonFile<{ id?: unknown }>(raw);

        if (template.id === templateId) {
          return path;
        }
      } catch {
        // Ignore malformed local templates and keep scanning.
      }

      if (raw.includes(`"id": "${templateId}"`)) {
        return path;
      }
    }
  }

  return null;
}

function normalizeTextArcGeometry(value: unknown): TemplateTextArc | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const arc = value as Record<string, unknown>;

  if (
    typeof arc.radius === "number" &&
    Number.isFinite(arc.radius) &&
    arc.radius > 0 &&
    typeof arc.startAngle === "number" &&
    Number.isFinite(arc.startAngle) &&
    typeof arc.endAngle === "number" &&
    Number.isFinite(arc.endAngle)
  ) {
    return {
      radius: arc.radius,
      startAngle: arc.startAngle,
      endAngle: arc.endAngle,
    };
  }

  return undefined;
}

function normalizeField(
  element: HeadlessTemplateObject["textElements"][number],
  index: number,
  widthPx: number,
  heightPx: number,
): TemplateTextField {
  const fallbackFont = defaultTextFonts[0];
  const x = element.x ?? widthPx / 2;
  const y = element.y ?? heightPx * (0.25 + index * 0.12);
  const rawFontSize =
    element.fontSize ?? Math.max(72, Math.round(heightPx * 0.035));
  const fontSize = rawFontSize;
  const defaultValue = element.text ?? "";
  const arc = normalizeTextArcGeometry(element.arc);
  const path = normalizeTextPathGeometry(element.path);
  const hasUnsupportedPath = Boolean(
    (element.path && !path) || (element.arc && !arc),
  );

  return {
    label: element.label ?? `Texto ${index + 1}`,
    defaultValue,
    source: element.source,
    sourceTextKind: element.sourceTextKind,
    needsReview: Boolean(element.needsReview || hasUnsupportedPath),
    sourceMeta: element.sourceMeta,
    path,
    arc,
    editable: true,
    x,
    y,
    width: element.width ?? Math.min(widthPx * 0.72, 1800),
    fontFamily: element.fontFamily ?? fallbackFont.value,
    pdfFont: element.pdfFont ?? fallbackFont.pdfFont,
    fontAsset:
      element.fontAsset ??
      getBundledGoogleFontAsset(
        getBundledGoogleFontFamily(element.fontFamily) ?? element.fontFamily,
      ),
    fontWeight: element.fontWeight,
    fontSize,
    minFontSize: Math.min(element.minFontSize ?? 32, fontSize),
    fill: element.fill ?? "#202124",
    opacity: element.opacity ?? 1,
    align: element.align ?? "center",
    maxLines: element.maxLines ?? 2,
    lineHeight: element.lineHeight ?? 1.15,
    letterSpacing: element.letterSpacing ?? 0,
    rotation: element.rotation ?? 0,
  };
}

function toInvitationTemplate(source: HeadlessTemplateObject): InvitationTemplate {
  const widthPx = mmToPixels(source.widthMm, source.printProfile.designMasterPpi);
  const heightPx = mmToPixels(source.heightMm, source.printProfile.designMasterPpi);
  const fields = Object.fromEntries(
    source.textElements.map((element, index) => [
      element.id,
      normalizeField(element, index, widthPx, heightPx),
    ]),
  );

  return {
    id: source.id,
    collectionSlug: source.collectionSlug,
    productCode: source.productSlug,
    widthMm: source.widthMm,
    heightMm: source.heightMm,
    safeArea: source.safeArea,
    printProfile: {
      ppiTolerance: 3,
      ...source.printProfile,
    },
    widthPx,
    heightPx,
    masterPpi: source.printProfile.designMasterPpi,
    master: {
      path: "",
      contentType: "image/jpeg",
    },
    storage: {
      masterKey: source.assets.masterKey,
      previewKey: source.assets.previewKey,
      templateKey: `collections/${source.collectionSlug}/${source.productSlug}/v1/template.json`,
    },
    preview: {
      src: "",
      widthPx,
    },
    artwork: {
      src: "",
      contentType: "image/jpeg",
    },
    textConstraints: {
      allowedColors:
        source.allowedColors && source.allowedColors.length > 0
          ? source.allowedColors
          : defaultTextColors,
      allowedFonts: getAllowedFonts(source.allowedFonts),
    },
    fields,
  };
}

export async function getRenderingTemplateAsync(templateId: string) {
  const source =
    (await loadTemplateFromSupabase(templateId)) ??
    (await loadTemplateFromStorage(templateId));

  if (source) {
    return toInvitationTemplate(source);
  }

  return getRenderingTemplate(templateId);
}
