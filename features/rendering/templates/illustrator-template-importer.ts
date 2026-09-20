import type {
  TextElement,
  TemplateTextAlign,
  TextPathGeometry,
} from "./template-types";
import {
  getBundledGoogleFontAsset,
  getBundledGoogleFontFamilyStack,
} from "./google-font-assets";

type IllustratorTextKind = "point" | "area" | "path";

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
  pathText?: {
    kind?: string;
    approximateShape?: {
      kind?: string;
      centerXPt?: number;
      centerYPt?: number;
      radiusXPt?: number;
      radiusYPt?: number;
    };
    startTValue?: number;
    endTValue?: number;
    winding?: string;
  };
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
  exportProfile?: {
    masterPpi?: number;
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

export function getIllustratorMasterPpi(
  source: IllustratorTemplateExport,
  fallbackPpi: number,
) {
  const masterPpi = source.exportProfile?.masterPpi;

  return typeof masterPpi === "number" && Number.isFinite(masterPpi) && masterPpi > 0
    ? masterPpi
    : fallbackPpi;
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

function getPathAngleFromTValue(tValue: number, winding: string | undefined) {
  const direction = winding === "clockwise" ? 1 : -1;

  return tValue * 90 * direction;
}

function getPathAngles(element: IllustratorTextElement) {
  const startTValue = element.pathText?.startTValue;
  const endTValue = element.pathText?.endTValue;

  if (
    typeof startTValue === "number" &&
    typeof endTValue === "number" &&
    startTValue !== endTValue
  ) {
    return {
      startAngle: getPathAngleFromTValue(
        startTValue,
        element.pathText?.winding,
      ),
      endAngle: getPathAngleFromTValue(
        endTValue,
        element.pathText?.winding,
      ),
    };
  }

  return {
    startAngle: 205,
    endAngle: 335,
  };
}

function getPathGeometry(
  element: IllustratorTextElement,
  options: ImportIllustratorTemplateOptions,
): TextPathGeometry | null {
  const shape = element.pathText?.approximateShape;

  if (!shape) {
    return null;
  }

  const centerX = typeof shape.centerXPt === "number"
    ? ptToPx(shape.centerXPt, options.designMasterPpi)
    : null;
  const centerY = typeof shape.centerYPt === "number"
    ? ptToPx(shape.centerYPt, options.designMasterPpi)
    : null;
  const radiusX = typeof shape.radiusXPt === "number"
    ? ptToPx(shape.radiusXPt, options.designMasterPpi)
    : null;
  const radiusY = typeof shape.radiusYPt === "number"
    ? ptToPx(shape.radiusYPt, options.designMasterPpi)
    : null;

  if (
    centerX === null ||
    centerY === null ||
    radiusX === null ||
    radiusY === null ||
    radiusX <= 0 ||
    radiusY <= 0
  ) {
    return null;
  }

  const { startAngle, endAngle } = getPathAngles(element);

  if (shape.kind === "circle" && Math.abs(radiusX - radiusY) <= 1) {
    return {
      type: "circle",
      radius: Math.round((radiusX + radiusY) / 2),
      startAngle,
      endAngle,
    };
  }

  if (shape.kind === "ellipse" || shape.kind === "circle") {
    return {
      type: "ellipse",
      radiusX: Math.round(radiusX),
      radiusY: Math.round(radiusY),
      startAngle,
      endAngle,
    };
  }

  return null;
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
      const height = Math.max(fontSize, geometry.heightRatio * options.heightPx);
      const left = geometry.xRatio * options.widthPx;
      const top = geometry.yRatio * options.heightPx;
      const centerX = left + width / 2;
      const y = top + fontSize * 0.82;
      const pathGeometry = element.kind === "path"
        ? getPathGeometry(element, options)
        : null;
      const kind: Exclude<IllustratorTextKind, "path"> = element.kind === "area"
        ? "area"
        : element.kind === "path"
          ? "point"
          : "point";
      const fontAsset = getBundledGoogleFontAsset(typography?.fontFamily);
      const lineHeight = getLineHeight(typography);
      const maxLines = kind === "area"
        ? Math.max(1, Math.floor(height / Math.max(fontSize * lineHeight, 1)))
        : 1;
      const baseElement = {
        id: getElementId(element, index),
        label: element.sourceName ?? element.id ?? `Texto ${index + 1}`,
        text: element.text ?? "",
        source: "illustrator" as const,
        sourceTextKind: kind,
        needsReview: Boolean(
          element.needsReview ||
          element.mixedFormatting ||
          (element.kind === "path" && !pathGeometry),
        ),
        x: Math.round(
          pathGeometry && typeof element.pathText?.approximateShape?.centerXPt === "number"
            ? ptToPx(element.pathText.approximateShape.centerXPt, options.designMasterPpi)
            : kind === "area"
              ? left
              : centerX,
        ),
        y: Math.round(
          pathGeometry && typeof element.pathText?.approximateShape?.centerYPt === "number"
            ? ptToPx(element.pathText.approximateShape.centerYPt, options.designMasterPpi)
            : y,
        ),
        width: Math.round(width),
        height: Math.round(height),
        fontFamily: getFontFamily(typography, fallbackFont),
        pdfFont: "helvetica" as const,
        fontAsset,
        fontWeight: getFontWeight(typography?.fontStyle),
        fontSize: Math.round(fontSize),
        minFontSize: Math.max(8, Math.round(fontSize * 0.45)),
        fill: getFill(typography, fallbackFill),
        opacity: typeof element.opacity === "number" ? element.opacity / 100 : 1,
        align: normalizeAlign(typography?.alignment),
        maxLines,
        lineHeight,
        letterSpacing: trackingToPx(typography?.tracking, fontSize),
        rotation: geometry.rotationDeg ?? 0,
        sourceMeta: {
          geometry,
          typography,
          mixedFormatting: element.mixedFormatting ?? false,
          zOrderPosition: element.zOrderPosition,
          pathText: element.pathText,
        },
      };

      if (pathGeometry) {
        return {
          ...baseElement,
          kind: "pathText",
          path: pathGeometry,
          pathLocked: true,
        };
      }

      return baseElement;
    })
    .filter((element): element is TextElement => Boolean(element));
}
