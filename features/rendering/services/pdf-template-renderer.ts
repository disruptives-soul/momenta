import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  degrees,
  PDFDocument,
  type PDFPage,
  StandardFonts,
  type PDFFont,
  rgb,
} from "pdf-lib";
import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import type {
  InvitationTemplate,
  RuntimeInvitationTemplate,
  TextElement,
  TemplateFontAsset,
  TemplateTextField,
} from "../templates/template-types";
import { spaceBirthdayInvitationTemplate } from "../templates/space-birthday-invitation-template";
import {
  loadOriginalMasterJpgBytes,
  loadRuntimeInvitationTemplate,
} from "../templates/load-runtime-template";
import {
  getTemplateFieldValue,
} from "../templates/template-text";
import { applyFieldOverride } from "../templates/template-overrides";
import { layoutPathText } from "../templates/path-text-layout";
import {
  getPdfPageSize,
  pxFontSizeToPt,
  pxToPdfWidth,
  pxToPdfX,
  pxToPdfY,
} from "./template-coordinate-conversion";
import { addInstructionPageTemplate } from "./instruction-page-template";

function hexToRgb(value: string) {
  const normalized = value.replace("#", "");
  const number = Number.parseInt(normalized, 16);

  return rgb(
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  );
}

function normalizePdfText(value: string) {
  return value.replaceAll("\uFFFD", "").normalize("NFC");
}

function getTrackedTextWidth(
  value: string,
  font: PDFFont,
  fontSize: number,
  letterSpacingPt = 0,
) {
  if (!letterSpacingPt || value.length <= 1) {
    return font.widthOfTextAtSize(value, fontSize);
  }

  return (
    Array.from(value).reduce(
      (width, character) => width + font.widthOfTextAtSize(character, fontSize),
      0,
    ) +
    letterSpacingPt * (Array.from(value).length - 1)
  );
}

function drawTrackedText(
  page: PDFPage,
  value: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
    opacity: number;
    letterSpacingPt?: number;
    rotate?: ReturnType<typeof degrees>;
  },
) {
  const letterSpacingPt = options.letterSpacingPt ?? 0;

  if (!letterSpacingPt || value.length <= 1) {
    page.drawText(value, {
      x: options.x,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
      opacity: options.opacity,
      rotate: options.rotate,
    });
    return;
  }

  let cursorX = options.x;

  for (const character of Array.from(value)) {
    page.drawText(character, {
      x: cursorX,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
      opacity: options.opacity,
      rotate: options.rotate,
    });
    cursorX +=
      options.font.widthOfTextAtSize(character, options.size) + letterSpacingPt;
  }
}

function getElementStandardFontName(element: TextElement) {
  const isBold = (element.fontWeight ?? 500) >= 700;

  if (element.pdfFont === "times-roman") {
    return isBold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
  }

  return isBold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
}

function getFontAssetPath(fontAssetPath: string) {
  return join(
    process.cwd(),
    "features",
    "rendering",
    "assets",
    fontAssetPath,
  );
}

function getFontAssetKey(fontAsset: TemplateFontAsset, fontWeight?: number) {
  const isBold = (fontWeight ?? 500) >= 700;

  return isBold && fontAsset.bold ? fontAsset.bold : fontAsset.regular;
}

type StandardPdfFonts = {
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  timesRoman: PDFFont;
  timesRomanBold: PDFFont;
};

function getEmbeddedStandardFont(
  standardFontName: StandardFonts,
  standardFonts: StandardPdfFonts,
) {
  if (standardFontName === StandardFonts.TimesRoman) {
    return standardFonts.timesRoman;
  }

  if (standardFontName === StandardFonts.TimesRomanBold) {
    return standardFonts.timesRomanBold;
  }

  if (standardFontName === StandardFonts.HelveticaBold) {
    return standardFonts.helveticaBold;
  }

  return standardFonts.helvetica;
}

