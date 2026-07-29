import type { TemplateVariable } from "@/domain";

export type SvgTemplateContract = {
  templateId: string;
  variables: TemplateVariable[];
  widthMm: number;
  heightMm: number;
};

export function validateSvgTemplateContract(
  contract: SvgTemplateContract,
): string[] {
  const errors: string[] = [];

  if (!contract.templateId) {
    errors.push("Template id is required.");
  }

  if (contract.widthMm <= 0 || contract.heightMm <= 0) {
    errors.push("Template dimensions must be positive.");
  }

  for (const variable of contract.variables) {
    if (!variable.key || !variable.label) {
      errors.push("Each template variable needs a key and label.");
    }
  }

  return errors;
}
