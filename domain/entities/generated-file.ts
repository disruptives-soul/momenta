export type GeneratedFileFormat = "png" | "pdf" | "zip";

export type GeneratedFile = {
  id: string;
  projectId: string;
  format: GeneratedFileFormat;
  storageKey: string;
  sizeBytes: number;
  createdAt: Date;
};
