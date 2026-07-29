export const demoPersonalizationProjectId = "demo-space-birthday";

export type PersonalizationFieldKey =
  | "name"
  | "age"
  | "date"
  | "time"
  | "place"
  | "message";

export type PersonalizationValues = Record<PersonalizationFieldKey, string>;

export type PersonalizationDraft = {
  projectId: string;
  collectionSlug: "space-birthday";
  productCode: "essential-invitation";
  currentStep: string;
  values: PersonalizationValues;
};

export const defaultPersonalizationValues: PersonalizationValues = {
  name: "",
  age: "",
  date: "",
  time: "",
  place: "",
  message: "",
};

export function createInitialPersonalizationDraft(): PersonalizationDraft {
  return {
    projectId: demoPersonalizationProjectId,
    collectionSlug: "space-birthday",
    productCode: "essential-invitation",
    currentStep: "name",
    values: defaultPersonalizationValues,
  };
}
