export type PutObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export type SignedUrlInput = {
  key: string;
  expiresInSeconds: number;
};

export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<void>;
  createSignedUrl(input: SignedUrlInput): Promise<string>;
}
