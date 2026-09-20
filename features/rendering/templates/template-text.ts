import type { PersonalizationValues } from "@/features/personalization/types/personalization-draft";
import type {
  TemplateTextAlign,
  TemplateTextArc,
  TemplateTextCopy,
  TemplateTextField,
} from "./template-types";
import { layoutPathText } from "./path-text-layout";

export function getTemplateFieldValue(
  fieldKey: string,
  field: TemplateTextField,
  values: PersonalizationValues,
) {
  return values[fieldKey]?.trim() || field.defaultValue;
}

export function getTextAnchor(align: TemplateTextAlign) {
  if (align === "left" || align === "justify") return "start";
  if (align === "right") return "end";
  return "middle";
}

export function getResponsiveFontSize(value: string, field: TemplateTextField) {
  const safeLength = Math.max(value.trim().length, 1);
  const approximateTextWidth = safeLength * field.fontSize * 0.56;

  if (approximateTextWidth <= field.width || field.maxLines > 1) {
    return field.fontSize;
  }

  return Math.max(
    field.minFontSize,
    Math.floor((field.width / approximateTextWidth) * field.fontSize),
  );
}

function polarToSvgPoint(copy: TemplateTextCopy, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: copy.x + radius * Math.cos(radians),
    y: copy.y + radius * Math.sin(radians),
  };
}

export function getArcPathD(copy: TemplateTextCopy, arc: TemplateTextArc) {
  const start = polarToSvgPoint(copy, arc.radius, arc.startAngle);
  const end = polarToSvgPoint(copy, arc.radius, arc.endAngle);
  const largeArcFlag = Math.abs(arc.endAngle - arc.startAngle) > 180 ? 1 : 0;
  const sweepFlag = arc.endAngle >= arc.startAngle ? 1 : 0;

  return [
    `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${arc.radius} ${arc.radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
  ].join(" ");
}

export function getTextWeight(fieldKey: string, field?: TemplateTextField) {
  if (field?.fontWeight) {
    return field.fontWeight;
  }

  return fieldKey === "monogram" || fieldKey === "label" ? 700 : 500;
}

export function getArcTextCharacters(
  value: string,
  copy: TemplateTextCopy,
  arc: TemplateTextArc,
  fontSize: number,
  letterSpacing = 0,
) {
  return layoutPathText({
    text: value,
    centerX: copy.x,
    centerY: copy.y,
    path: {
      type: "circle",
      radius: arc.radius,
      startAngle: arc.startAngle,
      endAngle: arc.endAngle,
    },
    fontSize,
    letterSpacing,
  });
}

export function wrapTemplateText(value: string, field: TemplateTextField) {
  const fontSize = getResponsiveFontSize(value, field);
  const maxCharactersPerLine = Math.max(
    8,
    Math.floor(field.width / (fontSize * 0.54)),
  );
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (field.maxLines === 1 || words.length === 0) {
    return [value.trim()];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharactersPerLine) {
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
    const lastLine = lines[lines.length - 1];
    lines[lines.length - 1] =
      lastLine.length > 3 ? `${lastLine.slice(0, -3).trimEnd()}...` : "...";
  }

  return lines;
}