async function getPdfFont(
  pdf: PDFDocument,
  standardFonts: StandardPdfFonts,
  customFontCache: Map<string, PDFFont>,
  fontSource: Pick<TextElement, "fontAsset" | "fontWeight" | "pdfFont">,
) {
  if (fontSource.fontAsset) {
    const fontAssetKey = getFontAssetKey(
      fontSource.fontAsset,
      fontSource.fontWeight,
    );
    const cachedFont = customFontCache.get(fontAssetKey);

    if (cachedFont) {
      return cachedFont;
    }

    const fontBytes = await readFile(getFontAssetPath(fontAssetKey));
    const font = await pdf.embedFont(fontBytes, { subset: true });
    customFontCache.set(fontAssetKey, font);

    return font;
  }

  return getEmbeddedStandardFont(
    getElementStandardFontName(fontSource as TextElement),
    standardFonts,
  );
}

function getStandardFontName(field: TemplateTextField) {
  const isBold = (field.fontWeight ?? 500) >= 700;

  if (field.pdfFont === "times-roman") {
    return isBold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
  }

  return isBold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
}

function fitFontSize(
  value: string,
  field: TemplateTextField,
  font: PDFFont,
  maxWidthPt: number,
  template: RuntimeInvitationTemplate,
  pageWidthPt: number,
  pageHeightPt: number,
) {
  let fontSize = pxFontSizeToPt(field.fontSize, template, pageHeightPt);
  const minFontSize = pxFontSizeToPt(field.minFontSize, template, pageHeightPt);
  const letterSpacingPt = pxToPdfWidth(field.letterSpacing ?? 0, template, pageWidthPt);

  if (field.maxLines > 1) {
    return fontSize;
  }

  while (
    fontSize > minFontSize &&
    getTrackedTextWidth(value, font, fontSize, letterSpacingPt) > maxWidthPt
  ) {
    fontSize -= 0.5;
  }

  return Math.max(fontSize, minFontSize);
}

function wrapPdfText(
  value: string,
  field: TemplateTextField,
  font: PDFFont,
  fontSize: number,
  maxWidthPt: number,
  letterSpacingPt = 0,
) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (field.maxLines === 1 || words.length === 0) {
    return [value.trim()];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (getTrackedTextWidth(nextLine, font, fontSize, letterSpacingPt) <= maxWidthPt) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === field.maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < field.maxLines) {
    lines.push(currentLine);
  }

  const usedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;

  if (usedWords < words.length && lines.length > 0) {
    let lastLine = lines[lines.length - 1];

    while (
      lastLine.length > 0 &&
      getTrackedTextWidth(`${lastLine}...`, font, fontSize, letterSpacingPt) > maxWidthPt
    ) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }

    lines[lines.length - 1] = `${lastLine}...`;
  }

  return lines;
}

function getAlignedTextX(
  field: TemplateTextField,
  line: string,
  font: PDFFont,
  fontSize: number,
  pageWidthPt: number,
  template: RuntimeInvitationTemplate,
) {
  const anchorX = pxToPdfX(field.x, template, pageWidthPt);
  const letterSpacingPt = pxToPdfWidth(field.letterSpacing ?? 0, template, pageWidthPt);
  const lineWidth = getTrackedTextWidth(line, font, fontSize, letterSpacingPt);

  if (field.align === "left") {
    return anchorX;
  }

  if (field.align === "right") {
    return anchorX - lineWidth;
  }

  return anchorX - lineWidth / 2;
}

function fitElementFontSize(
  element: TextElement,
  _font: PDFFont,
  _maxWidthPt: number,
  template: RuntimeInvitationTemplate,
  _pageWidthPt: number,
  pageHeightPt: number,
) {
  return pxFontSizeToPt(element.fontSize, template, pageHeightPt);
}

