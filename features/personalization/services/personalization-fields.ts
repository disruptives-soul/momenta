import { spaceInvitationProduct } from "@/features/products/data/mock-products";
import type { TemplateVariable } from "@/domain";
import type { PersonalizationFieldKey } from "../types/personalization-draft";

export type PersonalizationFieldDefinition = TemplateVariable & {
  key: PersonalizationFieldKey;
};

export const personalizationFields =
  spaceInvitationProduct.variables as PersonalizationFieldDefinition[];

export function getPersonalizationField(fieldKey: PersonalizationFieldKey) {
  return personalizationFields.find((field) => field.key === fieldKey);
}
