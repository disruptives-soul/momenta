import type {
  InvitationTemplate,
  TextElement,
  TextSceneConstraints,
} from "./template-types";

export const defaultTextFonts = [
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
    pdfFont: "helvetica",
  },
  {
    label: "Georgia",
    value: "Georgia, serif",
    pdfFont: "times-roman",
  },
  {
    label: "Times",
    value: "Times New Roman, Times, serif",
    pdfFont: "times-roman",
  },
  {
    label: "Verdana",
    value: "Verdana, Geneva, sans-serif",
    pdfFont: "helvetica",
  },
] as const satisfies TextSceneConstraints["allowedFonts"];

export const defaultTextColors = [
  "#202124",
  "#ffffff",
  "#8b9477",
  "#9b9488",
  "#0f766e",
];

export function getTextSceneConstraints(
  template: InvitationTemplate,
): TextSceneConstraints {
  const width = template.widthPx ?? 1748;
  const height = template.heightPx ?? 2480;

  return {
    allowedFonts: template.textConstraints?.allowedFonts ?? [...defaultTextFonts],
    allowedColors: template.textConstraints?.allowedColors ?? defaultTextColors,
    minFontSize: template.textConstraints?.minFontSize ?? 24,
    maxFontSize: template.textConstraints?.maxFontSize ?? 900,
    bounds: template.textConstraints?.bounds ?? {
      x: 0,
      y: 0,
      width,
      height,
    },
    defaults: {
      fontFamily:
        template.textConstraints?.defaults?.fontFamily ??
        "Arial, Helvetica, sans-serif",
      pdfFont: template.textConstraints?.defaults?.pdfFont ?? "helvetica",
      fontWeight: template.textConstraints?.defaults?.fontWeight ?? 500,
      fontSize: template.textConstraints?.defaults?.fontSize ?? 120,
      minFontSize: template.textConstraints?.defaults?.minFontSize ?? 32,
      fill: template.textConstraints?.defaults?.fill ?? "#202124",
      opacity: template.textConstraints?.defaults?.opacity ?? 1,
      align: template.textConstraints?.defaults?.align ?? "center",
      maxLines: template.textConstraints?.defaults?.maxLines ?? 1,
      lineHeight: template.textConstraints?.defaults?.lineHeight ?? 1.15,
      letterSpacing: template.textConstraints?.defaults?.letterSpacing ?? 0,
    },
  };
}

export function createTextSceneFromTemplate(
  template: InvitationTemplate,
): TextElement[] {
  return Object.entries(template.fields)
    .filter(([, field]) => !field.arc)
    .flatMap(([fieldKey, field]) => {
      const copies = field.copies ?? [{ x: field.x, y: field.y }];

      return copies.map((copy, copyIndex) => ({
        id: copies.length > 1 ? `${fieldKey}-${copyIndex + 1}` : fieldKey,
        label: copies.length > 1 ? `${field.label} ${copyIndex + 1}` : field.label,
        text: field.defaultValue,
        x: copy.x,
        y: copy.y,
        width: field.width,
        fontFamily: field.fontFamily,
        pdfFont: field.pdfFont,
        fontWeight: field.fontWeight,
        fontSize: field.fontSize,
        minFontSize: field.minFontSize,
        fill: field.fill,
        opacity: field.opacity ?? 1,
        align: field.align,
        maxLines: field.maxLines,
        lineHeight: field.lineHeight ?? 1.15,
        letterSpacing: field.letterSpacing ?? 0,
        rotation: field.rotation ?? 0,
      }));
    });
}

export function createDefaultTextElement(
  template: InvitationTemplate,
  index: number,
): TextElement {
  const constraints = getTextSceneConstraints(template);
  const centerX = constraints.bounds.x + constraints.bounds.width / 2;
  const centerY = constraints.bounds.y + constraints.bounds.height / 2;

  return {
    id: `custom-text-${Date.now()}-${index}`,
    label: `Texto ${index}`,
    text: "Nuevo texto",
    x: centerX,
    y: centerY,
    width: Math.min(900, constraints.bounds.width * 0.5),
    ...constraints.defaults,
  };
}
