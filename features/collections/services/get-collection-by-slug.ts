import { staticCollectionRepository } from "../repositories/static-collection-repository";
import { listHeadlessCollections } from "@/features/products/services/headless-catalog";

export async function getCollectionBySlug(slug: string) {
  const headlessCollection = (await listHeadlessCollections()).find(
    (collection) => collection.slug === slug,
  );

  return headlessCollection ?? staticCollectionRepository.findPublishedBySlug(slug);
}
