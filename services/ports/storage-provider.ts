export type PutObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export type GetObjectInput = {
  key: string;
};

export type GetObjectOutput = {
  body: Uint8Array;
  contentType?: string;
};

export type SignedUrlInput = {
  key: string;
  expiresInSeconds: number;
};

export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<void>;
  getObject?(input: GetObjectInput): Promise<GetObjectOutput>;
  createSignedUrl(input: SignedUrlInput): Promise<string>;
}
