export type TemplateTextAlign = "left" | "center" | "right";

export type TemplateTextCopy = {
  x: number;
  y: number;
};

export type TemplateTextArc = {
  radius: number;
  startAngle: number;
  endAngle: number;
};

export type TemplateTextControls = {
  content: boolean;
  move: boolean;
  resize: boolean;
  font: boolean;
  color: boolean;
  rotate: boolean;
  delete: boolean;
};

export type TemplateTextField = {
  label: string;
  defaultValue: string;
  editable?: boolean;
  controls?: TemplateTextControls;
  x: number;
  y: number;
  width: number;
  copies?: TemplateTextCopy[];
  fontFamily: string;
  pdfFont?: "helvetica" | "times-roman";
  fontWeight?: number;
  fontSize: number;
  minFontSize: number;
  fill: string;
  opacity?: number;
  align: TemplateTextAlign;
  maxLines: number;
  lineHeight?: number;
  letterSpacing?: number;
  rotation?: number;
  arc?: TemplateTextArc;
};

export type TextElement = {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  pdfFont?: "helvetica" | "times-roman";
  fontWeight?: number;
  fontSize: number;
  minFontSize: number;
  fill: string;
  opacity?: number;
  align: TemplateTextAlign;
  maxLines: number;
  lineHeight?: number;
  letterSpacing?: number;
  rotation?: number;
};

export type TextSceneConstraints = {
  allowedFonts: Array<{
    label: string;
    value: string;
    pdfFont: "helvetica" | "times-roman";
  }>;
  allowedColors: string[];
  minFontSize: number;
  maxFontSize: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  defaults: Pick<
    TextElement,
    | "fontFamily"
    | "pdfFont"
    | "fontWeight"
    | "fontSize"
    | "minFontSize"
    | "fill"
    | "opacity"
    | "align"
    | "maxLines"
    | "lineHeight"
    | "letterSpacing"
  >;
};

export type InvitationTemplate = {
  id: string;
  collectionSlug: string;
  productCode: string;
  widthMm: number;
  heightMm: number;
  widthPx?: number;
  heightPx?: number;
  masterPpi?: number;
  master: {
    path: string;
    contentType: string;
  };
  preview: {
    src: string;
    widthPx: number;
  };
  artwork: {
    src: string;
    contentType: string;
  };
  textConstraints?: Partial<TextSceneConstraints>;
  fields: Record<string, TemplateTextField>;
};

export type RuntimeInvitationTemplate = InvitationTemplate & {
  widthPx: number;
  heightPx: number;
  masterPpi?: number;
};
