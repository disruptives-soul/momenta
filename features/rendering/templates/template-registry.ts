import { backing1x1Template } from "./backing-1x1-template";
import { banner2x1Template } from "./banner-2x1-template";
import { spaceBirthdayInvitationTemplate } from "./space-birthday-invitation-template";
import { stickersA3Template } from "./stickers-a3-template";

export const renderingTemplates = [
  spaceBirthdayInvitationTemplate,
  stickersA3Template,
  banner2x1Template,
  backing1x1Template,
] as const;

export function getRenderingTemplate(templateId: string) {
  return renderingTemplates.find((template) => template.id === templateId) ?? null;
}
