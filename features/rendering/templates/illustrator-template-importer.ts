import type { TextElement, TemplateTextAlign } from "./template-types";
import {
  getBundledGoogleFontAsset,
  getBundledGoogleFontFamilyStack,
} from "./google-font-assets";

type IllustratorTextKind = "point" | "area";

type IllustratorGeometry = {
  xRatio?: number;
  yRatio?: number;
  widthRatio?: number;
  heightRatio?: number;
  rotationDeg?: number;
  xPt?: number;
  yPt?: number;
  widthPt?: number;
  heightPt?: number;
  xMm?: number;
  yMm?: number;
  widthMm?: number;
  heightMm?: number;
};

type IllustratorTypography = {
  fontName?: string;
  fontFamily?: string;
  fontStyle?: string;
  fontSizePt?: number;
  tracking?: number;
  leadingPt?: number;
  autoLeading?: boolean;
  alignment?: string;
  fill?: {
    model?: string;
    hex?: string;
    approximateHex?: string;
  };
};

type IllustratorTextElement = {
  id?: string;
  sourceName?: string;
  kind?: IllustratorTextKind;
  text?: string;
  geometry?: IllustratorGeometry;
  typography?: IllustratorTypography;
  opacity?: number;
  zOrderPosition?: number;
  mixedFormatting?: boolean;
  needsReview?: boolean;
};

export type IllustratorTemplateExport = {
  schemaVersion?: string;
  artboard?: {
    widthPt?: number;
    heightPt?: number;
    widthMm?: number;
    heightMm?: number;
  };
  textElements?: IllustratorTextElement[];
  warnings?: string[];
};

type ImportIllustratorTemplateOptions = {
  widthPx: number;
  heightPx: number;
  designMasterPpi: number;
  defaultFontFamily?: string;
  defaultFill?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isIllustratorTemplateExport(
  value: unknown,
): value is IllustratorTemplateExport {
  return isRecord(value) && Array.isArray(value.textElements);
}

export function getIllustratorFontFamilies(source: IllustratorTemplateExport) {
  return Array.from(
    new Set(
      (source.textElements ?? [])
        .map((element) => element.typography?.fontFamily?.trim())
        .filter((family): family is string => Boolean(family)),
    ),
  );
}

function ptToPx(valuePt: number, ppi: number) {
  return (valuePt / 72) * ppi;
}

function trackingToPx(tracking: number | undefined, fontSizePx: number) {
  return ((tracking ?? 0) / 1000) * fontSizePx;
}

function normalizeAlign(value: string | undefined): TemplateTextAlign {
  if (value === "left" || value === "right" || value === "justify") {
    return value;
  }

  return "center";
}

function getFontWeight(fontStyle: string | undefined) {
  return fontStyle?.toLowerCase().includes("bold") ? 700 : 400;
}

function getFontFamily(
  typography: IllustratorTypography | undefined,
  fallback: string,
) {
  const family = typography?.fontFamily?.trim();

  if (!family) {
    return fallback;
  }

  return (
    getBundledGoogleFontFamilyStack(family) ??
    `${family}, Arial, Helvetica, sans-serif`
  );
}

function getFill(
  typography: IllustratorTypography | undefined,
  fallback: string,
) {
  return (
    typography?.fill?.hex ??
    typography?.fill?.approximateHex ??
    fallback
  );
}

function getLineHeight(typography: IllustratorTypography | undefined) {
  const fontSizePt = typography?.fontSizePt;
  const leadingPt = typography?.leadingPt;

  if (!fontSizePt || !leadingPt || fontSizePt <= 0 || leadingPt <= 0) {
    return 1.15;
  }

  return leadingPt / fontSizePt;
}

function getElementId(element: IllustratorTextElement, index: number) {
  return element.id?.trim() || element.sourceName?.trim() || `text-${index + 1}`;
}

export function importIllustratorTemplate(
  source: IllustratorTemplateExport,
  options: ImportIllustratorTemplateOptions,
): TextElement[] {
  const fallbackFont = options.defaultFontFamily ?? "Arial, Helvetica, sans-serif";
  const fallbackFill = options.defaultFill ?? "#202124";

  return [...(source.textElements ?? [])]
    .sort((a, b) => (a.zOrderPosition ?? 0) - (b.zOrderPosition ?? 0))
    .map((element, index): TextElement | null => {
      const geometry = element.geometry;
      const typography = element.typography;
      const fontSizePt = typography?.fontSizePt;

      if (
        !geometry ||
        typeof geometry.xRatio !== "number" ||
        typeof geometry.yRatio !== "number" ||
        typeof geometry.widthRatio !== "number" ||
        typeof geometry.heightRatio !== "number" ||
        typeof fontSizePt !== "number" ||
        fontSizePt <= 0
      ) {
        return null;
      }

      const fontSize = ptToPx(fontSizePt, options.designMasterPpi);
      const width = Math.max(24, geometry.widthRatio * options.widthPx);
      const top = geometry.yRatio * options.heightPx;
      const x = (geometry.xRatio + geometry.widthRatio / 2) * options.widthPx;
      const y = top + fontSize * 0.82;
      const kind = element.kind === "area" ? "area" : "point";
      const fontAsset = getBundledGoogleFontAsset(typography?.fontFamily);

      return {
        id: getElementId(element, index),
        label: element.sourceName ?? element.id ?? `Texto ${index + 1}`,
        text: element.text ?? "",
        source: "illustrator",
        sourceTextKind: kind,
        needsReview: Boolean(element.needsReview || element.mixedFormatting),
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        fontFamily: getFontFamily(typography, fallbackFont),
        pdfFont: "helvetica",
        fontAsset,
        fontWeight: getFontWeight(typography?.fontStyle),
        fontSize: Math.round(fontSize),
        minFontSize: Math.max(8, Math.round(fontSize * 0.45)),
        fill: getFill(typography, fallbackFill),
        opacity: typeof element.opacity === "number" ? element.opacity / 100 : 1,
        align: normalizeAlign(typography?.alignment),
        maxLines: kind === "area" ? 6 : 1,
        lineHeight: getLineHeight(typography),
        letterSpacing: trackingToPx(typography?.tracking, fontSize),
        rotation: geometry.rotationDeg ?? 0,
        sourceMeta: {
          geometry,
          typography,
          mixedFormatting: element.mixedFormatting ?? false,
          zOrderPosition: element.zOrderPosition,
        },
      };
    })
    .filter((element): element is TextElement => Boolean(element));
}
