import type { StorageProvider } from "@/services/ports/storage-provider";
import { R2StorageProvider } from "@/infrastructure/r2/r2-storage-provider";
import { LocalFileStorageProvider } from "./local-file-storage-provider";

function isUsableEnvValue(value?: string) {
  return Boolean(value && value.trim() !== "" && value !== "[SENSITIVE]");
}

function hasR2Environment() {
  return Boolean(
    isUsableEnvValue(process.env.R2_ACCOUNT_ID) &&
      isUsableEnvValue(process.env.R2_ACCESS_KEY_ID) &&
      isUsableEnvValue(process.env.R2_SECRET_ACCESS_KEY) &&
      isUsableEnvValue(process.env.R2_BUCKET_NAME),
  );
}

export function createStorageProvider(): StorageProvider {
  if (hasR2Environment()) {
    return new R2StorageProvider({
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
      endpoint: isUsableEnvValue(process.env.R2_ENDPOINT)
        ? process.env.R2_ENDPOINT
        : undefined,
    });
  }

  return new LocalFileStorageProvider();
}

export function getStorageProviderName() {
  return hasR2Environment() ? "r2" : "local-file";
}
