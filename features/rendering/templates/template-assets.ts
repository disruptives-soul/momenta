import type { InvitationTemplate } from "./template-types";

export function getTemplatePreviewAssetSrc(template: InvitationTemplate) {
  if (!template.storage?.previewKey) {
    return template.preview.src;
  }

  return `/api/assets/template-preview/${template.id}`;
}
