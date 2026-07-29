export type TemplateVariableKind = "text" | "date" | "time" | "number";

export type TemplateVariableRule = {
  required: boolean;
  maxLength?: number;
  minLength?: number;
  maxValue?: number;
  minValue?: number;
  displayFormat?: string;
  placeholder?: string;
};

export type TemplateVariable = {
  key: string;
  label: string;
  kind: TemplateVariableKind;
  rule: TemplateVariableRule;
};

export type Template = {
  id: string;
  productId: string;
  assetId: string;
  version: number;
  variables: TemplateVariable[];
};
