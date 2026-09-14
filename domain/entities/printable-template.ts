export type PrintableTextAlign = "left" | "center" | "right";

export type PrintableTextCopy = {
  x: number;
  y: number;
};

export type PrintableTextArc = {
  radius: number;
  startAngle: number;
  endAngle: number;
};

export type PersonalizationFieldControls = {
  content: boolean;
  move: boolean;
  resize: boolean;
  font: boolean;
  color: boolean;
  rotate: boolean;
  delete: boolean;
};

export type PersonalizationField = {
  id: string;
  label: string;
  type: "text";
  required: boolean;
  editable: boolean;
  controls: PersonalizationFieldControls;
  defaultValue: string;
  maxLength?: number;
  x: number;
  y: number;
  width: number;
  copies?: PrintableTextCopy[];
  fontFamily: string;
  pdfFont?: "helvetica" | "times-roman";
  fontSize: number;
  minFontSize: number;
  fill: string;
  align: PrintableTextAlign;
  maxLines: number;
  lineHeight?: number;
  letterSpacing?: number;
  arc?: PrintableTextArc;
};

export type PrintableTemplate = {
  id: string;
  collectionId: string;
  productId: string;
  physical: {
    widthMm: number;
    heightMm: number;
  };
  master: {
    assetKey: string;
    widthPx?: number;
    heightPx?: number;
    ppi?: number;
    contentType: string;
  };
  preview: {
    assetKey: string;
    widthPx: number;
  };
  fields: PersonalizationField[];
};

export type PersonalizationData = Record<string, string>;