function wrapPdfElementText(
  element: TextElement,
  font: PDFFont,
  fontSize: number,
  maxWidthPt: number,
  letterSpacingPt = 0,
) {
  const lines: string[] = [];

  for (const paragraph of element.text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let currentLine = "";

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (
        !currentLine ||
        getTrackedTextWidth(nextLine, font, fontSize, letterSpacingPt) <=
          maxWidthPt
      ) {
        currentLine = nextLine;
        continue;
      }

      lines.push(currentLine);
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [element.text.trim()];
}

function getAlignedElementTextX(
  element: TextElement,
  line: string,
  font: PDFFont,
  fontSize: number,
  pageWidthPt: number,
  template: RuntimeInvitationTemplate,
) {
  const anchorX = pxToPdfX(element.x, template, pageWidthPt);
  const letterSpacingPt = pxToPdfWidth(
    element.letterSpacing ?? 0,
    template,
    pageWidthPt,
  );
  const lineWidth = getTrackedTextWidth(line, font, fontSize, letterSpacingPt);

  if (element.align === "left") {
    return anchorX;
  }

  if (element.align === "right") {
    return anchorX - lineWidth;
  }

  return anchorX - lineWidth / 2;
}

function drawPathTextElement(
  page: PDFPage,
  value: string,
  element: TextElement,
  font: PDFFont,
  template: RuntimeInvitationTemplate,
  pageWidthPt: number,
  pageHeightPt: number,
) {
  if (element.kind !== "pathText") {
    return;
  }

  const fontSize = pxFontSizeToPt(element.fontSize, template, pageHeightPt);
  const glyphMetrics = Array.from(value).map((character) => ({
    character,
    width:
      (font.widthOfTextAtSize(character, fontSize) / pageWidthPt) *
      template.widthPx,
  }));
  const glyphs = layoutPathText({
    text: value,
    centerX: element.x,
    centerY: element.y,
    path: element.path,
    fontSize: element.fontSize,
    letterSpacing: element.letterSpacing ?? 0,
    rotation: element.rotation ?? 0,
    glyphMetrics,
  });

  glyphs.forEach((glyph) => {
    const characterWidth = font.widthOfTextAtSize(glyph.character, fontSize);

    page.drawText(glyph.character, {
      x: pxToPdfX(glyph.x, template, pageWidthPt) - characterWidth / 2,
      y: pxToPdfY(glyph.y, template, pageHeightPt) - fontSize / 3,
      size: fontSize,
      font,
      color: hexToRgb(element.fill),
      opacity: element.opacity ?? 1,
      rotate: degrees(-glyph.rotation),
    });
  });
}

function drawArcText(
  page: PDFPage,
  value: string,
  field: TemplateTextField,
  copy: { x: number; y: number },
  font: PDFFont,
  fontSize: number,
  template: RuntimeInvitationTemplate,
  pageWidthPt: number,
  pageHeightPt: number,
) {
  if (!field.arc) {
    return;
  }

  const glyphMetrics = Array.from(value).map((character) => ({
    character,
    width:
      (font.widthOfTextAtSize(character, fontSize) / pageWidthPt) *
      template.widthPx,
  }));
  const glyphs = layoutPathText({
    text: value,
    centerX: copy.x,
    centerY: copy.y,
    path: {
      type: "circle",
      radius: field.arc.radius,
      startAngle: field.arc.startAngle,
      endAngle: field.arc.endAngle,
    },
    fontSize: field.fontSize,
    letterSpacing: field.letterSpacing ?? 0,
    rotation: field.rotation ?? 0,
    glyphMetrics,
  });

  glyphs.forEach((glyph) => {
    const characterWidth = font.widthOfTextAtSize(glyph.character, fontSize);

    page.drawText(glyph.character, {
      x: pxToPdfX(glyph.x, template, pageWidthPt) - characterWidth / 2,
      y: pxToPdfY(glyph.y, template, pageHeightPt) - fontSize / 3,
      size: fontSize,
      font,
      color: hexToRgb(field.fill),
      opacity: field.opacity ?? 1,
      rotate: degrees(-glyph.rotation),
    });
  });
}

export async function renderPersonalizedInvitationPdf(
  values: PersonalizationValues,
  baseTemplate: InvitationTemplate = spaceBirthdayInvitationTemplate,
  layout: PersonalizationLayoutOverrides = {},
  scene?: TextElement[],
) {
  const template = await loadRuntimeInvitationTemplate(
    baseTemplate,
  );
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const { widthPt, heightPt } = getPdfPageSize(template);
  const page = pdf.addPage([widthPt, heightPt]);
  // Preserve color pipeline: never process the master with Sharp before PDF.
  // The original JPG bytes go directly into pdf-lib.
  const masterBytes = await loadOriginalMasterJpgBytes(template);
  const master = await pdf.embedJpg(masterBytes);
  const standardFonts: StandardPdfFonts = {
    helvetica: await pdf.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdf.embedFont(StandardFonts.HelveticaBold),
    timesRoman: await pdf.embedFont(StandardFonts.TimesRoman),
    timesRomanBold: await pdf.embedFont(StandardFonts.TimesRomanBold),
  };
  const customFontCache = new Map<string, PDFFont>();

  page.drawImage(master, {
    x: 0,
    y: 0,
    width: widthPt,
    height: heightPt,
  });

  if (scene) {
    for (const element of scene) {
      const value = normalizePdfText(element.text);
      const font = await getPdfFont(
        pdf,
        standardFonts,
        customFontCache,
        element,
      );
      if (element.kind === "pathText") {
        drawPathTextElement(
          page,
          value,
          element,
          font,
          template,
          widthPt,
          heightPt,
        );
        continue;
      }

      const maxWidthPt = pxToPdfWidth(element.width, template, widthPt);
      const fontSize = fitElementFontSize(
        { ...element, text: value },
        font,
        maxWidthPt,
        template,
        widthPt,
        heightPt,
      );
      const letterSpacingPt = pxToPdfWidth(
        element.letterSpacing ?? 0,
        template,
        widthPt,
      );
      const lines = wrapPdfElementText(
        { ...element, text: value },
        font,
        fontSize,
        maxWidthPt,
        letterSpacingPt,
      );
      const lineHeight = element.lineHeight ?? 1.15;
      const startY = pxToPdfY(element.y, template, heightPt);

      lines.forEach((line, index) => {
        drawTrackedText(page, line, {
          x: getAlignedElementTextX(
            element,
            line,
            font,
            fontSize,
            widthPt,
            template,
          ),
          y: startY - index * fontSize * lineHeight,
          size: fontSize,
          font,
          color: hexToRgb(element.fill),
          opacity: element.opacity ?? 1,
          letterSpacingPt,
          rotate: element.rotation ? degrees(-(element.rotation ?? 0)) : undefined,
        });
      });
    }

    await addInstructionPageTemplate(pdf, template, {
      regular: standardFonts.helvetica,
      bold: standardFonts.helveticaBold,
    });

    return pdf.save();
  }

  for (const [fieldKey, baseField] of Object.entries(template.fields)) {
    const field = applyFieldOverride(baseField, layout[fieldKey]);
    const value = normalizePdfText(getTemplateFieldValue(fieldKey, field, values));
    const font = field.fontAsset
      ? await getPdfFont(pdf, standardFonts, customFontCache, field)
      : getEmbeddedStandardFont(getStandardFontName(field), standardFonts);
    const maxWidthPt = pxToPdfWidth(field.width, template, widthPt);
    const fontSize = fitFontSize(
      value,
      field,
      font,
      maxWidthPt,
      template,
      widthPt,
      heightPt,
    );
    if (field.arc) {
      for (const copy of field.copies ?? [{ x: field.x, y: field.y }]) {
        drawArcText(
          page,
          value,
          field,
          copy,
          font,
          fontSize,
          template,
          widthPt,
          heightPt,
        );
      }

      continue;
    }

    const letterSpacingPt = pxToPdfWidth(
      field.letterSpacing ?? 0,
      template,
      widthPt,
    );
    const lines = wrapPdfText(
      value,
      field,
      font,
      fontSize,
      maxWidthPt,
      letterSpacingPt,
    );
    const lineHeight = field.lineHeight ?? 1.15;
    for (const copy of field.copies ?? [{ x: field.x, y: field.y }]) {
      const startY = pxToPdfY(copy.y, template, heightPt);

      lines.forEach((line, index) => {
        drawTrackedText(page, line, {
          x: getAlignedTextX(
            { ...field, x: copy.x, y: copy.y },
            line,
            font,
            fontSize,
            widthPt,
            template,
          ),
          y: startY - index * fontSize * lineHeight,
          size: fontSize,
          font,
          color: hexToRgb(field.fill),
          opacity: field.opacity ?? 1,
          letterSpacingPt,
          rotate: field.rotation ? degrees(-(field.rotation ?? 0)) : undefined,
        });
      });
    }
  }

  await addInstructionPageTemplate(pdf, template, {
    regular: standardFonts.helvetica,
    bold: standardFonts.helveticaBold,
  });

  return pdf.save();
}

export type PersonalizedPdfTemplateInput = {
  values: PersonalizationValues;
  template: InvitationTemplate;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
};
