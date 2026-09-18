import { staticCollectionRepository } from "../repositories/static-collection-repository";
import { listHeadlessCollections } from "@/features/products/services/headless-catalog";

export async function listPublicCollections(input?: { limit?: number }) {
  const [headlessCollections, staticCollections] = await Promise.all([
    listHeadlessCollections(),
    staticCollectionRepository.listPublished(),
  ]);

  if (headlessCollections.length > 0) {
    return input?.limit
      ? headlessCollections.slice(0, input.limit)
      : headlessCollections;
  }

  const collections = Array.from(
    new Map(
      [...staticCollections, ...headlessCollections].map((collection) => [
        collection.slug,
        collection,
      ]),
    ).values(),
  );

  return input?.limit ? collections.slice(0, input.limit) : collections;
}
