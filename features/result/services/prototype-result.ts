import {
  demoPersonalizationProjectId,
  type PersonalizationDraft,
} from "@/features/personalization/types/personalization-draft";

export function isValidPrototypeProject(projectId: string) {
  return projectId === demoPersonalizationProjectId;
}

export function getPrototypeProjectErrors(draft: PersonalizationDraft) {
  return draft.templateId ? {} : { templateId: "Seleccioná una plantilla." };
}

export function hasCompletePrototypeDraft(draft: PersonalizationDraft) {
  return Object.keys(getPrototypeProjectErrors(draft)).length === 0;
}

export const resultEventPayload = {
  projectId: demoPersonalizationProjectId,
  collectionSlug: "space-birthday",
  productCode: "essential-invitation",
} as const;
