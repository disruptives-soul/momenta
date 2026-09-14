import type {
  InvitationTemplate,
  TemplateTextAlign,
  TemplateTextCopy,
  TemplateTextField,
} from "@/features/rendering/templates/template-types";

export type TemplateScale = {
  width: number;
  height: number;
  offsetX: number;
  scaleX: number;
  scaleY: number;
};

export function getTemplatePixelSize(template: InvitationTemplate) {
  return {
    widthPx: template.widthPx ?? 1748,
    heightPx: template.heightPx ?? 2480,
  };
}

export function getVisibleTemplateSize(
  template: InvitationTemplate,
  availableWidth: number,
  zoom = 1,
  availableHeight?: number,
) {
  const { widthPx, heightPx } = getTemplatePixelSize(template);
  const viewportWidth = Math.max(280, availableWidth - 32);
  const viewportHeight = availableHeight ? Math.max(360, availableHeight - 32) : null;
  const maxWidthByHeight = viewportHeight
    ? (viewportHeight / heightPx) * widthPx
    : template.preview.widthPx;
  const baseWidth = Math.max(
    280,
    Math.min(viewportWidth, template.preview.widthPx, maxWidthByHeight),
  );
  const width = baseWidth * zoom;

  return {
    width,
    height: (width / widthPx) * heightPx,
    offsetX: Math.max((availableWidth - width) / 2, 0),
    scaleX: width / widthPx,
    scaleY: ((width / widthPx) * heightPx) / heightPx,
  };
}

export function getCopyList(field: TemplateTextField): TemplateTextCopy[] {
  return field.copies ?? [{ x: field.x, y: field.y }];
}

export function getAlignedTextLeft(
  copyX: number,
  width: number,
  align: TemplateTextAlign,
) {
  if (align === "right") {
    return copyX - width;
  }

  if (align === "center") {
    return copyX - width / 2;
  }

  return copyX;
}

export function getScaledCopy(copy: TemplateTextCopy, scale: TemplateScale) {
  return {
    x: copy.x * scale.scaleX,
    y: copy.y * scale.scaleY,
  };
}

export function getScaledFieldWidth(
  field: TemplateTextField,
  scale: TemplateScale,
) {
  return field.width * scale.scaleX;
}

export function getScaledFontSize(
  fontSize: number,
  scale: TemplateScale,
) {
  return fontSize * scale.scaleY;
}
