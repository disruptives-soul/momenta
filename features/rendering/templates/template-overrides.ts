import type {
  PersonalizationLayoutOverride,
  PersonalizationLayoutOverrides,
} from "@/features/personalization/types/personalization-draft";
import type { TemplateTextField } from "./template-types";

export function applyFieldOverride(
  field: TemplateTextField,
  override?: PersonalizationLayoutOverride,
): TemplateTextField {
  if (!override) {
    return field;
  }

  const translatedCopies =
    (override.x !== undefined || override.y !== undefined) && field.copies
      ? field.copies.map((copy) => ({
          x: copy.x + (override.x ?? field.x) - field.x,
          y: copy.y + (override.y ?? field.y) - field.y,
        }))
      : field.copies;

  return {
    ...field,
    x: override.x ?? field.x,
    y: override.y ?? field.y,
    width: override.width ?? field.width,
    fontFamily: override.fontFamily ?? field.fontFamily,
    pdfFont: override.pdfFont ?? field.pdfFont,
    fontWeight: override.fontWeight ?? field.fontWeight,
    fontSize: override.fontSize ?? field.fontSize,
    fill: override.fill ?? field.fill,
    opacity: override.opacity ?? field.opacity,
    align: override.align ?? field.align,
    rotation: override.rotation ?? field.rotation,
    letterSpacing: override.letterSpacing ?? field.letterSpacing,
    lineHeight: override.lineHeight ?? field.lineHeight,
    copies: translatedCopies,
  };
}

export function getFieldOverride(
  fieldKey: string,
  layout?: PersonalizationLayoutOverrides,
) {
  return layout?.[fieldKey];
}
