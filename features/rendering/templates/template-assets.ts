import type { InvitationTemplate } from "./template-types";

export function getTemplateMasterAssetSrc(template: InvitationTemplate) {
  if (!template.storage?.masterKey && template.artwork.src) {
    return template.artwork.src;
  }

  return `/api/assets/template-master/${template.id}`;
}

export function getTemplatePreviewAssetSrc(template: InvitationTemplate) {
  if (!template.storage?.previewKey) {
    return template.preview.src;
  }

  return `/api/assets/template-preview/${template.id}`;
}
