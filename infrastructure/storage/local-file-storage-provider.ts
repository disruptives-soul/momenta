import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  GetObjectOutput,
  PutObjectInput,
  SignedUrlInput,
  StorageProvider,
} from "@/services/ports/storage-provider";

export class LocalFileStorageProvider implements StorageProvider {
  constructor(
    private readonly rootPath = join(process.cwd(), "tmp", "storage"),
  ) {}

  async putObject(input: PutObjectInput): Promise<void> {
    const targetPath = join(this.rootPath, input.key);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, input.body);
    await writeFile(
      `${targetPath}.metadata.json`,
      JSON.stringify({ contentType: input.contentType }, null, 2),
    );
  }

  async getObject(input: { key: string }): Promise<GetObjectOutput> {
    const targetPath = join(this.rootPath, input.key);
    const [body, metadata] = await Promise.all([
      readFile(targetPath),
      readFile(`${targetPath}.metadata.json`, "utf8").catch(() => "{}"),
    ]);

    return {
      body,
      contentType: JSON.parse(metadata).contentType,
    };
  }

  async deleteObject(input: { key: string }): Promise<void> {
    const targetPath = join(this.rootPath, input.key);

    await Promise.all([
      unlink(targetPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }),
      unlink(`${targetPath}.metadata.json`).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") {
            throw error;
          }
        },
      ),
    ]);
  }

  async createSignedUrl(input: SignedUrlInput): Promise<string> {
    return `local-storage://${input.key}?expires=${input.expiresInSeconds}`;
  }
}
