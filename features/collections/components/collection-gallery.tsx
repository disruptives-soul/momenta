import type { PublicCollection } from "../types/public-collection";
import { PlaceholderArtwork } from "@/features/prototype/components/placeholder-artwork";

type CollectionGalleryProps = {
  collection: PublicCollection;
};

export function CollectionGallery({ collection }: CollectionGalleryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
      <PlaceholderArtwork
        description={collection.prototype?.visualStyle}
        label="Placeholder de portada"
        title={collection.name}
        variant="cover"
      />
      <div className="grid gap-4">
        <PlaceholderArtwork
          label="Preview Free"
          title="Invitación esencial"
          variant="invitation"
        />
        <PlaceholderArtwork
          label="Preview Premium"
          title="Stickers pack"
          variant="stickers"
        />
      </div>
    </div>
  );
}
