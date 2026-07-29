import { staticCollectionRepository } from "../repositories/static-collection-repository";

export async function listPublicCollections(input?: { limit?: number }) {
  return staticCollectionRepository.listPublished(input);
}
