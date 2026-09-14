import { join } from "node:path";
import sharp from "sharp";
import { spaceBirthdayInvitationTemplate } from "./space-birthday-invitation-template";
import type {
  InvitationTemplate,
  RuntimeInvitationTemplate,
} from "./template-types";

export function getMasterAssetPath(template: InvitationTemplate) {
  return join(
    process.cwd(),
    "features",
    "rendering",
    "assets",
    template.master.path,
  );
}

export async function loadRuntimeInvitationTemplate(
  template: InvitationTemplate = spaceBirthdayInvitationTemplate,
): Promise<RuntimeInvitationTemplate> {
  const metadata = await sharp(getMasterAssetPath(template)).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read master dimensions for template ${template.id}.`);
  }

  return {
    ...template,
    widthPx: metadata.width,
    heightPx: metadata.height,
    masterPpi: metadata.density,
  };
}
