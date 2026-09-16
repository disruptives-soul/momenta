import { spaceBirthdayInvitationTemplate } from "@/features/rendering/templates/space-birthday-invitation-template";
import { createTextSceneFromTemplate } from "@/features/rendering/templates/text-scene";
import type {
  TemplateFontAsset,
  TemplatePdfFont,
  TextElement,
} from "@/features/rendering/templates/template-types";

export const demoPersonalizationProjectId = "demo-space-birthday";

export type PersonalizationFieldKey = string;

export type PersonalizationValues = Record<PersonalizationFieldKey, string>;
export type PersonalizationTemplateValues = Record<string, PersonalizationValues>;

export type PersonalizationLayoutOverride = {
  x?: number;
  y?: number;
  width?: number;
  fontFamily?: string;
  pdfFont?: TemplatePdfFont;
  fontAsset?: TemplateFontAsset;
  fontWeight?: number;
  fontSize?: number;
  fill?: string;
  opacity?: number;
  align?: "left" | "center" | "right";
  rotation?: number;
  letterSpacing?: number;
  lineHeight?: number;
};

export type PersonalizationLayoutOverrides = Record<
  PersonalizationFieldKey,
  PersonalizationLayoutOverride
>;
export type PersonalizationTemplateLayouts = Record<
  string,
  PersonalizationLayoutOverrides
>;
export type PersonalizationTextScenes = Record<string, TextElement[]>;

export type PersonalizationDraft = {
  projectId: string;
  collectionSlug: "space-birthday";
  productCode: "essential-invitation";
  templateId: string;
  currentStep: string;
  values: PersonalizationValues;
  valuesByTemplate: PersonalizationTemplateValues;
  layouts: PersonalizationTemplateLayouts;
  scenes: PersonalizationTextScenes;
};

export const defaultPersonalizationValues: PersonalizationValues =
  Object.fromEntries(
    Object.entries(spaceBirthdayInvitationTemplate.fields).map(([key, field]) => [
      key,
      field.defaultValue,
    ]),
  );

export function createInitialPersonalizationDraft(): PersonalizationDraft {
  const templateId = spaceBirthdayInvitationTemplate.id;

  return {
    projectId: demoPersonalizationProjectId,
    collectionSlug: "space-birthday",
    productCode: "essential-invitation",
    templateId,
    currentStep: "canvas",
    values: defaultPersonalizationValues,
    valuesByTemplate: {
      [templateId]: defaultPersonalizationValues,
    },
    layouts: {
      [templateId]: {},
    },
    scenes: {
      [templateId]: createTextSceneFromTemplate(spaceBirthdayInvitationTemplate),
    },
  };
}

export function getDraftTemplateLayout(
  draft: PersonalizationDraft,
  templateId = draft.templateId,
) {
  return draft.layouts[templateId] ?? {};
}

export function getDraftTemplateScene(
  draft: PersonalizationDraft,
  templateId = draft.templateId,
) {
  return draft.scenes[templateId] ?? [];
}
