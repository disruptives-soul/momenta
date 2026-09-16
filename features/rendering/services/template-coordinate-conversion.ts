import type { RuntimeInvitationTemplate } from "../templates/template-types";

export function mmToPt(mm: number) {
  return (mm / 25.4) * 72;
}

export function getPdfPageSize(template: RuntimeInvitationTemplate) {
  return {
    widthPt: mmToPt(template.printProfile.widthMm),
    heightPt: mmToPt(template.printProfile.heightMm),
  };
}

export function pxToPdfX(
  xPx: number,
  template: RuntimeInvitationTemplate,
  pageWidthPt: number,
) {
  return (xPx / template.widthPx) * pageWidthPt;
}

export function pxToPdfY(
  yPx: number,
  template: RuntimeInvitationTemplate,
  pageHeightPt: number,
) {
  return pageHeightPt - (yPx / template.heightPx) * pageHeightPt;
}

export function pxToPdfWidth(
  widthPx: number,
  template: RuntimeInvitationTemplate,
  pageWidthPt: number,
) {
  return (widthPx / template.widthPx) * pageWidthPt;
}

export function pxFontSizeToPt(
  fontSizePx: number,
  template: RuntimeInvitationTemplate,
  pageHeightPt: number,
) {
  return (fontSizePx / template.heightPx) * pageHeightPt;
}
