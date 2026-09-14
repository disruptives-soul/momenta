import {
  createInitialPersonalizationDraft,
  type PersonalizationLayoutOverrides,
  type PersonalizationDraft,
  type PersonalizationValues,
} from "../types/personalization-draft";
import { renderingTemplates } from "@/features/rendering/templates/template-registry";
import { createTextSceneFromTemplate } from "@/features/rendering/templates/text-scene";

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
    const initialDraft = createInitialPersonalizationDraft();
    const parsedDraft = JSON.parse(stored) as Partial<PersonalizationDraft> & {
      layout?: PersonalizationLayoutOverrides;
      values?: PersonalizationValues;
    };
    const { layout: legacyLayout, ...storedDraft } = parsedDraft;
    const templateId = storedDraft.templateId ?? initialDraft.templateId;
    const values = {
      ...initialDraft.values,
      ...(storedDraft.valuesByTemplate?.[templateId] ?? storedDraft.values ?? {}),
    };
    const valuesByTemplate = {
      ...initialDraft.valuesByTemplate,
      ...(storedDraft.valuesByTemplate ?? {}),
      [templateId]: values,
    };
    const layouts = {
      ...initialDraft.layouts,
      ...(storedDraft.layouts ?? {}),
      ...(legacyLayout ? { [templateId]: legacyLayout } : {}),
    };
    const scenes = {
      ...Object.fromEntries(
        renderingTemplates.map((template) => [
          template.id,
          createTextSceneFromTemplate(template),
        ]),
      ),
      ...(storedDraft.scenes ?? {}),
    };

    return {
      ...initialDraft,
      ...storedDraft,
      templateId,
      values,
      valuesByTemplate,
      layouts,
      scenes,
    } as PersonalizationDraft;
  } catch {
    return createInitialPersonalizationDraft();
  }
}

export function savePersonalizationDraft(draft: PersonalizationDraft) {
  window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
}
