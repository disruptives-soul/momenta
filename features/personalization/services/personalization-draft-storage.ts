import {
  createInitialPersonalizationDraft,
  type PersonalizationDraft,
} from "../types/personalization-draft";

const storageKey = "momenta:stage1:space-birthday:personalization";

export function loadPersonalizationDraft() {
  if (typeof window === "undefined") {
    return createInitialPersonalizationDraft();
  }

  const stored = window.sessionStorage.getItem(storageKey);

  if (!stored) {
    return createInitialPersonalizationDraft();
  }

  try {
    return {
      ...createInitialPersonalizationDraft(),
      ...JSON.parse(stored),
    } as PersonalizationDraft;
  } catch {
    return createInitialPersonalizationDraft();
  }
}

export function savePersonalizationDraft(draft: PersonalizationDraft) {
  window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
}
