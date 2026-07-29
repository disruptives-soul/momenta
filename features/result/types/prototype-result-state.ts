export type PrototypeGenerationState =
  | "idle"
  | "generating"
  | "ready"
  | "failed";

export type PrototypeDownloadState =
  | "available"
  | "downloading"
  | "completed"
  | "failed";
