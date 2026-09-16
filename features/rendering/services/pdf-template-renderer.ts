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
  pageHeightPt: number,
) {
  let fontSize = pxFontSizeToPt(field.fontSize, template, pageHeightPt);
  const minFontSize = pxFontSizeToPt(field.minFontSize, template, pageHeightPt);

  if (field.maxLines > 1) {
    return fontSize;
  }

  while (fontSize > minFontSize && font.widthOfTextAtSize(value, fontSize) > maxWidthPt) {
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
) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (field.maxLines === 1 || words.length === 0) {
    return [value.trim()];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidthPt) {
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
      font.widthOfTextAtSize(`${lastLine}...`, fontSize) > maxWidthPt
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
  const lineWidth = font.widthOfTextAtSize(line, fontSize);

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
  font: PDFFont,
  maxWidthPt: number,
  template: RuntimeInvitationTemplate,
  pageHeightPt: number,
) {
  let fontSize = pxFontSizeToPt(element.fontSize, template, pageHeightPt);
  const minFontSize = pxFontSizeToPt(element.minFontSize, template, pageHeightPt);

  if (element.maxLines > 1) {
    return fontSize;
  }

  while (
    fontSize > minFontSize &&
    font.widthOfTextAtSize(element.text, fontSize) > maxWidthPt
  ) {
    fontSize -= 0.5;
  }

  return Math.max(fontSize, minFontSize);
}

function wrapPdfElementText(
  element: TextElement,
  font: PDFFont,
  fontSize: number,
  maxWidthPt: number,
) {
  const words = element.text.trim().split(/\s+/).filter(Boolean);

  if (element.maxLines === 1 || words.length === 0) {
    return [element.text.trim()];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidthPt) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === element.maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < element.maxLines) {
    lines.push(currentLine);
  }

  return lines;
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
  const lineWidth = font.widthOfTextAtSize(line, fontSize);

  if (element.align === "left") {
    return anchorX;
  }

  if (element.align === "right") {
    return anchorX - lineWidth;
  }

  return anchorX - lineWidth / 2;
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

  const characters = Array.from(value);
  const radiusPt = pxToPdfWidth(field.arc.radius, template, pageWidthPt);
  const centerX = pxToPdfX(copy.x, template, pageWidthPt);
  const centerY = pxToPdfY(copy.y, template, pageHeightPt);
  const startAngle = field.arc.startAngle;
  const endAngle = field.arc.endAngle;
  const span = endAngle - startAngle;
  const direction = span >= 0 ? 1 : -1;
  const letterSpacingPt = pxToPdfWidth(field.letterSpacing ?? 0, template, pageWidthPt);
  const characterWidths = characters.map((character) =>
    font.widthOfTextAtSize(character, fontSize),
  );
  const textWidth =
    characterWidths.reduce((total, width) => total + width, 0) +
    letterSpacingPt * Math.max(characters.length - 1, 0);
  const textAngle = (textWidth / radiusPt) * (180 / Math.PI);
  let cursorAngle = (startAngle + endAngle) / 2 - (direction * textAngle) / 2;

  characters.forEach((character, index) => {
    const halfCharacterAngle =
      (characterWidths[index] / 2 / radiusPt) * (180 / Math.PI);
    const letterSpacingAngle = (letterSpacingPt / radiusPt) * (180 / Math.PI);
    const angle = cursorAngle + direction * halfCharacterAngle;
    const rotatedAngle = angle + (field.rotation ?? 0);
    const radians = (rotatedAngle * Math.PI) / 180;
    const characterWidth = font.widthOfTextAtSize(character, fontSize);
    const x = centerX + radiusPt * Math.cos(radians);
    const y = centerY - radiusPt * Math.sin(radians);

    cursorAngle += direction * (halfCharacterAngle * 2 + letterSpacingAngle);

    page.drawText(character, {
      x: x - characterWidth / 2,
      y: y - fontSize / 3,
      size: fontSize,
      font,
      color: hexToRgb(field.fill),
      opacity: field.opacity ?? 1,
      rotate: degrees(direction >= 0 ? -rotatedAngle - 90 : -rotatedAngle + 90),
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
      const maxWidthPt = pxToPdfWidth(element.width, template, widthPt);
      const fontSize = fitElementFontSize(
        { ...element, text: value },
        font,
        maxWidthPt,
        template,
        heightPt,
      );
      const lines = wrapPdfElementText(
        { ...element, text: value },
        font,
        fontSize,
        maxWidthPt,
      );
      const lineHeight = element.lineHeight ?? 1.15;
      const startY = pxToPdfY(element.y, template, heightPt);

      lines.forEach((line, index) => {
        page.drawText(line, {
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
    const fontSize = fitFontSize(value, field, font, maxWidthPt, template, heightPt);
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

    const lines = wrapPdfText(value, field, font, fontSize, maxWidthPt);
    const lineHeight = field.lineHeight ?? 1.15;
    for (const copy of field.copies ?? [{ x: field.x, y: field.y }]) {
      const startY = pxToPdfY(copy.y, template, heightPt);

      lines.forEach((line, index) => {
        page.drawText(line, {
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

export async function renderPersonalizedTemplatesPdf(
  templates: PersonalizedPdfTemplateInput[],
) {
  const pdf = await PDFDocument.create();

  for (const item of templates) {
    const templatePdfBytes = await renderPersonalizedInvitationPdf(
      item.values,
      item.template,
      item.layout,
      item.scene,
    );
    const templatePdf = await PDFDocument.load(templatePdfBytes);
    const pages = await pdf.copyPages(
      templatePdf,
      templatePdf.getPageIndices(),
    );

    pages.forEach((page) => pdf.addPage(page));
  }

  return pdf.save();
}
