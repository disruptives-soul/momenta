import { mockCollections } from "../data/mock-collections";
import type { CollectionRepository } from "./collection-repository";

export class StaticCollectionRepository implements CollectionRepository {
  async listPublished(input?: { limit?: number }) {
    const published = mockCollections.filter(
      (collection) => collection.status === "published",
    );

    return typeof input?.limit === "number"
      ? published.slice(0, input.limit)
      : published;
  }

  async findPublishedBySlug(slug: string) {
    return (
      mockCollections.find(
        (collection) =>
          collection.status === "published" && collection.slug === slug,
      ) ?? null
    );
  }
}

export const staticCollectionRepository = new StaticCollectionRepository();
