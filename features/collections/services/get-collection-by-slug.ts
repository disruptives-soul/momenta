import { staticCollectionRepository } from "../repositories/static-collection-repository";

export async function getCollectionBySlug(slug: string) {
  return staticCollectionRepository.findPublishedBySlug(slug);
}
