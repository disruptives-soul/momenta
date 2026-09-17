import { createHash, createHmac } from "node:crypto";
import type {
  GetObjectOutput,
  PutObjectInput,
  SignedUrlInput,
  StorageProvider,
} from "@/services/ports/storage-provider";

export type R2StorageProviderConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
};

const REGION = "auto";
const SERVICE = "s3";

function hashSha256(input: Uint8Array | string) {
  return createHash("sha256").update(input).digest("hex");
}

function hmacSha256(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacSha256Hex(key: Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function toAmzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(amzDate: string) {
  return amzDate.slice(0, 8);
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeKeyPath(key: string) {
  return key.split("/").map(encodePathSegment).join("/");
}

function encodeQueryValue(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function getCanonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .map(([key, value]) => [encodeQueryValue(key), encodeQueryValue(value)])
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmacSha256(dateKey, REGION);
  const serviceKey = hmacSha256(regionKey, SERVICE);

  return hmacSha256(serviceKey, "aws4_request");
}

function getCredentialScope(dateStamp: string) {
  return `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, "");
}

export function getR2Endpoint(accountId: string) {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export class R2StorageProvider implements StorageProvider {
  private readonly endpoint: string;
  private readonly host: string;

  constructor(private readonly config: R2StorageProviderConfig) {
    this.endpoint = normalizeEndpoint(
      config.endpoint ?? getR2Endpoint(config.accountId),
    );
    this.host = new URL(this.endpoint).host;
  }

  async putObject(input: PutObjectInput): Promise<void> {
    const requestBody = Buffer.from(input.body);
    const payloadHash = hashSha256(requestBody);
    const amzDate = toAmzDate();
    const canonicalUri = this.getCanonicalUri(input.key);
    const signedHeaders =
      "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalHeaders = [
      `content-type:${input.contentType}`,
      `host:${this.host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      "",
    ].join("\n");
    const authorization = this.createAuthorizationHeader({
      amzDate,
      canonicalHeaders,
      canonicalQuery: "",
      canonicalUri,
      method: "PUT",
      payloadHash,
      signedHeaders,
    });

    const response = await fetch(`${this.endpoint}${canonicalUri}`, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": input.contentType,
        "X-Amz-Content-Sha256": payloadHash,
        "X-Amz-Date": amzDate,
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(
        `R2 putObject failed for ${input.key}: ${response.status} ${await response.text()}`,
      );
    }
  }

  async getObject(input: { key: string }): Promise<GetObjectOutput> {
    const url = await this.createSignedUrl({
      key: input.key,
      expiresInSeconds: 60,
    });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `R2 getObject failed for ${input.key}: ${response.status} ${await response.text()}`,
      );
    }

    return {
      body: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? undefined,
    };
  }

  async createSignedUrl(input: SignedUrlInput): Promise<string> {
    const amzDate = toAmzDate();
    const dateStamp = toDateStamp(amzDate);
    const credentialScope = getCredentialScope(dateStamp);
    const canonicalUri = this.getCanonicalUri(input.key);
    const queryParams = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.config.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(input.expiresInSeconds),
      "X-Amz-SignedHeaders": "host",
    };
    const canonicalQuery = getCanonicalQuery(queryParams);
    const canonicalRequest = [
      "GET",
      canonicalUri,
      canonicalQuery,
      `host:${this.host}`,
      "",
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      hashSha256(canonicalRequest),
    ].join("\n");
    const signature = hmacSha256Hex(
      getSigningKey(this.config.secretAccessKey, dateStamp),
      stringToSign,
    );

    return `${this.endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  private getCanonicalUri(key: string) {
    return `/${encodePathSegment(this.config.bucketName)}/${encodeKeyPath(key)}`;
  }

  private createAuthorizationHeader(input: {
    method: "PUT";
    canonicalUri: string;
    canonicalQuery: string;
    canonicalHeaders: string;
    signedHeaders: string;
    payloadHash: string;
    amzDate: string;
  }) {
    const dateStamp = toDateStamp(input.amzDate);
    const credentialScope = getCredentialScope(dateStamp);
    const canonicalRequest = [
      input.method,
      input.canonicalUri,
      input.canonicalQuery,
      input.canonicalHeaders,
      input.signedHeaders,
      input.payloadHash,
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      input.amzDate,
      credentialScope,
      hashSha256(canonicalRequest),
    ].join("\n");
    const signature = hmacSha256Hex(
      getSigningKey(this.config.secretAccessKey, dateStamp),
      stringToSign,
    );

    return [
      `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${input.signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");
  }
}
