export type AssetKind = "image" | "font" | "svg-template";

export type Asset = {
  id: string;
  kind: AssetKind;
  storageKey: string;
  contentType: string;
  checksum?: string;
};
