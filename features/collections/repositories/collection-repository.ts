import type { PublicCollection } from "../types/public-collection";

export interface CollectionRepository {
  listPublished(input?: { limit?: number }): Promise<PublicCollection[]>;
  findPublishedBySlug(slug: string): Promise<PublicCollection | null>;
}
