import { join } from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { spaceBirthdayInvitationTemplate } from "./space-birthday-invitation-template";
import type {
  InvitationTemplate,
  RuntimeInvitationTemplate,
  TemplatePrintDiagnostics,
} from "./template-types";

function mmToInches(mm: number) {
  return mm / 25.4;
}

function getTargetPixels(mm: number, targetPpi: number) {
  return Math.round(mmToInches(mm) * targetPpi);
}

function roundPpi(value: number) {
  return Math.round(value * 10) / 10;
}

export class TemplatePrintProfileError extends Error {
  constructor(
    message: string,
    readonly diagnostics: TemplatePrintDiagnostics,
  ) {
    super(message);
    this.name = "TemplatePrintProfileError";
  }
}

export function validateTemplatePrintProfile(
  template: InvitationTemplate,
  metadata: {
    width: number;
    height: number;
    density?: number;
  },
): TemplatePrintDiagnostics {
  const profile = template.printProfile;
  const tolerance = profile.ppiTolerance ?? 1;
  const targetWidthPx = getTargetPixels(profile.widthMm, profile.targetPpi);
  const targetHeightPx = getTargetPixels(profile.heightMm, profile.targetPpi);
  const effectivePpiX = metadata.width / mmToInches(profile.widthMm);
  const effectivePpiY = metadata.height / mmToInches(profile.heightMm);
  const effectivePpi = Math.min(effectivePpiX, effectivePpiY);
  const warnings: string[] = [];

  if (
    metadata.density !== undefined &&
    Math.abs(metadata.density - profile.targetPpi) > tolerance
  ) {
    warnings.push(
      `Master ${template.id} metadata density is ${metadata.density} PPI; target output is ${profile.targetPpi} PPI.`,
    );
  }

  const diagnostics = {
    effectivePpiX: roundPpi(effectivePpiX),
    effectivePpiY: roundPpi(effectivePpiY),
    effectivePpi: roundPpi(effectivePpi),
    designMasterPpi: profile.designMasterPpi,
    targetPpi: profile.targetPpi,
    metadataPpi: metadata.density,
    targetWidthPx,
    targetHeightPx,
    warnings,
  };

  if (effectivePpi + tolerance < profile.targetPpi) {
    throw new TemplatePrintProfileError(
      `Master ${template.id} is ${diagnostics.effectivePpi} effective PPI; target is at least ${profile.targetPpi} PPI for ${profile.widthMm} x ${profile.heightMm} mm.`,
      diagnostics,
    );
  }

  return diagnostics;
}

export function getMasterAssetPath(template: InvitationTemplate) {
  return join(
    process.cwd(),
    "features",
    "rendering",
    "assets",
    template.master.path,
  );
}

export async function loadOriginalMasterJpgBytes(
  template: InvitationTemplate,
) {
  if (template.master.contentType !== "image/jpeg") {
    throw new Error(
      `PDF renderer expects an original JPG master for template ${template.id}.`,
    );
  }

  return readFile(getMasterAssetPath(template));
}

export async function loadRuntimeInvitationTemplate(
  template: InvitationTemplate = spaceBirthdayInvitationTemplate,
): Promise<RuntimeInvitationTemplate> {
  const metadata = await sharp(getMasterAssetPath(template)).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read master dimensions for template ${template.id}.`);
  }

  const printDiagnostics = validateTemplatePrintProfile(template, {
    width: metadata.width,
    height: metadata.height,
    density: metadata.density,
  });

  printDiagnostics.warnings.forEach((warning) => {
    console.warn(warning);
  });

  return {
    ...template,
    widthPx: metadata.width,
    heightPx: metadata.height,
    masterPpi: metadata.density,
    printDiagnostics,
  };
}
